export const verseHuntModes = [
  {
    id: 'facil',
    label: 'Fácil',
    summary: '7x9 | 8-12 palavras | mais leitura e confusão',
    gameOptions: {
      cols: 6,
      rows: 8,
      minTargetWordCount: 8,
      maxTargetWordCount: 12,
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
    id: 'medio',
    label: 'Médio',
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
  {
    id: 'dificil',
    label: 'Difícil',
    summary: '9x11 | 12-18 palavras | foco total',
    gameOptions: {
      cols: 9,
      rows: 11,
      minTargetWordCount: 12,
      maxTargetWordCount: 18,
      minWordLength: 4,
      minFallbackWordLength: 2,
      maxWordLength: 11,
      directionDistribution: {
        right: 20,
        down: 15,
        left: 15,
        up: 15,
        diagonalDown: 20,
        diagonalUp: 15,
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
