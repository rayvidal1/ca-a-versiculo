import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

// Toca o som de vitória em 3 batidas rápidas (fanfarra)
export function useVictorySound() {
  const soundsRef = useRef([]);

  useEffect(() => {
    const promises = [0, 1, 2].map(() =>
      Audio.Sound.createAsync(require('../assets/sounds/sucess.mp3'))
        .then(({ sound }) => sound)
        .catch(() => null)
    );

    Promise.all(promises).then((sounds) => {
      soundsRef.current = sounds.filter(Boolean);
    });

    return () => {
      soundsRef.current.forEach((sound) => sound.unloadAsync());
    };
  }, []);

  return async function playVictory() {
    const delays = [0, 280, 520];
    soundsRef.current.forEach((sound, i) => {
      setTimeout(async () => {
        try {
          await sound.setPositionAsync(0);
          await sound.playAsync();
        } catch {}
      }, delays[i]);
    });
  };
}
