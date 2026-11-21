import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, ImageBackground, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

const BG = require('../assets/fundo.png');

import ConfettiCannon from 'react-native-confetti-cannon';

import FinalRevealAdBanner from '../components/FinalRevealAdBanner.js';
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
import { palette } from '../theme/palette.js';

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
  // Keep the current round stable when completion advances the tutorial counter.
  const [round, setRound] = useState(() => ({
    options: isTutorial ? getTutorialOptions(tutorialRound) : selectedMode.gameOptions,
    isFirst: isTutorial && tutorialRound === 1,
  }));
  const activeGameOptions = round.options;
  const hasModeInitializedRef = useRef(false);
  const [currentVerse, setCurrentVerse] = useState(() =>
    getInitialVerse(isTutorial ? getTutorialOptions(tutorialRound) : getVerseHuntModeConfig(modeId).gameOptions)
  );
  useEffect(() => {
    if (!hasModeInitializedRef.current) {
      hasModeInitializedRef.current = true;
      return;
    }

    setRound({ options: selectedMode.gameOptions, isFirst: false });
    setCurrentVerse((current) =>
      getRandomVerse(current?.id, selectedMode.gameOptions)
    );
  }, [selectedMode.id, selectedMode.gameOptions]);

  const completionAnim = useRef(new Animated.Value(0)).current;
  const overlayFadeAnim = useRef(new Animated.Value(0)).current;
  const boardAnim = useRef(new Animated.Value(0)).current;
  const nextVerseRef = useRef(null);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  const [hintWord, setHintWord] = useState(null);
  const isFirstRound = round.isFirst;

  const {
    verse,
    grid,
    placements,
    wordStyleMap,
    foundPlacements,
    foundWordSet,
    lastFoundWord,
    isComplete,
    isLoading,
    error,
    retry,
    addFoundPlacement,
    handleSelectionStart,
    handleSelectionMove,
    handleSelectionEnd,
    handleSelectionCancel,
  } = useVerseHuntGame(currentVerse, activeGameOptions, {
    onComplete: () => {
      onVersePlayed?.();
      playVictory();
      setActivePhrase({ text: pickRandom(END_PHRASES), duration: 1200 });
    },
  });

  const guideActive = isFirstRound && !isComplete && placements.length > 0;
  const guidePlacement = guideActive ? (placements.find(p => !foundWordSet.has(p.word)) ?? null) : null;
  const showOnboarding = guideActive && !onboardingDismissed;
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
      confettiRef.current?.start();
      Animated.parallel([
        Animated.timing(completionAnim, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayFadeAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(boardAnim, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }, 0);
    return () => clearTimeout(timeout);
  }, [isComplete]);

  // Reseta ao trocar de versículo
  useEffect(() => {
    midpointShownRef.current = false;
    completionAnim.setValue(0);
    overlayFadeAnim.setValue(0);
    boardAnim.setValue(0);
    setActivePhrase(null);
  }, [currentVerse.id]);

  // Frase na metade do desafio
  useEffect(() => {
    if (isComplete || midpointShownRef.current) return;
    const mid = Math.ceil(placements.length / 2);
    if (placements.length > 1 && foundPlacements.length === mid) {
      midpointShownRef.current = true;
      setActivePhrase({ text: pickRandom(MID_PHRASES), duration: 2000 });
    }
  }, [foundPlacements.length]);


  const boardOpacity = boardAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const boardTranslateY = boardAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -70] });
  const originalCardOpacity = completionAnim.interpolate({ inputRange: [0, 0.3], outputRange: [1, 0], extrapolate: 'clamp' });
  const overlayTranslateY = completionAnim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0], extrapolate: 'clamp' });

  function handleNextVerse() {
    playGameStart();
    const nextOptions = isTutorial ? getTutorialOptions(tutorialRound) : selectedMode.gameOptions;
    setRound({ options: nextOptions, isFirst: isTutorial && tutorialRound === 1 });
    setCurrentVerse((current) =>
      getRandomVerse(current.id, nextOptions)
    );
  }

  nextVerseRef.current = handleNextVerse;
  useEffect(() => {
    if (!isComplete || isLoading || error) return;
    const timer = setTimeout(() => nextVerseRef.current?.(), 1300);
    return () => clearTimeout(timer);
  }, [isComplete, isLoading, error, currentVerse.id]);

  function handleSkipVerse() {
    setCurrentVerse((current) => getRandomVerse(current.id, activeGameOptions));
  }

  return (
    <ImageBackground source={BG} style={styles.screen} resizeMode="cover" onTouchStart={() => setOnboardingDismissed(true)}>
      {/* Conteúdo do jogo — oculto durante loading/erro */}
      {!isLoading && !error && (
        <>
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
                isComplete={isComplete}
              />
            </Animated.View>
            <Animated.View style={[styles.boardArea, { opacity: boardOpacity, transform: [{ translateY: boardTranslateY }] }]}>
              <View style={styles.boardCard}>
                <WordSearchGrid
                  grid={grid}
                  foundPlacements={foundPlacements}
                  hintCell={(showOnboarding ? guideHintCell : null) ?? hintCell}
                  showOnboarding={showOnboarding}
                  onInteractionStart={() => setOnboardingDismissed(true)}
                  guidePlacement={guidePlacement}
                  onGuideComplete={(placement) => {
                    addFoundPlacement(placement);
                  }}
                  includeDiagonal={activeGameOptions.includeDiagonal ?? false}
                  directionDistribution={activeGameOptions.directionDistribution}
                  onSelectionStart={handleSelectionStart}
                  onSelectionMove={handleSelectionMove}
                  onSelectionEnd={handleSelectionEnd}
                  onSelectionCancel={handleSelectionCancel}
                  disabled={isComplete}
                />
              </View>
            </Animated.View>
          </View>
          {isComplete && (
            <Animated.View
              style={[styles.completionOverlay, {
                opacity: overlayFadeAnim,
                transform: [{ translateY: overlayTranslateY }],
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
                isComplete={isComplete}
              />
              <FinalRevealAdBanner />
            </Animated.View>
          )}
          {activePhrase && (
            <PhraseToast
              key={activePhrase.text + foundPlacements.length}
              phrase={activePhrase.text}
              duration={activePhrase.duration}
              onHide={() => setActivePhrase(null)}
            />
          )}
          {isComplete && (
            <View style={styles.confettiLayer}>
              <ConfettiCannon
                ref={confettiRef}
                count={35}
                origin={{ x: width / 2, y: -20 }}
                colors={CONFETTI_COLORS}
                autoStart={false}
                fadeOut
                fallSpeed={3000}
              />
            </View>
          )}
        </>
      )}

      {/* Botão de voltar — sempre visível */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonIcon}>‹</Text>
        </TouchableOpacity>
      </View>

      {/* Overlay de carregamento */}
      {isLoading && (
        <View style={styles.stateOverlay}>
          <ActivityIndicator size="large" color="rgba(255,255,255,0.9)" />
          <Text style={styles.stateLabel}>Preparando grade…</Text>
        </View>
      )}

      {/* Overlay de erro com retry */}
      {!isLoading && error && (
        <View style={styles.stateOverlay}>
          <Text style={styles.stateLabel}>Não foi possível{'\n'}gerar a grade</Text>
          <View style={styles.errorButtons}>
            <TouchableOpacity
              style={styles.completionNextButton}
              onPress={retry}
              activeOpacity={0.8}
            >
              <Text style={styles.completionNextButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.completionNextButton, styles.ghostButton]}
              onPress={handleSkipVerse}
              activeOpacity={0.8}
            >
              <Text style={styles.completionNextButtonText}>Outro versículo</Text>
            </TouchableOpacity>
          </View>
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
  completionNextButton: {
    marginTop: 14,
    backgroundColor: '#D4900A',
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    shadowOpacity: 0.5,
    elevation: 6,
  },
  completionNextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  completionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 80,
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
  stateOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  stateLabel: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    marginBottom: 6,
  },
  errorButtons: {
    width: '100%',
    gap: 10,
  },
  ghostButton: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    shadowOpacity: 0,
    elevation: 0,
  },
});

