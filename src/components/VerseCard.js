import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import Svg, { Path } from 'react-native-svg';

import { palette, shadow } from '../theme/palette.js';

function FoundWordToken({ text, color, style, animate }) {
  const flash = useRef(new Animated.Value(animate ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(animate ? 0.7 : 1)).current;
  const translateY = useRef(new Animated.Value(animate ? 22 : 0)).current;

  useEffect(() => {
    if (!animate) return;
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
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const { width: w, height: h } = size;
  // One closed outline: broad page curves, a soft top dip and a rounded lower spine.
  const outline = w && h ? [
    'M 10 18',
    'C ' + w * 0.18 + ' 26 ' + w * 0.33 + ' -4 ' + w * 0.43 + ' 8',
    'C ' + w * 0.47 + ' 13 ' + w * 0.48 + ' 23 ' + w * 0.495 + ' 27',
    'Q ' + w * 0.5 + ' 30 ' + w * 0.505 + ' 27',
    'C ' + w * 0.52 + ' 23 ' + w * 0.53 + ' 13 ' + w * 0.57 + ' 8',
    'C ' + w * 0.67 + ' -4 ' + w * 0.82 + ' 26 ' + (w - 10) + ' 18',
    'Q ' + (w - 2) + ' 16 ' + (w - 2) + ' 26',
    'L ' + (w - 2) + ' ' + (h - 20),
    'Q ' + (w - 2) + ' ' + (h - 12) + ' ' + (w - 10) + ' ' + (h - 10),
    'C ' + w * 0.82 + ' ' + (h + 2) + ' ' + w * 0.67 + ' ' + (h - 22) + ' ' + w * 0.57 + ' ' + (h - 14),
    'C ' + w * 0.53 + ' ' + (h - 10) + ' ' + w * 0.53 + ' ' + (h - 2) + ' ' + w * 0.5 + ' ' + (h - 2),
    'C ' + w * 0.47 + ' ' + (h - 2) + ' ' + w * 0.47 + ' ' + (h - 10) + ' ' + w * 0.43 + ' ' + (h - 14),
    'C ' + w * 0.33 + ' ' + (h - 22) + ' ' + w * 0.18 + ' ' + (h + 2) + ' 10 ' + (h - 10),
    'Q 2 ' + (h - 12) + ' 2 ' + (h - 20),
    'L 2 26 Q 2 16 10 18 Z',
  ].join(' ') : '';

  function handleLayout({ nativeEvent: { layout } }) {
    setSize((current) => current.width === layout.width && current.height === layout.height
      ? current : { width: layout.width, height: layout.height });
  }

  return (
    <View style={styles.cardShell}>
      <View style={styles.card} onLayout={handleLayout}>
        {outline !== '' && (
          <Svg pointerEvents="none" accessible={false} width={w} height={h} style={StyleSheet.absoluteFill}>
            <Path d={outline} fill={isComplete ? '#F3FAF6' : '#FFFFFF'}
              stroke="rgba(124, 106, 74, 0.22)" strokeWidth={1} strokeLinejoin="round" />
          </Svg>
        )}
        <View style={styles.cardTint}>
          <View style={styles.header}>
            <Text style={styles.reference}>{reference}</Text>
            <View style={styles.headerButtons}>
              {!isComplete && (
                <Pressable style={styles.hintButton} onPress={onHint}>
                  <Text style={styles.hintButtonText}>📖</Text>
                </Pressable>
              )}
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
                    animate={token.normalized === lastFoundWord}
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
    maxHeight: '100%',
    flexShrink: 1,
    ...shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 0,
  },
  card: {
    position: 'relative',
    flexShrink: 1,
  },
  cardTint: {
    paddingHorizontal: 18,
    paddingTop: 34,
    paddingBottom: 28,
    flexShrink: 1,
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
