import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { palette } from '../theme/palette.js';

function resolveGridMetrics(width, rowCount, colCount) {
  const largerSide = Math.max(rowCount, colCount);
  const horizontalPadding = largerSide >= 11 ? 10 : 14;
  const gap = largerSide >= 9 ? 4 : 5;
  const usableWidth = Math.min(width - 36, 420) - horizontalPadding * 2;
  const cellSize = Math.floor((usableWidth - gap * (colCount - 1)) / colCount);

  return {
    cellSize,
    gap,
    horizontalPadding,
    boardWidth: cellSize * colCount + gap * (colCount - 1),
    boardHeight: cellSize * rowCount + gap * (rowCount - 1),
    letterSize: Math.max(11, Math.floor(cellSize * 0.42)),
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
  if (!cells?.length) {
    return null;
  }

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

export default function WordSearchGrid({
  grid,
  selectedCells = [],
  foundPlacements = [],
  selectionInvalid,
  onSelectionStart,
  onSelectionMove,
  onSelectionEnd,
  disabled,
}) {
  const { width } = useWindowDimensions();
  const rowCount = grid.length;
  const colCount = grid[0]?.length ?? 0;
  const metrics = resolveGridMetrics(width, rowCount, colCount);
  const gridRef = useRef(null);
  const gridOriginRef = useRef({ x: 0, y: 0 });

  const measureOrigin = useCallback(() => {
    gridRef.current?.measureInWindow((x, y) => {
      gridOriginRef.current = { x, y };
    });
  }, []);

  useEffect(() => {
    const t1 = setTimeout(measureOrigin, 100);
    const t2 = setTimeout(measureOrigin, 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [grid, measureOrigin]);

  function handleLayout() {
    measureOrigin();
  }

  function getCellFromPagePoint(pageX, pageY) {
    const relativeX = pageX - gridOriginRef.current.x - metrics.horizontalPadding;
    const relativeY = pageY - gridOriginRef.current.y - metrics.horizontalPadding;

    if (
      relativeX < 0 ||
      relativeY < 0 ||
      relativeX > metrics.boardWidth ||
      relativeY > metrics.boardHeight
    ) {
      return null;
    }

    const stride = metrics.cellSize + metrics.gap;
    const col = Math.floor(relativeX / stride);
    const row = Math.floor(relativeY / stride);

    if (row < 0 || row >= rowCount || col < 0 || col >= colCount) {
      return null;
    }

    const cellOffsetX = relativeX - col * stride;
    const cellOffsetY = relativeY - row * stride;

    if (cellOffsetX > metrics.cellSize || cellOffsetY > metrics.cellSize) {
      return null;
    }

    return grid[row]?.[col] ?? null;
  }

  function handleTouch(nativeEvent, callback) {
    if (disabled) {
      return;
    }

    const cell = getCellFromPagePoint(nativeEvent.pageX, nativeEvent.pageY);

    if (cell) {
      callback(cell);
    }
  }

  const foundLineThickness = Math.max(16, Math.floor(metrics.cellSize * 0.68));
  const activeLineThickness = Math.max(18, Math.floor(metrics.cellSize * 0.78));
  const activeSelectionStyle =
    selectedCells.length > 1 && !selectionInvalid
      ? buildHighlightStyle(selectedCells, metrics, activeLineThickness)
      : null;

  return (
    <View style={styles.wrapper}>
      <View
        ref={gridRef}
        style={[
          styles.gridFrame,
          {
            padding: metrics.horizontalPadding,
            gap: metrics.gap,
          },
        ]}
        onLayout={handleLayout}
        onStartShouldSetResponder={() => !disabled}
        onMoveShouldSetResponder={() => !disabled}
        onResponderGrant={({ nativeEvent }) =>
          handleTouch(nativeEvent, onSelectionStart)
        }
        onResponderMove={({ nativeEvent }) =>
          handleTouch(nativeEvent, onSelectionMove)
        }
        onResponderRelease={onSelectionEnd}
        onResponderTerminate={onSelectionEnd}
      >
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {foundPlacements.map((placement) => {
            const lineStyle = buildHighlightStyle(
              placement.cells,
              metrics,
              foundLineThickness
            );

            if (!lineStyle) {
              return null;
            }

            return (
              <View
                key={`found-line-${placement.word}`}
                style={[
                  styles.highlightLine,
                  lineStyle,
                  {
                    backgroundColor:
                      placement.color?.soft || palette.foundSoft,
                  },
                ]}
              />
            );
          })}
          {activeSelectionStyle ? (
            <View
              style={[
                styles.highlightLine,
                styles.activeSelectionLine,
                activeSelectionStyle,
              ]}
            />
          ) : null}
        </View>
        {grid.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={[styles.row, { gap: metrics.gap }]}>
            {row.map((cell) => (
              <View
                key={`${cell.row}-${cell.col}`}
                style={[
                  styles.cell,
                  { width: metrics.cellSize, height: metrics.cellSize },
                ]}
              >
                <Text
                  style={[
                    styles.cellLetter,
                    { fontSize: metrics.letterSize },
                  ]}
                >
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
});
