import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

export function useVictorySound() {
  const soundRef = useRef(null);

  useEffect(() => {
    Audio.Sound.createAsync(require('../assets/sounds/victory.mp3'), { volume: 0.55 })
      .then(({ sound }) => { soundRef.current = sound; })
      .catch(() => {});

    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  return function playVictory() {
    const sound = soundRef.current;
    if (!sound) return;
    sound.setPositionAsync(0).then(() => sound.playAsync()).catch(() => {});
  };
}
