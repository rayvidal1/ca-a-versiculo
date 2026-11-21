import { wordHighlights } from '../theme/palette.js';
import { processVerseForHunt } from './verseProcessing.js';
import { generateWordSearchGrid } from './wordSearch.js';

function createGridState(targetWords, options) {
  return generateWordSearchGrid(targetWords, {
    rows: options.rows,
    cols: options.cols,
    gridSize: options.gridSize,
    directionDistribution: options.directionDistribution,
    includeDiagonal: options.includeDiagonal ?? false,
    allowBackwards: options.allowBackwards ?? false,
    autoAdjustDirectionWeights: options.autoAdjustDirectionWeights ?? false,
    maxAttempts: options.maxAttempts,
  });
}

function resolveRequestedWordRange(verse, options = {}) {
  const requestedMax =
    options.maxTargetWordCount ??
    options.targetWordCount ??
    verse.targetWordCount ??
    3;
  const requestedMin =
    options.minTargetWordCount ??
    options.targetWordCount ??
    requestedMax;

  return {
    min: Math.min(requestedMin, requestedMax),
    max: Math.max(requestedMin, requestedMax),
  };
}

export function createGameState(verse, options) {
  const requestedWordRange = resolveRequestedWordRange(verse, options);
  const initialVerseState = processVerseForHunt(verse, options);
  const maxAvailableCount = initialVerseState.targetWords.length;
  if (!maxAvailableCount) throw new Error('Versiculo sem palavras validas de pelo menos 3 letras.');
  const preferredMinimumCount = Math.min(maxAvailableCount, requestedWordRange.min);
  let lastError = null;

  for (let wordCount = maxAvailableCount; wordCount >= preferredMinimumCount; wordCount -= 1) {
    const gameOptions =
      wordCount === maxAvailableCount
        ? options
        : {
            ...options,
            targetWordCount: wordCount,
            minTargetWordCount: wordCount,
            maxTargetWordCount: wordCount,
          };
    const processedVerse =
      wordCount === maxAvailableCount
        ? initialVerseState
        : processVerseForHunt(verse, gameOptions);

    try {
      const gridState = createGridState(processedVerse.targetWords, gameOptions);
      const wordStyleMap = processedVerse.targetWords.reduce((map, word, index) => {
        map[word.normalized] = wordHighlights[index % wordHighlights.length];
        return map;
      }, {});
      const placements = gridState.placements.map((placement) => ({
        ...placement,
        color: wordStyleMap[placement.word],
      }));

      return {
        verse: processedVerse,
        gridState: {
          ...gridState,
          placements,
        },
        wordStyleMap,
      };
    } catch (error) {
      lastError = error;
    }
  }

  for (let wordCount = preferredMinimumCount - 1; wordCount >= 1; wordCount -= 1) {
    const fallbackOptions = {
      ...options,
      targetWordCount: wordCount,
      minTargetWordCount: wordCount,
      maxTargetWordCount: wordCount,
    };
    const processedVerse = processVerseForHunt(verse, fallbackOptions);

    try {
      const gridState = createGridState(processedVerse.targetWords, fallbackOptions);
      const wordStyleMap = processedVerse.targetWords.reduce((map, word, index) => {
        map[word.normalized] = wordHighlights[index % wordHighlights.length];
        return map;
      }, {});
      const placements = gridState.placements.map((placement) => ({
        ...placement,
        color: wordStyleMap[placement.word],
      }));

      return {
        verse: processedVerse,
        gridState: {
          ...gridState,
          placements,
        },
        wordStyleMap,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('Nao foi possivel iniciar o jogo.');
}
