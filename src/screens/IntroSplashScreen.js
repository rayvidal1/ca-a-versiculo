import { memo, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

const JESUS = require('../assets/intro/jesus.png');
const SHEEP = require('../assets/intro/sheep.png');

const INTRO_DURATION = 3000;
const STAGE_WIDTH = 260;
const STAGE_HEIGHT = 220;

function IntroSplashScreen({ onFinish }) {
  const { width, height } = useWindowDimensions();
  const onFinishRef = useRef(onFinish);
  const finishedRef = useRef(false);

  const jesusOpacity = useRef(new Animated.Value(0)).current;
  const jesusScale = useRef(new Animated.Value(0.96)).current;
  const sheepOpacity = useRef(new Animated.Value(0)).current;
  const sheepTranslateX = useRef(new Animated.Value(-150)).current;
  const sheepScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    const startX = -Math.min(Math.max(width, 320) * 0.42, 170);

    jesusOpacity.setValue(0);
    jesusScale.setValue(0.96);
    sheepOpacity.setValue(0);
    sheepTranslateX.setValue(startX);
    sheepScale.setValue(0.95);
    finishedRef.current = false;

    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onFinishRef.current?.();
    };

    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(jesusOpacity, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(jesusScale, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(50),
      Animated.parallel([
        Animated.timing(sheepOpacity, {
          toValue: 1,
          duration: 160,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sheepTranslateX, {
          toValue: -28,
          duration: 1100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sheepScale, {
          toValue: 1,
          duration: 1100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.sequence([
          Animated.timing(jesusScale, {
            toValue: 1.04,
            duration: 260,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(jesusScale, {
            toValue: 1,
            duration: 340,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(sheepScale, {
          toValue: 0.9,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(600),
    ]);

    const timer = setTimeout(finish, INTRO_DURATION);
    animation.start(({ finished }) => {
      if (finished) finish();
    });

    return () => {
      clearTimeout(timer);
      animation.stop();
    };
  }, [
    jesusOpacity,
    jesusScale,
    sheepOpacity,
    sheepScale,
    sheepTranslateX,
    width,
  ]);

  const stageScale = Math.min(width / 320, height / 620, 1);

  return (
    <View style={styles.container}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.stage,
          {
            transform: [{ scale: stageScale }],
          },
        ]}
      >
        <Animated.Image
          source={JESUS}
          fadeDuration={0}
          resizeMode="contain"
          style={[
            styles.jesus,
            {
              opacity: jesusOpacity,
              transform: [{ scale: jesusScale }],
            },
          ]}
        />
        <Animated.Image
          source={SHEEP}
          fadeDuration={0}
          resizeMode="contain"
          style={[
            styles.sheep,
            {
              opacity: sheepOpacity,
              transform: [{ translateX: sheepTranslateX }, { scale: sheepScale }],
            },
          ]}
        />
      </Animated.View>
    </View>
  );
}

export default memo(IntroSplashScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8EA',
  },
  stage: {
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
  },
  jesus: {
    position: 'absolute',
    top: 30,
    left: 94,
    width: 78,
    height: 104,
  },
  sheep: {
    position: 'absolute',
    top: 133,
    left: 110,
    width: 58,
    height: 46,
  },
});
