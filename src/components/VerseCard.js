import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, shadow } from '../theme/palette.js';

export default function VerseCard({
  reference,
  tokens,
  foundWordSet,
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
            <Text style={styles.reference}>{reference}</Text>
            <Pressable style={styles.actionButton} onPress={onNextVerse}>
              <Text style={styles.actionButtonText}>Novo</Text>
            </Pressable>
          </View>
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

              return (
                <Text
                  key={token.id}
                  style={[
                    styles.targetWord,
                    isFound ? styles.targetWordFound : styles.targetWordPending,
                  ]}
                >
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
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  glassGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.08)',
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
    backgroundColor: 'rgba(255,255,255,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
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
    backgroundColor: palette.verse,
    color: palette.text,
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    textDecorationColor: palette.accent,
  },
  targetWordFound: {
    backgroundColor: palette.accentSoft,
    color: palette.primary,
    fontWeight: '700',
  },
});
