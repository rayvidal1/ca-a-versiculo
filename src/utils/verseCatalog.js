import { getTutorialOptions, verseHuntModes } from '../constants/verseHuntModes.js';

export const MAX_VERSE_WORDS = 28;

export function getCatalogKey(options) {
  return JSON.stringify(Object.entries(options).sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => [key, value && typeof value === 'object'
      ? Object.entries(value).sort(([a], [b]) => a.localeCompare(b)) : value]));
}

export function getCatalogProfiles() {
  return [
    ...verseHuntModes.map((mode) => ({ id: mode.id, options: mode.gameOptions })),
    ...Array.from({ length: 5 }, (_, index) => ({
      id: `tutorial-${index + 1}`, options: getTutorialOptions(index + 1),
    })),
  ];
}

export function decodeCatalogVerse(catalog, index) {
  const [bookIndex, chapter, verse, text] = catalog.verses[index];
  const [abbrev, name] = catalog.books[bookIndex];
  return { id: `${abbrev}-${chapter}-${verse}`, reference: `${name} ${chapter}:${verse}`, text };
}

export function createCatalogSelector(catalog, eligibility, { onHistoryChange = () => {}, random = Math.random } = {}) {
  const defaults = getCatalogProfiles()[0].options;
  const pools = new Map(Object.values(eligibility.profiles).map((profile) => [profile.key, eligibility.pools[profile.pool]]));
  const limit = 512;
  let history = [], seen = new Set();

  function restoreHistory(stored) {
    if (!Array.isArray(stored)) return;
    // Keep rounds already started while storage was loading as the newest entries.
    history = [...new Set([...stored.filter((id) => typeof id === 'string'), ...history].reverse())]
      .reverse().slice(-limit);
    seen = new Set(history);
  }

  function pick(currentId, options = defaults) {
    const pool = pools.get(getCatalogKey(options));
    if (!pool?.length) throw new Error('Modo sem indice BPM elegivel; gere novamente o catalogo.');
    let chosen;
    const fresh = (index) => {
      const verse = decodeCatalogVerse(catalog, index);
      return verse.id !== currentId && !seen.has(verse.id);
    };
    // Most rounds need one lookup. Bounded retries avoid scanning the catalogue.
    for (let attempt = 0; attempt < 32; attempt++) {
      const index = pool[Math.floor(random() * pool.length)];
      if (fresh(index)) { chosen = index; break; }
    }
    if (chosen === undefined) {
      const start = Math.floor(random() * pool.length);
      for (let offset = 0; offset < pool.length; offset++) {
        const index = pool[(start + offset) % pool.length];
        if (fresh(index)) { chosen = index; break; }
      }
      // A small/exhausted pool may reuse history, but avoids the current verse.
      if (chosen === undefined) chosen = pool.find((index) => decodeCatalogVerse(catalog, index).id !== currentId) ?? pool[0];
    }
    const verse = decodeCatalogVerse(catalog, chosen);
    if (seen.has(verse.id)) history.splice(history.indexOf(verse.id), 1);
    history.push(verse.id); seen.add(verse.id);
    if (history.length > limit) seen.delete(history.shift());
    onHistoryChange(history.slice());
    return verse;
  }

  return { getInitialVerse: (options) => pick(undefined, options), getRandomVerse: pick, restoreHistory };
}
