import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import images from '../assets/images.js';
import GameModeSelector from '../components/GameModeSelector.js';
import { verseHuntModes } from '../constants/verseHuntModes.js';
import { palette, shadow } from '../theme/palette.js';

const BG = images[1] ?? images[0];

export default function SettingsScreen({
  selectedModeId,
  selectedMode,
  onSelectMode,
  onBack,
}) {
  return (
    <ImageBackground source={BG} style={styles.screen} resizeMode="cover">
      <View style={styles.overlay} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Pressable style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonIcon}>‹</Text>
          </Pressable>
          <Text style={styles.topLabel}>Configurações</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.title}>Modo de jogo</Text>
          <Text style={styles.description}>
            Escolha como o caça-palavra vai montar a grade antes de começar a partida.
          </Text>

          <GameModeSelector
            modes={verseHuntModes}
            selectedModeId={selectedModeId}
            onSelectMode={onSelectMode}
          />

          <View style={styles.modeCard}>
            <Text style={styles.modeLabel}>{selectedMode.label}</Text>
            <Text style={styles.modeSummary}>{selectedMode.summary}</Text>
            <Text style={styles.modeHint}>
              A próxima partida já vai abrir com esse modo selecionado.
            </Text>
          </View>

          <Text style={styles.footerNote}>
            Essa tela vai receber outras opções de configuração depois.
          </Text>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonIcon: {
    fontSize: 22,
    color: '#FFFFFF',
  },
  topLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.88)',
    letterSpacing: 0.4,
  },
  panel: {
    marginTop: 8,
    borderRadius: 28,
    padding: 20,
    backgroundColor: 'rgba(246,241,231,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    ...shadow,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: palette.text,
  },
  description: {
    marginTop: 8,
    marginBottom: 18,
    fontSize: 15,
    lineHeight: 22,
    color: palette.textMuted,
  },
  modeCard: {
    marginTop: 12,
    borderRadius: 22,
    padding: 18,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  modeLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.primary,
  },
  modeSummary: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22,
    color: palette.text,
  },
  modeHint: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    color: palette.textMuted,
  },
  footerNote: {
    marginTop: 16,
    fontSize: 13,
    lineHeight: 20,
    color: palette.textMuted,
  },
});
