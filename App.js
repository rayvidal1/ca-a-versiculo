import { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';

import {
  DEFAULT_VERSE_HUNT_MODE_ID,
  TUTORIAL_ROUNDS,
  getTutorialOptions,
  getVerseHuntModeConfig,
} from './src/constants/verseHuntModes.js';
import { useBackgroundMusic } from './src/hooks/useBackgroundMusic.js';
import { initVerseHistory } from './src/services/verseSource.js';
import { useVersesPlayed } from './src/hooks/useVersesPlayed.js';
import HomeScreen from './src/screens/HomeScreen.js';
import SettingsScreen from './src/screens/SettingsScreen.js';
import SplashScreen from './src/screens/SplashScreen.js';
import VerseHuntScreen from './src/screens/VerseHuntScreen.js';
import { palette } from './src/theme/palette.js';

export default function App() {
  useBackgroundMusic();
  useEffect(() => { initVerseHistory(); }, []);
  const [screen, setScreen] = useState('splash');
  const [selectedModeId, setSelectedModeId] = useState(DEFAULT_VERSE_HUNT_MODE_ID);
  const [versesCount, incrementVersesCount] = useVersesPlayed();
  const selectedMode = useMemo(
    () => getVerseHuntModeConfig(selectedModeId),
    [selectedModeId]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      {screen === 'splash' ? (
        <SplashScreen onFinish={() => setScreen('home')} />
      ) : screen === 'home' ? (
        <HomeScreen
          versesCount={versesCount}
          onPlay={() => setScreen('game')}
          onOpenSettings={() => setScreen('settings')}
          highlightSettings={versesCount === 1}
        />
      ) : screen === 'settings' ? (
        <SettingsScreen
          selectedModeId={selectedModeId}
          selectedMode={selectedMode}
          onSelectMode={setSelectedModeId}
          onBack={() => setScreen('home')}
        />
      ) : (
        <VerseHuntScreen
          modeId={selectedModeId}
          isTutorial={versesCount < TUTORIAL_ROUNDS}
          tutorialRound={Math.min(versesCount + 1, TUTORIAL_ROUNDS)}
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
