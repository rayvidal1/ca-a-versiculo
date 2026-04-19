import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, ImageBackground, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

const BG = require('../assets/fundo.png');

import ConfettiCannon from 'react-native-confetti-cannon';

import PhraseToast from '../components/PhraseToast.js';
import VerseCard from '../components/VerseCard.js';
import WordSearchGrid from '../components/WordSearchGrid.js';
import {
  getVerseHuntModeConfig,
  getTutorialOptions,
} from '../constants/verseHuntModes.js';
import { useSoundEffect } from '../hooks/useSoundEffect.js';
import { useVerseHuntGame } from '../hooks/useVerseHuntGame.js';
import { useVictorySound } from '../hooks/useVictorySound.js';
import { getInitialVerse, getRandomVerse } from '../services/verseSource.js';

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


export default function VerseHuntScreen({ modeId, isTutorial, tutorialRound, onBack, onVersePlayed }) {
  const { width } = useWindowDimensions();
  const confettiRef = useRef(null);

  const midpointShownRef = useRef(false);
  const [activePhrase, setActivePhrase] = useState(null);
  const playVictory = useVictorySound();
  const playGameStart = useSoundEffect(require('../assets/sounds/game-start.wav'), 0.55);

  const selectedMode = useMemo(() => getVerseHuntModeConfig(modeId), [modeId]);
  const activeGameOptions = isTutorial ? getTutorialOptions(tutorialRound) : selectedMode.gameOptions;
  const hasModeInitializedRef = useRef(false);
  const [currentVerse, setCurrentVerse] = useState(() =>
    getInitialVerse(isTutorial ? getTutorialOptions(tutorialRound) : getVerseHuntModeConfig(modeId).gameOptions)
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

  const completionAnim = useRef(new Animated.Value(0)).current;

  const [hintWord, setHintWord] = useState(null);
  const isFirstRound = isTutorial && tutorialRound === 1;

  const {
    verse,
    grid,
    placements,
    wordStyleMap,
    foundPlacements,
    foundWordSet,
    lastFoundWord,
    isComplete,
    addFoundPlacement,
    handleSelectionStart,
    handleSelectionMove,
    handleSelectionEnd,
  } = useVerseHuntGame(currentVerse, activeGameOptions, {
    onComplete: () => {
      confettiRef.current?.start();
      playVictory();
      setActivePhrase(pickRandom(END_PHRASES));
    },
  });

  const guideActive = isFirstRound && !isComplete && placements.length > 0;
  const guidePlacement = guideActive ? (placements.find(p => !foundWordSet.has(p.word)) ?? null) : null;
  const guideHintCell = guidePlacement ? (grid[guidePlacement.cells[0]?.row]?.[guidePlacement.cells[0]?.col] ?? null) : null;

  useEffect(() => { setHintWord(null); }, [currentVerse.id]);
  useEffect(() => {
    if (hintWord && foundWordSet.has(hintWord)) setHintWord(null);
  }, [foundWordSet, hintWord]);

  function handleHint() {
    if (!verse?.tokens) return;
    const next = verse.tokens.find((t) => t.isTarget && !foundWordSet.has(t.normalized));
    if (!next) return;
    setHintWord(next.normalized);
  }

  const hintCell = useMemo(() => {
    if (!hintWord || !placements?.length) return null;
    const placement = placements.find((p) => p.word === hintWord);
    const cell = placement?.cells?.[0];
    if (!cell) return null;
    return grid[cell.row]?.[cell.col] ?? null;
  }, [hintWord, placements, grid]);

  useEffect(() => {
    if (!isComplete) return;
    const timeout = setTimeout(() => {
      Animated.timing(completionAnim, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, 280);
    return () => clearTimeout(timeout);
  }, [isComplete]);

  // Reseta ao trocar de versículo
  useEffect(() => {
    midpointShownRef.current = false;
    completionAnim.setValue(0);
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


  const boardTranslateY = completionAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 320] });
  const boardOpacity = completionAnim.interpolate({ inputRange: [0, 0.55, 1], outputRange: [1, 0.15, 0] });
  const originalCardOpacity = completionAnim.interpolate({ inputRange: [0, 0.35], outputRange: [1, 0], extrapolate: 'clamp' });
  const overlayOpacity = completionAnim.interpolate({ inputRange: [0.2, 1], outputRange: [0, 1], extrapolate: 'clamp' });
  const overlayScale = completionAnim.interpolate({ inputRange: [0.2, 1], outputRange: [0.87, 1], extrapolate: 'clamp' });
  const overlayTranslateY = completionAnim.interpolate({ inputRange: [0.2, 1], outputRange: [36, 0], extrapolate: 'clamp' });

  function handleNextVerse() {
    playGameStart();
    onVersePlayed?.();
    setCurrentVerse((current) =>
      getRandomVerse(current.id, activeGameOptions)
    );
  }

  return (
    <ImageBackground source={BG} style={styles.screen} resizeMode="cover">
      <View style={styles.content}>
        <Animated.View style={[styles.verseCardWrapper, { opacity: originalCardOpacity }]}>
          <VerseCard
            reference={verse.reference}
            tokens={verse.tokens}
            foundWordSet={foundWordSet}
            wordStyleMap={wordStyleMap}
            lastFoundWord={lastFoundWord}
            hintWord={guideActive ? placements[0]?.word : hintWord}
            onHint={handleHint}
            onNextVerse={handleNextVerse}
            isComplete={isComplete}
            highlightNovo={isTutorial && tutorialRound === 2}
          />
        </Animated.View>
        <Animated.View style={[styles.boardArea, { opacity: boardOpacity, transform: [{ translateY: boardTranslateY }] }]}>
          <View style={styles.boardCard}>
            <WordSearchGrid
              grid={grid}
              foundPlacements={foundPlacements}
              hintCell={guideHintCell ?? hintCell}
              guidePlacement={guidePlacement}
              onGuideComplete={(placement) => {
                addFoundPlacement(placement);
              }}
              includeDiagonal={activeGameOptions.includeDiagonal ?? false}
              onSelectionStart={handleSelectionStart}
              onSelectionMove={handleSelectionMove}
              onSelectionEnd={handleSelectionEnd}
              disabled={isComplete}
            />
          </View>
        </Animated.View>
      </View>
      {isComplete && (
        <Animated.View
          style={[styles.completionOverlay, {
            opacity: overlayOpacity,
            transform: [{ scale: overlayScale }, { translateY: overlayTranslateY }],
          }]}
        >
          <VerseCard
            reference={verse.reference}
            tokens={verse.tokens}
            foundWordSet={foundWordSet}
            wordStyleMap={wordStyleMap}
            lastFoundWord={lastFoundWord}
            hintWord={null}
            onHint={null}
            onNextVerse={handleNextVerse}
            isComplete={isComplete}
            highlightNovo={false}
          />
        </Animated.View>
      )}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonIcon}>‹</Text>
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
        <View style={styles.confettiLayer}>
          <ConfettiCannon
            ref={confettiRef}
            count={180}
            origin={{ x: width / 2, y: -20 }}
            colors={CONFETTI_COLORS}
            autoStart={false}
            fadeOut
            fallSpeed={3000}
          />
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 72,
  },
  content: {
    flex: 1,
    gap: 8,
    paddingTop: 76,
  },
  boardArea: {
    flex: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardCard: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 10,
  },
  completionOverlay: {
    position: 'absolute',
    top: 96,
    left: 16,
    right: 16,
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
    pointerEvents: 'none',
  },
  topBar: {
    position: 'absolute',
    top: 36,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  verseCardWrapper: {
    flex: 3,
  },
});

