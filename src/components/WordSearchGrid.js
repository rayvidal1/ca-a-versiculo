import { memo, useRef } from 'react';
import { Animated, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { useSoundEffect } from '../hooks/useSoundEffect.js';

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

  // Rejeita se o toque caiu no gap entre células
  if (relX - col * stride > metrics.cellSize) return null;
  if (relY - row * stride > metrics.cellSize) return null;

  return grid[row]?.[col] ?? null;
}

// Quantiza deslocamento (dx, dy) em uma das 8 direções canônicas.
// Usa limiares tan(22.5°) ≈ 0.4142 e tan(67.5°) ≈ 2.4142 para divisão natural.
function quantizeDirection(dx, dy, includeDiagonal) {
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  if (adx === 0 && ady === 0) return null;

  const ratio = adx === 0 ? Infinity : ady / adx;

  if (ratio < 0.4142) {
    // Zona horizontal (< 22.5° do eixo X)
    return { stepRow: 0, stepCol: Math.sign(dx) };
  }
  if (ratio > 2.4142) {
    // Zona vertical (> 67.5° do eixo X)
    return { stepRow: Math.sign(dy), stepCol: 0 };
  }
  // Zona diagonal (entre 22.5° e 67.5°)
  if (!includeDiagonal) {
    // Sem diagonal: snap para o eixo dominante
    return adx >= ady
      ? { stepRow: 0, stepCol: Math.sign(dx) }
      : { stepRow: Math.sign(dy), stepCol: 0 };
  }
  return { stepRow: Math.sign(dy), stepCol: Math.sign(dx) };
}

// Projeta o toque atual (locationX/Y) na direção travada e retorna a célula snappada.
// Tudo em coordenadas locais ao gridFrame — sem dependência de medição absoluta.
function getSnappedEndCell(locationX, locationY, anchor, direction, grid, metrics) {
  const rowCount = grid.length;
  const colCount = grid[0]?.length ?? 0;
  const stride = metrics.cellSize + metrics.gap;

  // Centro da célula âncora em coordenadas locais
  const anchorLocX = metrics.horizontalPadding + anchor.col * stride + metrics.cellSize / 2;
  const anchorLocY = metrics.horizontalPadding + anchor.row * stride + metrics.cellSize / 2;

  const dx = locationX - anchorLocX;
  const dy = locationY - anchorLocY;

  // Projeção do deslocamento na direção travada, convertida para passos de célula
  let steps;
  if (direction.stepRow === 0) {
    steps = (dx * direction.stepCol) / stride;
  } else if (direction.stepCol === 0) {
    steps = (dy * direction.stepRow) / stride;
  } else {
    // Diagonal: stride diagonal = stride * sqrt(2)
    steps = (dx * direction.stepCol + dy * direction.stepRow) / (stride * Math.SQRT2);
  }

  steps = Math.max(0, Math.round(steps));

  // Clamp aos limites da grade
  while (steps > 0) {
    const r = anchor.row + direction.stepRow * steps;
    const c = anchor.col + direction.stepCol * steps;
    if (r >= 0 && r < rowCount && c >= 0 && c < colCount) break;
    steps -= 1;
  }

  return (
    grid[anchor.row + direction.stepRow * steps]?.[anchor.col + direction.stepCol * steps] ??
    anchor
  );
}

const BASE_LINE_WIDTH = 600;

function WordSearchGrid({
  grid,
  foundPlacements = [],
  includeDiagonal = false,
  letterShadow = false,
  onSelectionStart,
  onSelectionMove,
  onSelectionEnd,
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
  const lockedDirectionRef = useRef(null);
  const lastSnappedKeyRef = useRef(null);
  const playPop = useSoundEffect(require('../assets/sounds/ui-pop.mp3'), 0.46);

  // Valores animados — atualizados via .setValue(), sem re-render do React
  const animTX = useRef(new Animated.Value(0)).current;
  const animTY = useRef(new Animated.Value(0)).current;
  const animScale = useRef(new Animated.Value(0)).current;
  const animAngle = useRef(new Animated.Value(0)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;

  function updateActiveLine(anchorCell, endCell) {
    const m = metricsRef.current;
    const start = getCellCenter(anchorCell, m);
    const end = getCellCenter(endCell, m);
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const distance = Math.hypot(deltaX, deltaY);
    const lineWidth = distance + m.cellSize * 0.92;
    const thickness = Math.max(18, Math.floor(m.cellSize * 0.78));

    animTX.setValue((start.x + end.x) / 2 - BASE_LINE_WIDTH / 2);
    animTY.setValue((start.y + end.y) / 2 - thickness / 2);
    animScale.setValue(lineWidth / BASE_LINE_WIDTH);
    animAngle.setValue(Math.atan2(deltaY, deltaX));
    animOpacity.setValue(1);
  }

  // Início do toque: detecta célula via locationX/Y (relativo ao gridFrame),
  // sem necessidade de measureInWindow ou coordenadas absolutas.
  function handleTouchStart(nativeEvent, callback) {
    if (disabled) return;
    const m = metricsRef.current;
    const cell = getCellAtLocation(
      nativeEvent.locationX,
      nativeEvent.locationY,
      m,
      grid,
      rowCount,
      colCount
    );
    if (cell) {
      anchorCellRef.current = cell;
      lockedDirectionRef.current = null;
      lastSnappedKeyRef.current = `${cell.row}-${cell.col}`;
      animOpacity.setValue(0);
      playPop();
      callback(cell);
    }
  }

  // Movimento: trava direção após sair da zona morta (~0.6 célula),
  // depois projeta o toque na direção travada para snap discreto.
  function handleTouchMove(nativeEvent, callback) {
    if (disabled || !anchorCellRef.current) return;

    const anchor = anchorCellRef.current;
    const m = metricsRef.current;
    const { locationX, locationY } = nativeEvent;

    if (!lockedDirectionRef.current) {
      const stride = m.cellSize + m.gap;
      const anchorLocX = m.horizontalPadding + anchor.col * stride + m.cellSize / 2;
      const anchorLocY = m.horizontalPadding + anchor.row * stride + m.cellSize / 2;
      const dx = locationX - anchorLocX;
      const dy = locationY - anchorLocY;

      if (Math.hypot(dx, dy) < stride * 0.6) return; // zona morta

      lockedDirectionRef.current = quantizeDirection(dx, dy, includeDiagonal);
    }

    if (!lockedDirectionRef.current) return;

    const snappedCell = getSnappedEndCell(
      locationX,
      locationY,
      anchor,
      lockedDirectionRef.current,
      grid,
      m
    );

    const isAtAnchor = snappedCell.row === anchor.row && snappedCell.col === anchor.col;
    if (isAtAnchor) {
      animOpacity.setValue(0);
    } else {
      updateActiveLine(anchor, snappedCell);
    }

    const snappedKey = `${snappedCell.row}-${snappedCell.col}`;
    if (snappedKey !== lastSnappedKeyRef.current) {
      lastSnappedKeyRef.current = snappedKey;
      playPop();
    }

    callback(snappedCell);
  }

  function handleRelease(event) {
    animOpacity.setValue(0);
    anchorCellRef.current = null;
    lockedDirectionRef.current = null;
    onSelectionEnd?.(event);
  }

  const foundLineThickness = Math.max(16, Math.floor(metrics.cellSize * 0.68));
  const activeLineThickness = Math.max(18, Math.floor(metrics.cellSize * 0.78));

  return (
    <View style={styles.wrapper}>
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
        onResponderTerminate={handleRelease}
      >
        {/* pointerEvents="none" garante que locationX/Y das views filhas não
            interceptem o toque — o gridFrame sempre é o alvo do toque */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {foundPlacements.map((placement) => {
            const lineStyle = buildHighlightStyle(placement.cells, metrics, foundLineThickness);
            if (!lineStyle) return null;
            return (
              <View
                key={`found-line-${placement.word}`}
                style={[
                  styles.highlightLine,
                  lineStyle,
                  { backgroundColor: placement.color?.soft || palette.foundSoft },
                ]}
              />
            );
          })}
          <Animated.View
            style={[
              styles.highlightLine,
              styles.activeSelectionLine,
              {
                width: BASE_LINE_WIDTH,
                height: activeLineThickness,
                borderRadius: activeLineThickness / 2,
                opacity: animOpacity,
                transform: [
                  { translateX: animTX },
                  { translateY: animTY },
                  {
                    rotateZ: animAngle.interpolate({
                      inputRange: [-Math.PI, Math.PI],
                      outputRange: ['-3.14159rad', '3.14159rad'],
                    }),
                  },
                  { scaleX: animScale },
                ],
              },
            ]}
          />
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
    prev.disabled === next.disabled &&
    prev.includeDiagonal === next.includeDiagonal &&
    prev.letterShadow === next.letterShadow &&
    prev.maxHeight === next.maxHeight &&
    prev.onSelectionStart === next.onSelectionStart &&
    prev.onSelectionMove === next.onSelectionMove &&
    prev.onSelectionEnd === next.onSelectionEnd
  );
});

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: 'rgba(224, 44, 44, 0.88)',
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
