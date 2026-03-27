import { useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

const KEY = 'cacapalavra_versesPlayed';

export function useVersesPlayed() {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);

  useEffect(() => {
    SecureStore.getItemAsync(KEY).then((val) => {
      const n = val ? parseInt(val, 10) : 0;
      countRef.current = n;
      setCount(n);
    }).catch(() => {});
  }, []);

  async function increment() {
    const next = countRef.current + 1;
    countRef.current = next;
    setCount(next);
    await SecureStore.setItemAsync(KEY, String(next)).catch(() => {});
  }

  return [count, increment];
}
