import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const Z1 = 0.3;
const Z2 = 0.7;

const FADED = [
  'rgba(253,224,71,0.18)',
  'rgba(250,204,21,0.18)',
  'rgba(245,158,11,0.18)',
];

const BAR_H = 10;
const WRAP_H = 32;

export default function ProgressBar({ found, total }) {
  const [barWidth, setBarWidth] = useState(0);
  const animProgress = useRef(new Animated.Value(0)).current;
  const prevTotalRef = useRef(total);

  useEffect(() => {
    if (total !== prevTotalRef.current) {
      prevTotalRef.current = total;
      animProgress.setValue(0);
    }
  }, [animProgress, total]);

  useEffect(() => {
    const progress = total > 0 ? found / total : 0;
    Animated.spring(animProgress, {
      toValue: progress,
      useNativeDriver: false,
      friction: 7,
      tension: 38,
    }).start();
  }, [animProgress, found, total]);

  const w1 = barWidth * Z1;
  const w2 = barWidth * (Z2 - Z1);
  const w3 = barWidth * (1 - Z2);

  return (
    <View
      style={styles.wrapper}
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
    >
      <View style={styles.bar}>
        <View style={[StyleSheet.absoluteFill, styles.row]}>
          <View style={[styles.zone, { width: w1, backgroundColor: FADED[0] }]} />
          <View style={[styles.zone, { width: w2, backgroundColor: FADED[1] }]} />
          <View style={[styles.zone, { width: w3, backgroundColor: FADED[2] }]} />
        </View>
        <Animated.View
          style={[
            styles.fill,
            {
              width: animProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, barWidth],
              }),
            },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.shine,
            {
              width: animProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.max(0, barWidth - 2)],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: WRAP_H,
    justifyContent: 'center',
  },
  bar: {
    width: '100%',
    height: BAR_H,
    borderRadius: BAR_H / 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  row: {
    flexDirection: 'row',
  },
  zone: {
    height: '100%',
  },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: BAR_H / 2,
    backgroundColor: '#FACC15',
  },
  shine: {
    position: 'absolute',
    top: 1,
    left: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,220,0.5)',
  },
});
