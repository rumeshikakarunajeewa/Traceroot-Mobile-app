import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { AppButton } from '../../src/components/common/AppButton';
import { colors, spacing } from '../../src/lib/theme';

export default function OnboardingStep3Screen() {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animation (Fade in and slide up)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      })
    ]).start();

    // Subtle floating animation for the circle/image
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  const handleNext = () => {
    // TODO: Route to step 4 when created, for now go to register
    router.push('/(auth)/onboarding-step-4');
  };

  const handleSkip = () => {
    router.replace('/(auth)/register');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.onboardingBackground} />
      <View style={styles.container}>
        
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Text style={styles.stepText}>3 / 4</Text>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <Animated.View style={[styles.circle, { transform: [{ translateY: floatAnim }] }]}>
            <Image 
              source={require('../../assets/images/onboarding_farm_buyer_1791567143017.jpg')} 
              style={styles.image}
              contentFit="cover"
              transition={300}
            />
          </Animated.View>
        </View>

        {/* Content */}
        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.title}>Farm to Buyer{'\n'}Connection</Text>
          <Text style={styles.subtitle}>
            Farmers, buyers, and suppliers on one trusted platform. Transparency that builds real trust.
          </Text>
        </Animated.View>

        {/* Footer */}
        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          <View style={styles.pagination}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
          </View>

          <AppButton
            title="Next"
            variant="accent"
            showArrow
            onPress={handleNext}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  stepText: {
    color: colors.button.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  skipButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  skipText: {
    color: colors.text.onboarding,
    fontSize: 14,
    fontWeight: '500',
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 100, // Inner circle
  },
  
  // Custom Basket Illustration Styles
  basketContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  shadow: {
    width: 80,
    height: 15,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    position: 'absolute',
    bottom: 5,
  },
  fruitsGroup: {
    position: 'absolute',
    top: 10,
    width: 70,
    height: 40,
    zIndex: 1,
  },
  fruitRed: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E74C3C',
    position: 'absolute',
    left: 5,
    top: 15,
  },
  fruitOrange: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F39C12',
    position: 'absolute',
    left: 30,
    top: 8,
  },
  fruitLeaf: {
    width: 20,
    height: 10,
    backgroundColor: '#2ECC71',
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    position: 'absolute',
    right: 5,
    top: 18,
    transform: [{ rotate: '-20deg' }],
  },
  basketBody: {
    width: 70,
    height: 50,
    backgroundColor: '#CD8B50', // light brown
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    marginTop: 35,
    zIndex: 2,
    overflow: 'hidden',
  },
  basketRim: {
    width: 86,
    height: 14,
    backgroundColor: '#B5733A', // slightly darker brown
    borderRadius: 7,
    position: 'absolute',
    top: 32,
    zIndex: 3,
  },
  vLine: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  hLine: {
    position: 'absolute',
    height: 2,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  contentContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.onboarding,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontFamily: 'Georgia',
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.onboarding,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
    paddingHorizontal: spacing.sm,
  },
  footer: {
    width: '100%',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  activeDot: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.button.accent,
  },
});
