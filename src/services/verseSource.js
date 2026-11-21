import AsyncStorage from '@react-native-async-storage/async-storage';
import catalog from '../data/bpm/catalog.json';
import eligibility from '../data/bpm/eligibility.json';
import { createCatalogSelector } from '../utils/verseCatalog.js';

const HISTORY_KEY = 'verse_history';
const selector = createCatalogSelector(catalog, eligibility, {
  onHistoryChange: (history) => {
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history)).catch(() => {});
  },
});
let initialization;

export function initVerseHistory() {
  if (!initialization) {
    initialization = AsyncStorage.getItem(HISTORY_KEY).then((stored) => {
      if (stored) selector.restoreHistory(JSON.parse(stored));
    }).catch(() => {});
  }
  return initialization;
}

export const getInitialVerse = selector.getInitialVerse;
export const getRandomVerse = selector.getRandomVerse;
