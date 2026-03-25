import { accentedUpperCase, tokenizeVerse } from './text.js';

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

function collectCandidates(text, minWordLength, maxWordLength) {
  const seen = new Set();

  return tokenizeVerse(text)
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
}

function resolveTargetWordCount(totalCandidates, options = {}) {
  const requestedMax =
    options.maxTargetWordCount ??
    options.targetWordCount ??
    3;
  const requestedMin =
    options.minTargetWordCount ??
    options.targetWordCount ??
    requestedMax;
  const minTarget = Math.min(requestedMin, requestedMax);
  const maxTarget = Math.max(requestedMin, requestedMax);

  if (totalCandidates >= maxTarget) {
    return maxTarget;
  }

  if (totalCandidates >= minTarget) {
    return totalCandidates;
  }

  return totalCandidates;
}

export function selectTargetWords(text, options = {}) {
  const preferredMinWordLength = options.minWordLength ?? 4;
  const fallbackMinWordLength = Math.min(
    preferredMinWordLength,
    options.minFallbackWordLength ?? 2
  );
  const maxWordLength = options.maxWordLength ?? Infinity;
  const minimumDesiredCount =
    options.minTargetWordCount ??
    options.targetWordCount ??
    3;
  let candidates = [];

  for (
    let currentMinWordLength = preferredMinWordLength;
    currentMinWordLength >= fallbackMinWordLength;
    currentMinWordLength -= 1
  ) {
    candidates = collectCandidates(text, currentMinWordLength, maxWordLength);

    if (
      candidates.length >= minimumDesiredCount ||
      currentMinWordLength === fallbackMinWordLength
    ) {
      break;
    }
  }

  const targetWordCount = resolveTargetWordCount(candidates.length, options);

  let selected;
  if (options.randomWordSelection) {
    // Embaralha e pega os primeiros N — seleção aleatória
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    selected = shuffled.slice(0, targetWordCount);
  } else {
    selected = candidates
      .sort((left, right) => scoreCandidate(right, right.index) - scoreCandidate(left, left.index))
      .slice(0, targetWordCount);
  }

  return selected
    .sort((left, right) => left.index - right.index)
    .map((token) => ({
      id: token.normalized,
      normalized: token.normalized,
      letters: accentedUpperCase(token.text),
      label: token.text,
      display: token.normalized,
    }));
}

export function processVerseForHunt(verse, options = {}) {
  const minWordLength = options.minWordLength ?? 4;
  const maxGridDimension = Math.max(
    options.rows ?? 0,
    options.cols ?? 0,
    options.maxRows ?? 0,
    options.maxCols ?? 0,
    options.maxGridSize ?? 0,
    options.gridSize ?? 0
  );
  const maxWordLength = options.maxWordLength ?? (maxGridDimension > 0 ? maxGridDimension : 10);
  const targetWords = selectTargetWords(verse.text, {
    targetWordCount: options.targetWordCount ?? verse.targetWordCount ?? 3,
    minTargetWordCount: options.minTargetWordCount,
    maxTargetWordCount: options.maxTargetWordCount,
    minWordLength,
    minFallbackWordLength: options.minFallbackWordLength,
    maxWordLength,
    randomWordSelection: options.randomWordSelection ?? false,
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
