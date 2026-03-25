import { useEffect, useMemo, useRef, useState } from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import images from '../assets/images.js';
import GameModeSelector from '../components/GameModeSelector.js';
import VerseCard from '../components/VerseCard.js';
import WordSearchGrid from '../components/WordSearchGrid.js';
import {
  DEFAULT_VERSE_HUNT_MODE_ID,
  getVerseHuntModeConfig,
  verseHuntModes,
} from '../constants/verseHuntModes.js';
import { useVerseHuntGame } from '../hooks/useVerseHuntGame.js';
import { getInitialVerse, getRandomVerse } from '../services/verseSource.js';

function pickImage(verseId) {
  let hash = 0;
  for (let i = 0; i < verseId.length; i += 1) {
    hash = (hash * 31 + verseId.charCodeAt(i)) >>> 0;
  }
  return images[hash % images.length];
}

export default function VerseHuntScreen() {
  const [selectedModeId, setSelectedModeId] = useState(
    DEFAULT_VERSE_HUNT_MODE_ID
  );
  const hasModeInitializedRef = useRef(false);
  const [currentVerse, setCurrentVerse] = useState(() =>
    getInitialVerse(getVerseHuntModeConfig(DEFAULT_VERSE_HUNT_MODE_ID).gameOptions)
  );
  const backgroundImage = useMemo(
    () => pickImage(currentVerse.id),
    [currentVerse.id]
  );
  const selectedMode = useMemo(
    () => getVerseHuntModeConfig(selectedModeId),
    [selectedModeId]
  );

  useEffect(() => {
    if (!hasModeInitializedRef.current) {
      hasModeInitializedRef.current = true;
      return;
    }

    setCurrentVerse((current) =>
      getRandomVerse(current?.id, selectedMode.gameOptions)
    );
  }, [selectedMode.id, selectedMode.gameOptions]);

  const [cardsHidden, setCardsHidden] = useState(false);

  const {
    verse,
    grid,
    foundPlacements,
    foundWordSet,
    isComplete,
    handleSelectionStart,
    handleSelectionMove,
    handleSelectionEnd,
  } = useVerseHuntGame(currentVerse, selectedMode.gameOptions);

  function handleNextVerse() {
    setCurrentVerse((current) =>
      getRandomVerse(current.id, selectedMode.gameOptions)
    );
  }

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.screen}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={styles.content}>
        <View style={cardsHidden ? styles.hidden : null}>
          <VerseCard
            reference={verse.reference}
            tokens={verse.tokens}
            foundWordSet={foundWordSet}
            onNextVerse={handleNextVerse}
            isComplete={isComplete}
          />
        </View>
        <View style={styles.boardArea}>
          <View style={[styles.boardCard, cardsHidden && styles.boardCardHidden]}>
            <GameModeSelector
              modes={verseHuntModes}
              selectedModeId={selectedMode.id}
              onSelectMode={setSelectedModeId}
            />
            <WordSearchGrid
              grid={grid}
              foundPlacements={foundPlacements}
              includeDiagonal={selectedMode.gameOptions.includeDiagonal ?? false}
              onSelectionStart={handleSelectionStart}
              onSelectionMove={handleSelectionMove}
              onSelectionEnd={handleSelectionEnd}
              disabled={isComplete}
            />
          </View>
        </View>
      </View>
      <View style={styles.hideButtonContainer}>
        <TouchableOpacity
          style={styles.hideButton}
          onPress={() => setCardsHidden((v) => !v)}
          activeOpacity={0.7}
        >
          <Text style={styles.hideButtonIcon}>{cardsHidden ? '◉' : '◎'}</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  boardArea: {
    alignItems: 'center',
  },
  boardCard: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 28,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  hidden: {
    opacity: 0,
  },
  boardCardHidden: {
    backgroundColor: 'transparent',
  },
  hideButtonContainer: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hideButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hideButtonIcon: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.75)',
  },
});
