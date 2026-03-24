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
    letterSize: Math.max(11, Math.floor(cellSize * 0.42)),
  };
}

export default function WordSearchGrid({
  grid,
  selectedCellMap,
  foundCellMap,
  selectionInvalid,
  contentInsetTop = 0,
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

    const boardWidth = metrics.cellSize * colCount + metrics.gap * (colCount - 1);
    const boardHeight = metrics.cellSize * rowCount + metrics.gap * (rowCount - 1);

    if (
      relativeX < 0 ||
      relativeY < 0 ||
      relativeX > boardWidth ||
      relativeY > boardHeight
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

  return (
    <View style={styles.wrapper}>
      <View
        ref={gridRef}
        style={[
          styles.gridFrame,
          {
            marginTop: contentInsetTop,
          },
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
        {grid.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={[styles.row, { gap: metrics.gap }]}>
            {row.map((cell) => {
              const cellKey = `${cell.row}-${cell.col}`;
              const foundState = foundCellMap[cellKey];
              const isFound = Boolean(foundState);
              const isSelected = Boolean(selectedCellMap[cellKey]);

              return (
                <View
                  key={cellKey}
                  style={[
                    styles.cell,
                    { width: metrics.cellSize, height: metrics.cellSize },
                    isFound && [
                      styles.cellFound,
                      {
                        backgroundColor: foundState.color?.fill || palette.found,
                        borderColor: foundState.color?.border || palette.found,
                      },
                    ],
                    !isFound &&
                      isSelected &&
                      (selectionInvalid ? styles.cellInvalid : styles.cellSelected),
                  ]}
                >
                  <Text
                    style={[
                      styles.cellLetter,
                      { fontSize: metrics.letterSize },
                      isFound && styles.cellLetterFound,
                      !isFound &&
                        isSelected &&
                        (selectionInvalid
                          ? styles.cellLetterInvalid
                          : styles.cellLetterSelected),
                    ]}
                  >
                    {cell.letter}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#1B2D5A',
    borderRadius: 24,
    justifyContent: 'flex-start',
    alignItems: 'center',
    overflow: 'hidden',
  },
  gridFrame: {
    borderRadius: 18,
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cell: {
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellSelected: {
    backgroundColor: palette.selectionSoft,
    borderWidth: 1,
    borderColor: palette.selection,
  },
  cellInvalid: {
    backgroundColor: palette.selectionInvalidSoft,
    borderWidth: 1,
    borderColor: palette.selectionInvalid,
  },
  cellFound: {
    borderWidth: 1,
  },
  cellLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cellLetterSelected: {
    color: palette.text,
  },
  cellLetterInvalid: {
    color: palette.selectionInvalid,
  },
  cellLetterFound: {
    color: palette.white,
  },
});
