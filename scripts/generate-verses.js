/** Offline BPM catalogue. Usage: node scripts/generate-verses.js [books-directory] */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { performance } = require('node:perf_hooks');
const { gzipSync } = require('node:zlib');
const root = path.resolve(__dirname, '..');
const source = path.resolve(process.argv[2] || process.env.BPM_BOOKS_DIR || path.join(root, '../biblu/src/data/bible/pt/books'));
const output = path.join(root, 'src/data/bpm');
const sha = (content) => crypto.createHash('sha256').update(content).digest('hex');

async function main() {
  const start = performance.now();
  const [{ processVerseForHunt }, { createGameState }, catalogUtils] = await Promise.all([
    'verseProcessing', 'gameSetup', 'verseCatalog',
  ].map((name) => import(pathToFileURL(path.join(root, 'src/utils', name + '.js')).href)));
  const { getCatalogProfiles, getCatalogKey, MAX_VERSE_WORDS } = catalogUtils;
  const sourceIndex = JSON.parse(fs.readFileSync(path.join(source, '../bible.index.json'), 'utf8'));
  if (sourceIndex.meta.translationId !== 'porbrbsl' || sourceIndex.meta.publicDomain !== true) {
    throw Error('Expected the public-domain BPM/porbrbsl source.');
  }
  const files = fs.readdirSync(source).filter((name) => name.endsWith('.json')).sort();
  if (files.length !== 66) throw Error('Expected 66 BPM books.');
  const sourceFiles = [], books = [], candidates = [], excluded = [];
  let sourceVerses = 0, sourceChapters = 0;
  const seen = new Set();
  for (const file of files) {
    const bytes = fs.readFileSync(path.join(source, file));
    const book = JSON.parse(bytes);
    sourceFiles.push({ file, sha256: sha(bytes) });
    const bookIndex = books.length;
    books.push([book.abbrev, book.name]);
    sourceChapters += book.chapters.length;
    book.chapters.forEach((chapter, ci) => chapter.forEach((text, vi) => {
      sourceVerses++;
      const id = book.abbrev + '-' + (ci + 1) + '-' + (vi + 1);
      if (seen.has(id) || typeof text !== 'string' || !text.trim()) throw Error('Invalid source verse: ' + id);
      seen.add(id);
      if (book.abbrev === 'pv' && ci === 9 && vi >= 12 && vi <= 20) { excluded.push(id); return; }
      if (text.trim().split(/\s+/).length > MAX_VERSE_WORDS) return;
      candidates.push({ id, reference: book.name + ' ' + (ci + 1) + ':' + (vi + 1), text, row: [bookIndex, ci + 1, vi + 1, text] });
    }));
  }
  if (excluded.length !== 9) throw Error('Expected nine excluded supplements.');
  const profiles = getCatalogProfiles();
  const pools = [], profileEntries = {}, byKey = new Map(), retained = new Set();
  // Deterministic witnesses make generation reproducible; the app keeps random layouts.
  const random = Math.random;
  let seed = 0xB1B1;
  Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  try {
    for (const profile of profiles) {
      const key = getCatalogKey(profile.options);
      if (!byKey.has(key)) {
        const indices = [];
        candidates.forEach((verse, index) => {
          const words = processVerseForHunt(verse, profile.options).targetWords;
          if (words.length < profile.options.minTargetWordCount) return;
          const state = createGameState(verse, { ...profile.options, maxAttempts: 2 });
          if (state.verse.targetWords.length < profile.options.minTargetWordCount) return;
          indices.push(index); retained.add(index);
        });
        if (!indices.length) throw Error('Empty profile: ' + profile.id);
        byKey.set(key, pools.length); pools.push(indices);
      }
      profileEntries[profile.id] = { key, pool: byKey.get(key) };
      console.log(profile.id + ': ' + pools[byKey.get(key)].length);
    }
  } finally { Math.random = random; }
  const remap = new Map();
  const rows = candidates.flatMap((verse, index) => {
    if (!retained.has(index)) return [];
    remap.set(index, remap.size); return [verse.row];
  });
  const catalog = { version: 1, books, verses: rows };
  const eligibility = { version: 1, profiles: profileEntries, pools: pools.map((pool) => pool.map((i) => remap.get(i))) };
  const rules = ['src/constants/verseHuntModes.js', 'src/utils/text.js', 'src/utils/verseProcessing.js', 'src/utils/wordSearch.js', 'src/utils/gameSetup.js', 'src/utils/verseCatalog.js'];
  const manifest = {
    version: 1, translation: 'BPM', translationId: 'porbrbsl', language: 'pt-BR',
    source: 'eBible.org', sourceUrl: 'https://ebible.org/porbrbsl/', canonicalDirectory: source,
    license: 'Public Domain', notice: 'BPM/porbrbsl is declared Public Domain by its source. Draft translation under revision. Original verse texts are preserved; Proverbs 10:13-21 (TB 1917 supplements) are excluded.',
    sourceBooks: files.length, sourceChapters, sourceVerses, excluded,
    maxVerseWords: MAX_VERSE_WORDS, minTargetLetters: 3, eligibleVerses: rows.length,
    sourceFiles, rules: rules.map((file) => ({ file, sha256: sha(fs.readFileSync(path.join(root, file))) })),
    profiles: Object.fromEntries(profiles.map((profile) => [profile.id, eligibility.pools[profileEntries[profile.id].pool].length])),
  };
  fs.mkdirSync(output, { recursive: true });
  const data = { 'catalog.json': catalog, 'eligibility.json': eligibility, 'provenance.json': manifest };
  let bytes = 0, gzipBytes = 0;
  for (const [name, value] of Object.entries(data)) {
    const content = JSON.stringify(value);
    fs.writeFileSync(path.join(output, name), content);
    bytes += Buffer.byteLength(content); gzipBytes += gzipSync(content).length;
  }
  console.log(JSON.stringify({ eligibleVerses: rows.length, bytes, gzipBytes, generationMs: Math.round(performance.now() - start) }));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
