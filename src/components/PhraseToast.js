import { useEffect, useRef } from 'react';
import { StyleSheet, Text } from 'react-native';
import * as Animatable from 'react-native-animatable';

export default function PhraseToast({ phrase, onHide }) {
  const ref = useRef(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      await ref.current?.animate(
        { 0: { opacity: 1, translateY: 0 }, 1: { opacity: 0, translateY: -24 } },
        400
      );
      onHide?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animatable.View
      ref={ref}
      animation="fadeInDown"
      duration={380}
      style={styles.container}
      pointerEvents="none"
    >
      <Text style={styles.text}>{phrase}</Text>
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '38%',
    alignSelf: 'center',
    backgroundColor: 'rgba(20, 20, 20, 0.82)',
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 999,
    zIndex: 100,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
});
