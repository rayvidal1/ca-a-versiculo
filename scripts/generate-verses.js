/**
 * Gera src/data/verses.json a partir da biblia-api local.
 * Uso: node scripts/generate-verses.js
 */

const fs = require('fs');
const path = require('path');

const BIBLE_ROOT = path.join('C:', 'Users', 'Ray Vidal', 'biblia-api', 'nvi', 'nvi');
const OUT_FILE = path.join(__dirname, '..', 'src', 'data', 'verses.json');

// Livros curados com referências populares
const CURATED_REFS = [
  // Salmos
  { abbrev: 'sl', chapter: 23, verse: '1' },
  { abbrev: 'sl', chapter: 23, verse: '4' },
  { abbrev: 'sl', chapter: 27, verse: '1' },
  { abbrev: 'sl', chapter: 46, verse: '1' },
  { abbrev: 'sl', chapter: 46, verse: '10' },
  { abbrev: 'sl', chapter: 91, verse: '1' },
  { abbrev: 'sl', chapter: 91, verse: '11' },
  { abbrev: 'sl', chapter: 103, verse: '1' },
  { abbrev: 'sl', chapter: 119, verse: '105' },
  { abbrev: 'sl', chapter: 121, verse: '1' },
  { abbrev: 'sl', chapter: 121, verse: '2' },
  // João
  { abbrev: 'jo', chapter: 3, verse: '16' },
  { abbrev: 'jo', chapter: 3, verse: '17' },
  { abbrev: 'jo', chapter: 11, verse: '25' },
  { abbrev: 'jo', chapter: 14, verse: '6' },
  { abbrev: 'jo', chapter: 14, verse: '27' },
  { abbrev: 'jo', chapter: 15, verse: '5' },
  // Mateus
  { abbrev: 'mt', chapter: 5, verse: '3' },
  { abbrev: 'mt', chapter: 5, verse: '9' },
  { abbrev: 'mt', chapter: 6, verse: '33' },
  { abbrev: 'mt', chapter: 11, verse: '28' },
  { abbrev: 'mt', chapter: 28, verse: '20' },
  // Romanos
  { abbrev: 'rm', chapter: 8, verse: '28' },
  { abbrev: 'rm', chapter: 8, verse: '38' },
  { abbrev: 'rm', chapter: 8, verse: '39' },
  { abbrev: 'rm', chapter: 12, verse: '2' },
  // Filipenses
  { abbrev: 'fp', chapter: 4, verse: '4' },
  { abbrev: 'fp', chapter: 4, verse: '7' },
  { abbrev: 'fp', chapter: 4, verse: '13' },
  // Gálatas
  { abbrev: 'gl', chapter: 5, verse: '22' },
  // Isaías
  { abbrev: 'is', chapter: 40, verse: '31' },
  { abbrev: 'is', chapter: 41, verse: '10' },
  { abbrev: 'is', chapter: 53, verse: '5' },
  // Jeremias
  { abbrev: 'jr', chapter: 29, verse: '11' },
  // Josué
  { abbrev: 'js', chapter: 1, verse: '9' },
  // Provérbios
  { abbrev: 'pv', chapter: 3, verse: '5' },
  { abbrev: 'pv', chapter: 3, verse: '6' },
  { abbrev: 'pv', chapter: 18, verse: '10' },
  // Efésios
  { abbrev: 'ef', chapter: 2, verse: '8' },
  { abbrev: 'ef', chapter: 6, verse: '10' },
  // 1 João
  { abbrev: '1jo', chapter: 4, verse: '8' },
  { abbrev: '1jo', chapter: 4, verse: '19' },
  // Marcos
  { abbrev: 'mc', chapter: 10, verse: '45' },
  { abbrev: 'mc', chapter: 12, verse: '30' },
  // Lucas
  { abbrev: 'lc', chapter: 1, verse: '37' },
  // Gênesis
  { abbrev: 'gn', chapter: 1, verse: '1' },
];

const BOOK_NAMES = {
  sl: 'Salmos', jo: 'João', mt: 'Mateus', rm: 'Romanos', fp: 'Filipenses',
  gl: 'Gálatas', is: 'Isaías', jr: 'Jeremias', js: 'Josué', pv: 'Provérbios',
  ef: 'Efésios', '1jo': '1 João', mc: 'Marcos', lc: 'Lucas', gn: 'Gênesis',
};

function bookDisplayName(abbrev, chapterData) {
  return chapterData.book || BOOK_NAMES[abbrev] || abbrev.toUpperCase();
}

const verses = [];

for (const ref of CURATED_REFS) {
  const filePath = path.join(BIBLE_ROOT, ref.abbrev, `${ref.chapter}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`Arquivo não encontrado: ${filePath}`);
    continue;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const text = data.verses[ref.verse];
  if (!text) {
    console.warn(`Versículo não encontrado: ${ref.abbrev} ${ref.chapter}:${ref.verse}`);
    continue;
  }

  const bookName = bookDisplayName(ref.abbrev, data);
  const id = `${ref.abbrev}-${ref.chapter}-${ref.verse}`;
  const reference = `${bookName} ${ref.chapter}:${ref.verse}`;

  verses.push({ id, reference, text });
}

fs.writeFileSync(OUT_FILE, JSON.stringify(verses, null, 2), 'utf8');
console.log(`✓ Gerados ${verses.length} versículos em ${OUT_FILE}`);
