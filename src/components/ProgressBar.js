import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

// Zonas: 0–30% amarelo pálido | 30–70% amarelo vivo | 70–100% dourado neon
const Z1 = 0.30;
const Z2 = 0.70;

const FADED  = ['rgba(253,224,71,0.22)', 'rgba(250,204,21,0.22)', 'rgba(245,158,11,0.22)'];
const ACTIVE = ['#FDE047', '#FACC15', '#FFB300'];

// Cor do halo de neon (dourado quente)
const GLOW_COLOR = (opacity) => `rgba(255,195,0,${opacity})`;

// Altura da barra e das camadas de glow
const BAR_H   = 10;
const GLOW1_H = 18; // camada interna (mais opaca)
const GLOW2_H = 26; // camada externa (mais difusa)
const WRAP_H  = GLOW2_H + 4; // espaço total do componente

export default function ProgressBar({ found, total }) {
  const [barWidth, setBarWidth] = useState(0);
  const animProgress = useRef(new Animated.Value(0)).current;
  const prevTotalRef = useRef(total);

  // Nova grade → zera imediatamente
  useEffect(() => {
    if (total !== prevTotalRef.current) {
      prevTotalRef.current = total;
      animProgress.setValue(0);
    }
  }, [total, animProgress]);

  // Anima com spring ao encontrar cada palavra
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

  // Larguras absolutas das zonas relativas à barra inteira
  const w1 = barWidth * Z1;
  const w2 = barWidth * (Z2 - Z1);
  const w3 = barWidth * (1 - Z2);

  return (
    <View
      style={styles.wrapper}
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
    >
      {/* ── Camada de glow externa (mais difusa) ── */}
      <Animated.View
        style={[
          styles.glowOuter,
          { width: fillWidth, height: GLOW2_H, borderRadius: GLOW2_H / 2 },
        ]}
      />

      {/* ── Camada de glow interna (mais concentrada) ── */}
      <Animated.View
        style={[
          styles.glowInner,
          { width: fillWidth, height: GLOW1_H, borderRadius: GLOW1_H / 2 },
        ]}
      />

      {/* ── Barra principal (overflow hidden para clipar as zonas) ── */}
      <View style={styles.bar}>
        {/* Fundo apagado — sempre visível */}
        <View style={[StyleSheet.absoluteFill, styles.row]}>
          <View style={[styles.zone, { width: w1, backgroundColor: FADED[0] }]} />
          <View style={[styles.zone, { width: w2, backgroundColor: FADED[1] }]} />
          <View style={[styles.zone, { width: w3, backgroundColor: FADED[2] }]} />
        </View>

        {/* Preenchimento animado com cores vivas */}
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
  // Glow externo: halo largo e suave
  glowOuter: {
    position: 'absolute',
    left: 0,
    backgroundColor: GLOW_COLOR(0.10),
  },
  // Glow interno: mais brilhante, mais concentrado
  glowInner: {
    position: 'absolute',
    left: 0,
    backgroundColor: GLOW_COLOR(0.22),
  },
  // Barra em si
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
