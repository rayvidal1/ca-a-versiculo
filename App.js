import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';

import { useBackgroundMusic } from './src/hooks/useBackgroundMusic.js';
import VerseHuntScreen from './src/screens/VerseHuntScreen.js';
import { palette } from './src/theme/palette.js';

export default function App() {
  useBackgroundMusic();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <VerseHuntScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
});
