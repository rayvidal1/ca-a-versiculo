import verses from '../data/verses.json';
import { selectTargetWords } from '../utils/verseProcessing.js';

function resolveRequestedWordRange(options = {}) {
  const max =
    options.maxTargetWordCount ??
    options.targetWordCount ??
    3;
  const min =
    options.minTargetWordCount ??
    options.targetWordCount ??
    max;

  return {
    min: Math.min(min, max),
    max: Math.max(min, max),
  };
}

function buildVerseMetrics(verse, options = {}) {
  const targetWords = selectTargetWords(verse.text, options);

  return {
    verse,
    targetWordCount: targetWords.length,
    textLength: verse.text.length,
  };
}

function scoreVerse(metrics, options = {}) {
  const range = resolveRequestedWordRange(options);
  const preferredWordCount = Math.round((range.min + range.max) / 2);
  const shortVerseMaxLength = options.shortVerseMaxLength ?? 105;
  let score = 0;

  if (
    metrics.targetWordCount >= range.min &&
    metrics.targetWordCount <= range.max
  ) {
    score += 600;
  } else if (metrics.targetWordCount < range.min) {
    score -= (range.min - metrics.targetWordCount) * 220;
  } else {
    score -= (metrics.targetWordCount - range.max) * 30;
  }

  score -= Math.abs(metrics.targetWordCount - preferredWordCount) * 18;

  if (options.preferShortVerse) {
    if (metrics.textLength <= shortVerseMaxLength) {
      score += 140;
    } else {
      score -= (metrics.textLength - shortVerseMaxLength) * 2;
    }

    score -= metrics.textLength * 0.18;
  } else {
    score -= metrics.textLength * 0.03;
  }

  return score;
}

function pickVerse(candidates) {
  const ranked = [...candidates].sort((left, right) => right.score - left.score);
  const pool = ranked.slice(0, Math.min(8, ranked.length));

  return pool[Math.floor(Math.random() * pool.length)]?.verse ?? verses[0];
}

function resolveVerseCandidates(currentId, options = {}) {
  const available = verses.filter((verse) => verse.id !== currentId);
  const metrics = available.map((verse) => buildVerseMetrics(verse, options));
  const scored = metrics.map((entry) => ({
    ...entry,
    score: scoreVerse(entry, options),
  }));

  return scored;
}

export function getInitialVerse(options = {}) {
  return pickVerse(resolveVerseCandidates(undefined, options));
}

export function getRandomVerse(currentId, options = {}) {
  const candidates = resolveVerseCandidates(currentId, options);

  if (!candidates.length) {
    return verses[0];
  }

  return pickVerse(candidates);
}
