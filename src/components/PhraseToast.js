import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

export default function PhraseToast({ phrase, onHide }) {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    // Entra
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 7, tension: 60 }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }),
    ]).start();

    // Sai após 2s
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -40, duration: 300, useNativeDriver: true }),
      ]).start(() => onHide?.());
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        { opacity, transform: [{ translateY }, { scale }] },
      ]}
    >
      <Text style={styles.text}>{phrase}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '42%',
    left: 20,
    right: 20,
    zIndex: 999,
    elevation: 20,
    backgroundColor: '#D4006A',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    shadowOpacity: 0.35,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
