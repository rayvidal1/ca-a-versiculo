export const verseHuntModes = [
  {
    id: 'facil',
    label: 'Facil',
    summary: '6x8 | 5-8 palavras | vitoria rapida',
    gameOptions: {
      cols: 6,
      rows: 8,
      minTargetWordCount: 5,
      maxTargetWordCount: 8,
      minWordLength: 3,
      minFallbackWordLength: 2,
      maxWordLength: 6,
      directionDistribution: {
        right: 60,
        down: 40,
      },
      includeDiagonal: false,
      allowBackwards: false,
      randomWordSelection: true,
      preferShortVerse: true,
      shortVerseMaxLength: 105,
    },
  },
  {
    id: 'medio',
    label: 'Medio',
    summary: '7x9 | 8-12 palavras | mais leitura e confusao',
    gameOptions: {
      cols: 7,
      rows: 9,
      minTargetWordCount: 8,
      maxTargetWordCount: 12,
      minWordLength: 4,
      minFallbackWordLength: 2,
      maxWordLength: 7,
      directionDistribution: {
        right: 40,
        down: 30,
        left: 10,
        up: 5,
        diagonalDown: 15,
      },
      includeDiagonal: true,
      allowBackwards: false,
    },
  },
  {
    id: 'dificil',
    label: 'Dificil',
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
