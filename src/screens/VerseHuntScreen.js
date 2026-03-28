import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, ImageBackground, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

import ConfettiCannon from 'react-native-confetti-cannon';

import images from '../assets/images.js';
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
  const [hintWord, setHintWord] = useState(null);
  const isFirstRound = isTutorial && tutorialRound === 1;
  const [hideButtonTipDismissed, setHideButtonTipDismissed] = useState(false);
  const isThirdRound = isTutorial && tutorialRound === 3;
  const showHideButtonTip = isThirdRound && !hideButtonTipDismissed && !cardsHidden;
  const tipPulse = useRef(new Animated.Value(0)).current;
  const tipOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isThirdRound) return;
    Animated.timing(tipOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(tipPulse, { toValue: 1, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(tipPulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isThirdRound]);

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


  function handleNextVerse() {
    playGameStart();
    onVersePlayed?.();
    setCurrentVerse((current) =>
      getRandomVerse(current.id, activeGameOptions)
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
            hintWord={guideActive ? placements[0]?.word : hintWord}
            onHint={handleHint}
            onNextVerse={handleNextVerse}
            isComplete={isComplete}
            hideBackground={cardsHidden}
            highlightNovo={isTutorial && tutorialRound === 2}
          />
        </View>
        <View style={styles.boardArea}>
          <View style={[styles.boardCard, cardsHidden && styles.boardCardHidden]}>
            <WordSearchGrid
              grid={grid}
              foundPlacements={foundPlacements}
              hintCell={guideHintCell ?? hintCell}
              guidePlacement={guidePlacement}
              onGuideComplete={(placement) => {
                addFoundPlacement(placement);
              }}
              includeDiagonal={activeGameOptions.includeDiagonal ?? false}
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
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.hideButtonIcon}>‹</Text>
        </TouchableOpacity>
        {(!isTutorial || tutorialRound >= 3) && (
          <View>
            {showHideButtonTip && (
              <Animated.View pointerEvents="none" style={[styles.tipRing, {
                opacity: tipPulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
                transform: [{ scale: tipPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
              }]} />
            )}
            <TouchableOpacity
              style={[styles.hideButton, showHideButtonTip && styles.hideButtonHighlight]}
              onPress={() => {
                setCardsHidden((v) => !v);
                setHideButtonTipDismissed(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.hideButtonIcon}>{cardsHidden ? '◉' : '◎'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {showHideButtonTip && (
        <Animated.View style={[styles.tipCard, { opacity: tipOpacity }]} pointerEvents="none">
          <Text style={styles.tipText}>Toque em <Text style={styles.tipHighlight}>◎</Text> para jogar sem fundo e testar seu foco!</Text>
        </Animated.View>
      )}
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
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
    pointerEvents: 'none',
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
  hideButtonHighlight: {
    borderColor: 'rgba(255, 220, 80, 0.9)',
    backgroundColor: 'rgba(255, 200, 50, 0.25)',
  },
  tipRing: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255, 220, 80, 0.9)',
    alignSelf: 'center',
    top: 0,
  },
  tipCard: {
    position: 'absolute',
    bottom: 78,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  tipText: {
    color: '#1a2e1a',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  tipHighlight: {
    color: '#2D6A57',
    fontWeight: '800',
  },
  verseCardWrapper: {
    flex: 3,
  },
});

