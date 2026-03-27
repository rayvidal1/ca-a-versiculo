import { Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

const BG = require('../assets/15.jpg');
const LOGO = require('../assets/grad.png');
const LOGO_WIDTH = 170;
const LOGO_HEIGHT = Math.round((LOGO_WIDTH * 976) / 1103);
const COUNT_PANEL_WIDTH = 276;
const COUNT_PANEL_HEIGHT = 116;
const COUNT_PANEL_RADIUS = 18;

export default function HomeScreen({
  versesCount,
  onPlay,
  onOpenSettings,
}) {
  const { height } = useWindowDimensions();
  const logoLift = Math.round(height / 6);

  return (
    <ImageBackground source={BG} style={styles.screen} resizeMode="cover">
      <View style={styles.overlay} />
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={onOpenSettings}
        activeOpacity={0.8}
      >
        <Text style={styles.settingsIcon}>⚙️</Text>
      </TouchableOpacity>
      <View style={styles.content}>
        <View style={styles.heroArea}>
          <View style={[styles.logoFrame, { transform: [{ translateY: -logoLift }] }]}>
            <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
          </View>
        </View>
        <TouchableOpacity style={styles.playButton} onPress={onPlay} activeOpacity={0.82}>
          <View style={styles.countPanel}>
            <Text style={styles.countNumber}>{versesCount}</Text>
            <Text style={styles.countLabel}>versículos lidos!</Text>
          </View>
        </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.26)',
  },
  settingsButton: {
    position: 'absolute',
    top: 42,
    left: 18,
    zIndex: 2,
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 28,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 32,
    paddingBottom: 80,
    paddingHorizontal: 32,
  },
  heroArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFrame: {
    alignSelf: 'center',
  },
  logoImage: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
  },
  playButton: {
    width: '100%',
    minHeight: 140,
    paddingHorizontal: 24,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPanel: {
    width: COUNT_PANEL_WIDTH,
    minHeight: COUNT_PANEL_HEIGHT,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: COUNT_PANEL_RADIUS,
    backgroundColor: 'rgba(236, 204, 104, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  countNumber: {
    fontSize: 60,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 64,
    textShadowColor: 'rgba(255,220,120,0.18)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  countLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,248,229,0.92)',
    marginTop: 6,
    letterSpacing: 0.6,
  },
});
