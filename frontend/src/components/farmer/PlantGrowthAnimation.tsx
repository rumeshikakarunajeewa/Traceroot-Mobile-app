import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface PlantGrowthAnimationProps {
  isFocused?: boolean;
}

/**
 * PlantGrowthAnimation (SeedToSuccess)
 * Faithful React Native implementation of the "Seed to Success" vector scene:
 * - 4 distinct stages of plants growing at [78, 150, 232, 312] across the soil line
 * - Seed at x=34 on the soil
 * - Gentle falling water stream & water drops targeting the 2nd sprout (x=150)
 * - Atmospheric bokeh circles with soft green/orange glows
 * - Glowing nutrient sparks ascending from the fertile soil
 * - Organic wavy soil bed anchored at the bottom of the card
 */
export const PlantGrowthAnimation: React.FC<PlantGrowthAnimationProps> = ({ isFocused = true }) => {
  // Master loop (duration ~4.5s)
  const animProgress = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isFocused) {
      loopRef.current = Animated.loop(
        Animated.timing(animProgress, {
          toValue: 1,
          duration: 4600,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loopRef.current.start();
    } else {
      if (loopRef.current) loopRef.current.stop();
    }

    return () => {
      if (loopRef.current) loopRef.current.stop();
    };
  }, [isFocused]);

  // Water drops over 2nd sprout (x=150, which is around 40.5% width)
  const drop1Y = animProgress.interpolate({
    inputRange: [0, 0.05, 0.35, 0.42, 1],
    outputRange: [-8, 0, 48, 48, 48],
  });
  const drop1Op = animProgress.interpolate({
    inputRange: [0, 0.05, 0.1, 0.32, 0.4, 1],
    outputRange: [0, 0.95, 0.95, 0.95, 0, 0],
  });

  const drop2Y = animProgress.interpolate({
    inputRange: [0, 0.12, 0.42, 0.48, 1],
    outputRange: [-10, 0, 48, 48, 48],
  });
  const drop2Op = animProgress.interpolate({
    inputRange: [0, 0.12, 0.18, 0.38, 0.45, 1],
    outputRange: [0, 0.95, 0.95, 0.95, 0, 0],
  });

  const drop3Y = animProgress.interpolate({
    inputRange: [0, 0.22, 0.52, 0.58, 1],
    outputRange: [-8, 0, 48, 48, 48],
  });
  const drop3Op = animProgress.interpolate({
    inputRange: [0, 0.22, 0.28, 0.48, 0.55, 1],
    outputRange: [0, 0.9, 0.9, 0.9, 0, 0],
  });

  // Stream opacity pulse
  const streamOp = animProgress.interpolate({
    inputRange: [0, 0.1, 0.45, 0.55, 1],
    outputRange: [0.3, 0.85, 0.85, 0.3, 0.3],
  });

  // Plant growth scales staggered by delay
  // Plant 1: x=78 (21% width), h=38, delay=0.6s (~0.13)
  const p1Scale = animProgress.interpolate({
    inputRange: [0, 0.12, 0.45, 0.88, 0.96, 1],
    outputRange: [0.15, 0.25, 1.0, 1.0, 0.8, 0.15],
  });

  // Plant 2: x=150 (40.5% width), h=54, delay=1.2s (~0.26)
  const p2Scale = animProgress.interpolate({
    inputRange: [0, 0.22, 0.58, 0.88, 0.96, 1],
    outputRange: [0.15, 0.25, 1.0, 1.0, 0.8, 0.15],
  });

  // Plant 3: x=232 (62.7% width), h=70, delay=1.8s (~0.39)
  const p3Scale = animProgress.interpolate({
    inputRange: [0, 0.32, 0.70, 0.90, 0.97, 1],
    outputRange: [0.15, 0.25, 1.0, 1.0, 0.8, 0.15],
  });

  // Plant 4: x=312 (84.3% width), h=88, delay=2.4s (~0.52)
  const p4Scale = animProgress.interpolate({
    inputRange: [0, 0.42, 0.82, 0.92, 0.98, 1],
    outputRange: [0.15, 0.25, 1.0, 1.0, 0.8, 0.15],
  });

  // Nutrient glow particles rising from soil
  const glow1Y = animProgress.interpolate({
    inputRange: [0, 0.4, 0.8, 1],
    outputRange: [4, -14, -28, 4],
  });
  const glow1Op = animProgress.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: [0.2, 0.85, 0, 0.2],
  });

  const glow2Y = animProgress.interpolate({
    inputRange: [0, 0.2, 0.6, 1],
    outputRange: [4, -18, -32, 4],
  });
  const glow2Op = animProgress.interpolate({
    inputRange: [0, 0.2, 0.55, 1],
    outputRange: [0.2, 0.9, 0, 0.2],
  });

  const glow3Y = animProgress.interpolate({
    inputRange: [0, 0.5, 0.85, 1],
    outputRange: [4, -12, -24, 4],
  });
  const glow3Op = animProgress.interpolate({
    inputRange: [0, 0.45, 0.75, 1],
    outputRange: [0.2, 0.85, 0, 0.2],
  });

  return (
    <View style={styles.container} pointerEvents="none">
      {/* 1. Atmospheric Bokeh Circles */}
      <View style={[styles.bokeh, { left: 40, top: 10, width: 68, height: 68, backgroundColor: '#6E9B4A', opacity: 0.25 }]} />
      <View style={[styles.bokeh, { left: '48%', top: 0, width: 84, height: 84, backgroundColor: '#4F6F3A', opacity: 0.3 }]} />
      <View style={[styles.bokeh, { right: 20, top: 20, width: 72, height: 72, backgroundColor: '#A9BFA0', opacity: 0.18 }]} />
      <View style={[styles.bokeh, { left: 100, top: 50, width: 50, height: 50, backgroundColor: '#E07B2E', opacity: 0.1 }]} />

      {/* 2. Water Stream falling from above toward 2nd Sprout (x ~40.5%) */}
      <Animated.View style={[styles.waterStream, { left: '40.2%', opacity: streamOp }]} />
      <Animated.View style={[styles.waterDrop, { left: '39.2%', transform: [{ translateY: drop1Y }], opacity: drop1Op }]} />
      <Animated.View style={[styles.waterDrop, { left: '40.6%', transform: [{ translateY: drop2Y }], opacity: drop2Op }]} />
      <Animated.View style={[styles.waterDrop, { left: '41.8%', transform: [{ translateY: drop3Y }], opacity: drop3Op }]} />

      {/* 3. Soil Seed at Left (x=34 ~9.2%) */}
      <View style={[styles.seed, { left: '9.5%' }]} />

      {/* 4. The 4 Plant Growth Stages (x=78, 150, 232, 312) */}
      {/* Plant 1 (h=38, x=21%) */}
      <Animated.View
        style={[
          styles.plantWrapper,
          {
            left: '21%',
            transform: [{ scaleY: p1Scale }, { scaleX: p1Scale }],
          },
        ]}
      >
        <View style={[styles.stem, { height: 32 }]} />
        <View style={[styles.leafLeft, { bottom: 22, width: 14, height: 8 }]} />
        <View style={[styles.leafRight, { bottom: 22, width: 14, height: 8 }]} />
      </Animated.View>

      {/* Plant 2 (h=54, x=40.5%) - receives water stream */}
      <Animated.View
        style={[
          styles.plantWrapper,
          {
            left: '40.5%',
            transform: [{ scaleY: p2Scale }, { scaleX: p2Scale }],
          },
        ]}
      >
        <View style={[styles.stem, { height: 46 }]} />
        <View style={[styles.leafLeft, { bottom: 34, width: 18, height: 10 }]} />
        <View style={[styles.leafRight, { bottom: 34, width: 18, height: 10 }]} />
        <View style={[styles.leafLeft, { bottom: 20, width: 12, height: 7, opacity: 0.8 }]} />
        <View style={[styles.leafRight, { bottom: 20, width: 12, height: 7, opacity: 0.8 }]} />
      </Animated.View>

      {/* Plant 3 (h=70, x=62.5%) */}
      <Animated.View
        style={[
          styles.plantWrapper,
          {
            left: '62.5%',
            transform: [{ scaleY: p3Scale }, { scaleX: p3Scale }],
          },
        ]}
      >
        <View style={[styles.stem, { height: 58 }]} />
        <View style={[styles.leafLeft, { bottom: 44, width: 22, height: 11 }]} />
        <View style={[styles.leafRight, { bottom: 44, width: 22, height: 11 }]} />
        <View style={[styles.leafLeft, { bottom: 26, width: 16, height: 9, opacity: 0.85 }]} />
        <View style={[styles.leafRight, { bottom: 26, width: 16, height: 9, opacity: 0.85 }]} />
      </Animated.View>

      {/* Plant 4 (h=88, x=84%) - Tallest mature plant */}
      <Animated.View
        style={[
          styles.plantWrapper,
          {
            left: '84%',
            transform: [{ scaleY: p4Scale }, { scaleX: p4Scale }],
          },
        ]}
      >
        <View style={[styles.stem, { height: 72 }]} />
        <View style={[styles.leafLeft, { bottom: 58, width: 25, height: 12 }]} />
        <View style={[styles.leafRight, { bottom: 58, width: 25, height: 12 }]} />
        <View style={[styles.leafLeft, { bottom: 38, width: 20, height: 10 }]} />
        <View style={[styles.leafRight, { bottom: 38, width: 20, height: 10 }]} />
        <View style={[styles.leafLeft, { bottom: 20, width: 14, height: 8, opacity: 0.8 }]} />
        <View style={[styles.leafRight, { bottom: 20, width: 14, height: 8, opacity: 0.8 }]} />
      </Animated.View>

      {/* 5. Glowing Nutrient Particles rising from Soil */}
      <Animated.View style={[styles.nutrientGlint, { left: '13%', transform: [{ translateY: glow1Y }], opacity: glow1Op }]} />
      <Animated.View style={[styles.nutrientGlint, { left: '30%', transform: [{ translateY: glow2Y }], opacity: glow2Op }]} />
      <Animated.View style={[styles.nutrientGlint, { left: '53%', transform: [{ translateY: glow1Y }], opacity: glow1Op }]} />
      <Animated.View style={[styles.nutrientGlint, { left: '73%', transform: [{ translateY: glow3Y }], opacity: glow3Op }]} />
      <Animated.View style={[styles.nutrientGlint, { left: '92%', transform: [{ translateY: glow2Y }], opacity: glow2Op }]} />

      {/* 6. Organic Soil Bed at Bottom */}
      <View style={styles.soilBed}>
        <View style={styles.soilHighlight} />
        <View style={styles.soilDeep} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  bokeh: {
    position: 'absolute',
    borderRadius: 50,
  },
  waterStream: {
    position: 'absolute',
    top: 4,
    width: 2.2,
    height: 38,
    borderRadius: 1.1,
    backgroundColor: '#DFF6FF',
    shadowColor: '#CFEFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
  },
  waterDrop: {
    position: 'absolute',
    top: 36,
    width: 3.2,
    height: 5.2,
    borderRadius: 2,
    backgroundColor: '#DFF6FF',
    shadowColor: '#BEEBFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 2,
  },
  seed: {
    position: 'absolute',
    bottom: 22,
    width: 7,
    height: 5,
    borderRadius: 3.5,
    backgroundColor: '#F1E8D2',
    opacity: 0.9,
  },
  plantWrapper: {
    position: 'absolute',
    bottom: 20,
    width: 30,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  stem: {
    width: 3,
    backgroundColor: '#8DAF5A',
    borderTopLeftRadius: 1.5,
    borderTopRightRadius: 1.5,
  },
  leafLeft: {
    position: 'absolute',
    right: 15,
    backgroundColor: '#9EC864',
    borderTopLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderBottomLeftRadius: 4,
    transform: [{ rotate: '-28deg' }],
  },
  leafRight: {
    position: 'absolute',
    left: 15,
    backgroundColor: '#7FA84A',
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 4,
    transform: [{ rotate: '28deg' }],
  },
  nutrientGlint: {
    position: 'absolute',
    bottom: 22,
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#FFE3BF',
    shadowColor: '#FFA834',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 3,
  },
  soilBed: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 16,
    backgroundColor: 'transparent',
  },
  soilHighlight: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(58, 42, 28, 0.45)',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  soilDeep: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
