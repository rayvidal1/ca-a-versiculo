import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

export function useSoundEffect(asset, volume = 1.0) {
  const soundRef = useRef(null);

  useEffect(() => {
    Audio.Sound.createAsync(asset, { volume })
      .then(({ sound }) => { soundRef.current = sound; })
      .catch(() => {});

    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  return function play() {
    const sound = soundRef.current;
    if (!sound) return;
    sound.setPositionAsync(0).then(() => sound.playAsync()).catch(() => {});
  };
}
