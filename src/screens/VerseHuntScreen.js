import { useEffect, useMemo, useRef, useState } from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

import ConfettiCannon from 'react-native-confetti-cannon';

import images from '../assets/images.js';
import PhraseToast from '../components/PhraseToast.js';
import VerseCard from '../components/VerseCard.js';
import WordSearchGrid from '../components/WordSearchGrid.js';
import {
  getVerseHuntModeConfig,
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
  'Muito bom! 👏', 'Uau! 😮🔥', 'Tá mandando bem! 💪', 'Mandou bem demais! 🚀',
  'Arrasou! ✨', 'Que isso! 🔥', 'Brabo! 💥', 'Sensacional! 😄',
  'Show! 🎯', 'Excelente! 🌟', 'Top! 🚀', 'Boa demais! 👏',
  'Que jogada! 🔥', 'Tá voando! ✈️', 'Aí sim! 😎', 'Muito top! 💥',
  'Tá afiado! 🎯', 'Que nível! 🔥', 'Perfeito! ✨', 'Que aula! 👏',
];
const END_PHRASES = [
  'Hô glória! 🙌', 'Que benção! ✨', 'Aleluia! 🔥', 'Glória a Deus! 🙏',
  'Só vitória! 🏆', 'Amém! 🙌', 'Que maravilha! 🌟', 'Vitória! 🔥',
  'Foi lindo! 😄', 'Mandou bem! 👏',
];

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}


export default function VerseHuntScreen({ modeId, onBack, onVersePlayed }) {
  const { width } = useWindowDimensions();
  const confettiRef = useRef(null);

  const midpointShownRef = useRef(false);
  const [activePhrase, setActivePhrase] = useState(null);
  const playVictory = useVictorySound();
  const playGameStart = useSoundEffect(require('../assets/sounds/game-start.wav'), 0.55);

  const selectedMode = useMemo(() => getVerseHuntModeConfig(modeId), [modeId]);
  const hasModeInitializedRef = useRef(false);
  const [currentVerse, setCurrentVerse] = useState(() =>
    getInitialVerse(getVerseHuntModeConfig(modeId).gameOptions)
  );
  const backgroundImage = useMemo(
    () => pickImage(currentVerse.id),
    [currentVerse.id]
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
  const [boardAreaHeight, setBoardAreaHeight] = useState(0);

  const {
    verse,
    grid,
    placements,
    wordStyleMap,
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
    }
  }, [isComplete]);

  function handleNextVerse() {
    playGameStart();
    onVersePlayed?.();
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
          <VerseCard
            reference={verse.reference}
            tokens={verse.tokens}
            foundWordSet={foundWordSet}
            wordStyleMap={wordStyleMap}
            lastFoundWord={lastFoundWord}
            onNextVerse={handleNextVerse}
            isComplete={isComplete}
            hideBackground={cardsHidden}
          />
        </View>
        <View
          style={styles.boardArea}
          onLayout={(e) => setBoardAreaHeight(e.nativeEvent.layout.height)}
        >
          <View style={[styles.boardCard, cardsHidden && styles.boardCardHidden]}>
            <WordSearchGrid
              grid={grid}
              foundPlacements={foundPlacements}
              includeDiagonal={selectedMode.gameOptions.includeDiagonal ?? false}
              letterShadow={cardsHidden}
              onSelectionStart={handleSelectionStart}
              onSelectionMove={handleSelectionMove}
              onSelectionEnd={handleSelectionEnd}
              disabled={isComplete}
              maxHeight={boardAreaHeight > 0 ? boardAreaHeight - 20 : undefined}
            />
          </View>
        </View>
      </View>
      <View style={styles.hideButtonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.hideButtonIcon}>‹</Text>
        </TouchableOpacity>
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
    gap: 8,
    paddingTop: 76,
  },
  boardArea: {
    flex: 1,
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.2,
    borderColor: 'rgba(100, 170, 255, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hideButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.2,
    borderColor: 'rgba(100, 170, 255, 0.75)',
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
});

