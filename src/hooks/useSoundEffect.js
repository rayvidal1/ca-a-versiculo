import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

export function useSoundEffect() {
  const soundRef = useRef(null);

  useEffect(() => {
    Audio.Sound.createAsync(require('../assets/sounds/sucess.mp3'))
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
