import { StyleSheet, View } from 'react-native';
import { useMemo, useState } from 'react';

import images from '../assets/images.js';
import VerseCard from '../components/VerseCard.js';
import WordSearchGrid from '../components/WordSearchGrid.js';
import { useVerseHuntGame } from '../hooks/useVerseHuntGame.js';
import { getInitialVerse, getRandomVerse } from '../services/verseSource.js';

function pickImage(verseId) {
  let hash = 0;
  for (let i = 0; i < verseId.length; i++) {
    hash = (hash * 31 + verseId.charCodeAt(i)) >>> 0;
  }
  return images[hash % images.length];
}

export default function VerseHuntScreen() {
  const [currentVerse, setCurrentVerse] = useState(() => getInitialVerse());
  const backgroundImage = useMemo(() => pickImage(currentVerse.id), [currentVerse.id]);

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
    gridSize: 8,
    minGridSize: 8,
    maxGridSize: 8,
    targetWordCount: 5,
    maxWordLength: 7,
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
        backgroundImage={backgroundImage}
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
