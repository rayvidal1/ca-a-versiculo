import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import images from '../assets/images.js';

const BG = images[0];

export default function HomeScreen({ versesCount, onPlay }) {
  return (
    <ImageBackground source={BG} style={styles.screen} resizeMode="cover">
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.title}>CAÇA{'\n'}PALAVRA</Text>
        <TouchableOpacity style={styles.playButton} onPress={onPlay} activeOpacity={0.82}>
          <Text style={styles.countNumber}>{versesCount}</Text>
          <Text style={styles.countLabel}>versículos explorados</Text>
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
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 80,
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 58,
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  playButton: {
    width: '100%',
    paddingVertical: 22,
    borderRadius: 999,
    backgroundColor: '#22A95B',
    alignItems: 'center',
    shadowColor: '#22A95B',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 22,
    shadowOpacity: 0.7,
    elevation: 10,
  },
  countNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 52,
  },
  countLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    letterSpacing: 0.5,
  },
});
