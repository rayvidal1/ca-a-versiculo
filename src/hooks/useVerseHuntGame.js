import { useEffect, useRef, useState } from 'react';
import { Animated, Share } from 'react-native';

import { wordHighlights } from '../theme/palette.js';
import { buildSelectionFromEndpoints } from '../utils/selection.js';
import { processVerseForHunt } from '../utils/verseProcessing.js';
import { buildCellMap, findMatchedPlacement } from '../utils/validation.js';
import { generateWordSearchGrid, getCellKey } from '../utils/wordSearch.js';

function createGameState(verse, options) {
  const processedVerse = processVerseForHunt(verse, options);
  const gridState = generateWordSearchGrid(processedVerse.targetWords, {
    size: options.gridSize,
    minSize: options.minGridSize ?? options.gridSize ?? 8,
    maxSize: options.maxGridSize ?? 10,
    includeDiagonal: options.includeDiagonal ?? false,
  });
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
}

export function useVerseHuntGame(verse, options = {}) {
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
    selectionAnchorRef.current = null;
  }, [verse.id, verse.reference, verse.text, options.gridSize, options.includeDiagonal]);

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
