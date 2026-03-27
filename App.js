import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';

import { useBackgroundMusic } from './src/hooks/useBackgroundMusic.js';
import { useVersesPlayed } from './src/hooks/useVersesPlayed.js';
import HomeScreen from './src/screens/HomeScreen.js';
import VerseHuntScreen from './src/screens/VerseHuntScreen.js';
import { palette } from './src/theme/palette.js';

export default function App() {
  useBackgroundMusic();
  const [screen, setScreen] = useState('home');
  const [versesCount, incrementVersesCount] = useVersesPlayed();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      {screen === 'home' ? (
        <HomeScreen versesCount={versesCount} onPlay={() => setScreen('game')} />
      ) : (
        <VerseHuntScreen
          onBack={() => setScreen('home')}
          onVersePlayed={incrementVersesCount}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
});
