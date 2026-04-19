import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

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
    <View style={styles.screen}>
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
            highlightNovo={isTutorial && tutorialRound === 2}
          />
        </View>
        <View style={styles.boardArea}>
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
        </View>
      </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: 'rgba(0,0,0,0.07)',
    borderWidth: 1.2,
    borderColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonIcon: {
    fontSize: 18,
    color: '#333333',
  },
  verseCardWrapper: {
    flex: 3,
  },
});

