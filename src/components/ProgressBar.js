import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

// Zonas: 0–30% amarelo pálido | 30–70% amarelo vivo | 70–100% dourado neon
const Z1 = 0.30;
const Z2 = 0.70;

const FADED  = ['rgba(253,224,71,0.22)', 'rgba(250,204,21,0.22)', 'rgba(245,158,11,0.22)'];
const ACTIVE = ['#FDE047', '#FACC15', '#FFB300'];

const BAR_H    = 10;
const GLOW1_H  = 18;
const GLOW2_H  = 26;
const WRAP_H   = GLOW2_H + 4;

export default function ProgressBar({ found, total }) {
  const [barWidth, setBarWidth] = useState(0);
  const animProgress = useRef(new Animated.Value(0)).current;
  const prevTotalRef = useRef(total);

  useEffect(() => {
    if (total !== prevTotalRef.current) {
      prevTotalRef.current = total;
      animProgress.setValue(0);
    }
  }, [total, animProgress]);

  useEffect(() => {
    const progress = total > 0 ? found / total : 0;
    Animated.spring(animProgress, {
      toValue: progress,
      useNativeDriver: false,
      friction: 7,
      tension: 38,
    }).start();
  }, [found, total, animProgress]);

  const fillWidth =
    barWidth > 0
      ? animProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, barWidth],
          extrapolate: 'clamp',
        })
      : 0;

  const w1 = barWidth * Z1;
  const w2 = barWidth * (Z2 - Z1);
  const w3 = barWidth * (1 - Z2);

  return (
    <View
      style={styles.wrapper}
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
    >
      {/* Glow externo — halo dourado largo e suave */}
      <Animated.View
        style={[styles.glow, {
          width: fillWidth,
          height: GLOW2_H,
          borderRadius: GLOW2_H / 2,
          backgroundColor: 'rgba(255,195,0,0.12)',
        }]}
      />
      {/* Glow interno — mais concentrado */}
      <Animated.View
        style={[styles.glow, {
          width: fillWidth,
          height: GLOW1_H,
          borderRadius: GLOW1_H / 2,
          backgroundColor: 'rgba(255,195,0,0.22)',
        }]}
      />
      {/* Barra principal */}
      <View style={styles.bar}>
        {/* Fundo apagado */}
        <View style={[StyleSheet.absoluteFill, styles.row]}>
          <View style={[styles.zone, { width: w1, backgroundColor: FADED[0] }]} />
          <View style={[styles.zone, { width: w2, backgroundColor: FADED[1] }]} />
          <View style={[styles.zone, { width: w3, backgroundColor: FADED[2] }]} />
        </View>
        {/* Preenchimento animado */}
        <Animated.View style={[styles.fill, { width: fillWidth }]}>
          <View style={[styles.zone, { width: w1, backgroundColor: ACTIVE[0] }]} />
          <View style={[styles.zone, { width: w2, backgroundColor: ACTIVE[1] }]} />
          <View style={[styles.zone, { width: w3, backgroundColor: ACTIVE[2] }]} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: WRAP_H,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  glow: {
    position: 'absolute',
    left: 0,
  },
  bar: {
    width: '100%',
    height: BAR_H,
    borderRadius: BAR_H / 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  row: {
    flexDirection: 'row',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  zone: {
    height: '100%',
  },
});
