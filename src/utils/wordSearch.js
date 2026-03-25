const DIRECTION_GROUPS = {
  right: {
    id: 'right',
    directions: [{ rowStep: 0, colStep: 1 }],
  },
  left: {
    id: 'left',
    directions: [{ rowStep: 0, colStep: -1 }],
  },
  down: {
    id: 'down',
    directions: [{ rowStep: 1, colStep: 0 }],
  },
  up: {
    id: 'up',
    directions: [{ rowStep: -1, colStep: 0 }],
  },
  diagonalDown: {
    id: 'diagonalDown',
    directions: [
      { rowStep: 1, colStep: 1 },
      { rowStep: 1, colStep: -1 },
    ],
  },
  diagonalUp: {
    id: 'diagonalUp',
    directions: [
      { rowStep: -1, colStep: 1 },
      { rowStep: -1, colStep: -1 },
    ],
  },
};

const DEFAULT_DIRECTION_DISTRIBUTION = {
  right: 1,
  down: 1,
};

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

function shuffle(array) {
  for (let index = array.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[swapIndex]] = [array[swapIndex], array[index]];
  }
  return array;
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

function resolveStartRange(limit, wordLength, step) {
  if (step === 1) {
    return { min: 0, max: limit - wordLength };
  }

  if (step === -1) {
    return { min: wordLength - 1, max: limit - 1 };
  }

  return { min: 0, max: limit - 1 };
}

function buildStartPositions(grid, wordLength, direction) {
  const rowCount = grid.length;
  const colCount = grid[0]?.length ?? 0;
  const rowRange = resolveStartRange(rowCount, wordLength, direction.rowStep);
  const colRange = resolveStartRange(colCount, wordLength, direction.colStep);

  if (
    rowRange.max < rowRange.min ||
    colRange.max < colRange.min
  ) {
    return [];
  }

  const positions = [];

  for (let row = rowRange.min; row <= rowRange.max; row += 1) {
    for (let col = colRange.min; col <= colRange.max; col += 1) {
      positions.push({ row, col, direction });
    }
  }

  return shuffle(positions);
}

function placeWord(grid, word, directions) {
  const positionBuckets = directions.map((direction) =>
    buildStartPositions(grid, word.length, direction)
  );
  const maxBucketLength = Math.max(
    0,
    ...positionBuckets.map((positions) => positions.length)
  );
  const attempts = [];

  for (let index = 0; index < maxBucketLength; index += 1) {
    positionBuckets.forEach((positions) => {
      if (positions[index]) {
        attempts.push(positions[index]);
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

function normalizeDirectionDistribution(directionDistribution, options = {}) {
  const sourceDistribution = directionDistribution ?? buildLegacyDistribution(options);
  const entries = Array.isArray(sourceDistribution)
    ? sourceDistribution
    : Object.entries(sourceDistribution).map(([id, weight]) => ({ id, weight }));

  return entries
    .map((entry) => ({
      id: entry.id,
      weight: Number(entry.weight ?? 0),
    }))
    .filter((entry) => DIRECTION_GROUPS[entry.id] && entry.weight > 0);
}

function buildLegacyDistribution(options = {}) {
  const distribution = {
    ...DEFAULT_DIRECTION_DISTRIBUTION,
  };

  if (options.includeDiagonal) {
    distribution.diagonalDown = 1;
  }

  if (options.allowBackwards) {
    distribution.left = 1;
    distribution.up = 1;
  }

  if (options.includeDiagonal && options.allowBackwards) {
    distribution.diagonalUp = 1;
  }

  return distribution;
}

function maybeAdjustDistributionForGrid(distribution, options = {}) {
  if (!options.autoAdjustDirectionWeights) {
    return distribution;
  }

  const rows = resolveRowCount(options);
  const cols = resolveColCount(options);
  const adjusted = distribution.map((entry) => ({ ...entry }));
  const horizontalFactor = cols >= rows ? 1.08 : 0.96;
  const verticalFactor = rows >= cols ? 1.08 : 0.96;
  const diagonalFactor = Math.abs(rows - cols) <= 2 ? 1.04 : 0.94;

  adjusted.forEach((entry) => {
    if (entry.id === 'right' || entry.id === 'left') {
      entry.weight *= horizontalFactor;
    } else if (entry.id === 'down' || entry.id === 'up') {
      entry.weight *= verticalFactor;
    } else {
      entry.weight *= diagonalFactor;
    }
  });

  return adjusted;
}

function buildDirectionQuotaMap(wordCount, distribution) {
  const totalWeight = distribution.reduce((sum, entry) => sum + entry.weight, 0);
  const quotas = {};
  let assigned = 0;
  const remainders = distribution.map((entry) => {
    const rawCount = totalWeight > 0 ? (wordCount * entry.weight) / totalWeight : 0;
    const baseCount = Math.floor(rawCount);
    quotas[entry.id] = baseCount;
    assigned += baseCount;

    return {
      id: entry.id,
      remainder: rawCount - baseCount,
      weight: entry.weight,
      tieBreaker: Math.random(),
    };
  });

  const remaining = wordCount - assigned;

  remainders
    .sort((left, right) => {
      if (right.remainder !== left.remainder) {
        return right.remainder - left.remainder;
      }

      return right.tieBreaker - left.tieBreaker;
    })
    .slice(0, remaining)
    .forEach((entry) => {
      quotas[entry.id] = (quotas[entry.id] ?? 0) + 1;
    });

  return quotas;
}

function getDistributionMap(distribution) {
  return distribution.reduce((map, entry) => {
    map[entry.id] = entry.weight;
    return map;
  }, {});
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

function canWordFitDirectionGroup(wordLength, rows, cols, directionId) {
  switch (directionId) {
    case 'right':
    case 'left':
      return wordLength <= cols;
    case 'down':
    case 'up':
      return wordLength <= rows;
    case 'diagonalDown':
    case 'diagonalUp':
      return wordLength <= Math.min(rows, cols);
    default:
      return false;
  }
}

function getTheoreticalFitCount(wordLength, rows, cols, directionId) {
  switch (directionId) {
    case 'right':
    case 'left':
      return rows * Math.max(0, cols - wordLength + 1);
    case 'down':
    case 'up':
      return cols * Math.max(0, rows - wordLength + 1);
    case 'diagonalDown':
    case 'diagonalUp':
      return (
        2 *
        Math.max(0, rows - wordLength + 1) *
        Math.max(0, cols - wordLength + 1)
      );
    default:
      return 0;
  }
}

function buildDirectionChoiceOrder(wordLength, context) {
  const {
    rows,
    cols,
    directionDistribution,
    distributionMap,
    quotaMap,
    usageMap,
  } = context;
  const eligibleDirections = directionDistribution
    .map((entry) => entry.id)
    .filter((directionId) =>
      canWordFitDirectionGroup(wordLength, rows, cols, directionId)
    );

  return eligibleDirections
    .map((directionId) => {
      const targetCount = quotaMap[directionId] ?? 0;
      const usedCount = usageMap[directionId] ?? 0;
      const remainingCount = targetCount - usedCount;

      return {
        id: directionId,
        remainingCount,
        targetCount,
        quotaPressure:
          remainingCount > 0 && targetCount > 0
            ? remainingCount / targetCount
            : 0,
        quotaBonus: targetCount > 0 ? 1 / targetCount : 0,
        fitCount: getTheoreticalFitCount(wordLength, rows, cols, directionId),
        weight: distributionMap[directionId] ?? 0,
        randomValue: Math.random(),
      };
    })
    .sort((left, right) => {
      const leftNeedsQuota = left.remainingCount > 0 ? 1 : 0;
      const rightNeedsQuota = right.remainingCount > 0 ? 1 : 0;

      if (rightNeedsQuota !== leftNeedsQuota) {
        return rightNeedsQuota - leftNeedsQuota;
      }

      if (right.quotaPressure !== left.quotaPressure) {
        return right.quotaPressure - left.quotaPressure;
      }

      if (right.quotaBonus !== left.quotaBonus) {
        return right.quotaBonus - left.quotaBonus;
      }

      if (right.remainingCount !== left.remainingCount) {
        return right.remainingCount - left.remainingCount;
      }

      if (right.fitCount !== left.fitCount) {
        return right.fitCount - left.fitCount;
      }

      if (right.weight !== left.weight) {
        return right.weight - left.weight;
      }

      return right.randomValue - left.randomValue;
    })
    .map((entry) => entry.id);
}

function buildDirectionUsageMap(directionDistribution) {
  return directionDistribution.reduce((map, entry) => {
    map[entry.id] = 0;
    return map;
  }, {});
}

function placeWordWithDistribution(grid, word, context) {
  const directionChoiceOrder = buildDirectionChoiceOrder(word.length, context);

  for (const directionId of directionChoiceOrder) {
    const directions = shuffle([
      ...DIRECTION_GROUPS[directionId].directions,
    ]);
    const placement = placeWord(grid, word, directions);

    if (!placement) {
      continue;
    }

    return {
      ...placement,
      directionId,
    };
  }

  return null;
}

function buildGridState(targetWords, options = {}) {
  const rows = resolveRowCount(options);
  const cols = resolveColCount(options);
  const grid = createEmptyGrid(rows, cols);
  const directionDistribution = maybeAdjustDistributionForGrid(
    normalizeDirectionDistribution(options.directionDistribution, options),
    options
  );

  if (!directionDistribution.length) {
    throw new Error('Nenhuma direcao disponivel para gerar a grade.');
  }

  const sortedWords = [...targetWords]
    .map((word) => ({ normalized: word.normalized, letters: word.letters ?? word.normalized }))
    .sort((left, right) => right.letters.length - left.letters.length);
  const quotaMap = buildDirectionQuotaMap(sortedWords.length, directionDistribution);
  const usageMap = buildDirectionUsageMap(directionDistribution);
  const distributionMap = getDistributionMap(directionDistribution);
  const placements = [];
  const directionContext = {
    rows,
    cols,
    directionDistribution,
    distributionMap,
    quotaMap,
    usageMap,
  };

  for (const word of sortedWords) {
    // Usa a versão acentuada para as letras na grade
    const placement = placeWordWithDistribution(grid, word.letters, directionContext);

    if (!placement) {
      throw new Error('Nao foi possivel gerar a grade do caca-versiculo.');
    }

    // Mantém normalized como ID (usado em wordStyleMap, foundWordSet, etc.)
    placement.word = word.normalized;
    usageMap[placement.directionId] = (usageMap[placement.directionId] ?? 0) + 1;
    placements.push(placement);
  }

  fillEmptyCells(grid);

  return {
    rows,
    cols,
    grid,
    placements,
    directionQuota: quotaMap,
    directionUsage: usageMap,
  };
}

export function getCellKey(cell) {
  return `${cell.row}-${cell.col}`;
}

export function generateWordSearchGrid(targetWords, options = {}) {
  const maxAttempts = options.maxAttempts ?? 1200;
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
