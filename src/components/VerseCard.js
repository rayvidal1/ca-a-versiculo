import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, shadow } from '../theme/palette.js';

export default function VerseCard({
  reference,
  tokens,
  foundWordSet,
  isComplete,
  onNextVerse,
}) {
  return (
    <View style={[styles.card, isComplete && styles.cardComplete]}>
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
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 24,
    padding: 18,
    ...shadow,
  },
  cardComplete: {
    backgroundColor: 'rgba(224,243,232,0.95)',
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
    backgroundColor: palette.primarySoft,
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
