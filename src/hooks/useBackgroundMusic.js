import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

export function useBackgroundMusic() {
  const soundRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});

    Audio.Sound.createAsync(
      require('../assets/sounds/harmony-of-heaven.mp3'),
      { isLooping: true, volume: 0.15 }
    ).then(({ sound }) => {
      if (!mounted) {
        sound.unloadAsync();
        return;
      }
      soundRef.current = sound;
      sound.playAsync().catch(() => {});
    }).catch(() => {});

    return () => {
      mounted = false;
      soundRef.current?.unloadAsync();
    };
  }, []);
}
