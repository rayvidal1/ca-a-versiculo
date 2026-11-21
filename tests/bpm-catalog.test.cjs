const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { performance } = require('node:perf_hooks');
const { gzipSync } = require('node:zlib');
const root = path.resolve(__dirname, '..');
const catalog = require('../src/data/bpm/catalog.json');
const eligibility = require('../src/data/bpm/eligibility.json');
const provenance = require('../src/data/bpm/provenance.json');
const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const modules = Promise.all([
  import('../src/utils/verseCatalog.js'), import('../src/utils/verseProcessing.js'),
  import('../src/utils/gameSetup.js'), import('../src/utils/validation.js'),
  import('../src/utils/wordSearch.js'),
]);

test('BPM provenance, source hashes, original texts and stable references', async (t) => {
  const [{ decodeCatalogVerse }] = await modules;
  assert.equal(provenance.translationId, 'porbrbsl');
  assert.equal(provenance.license, 'Public Domain');
  assert.equal(provenance.sourceVerses, 31102);
  assert.equal(catalog.books.length, 66);
  assert.equal(provenance.excluded.length, 9);
  const source = process.env.BPM_BOOKS_DIR || provenance.canonicalDirectory;
  const available = fs.existsSync(source);
  const originals = new Map();
  if (available) {
    for (const entry of provenance.sourceFiles) {
      const bytes = fs.readFileSync(path.join(source, entry.file));
      assert.equal(sha(bytes), entry.sha256, entry.file);
      const book = JSON.parse(bytes);
      book.chapters.forEach((chapter, ci) => chapter.forEach((text, vi) => {
        originals.set(`${book.abbrev}-${ci + 1}-${vi + 1}`, { text, reference: `${book.name} ${ci + 1}:${vi + 1}` });
      }));
    }
  } else t.diagnostic('Canonical source not available; source byte comparison skipped.');
  const seen = new Set();
  catalog.verses.forEach((_, index) => {
    const verse = decodeCatalogVerse(catalog, index);
    assert.ok(!seen.has(verse.id)); seen.add(verse.id);
    assert.ok(!provenance.excluded.includes(verse.id));
    assert.ok(verse.text.trim().split(/\s+/).length <= 28);
    if (available) assert.deepEqual({ text: verse.text, reference: verse.reference }, originals.get(verse.id));
  });
  for (const entry of provenance.rules) assert.equal(sha(fs.readFileSync(path.join(root, entry.file))), entry.sha256, `Regenerate catalogue after changing ${entry.file}`);
});

test('every indexed verse produces a valid 3+ letter game in all modes and tutorial stages', async (t) => {
  const [{ getCatalogProfiles, getCatalogKey, decodeCatalogVerse }, { processVerseForHunt }, { createGameState }, { findMatchedPlacement }, { canWordFitGrid }] = await modules;
  const checked = new Set();
  let combinations = 0;
  for (const profile of getCatalogProfiles()) {
    const entry = eligibility.profiles[profile.id];
    assert.equal(entry.key, getCatalogKey(profile.options));
    const pool = eligibility.pools[entry.pool];
    assert.equal(pool.length, provenance.profiles[profile.id]);
    assert.ok(pool.length > 134);
    assert.equal(new Set(pool).size, pool.length);
    combinations += pool.length;
    if (checked.has(entry.pool)) continue; // identical profiles share the exact same index/options
    checked.add(entry.pool);
    for (const index of pool) {
      const verse = decodeCatalogVerse(catalog, index);
      const processed = processVerseForHunt(verse, profile.options);
      assert.ok(processed.targetWords.length >= profile.options.minTargetWordCount);
      const state = createGameState(verse, { ...profile.options, maxAttempts: 2 });
      const placements = state.gridState.placements;
      assert.ok(placements.length > 0, `${profile.id}/${verse.id}`);
      for (const placement of placements) {
        const word = state.verse.targetWords.find((word) => word.normalized === placement.word);
        assert.ok(word.normalized.length >= 3 && word.letters.length >= 3);
        assert.ok(canWordFitGrid(word.letters.length, profile.options));
        assert.ok(profile.options.directionDistribution[placement.directionId] > 0);
        assert.equal(placement.cells.map(({ row, col }) => state.gridState.grid[row][col].letter).join(''), word.letters);
        assert.equal(findMatchedPlacement([...placement.cells].reverse(), placements, new Set()), placement);
      }
      assert.ok(state.verse.tokens.filter((token) => token.isTarget).every((token) => token.normalized.length >= 3));
    }
    t.diagnostic(`${profile.id}: ${pool.length} eligible verses validated`);
  }
  t.diagnostic(`${combinations} indexed combinations across eight profiles; identical pools tested once`);
});

test('indexed random selection, bounded history, restore race and offline performance', async (t) => {
  const [{ createCatalogSelector, getCatalogProfiles }, , { createGameState }] = await modules;
  let stored = [], calls = 0;
  const selector = createCatalogSelector(catalog, eligibility, { onHistoryChange: (history) => { stored = history; calls++; } });
  const profiles = getCatalogProfiles();
  let current;
  const recent = [];
  const samples = [];
  const start = performance.now();
  for (let i = 0; i < 10000; i++) {
    const before = performance.now();
    const next = selector.getRandomVerse(current?.id, profiles[i % profiles.length].options);
    samples.push(performance.now() - before);
    assert.ok(!recent.includes(next.id), 'recent verse repeated');
    recent.push(next.id); if (recent.length > 512) recent.shift();
    current = next;
  }
  assert.equal(calls, 10000);
  assert.equal(stored.length, 512);
  const previous = current.id;
  selector.restoreHistory(['old-id', previous]);
  assert.notEqual(selector.getRandomVerse(previous, profiles[0].options).id, previous);
  const restored = createCatalogSelector(catalog, eligibility, { random: () => 0 });
  restored.restoreHistory(stored);
  assert.ok(!stored.includes(restored.getInitialVerse(profiles[0].options).id));
  samples.sort((a, b) => a - b);
  const setupSamples = [];
  for (let i = 0; i < 160; i++) {
    const options = profiles[i % profiles.length].options;
    const verse = selector.getInitialVerse(options);
    const before = performance.now();
    const state = createGameState(verse, options); // production retry limit
    setupSamples.push(performance.now() - before);
    assert.ok(state.gridState.placements.length > 0);
  }
  setupSamples.sort((a, b) => a - b);
  const files = ['catalog.json', 'eligibility.json', 'provenance.json'].map((name) => fs.readFileSync(path.join(root, 'src/data/bpm', name)));
  t.diagnostic(JSON.stringify({ selections: 10000, totalTestMs: +(performance.now() - start).toFixed(2), selectionMedianMs: +samples[5000].toFixed(4), selectionP95Ms: +samples[9500].toFixed(4), setupMedianMs: +setupSamples[80].toFixed(3), setupP95Ms: +setupSamples[152].toFixed(3), dataBytes: files.reduce((n, b) => n + b.length, 0), gzipBytes: files.reduce((n, b) => n + gzipSync(b).length, 0) }));
});
