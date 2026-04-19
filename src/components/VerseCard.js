import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { palette, shadow } from '../theme/palette.js';

function FoundWordToken({ text, color, style }) {
  const flash = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.7)).current;
  const translateY = useRef(new Animated.Value(22)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(flash, { toValue: 0, duration: 600, useNativeDriver: false }),
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 180, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, friction: 5, tension: 180, useNativeDriver: true }),
    ]).start();
  }, []);

  const fill = color?.fill ?? 'rgba(224, 44, 44, 0.88)';
  const flashColor = color?.border ?? '#FF2222';

  const backgroundColor = flash.interpolate({
    inputRange: [0, 1],
    outputRange: [fill, flashColor],
  });

  return (
    <Animated.View style={{ transform: [{ scale }, { translateY }] }}>
      <Animated.Text style={[style, { backgroundColor }]}>
        {text}
      </Animated.Text>
    </Animated.View>
  );
}

export default function VerseCard({
  reference,
  tokens,
  foundWordSet,
  wordStyleMap,
  lastFoundWord,
  hintWord,
  onHint,
  isComplete,
  onNextVerse,
  highlightNovo,
}) {
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  const completePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!highlightNovo) return;
    ringOpacity.setValue(1);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ringScale, { toValue: 2.4, duration: 750, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.delay(400),
        Animated.timing(ringScale, { toValue: 1, duration: 0, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 1, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [highlightNovo]);

  useEffect(() => {
    if (!isComplete) { completePulse.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(completePulse, { toValue: 1.06, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(completePulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isComplete]);

  return (
    <View style={styles.cardShell}>
      <View style={styles.card}>
        <View style={styles.glassGlow} pointerEvents="none" />
        <View style={[styles.cardTint, isComplete && styles.cardTintComplete]}>
          <View style={styles.header}>
            <Text style={styles.reference}>{reference}</Text>
            <View style={styles.headerButtons}>
              {!isComplete && (
                <Pressable style={styles.hintButton} onPress={onHint}>
                  <Text style={styles.hintButtonText}>📖</Text>
                </Pressable>
              )}
              <Animated.View style={{ transform: [{ scale: isComplete && !highlightNovo ? completePulse : 1 }] }}>
                {highlightNovo && (
                  <Animated.View pointerEvents="none" style={[styles.novoRing, {
                    opacity: ringOpacity,
                    transform: [{ scale: ringScale }],
                  }]} />
                )}
                <Pressable style={[styles.actionButton, highlightNovo && styles.actionButtonHighlight, isComplete && !highlightNovo && styles.actionButtonComplete]} onPress={onNextVerse}>
                  <Text style={styles.actionButtonText}>Novo</Text>
                </Pressable>
              </Animated.View>
            </View>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          <Text style={styles.verse}>
            {tokens.map((token) => {
              if (!token.isTarget) {
                return (
                  <Text key={token.id} style={styles.plainText}>
                    {token.text}
                  </Text>
                );
              }

              const isFound = foundWordSet.has(token.normalized);

              if (isFound) {
                const color = wordStyleMap?.[token.normalized];
                return (
                  <FoundWordToken
                    key={token.id}
                    text={token.text}
                    color={color}
                    style={[styles.targetWord, styles.targetWordFound]}
                  />
                );
              }

              return (
                <Text key={token.id} style={[styles.targetWord, styles.targetWordPending]}>
                  {token.text}
                </Text>
              );
            })}
          </Text>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardShell: {
    borderRadius: 24,
    overflow: 'hidden',
    ...shadow,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  glassGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  cardTint: {
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  cardTintComplete: {
    backgroundColor: 'rgba(224,243,232,0.4)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 12,
  },
  reference: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.text,
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: 'rgba(228, 241, 233, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintButtonText: {
    fontSize: 16,
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(228, 241, 233, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
  },
  actionButtonHighlight: {
    backgroundColor: 'rgba(45, 106, 87, 0.18)',
    borderColor: palette.primary,
    borderWidth: 1.5,
  },
  actionButtonComplete: {
    backgroundColor: 'rgba(45, 106, 87, 0.14)',
    borderColor: 'rgba(60, 140, 220, 0.7)',
    borderWidth: 1.5,
  },
  novoRing: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: palette.primary,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  verse: {
    fontSize: 18,
    lineHeight: 28,
    color: palette.text,
  },
  plainText: {
    color: palette.text,
  },
  targetWord: {
    borderRadius: 8,
    paddingHorizontal: 2,
  },
  targetWordPending: {
    backgroundColor: 'rgba(255, 130, 0, 0.45)',
    color: palette.text,
  },
  targetWordFound: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
