import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

export function useSoundEffect(asset) {
  const soundRef = useRef(null);

  useEffect(() => {
    Audio.Sound.createAsync(asset)
      .then(({ sound }) => { soundRef.current = sound; })
      .catch(() => {});

    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  return async function play() {
    try {
      if (soundRef.current) {
        await soundRef.current.setPositionAsync(0);
        await soundRef.current.playAsync();
      }
    } catch {}
  };
}
