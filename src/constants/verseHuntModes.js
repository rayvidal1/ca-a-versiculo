export const TUTORIAL_ROUNDS = 5;

const tutorialLevels = [
  // Rodada 1 — guia automático, só direita/baixo
  {
    cols: 5, rows: 6,
    minTargetWordCount: 3, maxTargetWordCount: 4,
    minWordLength: 3, minFallbackWordLength: 2, maxWordLength: 6,
    directionDistribution: { right: 70, down: 30, left: 0, up: 0, diagonalDown: 0, diagonalUp: 0 },
    includeDiagonal: false, allowBackwards: false,
  },
  // Rodada 2 — sem guia, mesma grade
  {
    cols: 5, rows: 6,
    minTargetWordCount: 3, maxTargetWordCount: 4,
    minWordLength: 3, minFallbackWordLength: 2, maxWordLength: 6,
    directionDistribution: { right: 70, down: 30, left: 0, up: 0, diagonalDown: 0, diagonalUp: 0 },
    includeDiagonal: false, allowBackwards: false,
  },
  // Rodada 3 — grade maior, introduz esquerda
  {
    cols: 6, rows: 7,
    minTargetWordCount: 4, maxTargetWordCount: 5,
    minWordLength: 3, minFallbackWordLength: 2, maxWordLength: 7,
    directionDistribution: { right: 50, down: 30, left: 20, up: 0, diagonalDown: 0, diagonalUp: 0 },
    includeDiagonal: false, allowBackwards: false,
  },
  // Rodada 4 — todas as 4 direções
  {
    cols: 6, rows: 8,
    minTargetWordCount: 5, maxTargetWordCount: 6,
    minWordLength: 3, minFallbackWordLength: 2, maxWordLength: 8,
    directionDistribution: { right: 35, down: 30, left: 20, up: 15, diagonalDown: 0, diagonalUp: 0 },
    includeDiagonal: false, allowBackwards: false,
  },
  // Rodada 5 — igual ao Fácil, com diagonal
  {
    cols: 6, rows: 8,
    minTargetWordCount: 6, maxTargetWordCount: 8,
    minWordLength: 4, minFallbackWordLength: 2, maxWordLength: 7,
    directionDistribution: { right: 40, down: 30, left: 7, up: 3, diagonalDown: 15, diagonalUp: 5 },
    includeDiagonal: true, allowBackwards: false,
  },
];

export function getTutorialOptions(round) {
  const index = Math.min(round - 1, tutorialLevels.length - 1);
  return tutorialLevels[index];
}

export const verseHuntModes = [
  {
    id: 'facil',
    label: 'Fácil',
    summary: '5x6 | 5-7 palavras | direções básicas',
    gameOptions: {
      cols: 5,
      rows: 6,
      minTargetWordCount: 5,
      maxTargetWordCount: 7,
      minWordLength: 3,
      minFallbackWordLength: 2,
      maxWordLength: 6,
      directionDistribution: {
        right: 50,
        down: 35,
        left: 10,
        up: 5,
        diagonalDown: 0,
        diagonalUp: 0,
      },
      includeDiagonal: false,
      allowBackwards: false,
    },
  },
  {
    id: 'medio',
    label: 'Médio',
    summary: '6x8 | 6-8 palavras | diagonal incluída',
    gameOptions: {
      cols: 6,
      rows: 8,
      minTargetWordCount: 6,
      maxTargetWordCount: 8,
      minWordLength: 4,
      minFallbackWordLength: 2,
      maxWordLength: 7,
      directionDistribution: {
        right: 40,
        down: 30,
        left: 7,
        up: 3,
        diagonalDown: 15,
        diagonalUp: 5,
      },
      includeDiagonal: true,
      allowBackwards: false,
    },
  },
  {
    id: 'dificil',
    label: 'Difícil',
    summary: '7x9 | 12-18 palavras | foco total',
    gameOptions: {
      cols: 7,
      rows: 9,
      minTargetWordCount: 12,
      maxTargetWordCount: 18,
      minWordLength: 4,
      minFallbackWordLength: 2,
      maxWordLength: 11,
      directionDistribution: {
        right: 30,
        down: 25,
        left: 20,
        up: 15,
        diagonalDown: 5,
        diagonalUp: 5,
      },
      includeDiagonal: true,
      allowBackwards: true,
    },
  },
];

export const DEFAULT_VERSE_HUNT_MODE_ID = verseHuntModes[0].id;

export function getVerseHuntModeConfig(modeId) {
  return (
    verseHuntModes.find((mode) => mode.id === modeId) ??
    verseHuntModes[0]
  );
}
