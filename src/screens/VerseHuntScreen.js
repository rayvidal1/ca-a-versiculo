import { StyleSheet, View } from 'react-native';
import { useState } from 'react';

import VerseCard from '../components/VerseCard.js';
import WordSearchGrid from '../components/WordSearchGrid.js';
import { useVerseHuntGame } from '../hooks/useVerseHuntGame.js';
import { getInitialVerse, getRandomVerse } from '../services/verseSource.js';

export default function VerseHuntScreen() {
  const [currentVerse, setCurrentVerse] = useState(() => getInitialVerse());
  const {
    verse,
    grid,
    selectedCellMap,
    selectionInvalid,
    foundWordSet,
    foundCellMap,
    isComplete,
    handleSelectionStart,
    handleSelectionMove,
    handleSelectionEnd,
  } = useVerseHuntGame(currentVerse, {
    gridSize: 6,
    minGridSize: 6,
    maxGridSize: 6,
    targetWordCount: 3,
    maxWordLength: 6,
    includeDiagonal: false,
  });

  function handleNextVerse() {
    setCurrentVerse((current) => getRandomVerse(current.id));
  }

  return (
    <View style={styles.screen}>
      <VerseCard
        reference={verse.reference}
        tokens={verse.tokens}
        foundWordSet={foundWordSet}
        onNextVerse={handleNextVerse}
        isComplete={isComplete}
      />

      <WordSearchGrid
        grid={grid}
        selectedCellMap={selectedCellMap}
        foundCellMap={foundCellMap}
        selectionInvalid={selectionInvalid}
        onSelectionStart={handleSelectionStart}
        onSelectionMove={handleSelectionMove}
        onSelectionEnd={handleSelectionEnd}
        disabled={isComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
});
