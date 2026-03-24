import verses from '../data/verses.json';

export function getInitialVerse() {
  return verses[Math.floor(Math.random() * verses.length)];
}

export function getRandomVerse(currentId) {
  const available = verses.filter((v) => v.id !== currentId);
  if (!available.length) return verses[0];
  return available[Math.floor(Math.random() * available.length)];
}
