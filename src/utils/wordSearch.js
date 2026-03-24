const DIRECTIONS = [
  { rowStep: 0, colStep: 1 },
  { rowStep: 1, colStep: 0 },
];

function createEmptyGrid(size) {
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => ({
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

function placeWord(grid, word, preferredDirections = DIRECTIONS) {
  const attempts = [];

  preferredDirections.forEach((direction) => {
    for (let row = 0; row < grid.length; row += 1) {
      for (let col = 0; col < grid.length; col += 1) {
        attempts.push({ row, col, direction });
      }
    }
  });

  for (let i = attempts.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [attempts[i], attempts[j]] = [attempts[j], attempts[i]];
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

export function getCellKey(cell) {
  return `${cell.row}-${cell.col}`;
}

export function generateWordSearchGrid(targetWords, options = {}) {
  const size = options.size ?? 6;
  const grid = createEmptyGrid(size);
  const sortedWords = [...targetWords]
    .map((word) => word.normalized)
    .sort((left, right) => right.length - left.length);

  const placements = sortedWords.map((word, index) => {
    const directions =
      index === 0 && word.length >= Math.max(6, size)
        ? [{ rowStep: 1, colStep: 0 }]
        : DIRECTIONS;

    const placement = placeWord(grid, word, directions);

    if (!placement) {
      throw new Error('Nao foi possivel gerar a grade do caça-versiculo.');
    }

    return placement;
  });

  fillEmptyCells(grid);

  return {
    size,
    grid,
    placements,
  };
}
