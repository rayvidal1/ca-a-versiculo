import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, shadow } from '../theme/palette.js';

export default function GameModeSelector({
  modes,
  selectedModeId,
  onSelectMode,
}) {
  const activeMode =
    modes.find((mode) => mode.id === selectedModeId) ?? modes[0];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Nivel de jogo</Text>
      <View style={styles.optionsRow}>
        {modes.map((mode) => {
          const isSelected = mode.id === activeMode.id;

          return (
            <Pressable
              key={mode.id}
              style={({ pressed }) => [
                styles.optionButton,
                isSelected && styles.optionButtonSelected,
                pressed && !isSelected && styles.optionButtonPressed,
              ]}
              onPress={() => onSelectMode(mode.id)}
            >
              <Text
                style={[
                  styles.optionLabel,
                  isSelected && styles.optionLabelSelected,
                ]}
              >
                {mode.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.summary}>{activeMode.summary}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    ...shadow,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: palette.textMuted,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  optionButtonSelected: {
    borderColor: palette.primary,
    backgroundColor: palette.primarySoft,
  },
  optionButtonPressed: {
    backgroundColor: palette.verse,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textMuted,
  },
  optionLabelSelected: {
    color: palette.primary,
  },
  summary: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.text,
  },
});
