import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, shadow } from '../theme/palette.js';

export default function GameModeSelector({
  modes,
  selectedModeId,
  onSelectMode,
}) {
  return (
    <View style={styles.optionsRow}>
      {modes.map((mode) => {
        const isSelected = mode.id === selectedModeId;

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
  );
}

const styles = StyleSheet.create({
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
  },
  optionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    ...shadow,
  },
  optionButtonSelected: {
    borderColor: palette.primary,
    backgroundColor: 'rgba(223,242,232,0.96)',
  },
  optionButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.76)',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textMuted,
  },
  optionLabelSelected: {
    color: palette.primary,
  },
});
