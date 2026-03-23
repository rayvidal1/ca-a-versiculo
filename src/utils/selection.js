function getStep(startCell, endCell, includeDiagonal = false) {
  const rowDiff = endCell.row - startCell.row;
  const colDiff = endCell.col - startCell.col;
  const rowStep = Math.sign(rowDiff);
  const colStep = Math.sign(colDiff);

  if (rowDiff === 0 && colDiff === 0) {
    return { rowStep: 0, colStep: 0 };
  }

  if (rowDiff === 0) {
    return { rowStep: 0, colStep };
  }

  if (colDiff === 0) {
    return { rowStep, colStep: 0 };
  }

  if (includeDiagonal && Math.abs(rowDiff) === Math.abs(colDiff)) {
    return { rowStep, colStep };
  }

  return null;
}

export function buildSelectionFromEndpoints(
  startCell,
  endCell,
  options = {}
) {
  if (!startCell || !endCell) {
    return [];
  }

  const step = getStep(startCell, endCell, options.includeDiagonal ?? false);

  if (!step) {
    return null;
  }

  const distance = Math.max(
    Math.abs(endCell.row - startCell.row),
    Math.abs(endCell.col - startCell.col)
  );
  const selection = [];

  for (let index = 0; index <= distance; index += 1) {
    selection.push({
      row: startCell.row + step.rowStep * index,
      col: startCell.col + step.colStep * index,
    });
  }

  return selection;
}

export function selectionToWord(grid, selection) {
  return selection.map((cell) => grid[cell.row][cell.col].letter).join('');
}
