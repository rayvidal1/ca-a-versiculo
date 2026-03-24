import { useEffect, useRef, useState } from 'react';
import { Animated, Share } from 'react-native';

import { wordHighlights } from '../theme/palette.js';
import { buildSelectionFromEndpoints } from '../utils/selection.js';
import { processVerseForHunt } from '../utils/verseProcessing.js';
import { buildCellMap, findMatchedPlacement } from '../utils/validation.js';
import { generateWordSearchGrid, getCellKey } from '../utils/wordSearch.js';

function getDirectionDistributionKey(directionDistribution) {
  if (!directionDistribution) {
    return '';
  }

  return Object.entries(directionDistribution)
    .sort(([leftId], [rightId]) => leftId.localeCompare(rightId))
    .map(([directionId, weight]) => `${directionId}:${weight}`)
    .join(',');
}

function getOptionsKey(options = {}) {
  return [
    options.rows ?? '',
    options.cols ?? '',
    options.gridSize ?? '',
    options.targetWordCount ?? '',
    options.minTargetWordCount ?? '',
    options.maxTargetWordCount ?? '',
    options.minWordLength ?? '',
    options.minFallbackWordLength ?? '',
    options.maxWordLength ?? '',
    getDirectionDistributionKey(options.directionDistribution),
    options.includeDiagonal ? '1' : '0',
    options.allowBackwards ? '1' : '0',
    options.preferShortVerse ? '1' : '0',
    options.shortVerseMaxLength ?? '',
    options.autoAdjustDirectionWeights ? '1' : '0',
  ].join('|');
}

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

function createGameState(verse, options) {
  const requestedWordRange = resolveRequestedWordRange(verse, options);
  const initialVerseState = processVerseForHunt(verse, options);
  const maxAvailableCount = initialVerseState.targetWords.length;
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

export function useVerseHuntGame(verse, options = {}) {
  const optionsKey = getOptionsKey(options);
  const [setup, setSetup] = useState(() => createGameState(verse, options));
  const [selectedCells, setSelectedCells] = useState([]);
  const [selectionInvalid, setSelectionInvalid] = useState(false);
  const [foundPlacements, setFoundPlacements] = useState([]);
  const celebration = useRef(new Animated.Value(0)).current;
  const selectionAnchorRef = useRef(null);
  const selectedCellsRef = useRef([]);

  const foundWordSet = new Set(foundPlacements.map((placement) => placement.word));
  const foundCellMap = buildCellMap(foundPlacements);
  const selectedCellMap = selectedCells.reduce((map, cell) => {
    map[getCellKey(cell)] = true;
    return map;
  }, {});
  const isComplete =
    foundPlacements.length === setup.gridState.placements.length &&
    setup.gridState.placements.length > 0;

  function updateSelectedCells(nextSelection) {
    selectedCellsRef.current = nextSelection;
    setSelectedCells(nextSelection);
  }

  useEffect(() => {
    setSetup(createGameState(verse, options));
    updateSelectedCells([]);
    setFoundPlacements([]);
    setSelectionInvalid(false);
    selectionAnchorRef.current = null;
  }, [verse.id, verse.reference, verse.text, optionsKey]);

  useEffect(() => {
    if (!isComplete) {
      celebration.setValue(0);
      return;
    }

    Animated.sequence([
      Animated.spring(celebration, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
      }),
      Animated.timing(celebration, {
        toValue: 0.75,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(celebration, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [celebration, isComplete]);

  function commitSelection(selection) {
    if (selection.length < 2) {
      updateSelectedCells([]);
      return;
    }

    const matchedPlacement = findMatchedPlacement(
      selection,
      setup.gridState.placements,
      foundWordSet
    );

    if (matchedPlacement) {
      setFoundPlacements((currentPlacements) => {
        if (
          currentPlacements.some(
            (placement) => placement.word === matchedPlacement.word
          )
        ) {
          return currentPlacements;
        }

        return [...currentPlacements, matchedPlacement];
      });
    }

    updateSelectedCells([]);
  }

  function handleSelectionStart(cell) {
    if (isComplete) {
      return;
    }

    selectionAnchorRef.current = cell;
    setSelectionInvalid(false);
    updateSelectedCells(cell ? [cell] : []);
  }

  function handleSelectionMove(cell) {
    if (!selectionAnchorRef.current || !cell || isComplete) {
      return;
    }

    const nextSelection = buildSelectionFromEndpoints(selectionAnchorRef.current, cell, {
      includeDiagonal: options.includeDiagonal ?? false,
    });

    if (nextSelection === null) {
      setSelectionInvalid(true);
      updateSelectedCells([selectionAnchorRef.current]);
    } else {
      setSelectionInvalid(false);
      updateSelectedCells(nextSelection);
    }
  }

  function handleSelectionEnd() {
    if (!selectionAnchorRef.current || isComplete) {
      selectionAnchorRef.current = null;
      setSelectionInvalid(false);
      updateSelectedCells([]);
      return;
    }

    setSelectionInvalid(false);
    commitSelection(selectedCellsRef.current);
    selectionAnchorRef.current = null;
  }

  async function shareVerse() {
    try {
      await Share.share({
        message: `${setup.verse.reference}\n${setup.verse.text}`,
      });
    } catch (error) {
      return false;
    }

    return true;
  }

  return {
    verse: setup.verse,
    grid: setup.gridState.grid,
    placements: setup.gridState.placements,
    wordStyleMap: setup.wordStyleMap,
    selectedCells,
    selectedCellMap,
    selectionInvalid,
    foundPlacements,
    foundWordSet,
    foundCellMap,
    isComplete,
    celebration,
    handleSelectionStart,
    handleSelectionMove,
    handleSelectionEnd,
    shareVerse,
  };
}
