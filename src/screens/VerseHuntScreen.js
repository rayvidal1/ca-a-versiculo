import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ImageBackground, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

import ConfettiCannon from 'react-native-confetti-cannon';

import images from '../assets/images.js';
import GameModeSelector from '../components/GameModeSelector.js';
import PhraseToast from '../components/PhraseToast.js';
import ProgressBar from '../components/ProgressBar.js';
import VerseCard from '../components/VerseCard.js';
import WordSearchGrid from '../components/WordSearchGrid.js';
import {
  DEFAULT_VERSE_HUNT_MODE_ID,
  getVerseHuntModeConfig,
  verseHuntModes,
} from '../constants/verseHuntModes.js';
import { useSoundEffect } from '../hooks/useSoundEffect.js';
import { useVerseHuntGame } from '../hooks/useVerseHuntGame.js';
import { useVictorySound } from '../hooks/useVictorySound.js';
import { getInitialVerse, getRandomVerse } from '../services/verseSource.js';

function pickImage(verseId) {
  let hash = 0;
  for (let i = 0; i < verseId.length; i += 1) {
    hash = (hash * 31 + verseId.charCodeAt(i)) >>> 0;
  }
  return images[hash % images.length];
}

const CONFETTI_COLORS = ['#059669', '#D97706', '#7C3AED', '#DB2777', '#0284C7', '#F6F1E7', '#FFFFFF'];

const MID_PHRASES = [
  'Tá forte! 💪', 'Que isso! 🔥', 'Aí sim! 😎', 'Brabo demais! 💥',
  'Tá afiado! 🎯', 'Top demais! 🚀', 'Foi rápido! ⚡', 'Passou voando! ⏱️',
  'Deus é bom! 💛', 'Deus é fiel! 💙',
];
const END_PHRASES = [
  'Hô glória! 🙌', 'Que benção! ✨', 'Aleluia! 🔥', 'Glória a Deus! 🙏',
  'Só vitória! 🏆', 'Amém! 🙌', 'Que maravilha! 🌟', 'Vitória! 🔥',
  'Foi lindo! 😄', 'Mandou bem! 👏',
];

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export default function VerseHuntScreen() {
  const { width } = useWindowDimensions();
  const confettiRef = useRef(null);

  const midpointShownRef = useRef(false);
  const borderAnim = useRef(new Animated.Value(0)).current;
  const borderLoopRef = useRef(null);
  const [activePhrase, setActivePhrase] = useState(null);
  const playVictory = useVictorySound();
  const playGameStart = useSoundEffect(require('../assets/sounds/game-start.wav'));

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
    placements,
    foundPlacements,
    foundWordSet,
    lastFoundWord,
    isComplete,
    handleSelectionStart,
    handleSelectionMove,
    handleSelectionEnd,
  } = useVerseHuntGame(currentVerse, selectedMode.gameOptions);

  // Reseta ao trocar de versículo
  useEffect(() => {
    midpointShownRef.current = false;
    borderLoopRef.current?.stop();
    borderAnim.setValue(0);
  }, [currentVerse.id]);

  // Frase na metade do desafio
  useEffect(() => {
    if (isComplete || midpointShownRef.current) return;
    const mid = Math.ceil(placements.length / 2);
    if (placements.length > 1 && foundPlacements.length === mid) {
      midpointShownRef.current = true;
      setActivePhrase(pickRandom(MID_PHRASES));
    }
  }, [foundPlacements.length]);

  // Celebração ao completar
  useEffect(() => {
    if (isComplete) {
      confettiRef.current?.start();
      playVictory();
      setActivePhrase(pickRandom(END_PHRASES));
      borderLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(borderAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(borderAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      );
      borderLoopRef.current.start();
    }
  }, [isComplete]);

  function handleNextVerse() {
    playGameStart();
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
        <View style={styles.verseCardWrapper}>
          {isComplete && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.completeBorder,
                {
                  opacity: borderAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
                  transform: [{ scale: borderAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] }) }],
                },
              ]}
            />
          )}
          <VerseCard
            reference={verse.reference}
            tokens={verse.tokens}
            foundWordSet={foundWordSet}
            lastFoundWord={lastFoundWord}
            onNextVerse={handleNextVerse}
            isComplete={isComplete}
            hideBackground={cardsHidden}
          />
        </View>
        <ProgressBar found={foundPlacements.length} total={placements.length} />
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
              letterShadow={cardsHidden}
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
      {activePhrase && (
        <PhraseToast
          key={activePhrase + foundPlacements.length}
          phrase={activePhrase}
          onHide={() => setActivePhrase(null)}
        />
      )}
      {isComplete && (
        <ConfettiCannon
          ref={confettiRef}
          count={180}
          origin={{ x: width / 2, y: -20 }}
          colors={CONFETTI_COLORS}
          autoStart={false}
          fadeOut
          fallSpeed={3000}
        />
      )}
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
  boardCardHidden: {
    backgroundColor: 'transparent',
  },
  hideButtonContainer: {
    position: 'absolute',
    top: 36,
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
  verseCardWrapper: {
    position: 'relative',
  },
  completeBorder: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 28,
    borderWidth: 2.5,
    borderColor: '#D7AA59',
  },
});
