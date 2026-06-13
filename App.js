import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';

import {
  DEFAULT_VERSE_HUNT_MODE_ID,
  TUTORIAL_ROUNDS,
  getVerseHuntModeConfig,
} from './src/constants/verseHuntModes.js';
import { useBackgroundMusic } from './src/hooks/useBackgroundMusic.js';
import { initVerseHistory } from './src/services/verseSource.js';
import { useVersesPlayed } from './src/hooks/useVersesPlayed.js';
import HomeScreen from './src/screens/HomeScreen.js';
import IntroSplashScreen from './src/screens/IntroSplashScreen.js';
import SettingsScreen from './src/screens/SettingsScreen.js';
import VerseHuntScreen from './src/screens/VerseHuntScreen.js';
import { palette } from './src/theme/palette.js';

ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  useBackgroundMusic();
  useEffect(() => { initVerseHistory(); }, []);
  const [screen, setScreen] = useState('splash');
  const [selectedModeId, setSelectedModeId] = useState(DEFAULT_VERSE_HUNT_MODE_ID);
  const [versesCount, incrementVersesCount] = useVersesPlayed();
  const nativeSplashHiddenRef = useRef(false);
  const selectedMode = useMemo(
    () => getVerseHuntModeConfig(selectedModeId),
    [selectedModeId]
  );
  const handleRootLayout = useCallback(() => {
    if (nativeSplashHiddenRef.current) return;
    nativeSplashHiddenRef.current = true;
    ExpoSplashScreen.hideAsync().catch(() => {});
  }, []);
  const handleIntroFinish = useCallback(() => {
    setScreen('home');
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} onLayout={handleRootLayout}>
      <StatusBar style={screen === 'splash' ? 'dark' : 'light'} />
      {screen === 'splash' ? (
        <IntroSplashScreen onFinish={handleIntroFinish} />
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
