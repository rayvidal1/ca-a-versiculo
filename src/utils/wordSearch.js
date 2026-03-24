const STRAIGHT_DIRECTIONS = [
  { rowStep: 0, colStep: 1 },
  { rowStep: 1, colStep: 0 },
];

const DIAGONAL_DIRECTIONS = [
  { rowStep: 1, colStep: 1 },
  { rowStep: 1, colStep: -1 },
];

function createEmptyGrid(rows, cols) {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      row,
      col,
      letter: '',
    }))
  );
}

function randomLetter() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return letters[Math.floor(Math.random() * letters.length)];
}

function canPlaceWord(grid, word, startRow, startCol, direction) {
  for (let index = 0; index < word.length; index += 1) {
    const row = startRow + direction.rowStep * index;
    const col = startCol + direction.colStep * index;
    const cell = grid[row]?.[col];

    if (!cell) {
      return false;
    }

    if (cell.letter && cell.letter !== word[index]) {
      return false;
    }
  }

  return true;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function placeWord(grid, word, preferredDirections) {
  const rowCount = grid.length;
  const colCount = grid[0]?.length ?? 0;

  // Gera e embaralha posicoes para cada direcao separadamente,
  // depois intercala as tentativas para distribuir melhor os encaixes.
  const byDirection = preferredDirections.map((direction) => {
    const positions = [];
    for (let row = 0; row < rowCount; row += 1) {
      for (let col = 0; col < colCount; col += 1) {
        positions.push({ row, col, direction });
      }
    }
    return shuffle(positions);
  });

  const maxLen = Math.max(...byDirection.map((positions) => positions.length));
  const attempts = [];
  for (let i = 0; i < maxLen; i += 1) {
    byDirection.forEach((positions) => {
      if (positions[i]) {
        attempts.push(positions[i]);
      }
    });
  }

  for (const attempt of attempts) {
    if (!canPlaceWord(grid, word, attempt.row, attempt.col, attempt.direction)) {
      continue;
    }

    const cells = [];

    for (let index = 0; index < word.length; index += 1) {
      const row = attempt.row + attempt.direction.rowStep * index;
      const col = attempt.col + attempt.direction.colStep * index;
      grid[row][col].letter = word[index];
      cells.push({ row, col });
    }

    return {
      word,
      cells,
      direction: attempt.direction,
    };
  }

  return null;
}

function fillEmptyCells(grid) {
  grid.forEach((row) => {
    row.forEach((cell) => {
      if (!cell.letter) {
        cell.letter = randomLetter();
      }
    });
  });
}

function buildDirections(options = {}) {
  const directions = [...STRAIGHT_DIRECTIONS];

  if (options.includeDiagonal) {
    directions.push(...DIAGONAL_DIRECTIONS);
  }

  if (options.allowBackwards) {
    directions.push(
      ...directions.map((direction) => ({
        rowStep: -direction.rowStep,
        colStep: -direction.colStep,
      }))
    );
  }

  return directions.filter((direction, index, list) => {
    return (
      list.findIndex(
        (candidate) =>
          candidate.rowStep === direction.rowStep &&
          candidate.colStep === direction.colStep
      ) === index
    );
  });
}

function rotateDirections(directions, offset) {
  const startIndex = offset % directions.length;
  return [
    ...directions.slice(startIndex),
    ...directions.slice(0, startIndex),
  ];
}

function resolveRowCount(options = {}) {
  return (
    options.rows ??
    options.rowCount ??
    options.height ??
    options.size ??
    options.gridSize ??
    options.maxRows ??
    options.maxSize ??
    6
  );
}

function resolveColCount(options = {}) {
  return (
    options.cols ??
    options.colCount ??
    options.width ??
    options.size ??
    options.gridSize ??
    options.maxCols ??
    options.maxSize ??
    resolveRowCount(options)
  );
}

function buildGridState(targetWords, options = {}) {
  const rows = resolveRowCount(options);
  const cols = resolveColCount(options);
  const grid = createEmptyGrid(rows, cols);
  const directions = buildDirections(options);
  const sortedWords = [...targetWords]
    .map((word) => word.normalized)
    .sort((left, right) => right.length - left.length);

  const placements = sortedWords.map((word, index) => {
    const placement = placeWord(grid, word, rotateDirections(directions, index));

    if (!placement) {
      throw new Error('Nao foi possivel gerar a grade do caca-versiculo.');
    }

    return placement;
  });

  fillEmptyCells(grid);

  return {
    rows,
    cols,
    grid,
    placements,
  };
}

export function getCellKey(cell) {
  return `${cell.row}-${cell.col}`;
}

export function generateWordSearchGrid(targetWords, options = {}) {
  const maxAttempts = options.maxAttempts ?? 1500;
  let lastError = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return buildGridState(targetWords, options);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('Nao foi possivel gerar a grade do caca-versiculo.');
}
