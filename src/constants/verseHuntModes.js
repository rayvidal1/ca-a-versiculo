export const verseHuntModes = [
  {
    id: 'facil',
    label: 'Facil',
    summary: '6x8 | 5-8 palavras | horizontal e vertical',
    gameOptions: {
      cols: 6,
      rows: 8,
      minTargetWordCount: 5,
      maxTargetWordCount: 8,
      minWordLength: 4,
      minFallbackWordLength: 2,
      maxWordLength: 8,
      includeDiagonal: false,
      allowBackwards: false,
    },
  },
  {
    id: 'medio',
    label: 'Medio',
    summary: '7x9 | 8-12 palavras | inclui diagonais',
    gameOptions: {
      cols: 7,
      rows: 9,
      minTargetWordCount: 8,
      maxTargetWordCount: 12,
      minWordLength: 4,
      minFallbackWordLength: 2,
      maxWordLength: 9,
      includeDiagonal: true,
      allowBackwards: false,
    },
  },
  {
    id: 'dificil',
    label: 'Dificil',
    summary: '11x13 | 12-18 palavras | diagonal e invertido',
    gameOptions: {
      cols: 11,
      rows: 13,
      minTargetWordCount: 12,
      maxTargetWordCount: 18,
      minWordLength: 4,
      minFallbackWordLength: 2,
      maxWordLength: 13,
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
