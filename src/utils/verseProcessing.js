import { tokenizeVerse } from './text.js';

const STOP_WORDS = new Set([
  'A',
  'AO',
  'AS',
  'COM',
  'DA',
  'DE',
  'DO',
  'DOS',
  'E',
  'EM',
  'ME',
  'MEU',
  'NA',
  'NO',
  'O',
  'OS',
  'PARA',
  'SE',
  'SEM',
  'UM',
  'UMA',
]);

function scoreCandidate(token, index) {
  const uniqueLetters = new Set(token.normalized.split('')).size;
  return token.normalized.length * 10 + uniqueLetters - index * 0.01;
}

export function selectTargetWords(text, options = {}) {
  const targetWordCount = options.targetWordCount ?? 3;
  const minWordLength = options.minWordLength ?? 4;
  const maxWordLength = options.maxWordLength ?? Infinity;
  const seen = new Set();

  const candidates = tokenizeVerse(text)
    .filter((token) => token.type === 'word')
    .map((token, index) => ({ ...token, index }))
    .filter((token) => {
      return (
        token.normalized.length >= minWordLength &&
        token.normalized.length <= maxWordLength &&
        !STOP_WORDS.has(token.normalized)
      );
    })
    .filter((token) => {
      if (seen.has(token.normalized)) {
        return false;
      }

      seen.add(token.normalized);
      return true;
    });

  return candidates
    .sort((left, right) => scoreCandidate(right, right.index) - scoreCandidate(left, left.index))
    .slice(0, targetWordCount)
    .sort((left, right) => left.index - right.index)
    .map((token) => ({
      id: token.normalized,
      normalized: token.normalized,
      label: token.text,
      display: token.normalized,
    }));
}

export function processVerseForHunt(verse, options = {}) {
  const maxWordLength =
    options.maxWordLength ??
    options.maxGridSize ??
    options.gridSize ??
    10;
  const targetWords = selectTargetWords(verse.text, {
    targetWordCount: options.targetWordCount ?? verse.targetWordCount ?? 3,
    maxWordLength,
  });
  const targetWordSet = new Set(targetWords.map((word) => word.normalized));
  const tokens = tokenizeVerse(verse.text).map((token) => ({
    ...token,
    isTarget: token.type === 'word' && targetWordSet.has(token.normalized),
  }));

  return {
    ...verse,
    targetWords,
    tokens,
  };
}
