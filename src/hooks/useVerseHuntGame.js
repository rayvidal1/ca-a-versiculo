import { useEffect, useRef, useState } from 'react';
import { Animated, Share } from 'react-native';

import { useSoundEffect } from './useSoundEffect.js';

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

export function useVerseHuntGame(verse, options = {}, { onComplete } = {}) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const optionsKey = getOptionsKey(options);

  const [setup, setSetup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  const [selectedCells, setSelectedCells] = useState([]);
  const [selectionInvalid, setSelectionInvalid] = useState(false);
  const [foundPlacements, setFoundPlacements] = useState([]);
  const [lastFoundWord, setLastFoundWord] = useState(null);
  const celebration = useRef(new Animated.Value(0)).current;
  const playSuccess = useSoundEffect(require('../assets/sounds/sucess.mp3'), 0.11);
  const selectionAnchorRef = useRef(null);
  const selectedCellsRef = useRef([]);

  const foundWordSet = new Set(foundPlacements.map((placement) => placement.word));
  const foundCellMap = buildCellMap(foundPlacements);
  const selectedCellMap = selectedCells.reduce((map, cell) => {
    map[getCellKey(cell)] = true;
    return map;
  }, {});
  const isComplete =
    setup != null &&
    foundPlacements.length === setup.gridState.placements.length &&
    setup.gridState.placements.length > 0;

  function updateSelectedCells(nextSelection) {
    selectedCellsRef.current = nextSelection;
    setSelectedCells(nextSelection);
  }

  // Geração assíncrona: cede o controle para o React renderizar o loading
  // antes de iniciar o processamento síncrono pesado.
  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(null);
    selectedCellsRef.current = [];
    setSelectedCells([]);
    setFoundPlacements([]);
    setLastFoundWord(null);
    setSelectionInvalid(false);
    selectionAnchorRef.current = null;

    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      try {
        const gameState = createGameState(verse, options);
        if (!cancelled) {
          setSetup(gameState);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setIsLoading(false);
        }
      }
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verse.id, verse.reference, verse.text, optionsKey, retryKey]);

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
    if (selection.length < 2 || !setup) {
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
        if (currentPlacements.some((p) => p.word === matchedPlacement.word)) {
          return currentPlacements;
        }
        setLastFoundWord(matchedPlacement.word);
        playSuccess();
        const next = [...currentPlacements, matchedPlacement];
        if (next.length === setup.gridState.placements.length) {
          onCompleteRef.current?.();
        }
        return next;
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
      selectedCellsRef.current = [selectionAnchorRef.current];
    } else {
      selectedCellsRef.current = nextSelection;
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

  function addFoundPlacement(placement) {
    setFoundPlacements((current) => {
      if (current.some((p) => p.word === placement.word)) return current;
      setLastFoundWord(placement.word);
      playSuccess();
      return [...current, placement];
    });
  }

  async function shareVerse() {
    if (!setup) return false;
    try {
      await Share.share({
        message: `${setup.verse.reference}\n${setup.verse.text}`,
      });
    } catch (err) {
      return false;
    }

    return true;
  }

  function retry() {
    setRetryKey((k) => k + 1);
  }

  return {
    verse: setup?.verse ?? { reference: '', tokens: [], text: '' },
    grid: setup?.gridState.grid ?? [],
    placements: setup?.gridState.placements ?? [],
    wordStyleMap: setup?.wordStyleMap ?? {},
    selectedCells,
    selectedCellMap,
    selectionInvalid,
    foundPlacements,
    foundWordSet,
    foundCellMap,
    isComplete,
    celebration,
    lastFoundWord,
    isLoading,
    error,
    retry,
    addFoundPlacement,
    handleSelectionStart,
    handleSelectionMove,
    handleSelectionEnd,
    shareVerse,
  };
}
