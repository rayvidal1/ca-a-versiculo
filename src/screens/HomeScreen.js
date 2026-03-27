import { LinearGradient } from 'expo-linear-gradient';
import { Animated, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useEffect, useRef, useState } from 'react';

function ShimmerLabel() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const [labelWidth, setLabelWidth] = useState(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(2800),
        Animated.timing(shimmerAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, labelWidth + 80],
  });

  return (
    <View
      style={shimmerStyles.container}
      onLayout={(e) => setLabelWidth(e.nativeEvent.layout.width)}
    >
      <Text style={shimmerStyles.text}>Um momento leve com Deus!</Text>
      <Animated.View
        pointerEvents="none"
        style={[shimmerStyles.streakWrapper, { transform: [{ translateX }] }]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,220,0.72)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={shimmerStyles.streakGradient}
        />
      </Animated.View>
    </View>
  );
}

const BG = require('../assets/15.jpg');
const LOGO = require('../assets/grad.png');
const LOGO_WIDTH = 170;
const LOGO_HEIGHT = Math.round((LOGO_WIDTH * 976) / 1103);
const COUNT_PANEL_WIDTH = 276;
const COUNT_PANEL_HEIGHT = 116;
const COUNT_PANEL_RADIUS = 18;

export default function HomeScreen({
  onPlay,
  onOpenSettings,
}) {
  const { height } = useWindowDimensions();
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.25, duration: 1200, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
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
            <ShimmerLabel />
          </View>
        </View>
        <TouchableOpacity style={styles.playButton} onPress={onPlay} activeOpacity={0.82}>
          <LinearGradient
            colors={['transparent', 'rgba(220, 180, 80, 0.18)', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.countPanel}
          >
            <Animated.Text style={[styles.startLabel, { opacity: blinkAnim }]}>Começar</Animated.Text>
          </LinearGradient>
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
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  startLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: 'rgba(255,248,229,0.95)',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(255,210,80,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});

const shimmerStyles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    overflow: 'hidden',
    marginTop: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    color: 'rgba(255, 245, 200, 0.90)',
    fontSize: 15,
    fontStyle: 'italic',
    fontFamily: 'serif',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 210, 80, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  streakWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
  },
  streakGradient: {
    flex: 1,
  },
});
