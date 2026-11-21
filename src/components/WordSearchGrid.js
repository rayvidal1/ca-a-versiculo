import { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { useSoundEffect } from '../hooks/useSoundEffect.js';

import { projectGesture, resolveGestureDirection } from '../utils/gridGesture.js';

import { palette } from '../theme/palette.js';

function resolveGridMetrics(width, rowCount, colCount, maxHeight) {
  const largerSide = Math.max(rowCount, colCount);
  const horizontalPadding = largerSide >= 11 ? 10 : 14;
  const gap = largerSide >= 9 ? 4 : 5;
  const usableWidth = Math.min(width - 36, 420) - horizontalPadding * 2;
  const cellSizeByWidth = Math.floor((usableWidth - gap * (colCount - 1)) / colCount);

  let cellSize = cellSizeByWidth;
  if (maxHeight && maxHeight > 0) {
    const usableHeight = maxHeight - horizontalPadding * 2;
    const cellSizeByHeight = Math.floor((usableHeight - gap * (rowCount - 1)) / rowCount);
    cellSize = Math.min(cellSizeByWidth, cellSizeByHeight);
  }
  cellSize = Math.max(cellSize, 20);

  return {
    cellSize,
    gap,
    horizontalPadding,
    boardWidth: cellSize * colCount + gap * (colCount - 1),
    boardHeight: cellSize * rowCount + gap * (rowCount - 1),
    letterSize: Math.max(13, Math.floor(cellSize * 0.5)),
  };
}

function getCellCenter(cell, metrics) {
  const stride = metrics.cellSize + metrics.gap;
  return {
    x: metrics.horizontalPadding + cell.col * stride + metrics.cellSize / 2,
    y: metrics.horizontalPadding + cell.row * stride + metrics.cellSize / 2,
  };
}


function buildHighlightStyle(cells, metrics, thickness) {
  if (!cells?.length) return null;
  const start = getCellCenter(cells[0], metrics);
  const end = getCellCenter(cells[cells.length - 1], metrics);
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const distance = Math.hypot(deltaX, deltaY);
  const width = distance + metrics.cellSize * 0.92;
  return {
    left: (start.x + end.x) / 2 - width / 2,
    top: (start.y + end.y) / 2 - thickness / 2,
    width,
    height: thickness,
    borderRadius: thickness / 2,
    transform: [{ rotateZ: `${Math.atan2(deltaY, deltaX)}rad` }],
  };
}

// Converte locationX/Y (relativo ao gridFrame) em célula da grade.
// locationX/Y já são relativos ao gridFrame porque todas as views filhas
// têm pointerEvents="none", então o toque é sempre registrado no gridFrame.
function getCellAtLocation(locationX, locationY, metrics, grid, rowCount, colCount) {
  const relX = locationX - metrics.horizontalPadding;
  const relY = locationY - metrics.horizontalPadding;

  if (
    relX < 0 ||
    relY < 0 ||
    relX > metrics.boardWidth ||
    relY > metrics.boardHeight
  ) {
    return null;
  }

  const stride = metrics.cellSize + metrics.gap;
  const col = Math.floor(relX / stride);
  const row = Math.floor(relY / stride);

  if (row < 0 || row >= rowCount || col < 0 || col >= colCount) return null;


  return grid[row]?.[col] ?? null;
}

const BASE_LINE_WIDTH = 600;

function FoundHighlight({ placement, metrics, thickness }) {
  const opacity = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const animation = Animated.timing(opacity, { toValue: 0.96, duration: 160, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [opacity]);
  const lineStyle = buildHighlightStyle(placement.cells, metrics, thickness);
  if (!lineStyle) return null;
  return <Animated.View style={[styles.highlightLine, lineStyle, {
    opacity, backgroundColor: placement.color?.fill || palette.found,
  }]} />;
}

function renderHintCircle(hintCell, metrics, hintPulse) {
  const stride = metrics.cellSize + metrics.gap;
  const cx = metrics.horizontalPadding + hintCell.col * stride + metrics.cellSize / 2;
  const cy = metrics.horizontalPadding + hintCell.row * stride + metrics.cellSize / 2;
  const r = metrics.cellSize * 0.43;
  return (
    <Animated.View
      key="hint-circle"
      style={{
        position: 'absolute',
        width: r * 2,
        height: r * 2,
        borderRadius: r,
        borderWidth: 1.5,
        borderColor: 'rgba(45, 106, 87, 0.6)',
        backgroundColor: 'rgba(45, 106, 87, 0.08)',
        shadowColor: '#2D6A57',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 0 },
        left: cx - r,
        top: cy - r,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale: hintPulse }],
      }}
    >
      <Text style={{ fontSize: metrics.letterSize, fontWeight: '700', color: '#2D6A57' }}>
        {hintCell.letter}
      </Text>
    </Animated.View>
  );
}

function WordSearchGrid({
  grid,
  foundPlacements = [],
  hintCell = null,
  guidePlacement = null,
  onGuideComplete,
  showOnboarding = false,
  onInteractionStart,
  includeDiagonal = false,
  directionDistribution,
  letterShadow = false,
  onSelectionStart,
  onSelectionMove,
  onSelectionEnd,
  onSelectionCancel,
  disabled,
  maxHeight,
}) {
  const { width } = useWindowDimensions();
  const rowCount = grid.length;
  const colCount = grid[0]?.length ?? 0;
  const metrics = resolveGridMetrics(width, rowCount, colCount, maxHeight);
  const metricsRef = useRef(metrics);
  metricsRef.current = metrics;

  const anchorCellRef = useRef(null);
  const touchStartPointRef = useRef(null);
  const lockedDirectionRef = useRef(null);
  const lastSnappedKeyRef = useRef(null);
  const pendingGuideRef = useRef(null);
  const guideAnimationRef = useRef(null);
  const fadeAnimationRef = useRef(null);
  const guidePlacementRef = useRef(guidePlacement);
  guidePlacementRef.current = guidePlacement;
  const onGuideCompleteRef = useRef(onGuideComplete);
  onGuideCompleteRef.current = onGuideComplete;
  const playPop = useSoundEffect(require('../assets/sounds/ui-pop.mp3'), 0.46);

  const hintPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!hintCell) return;
    hintPulse.setValue(1);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(hintPulse, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(hintPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [hintCell]);

  // Valores animados — atualizados via .setValue(), sem re-render do React
  const animTX = useRef(new Animated.Value(0)).current;
  const animTY = useRef(new Animated.Value(0)).current;
  const animLength = useRef(new Animated.Value(0)).current;
  const animAngle = useRef(new Animated.Value(0)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anchorCellRef.current = null;
    pendingGuideRef.current = null;
    guideAnimationRef.current?.stop();
    fadeAnimationRef.current?.stop();
    animOpacity.setValue(0);
    return () => {
      guideAnimationRef.current?.stop();
      fadeAnimationRef.current?.stop();
    };
  }, [grid]);

  function updateActiveLine(anchorCell, endPoint) {
    const start = getCellCenter(anchorCell, metricsRef.current);
    const dx = endPoint.x - start.x, dy = endPoint.y - start.y;
    animTX.setValue(start.x);
    animTY.setValue(start.y);
    animLength.setValue(Math.hypot(dx, dy));
    animAngle.setValue(Math.atan2(dy, dx));
    animOpacity.setValue(0.28);
  }

  function triggerGuideAnimation() {
    const guide = guidePlacementRef.current;
    if (!guide?.cells?.length) return;
    const m = metricsRef.current;
    const firstCell = guide.cells[0];
    const lastCell = guide.cells[guide.cells.length - 1];
    const start = getCellCenter(firstCell, m);
    const end = getCellCenter(lastCell, m);
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const distance = Math.hypot(deltaX, deltaY);

    animTX.setValue(start.x);
    animTY.setValue(start.y);
    animAngle.setValue(Math.atan2(deltaY, deltaX));
    animLength.setValue(0);
    animOpacity.setValue(0.28);

    guideAnimationRef.current = Animated.sequence([
      Animated.timing(animLength, {
        toValue: distance,
        duration: 550,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.delay(350),
      Animated.timing(animOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]);
    guideAnimationRef.current.start(({ finished }) => {
      if (finished) onGuideCompleteRef.current?.(guide);
    });
  }

  // Início do toque: detecta célula via locationX/Y (relativo ao gridFrame),
  // sem necessidade de measureInWindow ou coordenadas absolutas.
  function handleTouchStart(nativeEvent, callback) {
    if (disabled) return;
    onInteractionStart?.();
    const m = metricsRef.current;
    const cell = getCellAtLocation(
      nativeEvent.locationX,
      nativeEvent.locationY,
      m,
      grid,
      rowCount,
      colCount
    );
    if (!cell) return;

    guideAnimationRef.current?.stop();
    fadeAnimationRef.current?.stop();
    const guide = guidePlacementRef.current;
    const first = guide?.cells?.[0];
    pendingGuideRef.current = first && first.row === cell.row && first.col === cell.col ? guide : null;

    anchorCellRef.current = cell;
    touchStartPointRef.current = { x: nativeEvent.locationX, y: nativeEvent.locationY };
    lockedDirectionRef.current = null;
    lastSnappedKeyRef.current = `${cell.row}-${cell.col}`;
    updateActiveLine(cell, getCellCenter(cell, m));
    playPop();
    callback(cell);
  }

  // Continuous projection drives the highlight; only cell changes reach validation.
  // Returning to the anchor unlocks the direction for natural reversal.
  function handleTouchMove(nativeEvent, callback) {
    if (disabled || !anchorCellRef.current) return;

    const anchor = anchorCellRef.current;
    const m = metricsRef.current;
    const { locationX, locationY } = nativeEvent;

    const start = getCellCenter(anchor, m);
    const dx = locationX - start.x, dy = locationY - start.y;
    const stride = m.cellSize + m.gap;
    const origin = touchStartPointRef.current;
    const moved = Math.hypot(locationX - origin.x, locationY - origin.y) > stride * 0.2;
    if (moved) pendingGuideRef.current = null;
    if (!lockedDirectionRef.current && moved) {
      lockedDirectionRef.current = resolveGestureDirection(dx, dy, { includeDiagonal, directionDistribution });
    }
    const direction = lockedDirectionRef.current;
    if (!direction) return;
    const projected = projectGesture({ x: locationX, y: locationY }, anchor, direction, m, grid);
    updateActiveLine(anchor, projected.end);
    if (projected.progress < 0.25) lockedDirectionRef.current = null;
    const key = projected.cell.row + '-' + projected.cell.col;
    if (key !== lastSnappedKeyRef.current) {
      lastSnappedKeyRef.current = key;
      callback(projected.cell);
    }
  }

  function handleRelease(event, cancelled = false) {
    if (!anchorCellRef.current) return;
    if (!cancelled && event?.nativeEvent) handleTouchMove(event.nativeEvent, onSelectionMove);
    const guide = pendingGuideRef.current;
    pendingGuideRef.current = null;
    anchorCellRef.current = null;
    lockedDirectionRef.current = null;
    if (cancelled || guide) {
      onSelectionCancel?.();
      if (guide && !cancelled) { triggerGuideAnimation(); return; }
    }
    const match = cancelled ? null : onSelectionEnd?.();
    fadeAnimationRef.current = Animated.timing(animOpacity, {
      toValue: 0, duration: match ? 100 : 180, useNativeDriver: true,
    });
    fadeAnimationRef.current.start();
  }

  const foundLineThickness = Math.max(16, Math.floor(metrics.cellSize * 0.68));
  const activeLineThickness = Math.max(18, Math.floor(metrics.cellSize * 0.68));

  return (
    <View style={styles.wrapper}>
      {showOnboarding && (
        <View pointerEvents="none" style={styles.onboardingOverlay}>
          <View style={styles.onboardingInstruction}>
            <Text style={styles.onboardingText}>Arraste da primeira até a última letra</Text>
          </View>
        </View>
      )}
      <View
        style={[
          styles.gridFrame,
          {
            padding: metrics.horizontalPadding,
            gap: metrics.gap,
          },
        ]}
        onStartShouldSetResponder={() => !disabled}
        onMoveShouldSetResponder={() => !disabled}
        onResponderGrant={({ nativeEvent }) =>
          handleTouchStart(nativeEvent, onSelectionStart)
        }
        onResponderMove={({ nativeEvent }) =>
          handleTouchMove(nativeEvent, onSelectionMove)
        }
        onResponderRelease={handleRelease}
        onResponderTerminationRequest={() => false}
        onResponderTerminate={(event) => handleRelease(event, true)}
      >
        {/* pointerEvents="none" garante que locationX/Y das views filhas não
            interceptem o toque — o gridFrame sempre é o alvo do toque */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {foundPlacements.map((placement) => (
            <FoundHighlight key={placement.word} placement={placement} metrics={metrics} thickness={foundLineThickness} />
          ))}
          <Animated.View pointerEvents="none" needsOffscreenAlphaCompositing style={{
            position: 'absolute', left: -activeLineThickness / 2, top: -activeLineThickness / 2,
            width: BASE_LINE_WIDTH + activeLineThickness, height: activeLineThickness, opacity: animOpacity,
            transformOrigin: [activeLineThickness / 2, activeLineThickness / 2, 0],
            transform: [{ translateX: animTX }, { translateY: animTY }, {
              rotateZ: animAngle.interpolate({ inputRange: [-Math.PI, Math.PI], outputRange: ['-3.14159rad', '3.14159rad'] }),
            }],
          }}>
            <Animated.View style={[styles.activeSelectionLine, {
              position: 'absolute', left: activeLineThickness / 2, top: 0,
              width: BASE_LINE_WIDTH, height: activeLineThickness,
              transformOrigin: 'left center',
              transform: [{ scaleX: animLength.interpolate({ inputRange: [0, BASE_LINE_WIDTH], outputRange: [0, 1] }) }],
            }]} />
            <View style={[styles.activeSelectionLine, { position: 'absolute', left: 0,
              top: 0, width: activeLineThickness, height: activeLineThickness, borderRadius: activeLineThickness / 2 }]} />
            <Animated.View style={[styles.activeSelectionLine, { position: 'absolute', left: 0,
              top: 0, width: activeLineThickness, height: activeLineThickness, borderRadius: activeLineThickness / 2,
              transform: [{ translateX: animLength }] }]} />
          </Animated.View>
          {hintCell != null && renderHintCircle(hintCell, metrics, hintPulse)}
        </View>
        {grid.map((row, rowIndex) => (
          <View
            key={`row-${rowIndex}`}
            pointerEvents="none"
            style={[styles.row, { gap: metrics.gap }]}
          >
            {row.map((cell) => (
              <View
                key={`${cell.row}-${cell.col}`}
                pointerEvents="none"
                style={[
                  styles.cell,
                  { width: metrics.cellSize, height: metrics.cellSize },
                ]}
              >
                <Text style={[styles.cellLetter, { fontSize: metrics.letterSize }, letterShadow && styles.cellLetterShadow]}>
                  {cell.letter}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

export default memo(WordSearchGrid, (prev, next) => {
  return (
    prev.grid === next.grid &&
    prev.foundPlacements === next.foundPlacements &&
    prev.hintCell === next.hintCell &&
    prev.guidePlacement === next.guidePlacement &&
    prev.showOnboarding === next.showOnboarding &&
    prev.onInteractionStart === next.onInteractionStart &&
    prev.disabled === next.disabled &&
    prev.includeDiagonal === next.includeDiagonal &&
    prev.directionDistribution === next.directionDistribution &&
    prev.onSelectionCancel === next.onSelectionCancel &&
    prev.letterShadow === next.letterShadow &&
    prev.maxHeight === next.maxHeight &&
    prev.onSelectionStart === next.onSelectionStart &&
    prev.onSelectionMove === next.onSelectionMove &&
    prev.onSelectionEnd === next.onSelectionEnd &&
    prev.onGuideComplete === next.onGuideComplete
  );
});

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(45, 106, 87, 0.035)',
    borderRadius: 22,
  },
  onboardingInstruction: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(45, 106, 87, 0.12)',
  },
  onboardingText: {
    color: '#2D6A57',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    fontWeight: '500',
  },
  gridFrame: {
    borderRadius: 22,
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  highlightLine: {
    position: 'absolute',
    opacity: 0.96,
  },
  activeSelectionLine: {
    backgroundColor: '#E02C2C',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
  },
  cellLetterShadow: {
    textShadowColor: 'rgba(255,255,255,0.95)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
