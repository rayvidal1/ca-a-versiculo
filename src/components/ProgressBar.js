import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import {
  BlurMask,
  Canvas,
  LinearGradient,
  Rect,
  vec,
} from '@shopify/react-native-skia';

// Zonas: 0–30% amarelo pálido | 30–70% amarelo vivo | 70–100% dourado neon
const Z1 = 0.30;
const Z2 = 0.70;

// Cores das zonas (faded e active)
const FADED  = ['rgba(253,224,71,0.22)', 'rgba(250,204,21,0.22)', 'rgba(245,158,11,0.22)'];
const ACTIVE = ['#FDE047', '#FACC15', '#FFB300'];

const BAR_H    = 10;
const CANVAS_H = 40; // espaço extra para o glow vazar para cima e baixo

export default function ProgressBar({ found, total }) {
  const [barWidth, setBarWidth] = useState(0);
  const animProgress = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState(0);
  const prevTotalRef = useRef(total);

  // Nova grade → zera imediatamente
  useEffect(() => {
    if (total !== prevTotalRef.current) {
      prevTotalRef.current = total;
      animProgress.setValue(0);
      setProgress(0);
    }
  }, [total, animProgress]);

  // Anima com spring e sincroniza o valor JS para o Canvas Skia
  useEffect(() => {
    const next = total > 0 ? found / total : 0;
    Animated.spring(animProgress, {
      toValue: next,
      useNativeDriver: false,
      friction: 7,
      tension: 38,
    }).start();

    const id = animProgress.addListener(({ value }) => setProgress(value));
    return () => animProgress.removeListener(id);
  }, [found, total, animProgress]);

  const fillW = barWidth * progress;

  // Zona onde o preenchimento está atualmente (para cor do glow)
  const glowColor =
    progress > Z2 ? '#FFB300' : progress > Z1 ? '#FACC15' : '#FDE047';

  // Pontos de gradiente da zona preenchida
  const gradStops = buildGradient(fillW, barWidth);

  return (
    <View
      style={styles.wrapper}
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
    >
      {/* ── Fundo apagado (View nativa, sem Skia) ── */}
      <View style={styles.fadedTrack}>
        <View style={[styles.zone, { flex: Z1,       backgroundColor: FADED[0] }]} />
        <View style={[styles.zone, { flex: Z2 - Z1,  backgroundColor: FADED[1] }]} />
        <View style={[styles.zone, { flex: 1 - Z2,   backgroundColor: FADED[2] }]} />
      </View>

      {/* ── Canvas Skia: barra preenchida + glow real ── */}
      {barWidth > 0 && fillW > 0 && (
        <Canvas style={[StyleSheet.absoluteFill, { width: barWidth, height: CANVAS_H }]}>
          {/* Glow externo — blur largo e suave */}
          <Rect
            x={0}
            y={(CANVAS_H - BAR_H) / 2}
            width={fillW}
            height={BAR_H}
            r={BAR_H / 2}
            color={glowColor}
            opacity={0.55}
          >
            <BlurMask blur={10} style="outer" />
          </Rect>

          {/* Barra preenchida com gradiente entre zonas */}
          <Rect
            x={0}
            y={(CANVAS_H - BAR_H) / 2}
            width={fillW}
            height={BAR_H}
            r={BAR_H / 2}
          >
            <LinearGradient
              start={vec(0, 0)}
              end={vec(fillW, 0)}
              colors={gradStops.colors}
              positions={gradStops.positions}
            />
          </Rect>
        </Canvas>
      )}
    </View>
  );
}

// Monta o gradiente da barra preenchida com as 3 zonas de cor
function buildGradient(fillW, totalW) {
  if (totalW <= 0 || fillW <= 0) {
    return { colors: [ACTIVE[0], ACTIVE[0]], positions: [0, 1] };
  }

  const p1 = Math.min(1, (totalW * Z1) / fillW);
  const p2 = Math.min(1, (totalW * Z2) / fillW);

  if (fillW <= totalW * Z1) {
    return { colors: [ACTIVE[0], ACTIVE[0]], positions: [0, 1] };
  }
  if (fillW <= totalW * Z2) {
    return {
      colors: [ACTIVE[0], ACTIVE[0], ACTIVE[1]],
      positions: [0, p1, 1],
    };
  }
  return {
    colors: [ACTIVE[0], ACTIVE[0], ACTIVE[1], ACTIVE[1], ACTIVE[2]],
    positions: [0, p1, p1, p2, 1],
  };
}

const styles = StyleSheet.create({
  wrapper: {
    height: CANVAS_H,
    justifyContent: 'center',
  },
  fadedTrack: {
    height: BAR_H,
    borderRadius: BAR_H / 2,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  zone: {
    height: '100%',
  },
});
