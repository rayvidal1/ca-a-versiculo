import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, shadow } from '../theme/palette.js';

function FoundWordToken({ text, isNewlyFound, color, style }) {
  const flash = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isNewlyFound) return;
    flash.setValue(1);
    scale.setValue(1);
    Animated.parallel([
      Animated.timing(flash, {
        toValue: 0,
        duration: 700,
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.3, duration: 120, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }),
      ]),
    ]).start();
  }, [isNewlyFound]);

  const fill = color?.fill ?? 'rgba(224, 44, 44, 0.88)';
  const flashColor = color?.border ?? '#FF2222';

  const backgroundColor = flash.interpolate({
    inputRange: [0, 1],
    outputRange: [fill, flashColor],
  });

  return (
    <Animated.Text style={[style, { backgroundColor, transform: [{ scale }] }]}>
      {text}
    </Animated.Text>
  );
}

export default function VerseCard({
  reference,
  tokens,
  foundWordSet,
  wordStyleMap,
  lastFoundWord,
  isComplete,
  hideBackground,
  onNextVerse,
}) {
  return (
    <View style={[styles.cardShell, hideBackground && styles.cardShellHidden]}>
      <View style={[styles.card, hideBackground && styles.cardHidden]}>
        <View style={styles.glassGlow} pointerEvents="none" />
        <View style={[styles.cardTint, isComplete && styles.cardTintComplete, hideBackground && styles.cardTintHidden]}>
          <View style={styles.header}>
            <Text style={[styles.reference, hideBackground && styles.textShadow]}>{reference}</Text>
            <Pressable style={styles.actionButton} onPress={onNextVerse}>
              <Text style={styles.actionButtonText}>Novo</Text>
            </Pressable>
          </View>
          <Text style={[styles.verse, hideBackground && styles.textShadow]}>
            {tokens.map((token) => {
              if (!token.isTarget) {
                return (
                  <Text key={token.id} style={styles.plainText}>
                    {token.text}
                  </Text>
                );
              }

              const isFound = foundWordSet.has(token.normalized);
              const isNewlyFound = token.normalized === lastFoundWord;

              if (isFound) {
                const color = wordStyleMap?.[token.normalized];
                return (
                  <FoundWordToken
                    key={token.id}
                    text={token.text}
                    isNewlyFound={isNewlyFound}
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
  cardShellHidden: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  cardHidden: {
    backgroundColor: 'transparent',
  },
  cardTint: {
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  cardTintHidden: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
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
  textShadow: {
    textShadowColor: 'rgba(255,255,255,0.95)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  reference: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.text,
    flex: 1,
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(228, 241, 233, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
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
