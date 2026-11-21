// Validation accepts a word in either reading order, so each allowed axis is bidirectional.
export function resolveGestureDirection(dx, dy, options = {}) {
  if (!dx && !dy) return null;
  const distribution = options.directionDistribution;
  const enabled = (ids, fallback) => distribution
    ? ids.some((id) => Number(distribution[id]) > 0)
    : fallback;
  const axes = [];
  if (enabled(['right', 'left'], true)) axes.push([0, 1]);
  if (enabled(['down', 'up'], true)) axes.push([1, 0]);
  if (enabled(['diagonalDown', 'diagonalUp'], options.includeDiagonal)) {
    axes.push([1, 1], [1, -1]);
  }
  let best = null, bestScore = -Infinity;
  for (const [row, col] of axes) {
    const dot = dx * col + dy * row;
    const sign = dot < 0 ? -1 : 1;
    const score = Math.abs(dot) / Math.hypot(row, col);
    if (score > bestScore) {
      bestScore = score;
      best = { stepRow: row ? row * sign : 0, stepCol: col ? col * sign : 0 };
    }
  }
  return best;
}

export function projectGesture(point, anchor, direction, metrics, grid) {
  const stride = metrics.cellSize + metrics.gap;
  const x = metrics.horizontalPadding + anchor.col * stride + metrics.cellSize / 2;
  const y = metrics.horizontalPadding + anchor.row * stride + metrics.cellSize / 2;
  const { stepRow, stepCol } = direction;
  const squared = stepRow * stepRow + stepCol * stepCol;
  const raw = ((point.x - x) * stepCol + (point.y - y) * stepRow) / (stride * squared);
  const rowLimit = stepRow > 0 ? grid.length - 1 - anchor.row : anchor.row;
  const colLimit = stepCol > 0 ? grid[0].length - 1 - anchor.col : anchor.col;
  const limit = Math.min(stepRow ? rowLimit : Infinity, stepCol ? colLimit : Infinity);
  const progress = Math.max(0, Math.min(limit, raw));
  const steps = Math.round(progress);
  return {
    cell: grid[anchor.row + stepRow * steps][anchor.col + stepCol * steps],
    end: { x: x + stepCol * progress * stride, y: y + stepRow * progress * stride },
    progress,
  };
}
