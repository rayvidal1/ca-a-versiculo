import { ScrollView, StyleSheet } from 'react-native';
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
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    gap: 18,
  },
});
