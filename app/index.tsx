import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ImageBackground, StatusBar, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { AppButton } from '../src/components/common/AppButton';
import { colors, spacing, typography } from '../src/lib/theme';

export default function WelcomeScreen() {
  const logoAnim = useRef(new Animated.Value(0)).current;
  
  // App Name letter animations
  const appName = "TraceRoot".split('');
  const letterAnims = useRef(appName.map(() => new Animated.Value(0))).current;

  // Tagline animations
  const textAnim = useRef(new Animated.Value(0)).current;
  const textSlideAnim = useRef(new Animated.Value(20)).current;

  // Button animations
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const buttonSlideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const letterAnimations = letterAnims.map((anim) => 
      Animated.timing(anim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    );

    Animated.sequence([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.stagger(40, letterAnimations),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(textAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(textSlideAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      ]),
      Animated.parallel([
        Animated.timing(buttonAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonSlideAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      ])
    ]).start();
  }, []);

  const handleGetStarted = () => {
    router.push('/(auth)/onboarding');
  };

  const handleSignIn = () => {
    router.push('/(auth)/login');
  };

  // Helper to render letter with correct styling
  const renderTitle = () => {
    return (
      <View style={styles.titleRow}>
        {appName.map((letter, index) => {
          return (
            <Animated.Text
              key={index}
              style={[
                styles.titleLetter,
                styles.titleLetterAccent, // All letters green!
                { opacity: letterAnims[index] }
              ]}
            >
              {letter}
            </Animated.Text>
          );
        })}
      </View>
    );
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' }}
      style={styles.background}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={styles.overlay} />

      <View style={styles.container}>
        <Animated.View style={[styles.logoContainer, { opacity: logoAnim, transform: [{ scale: logoAnim }] }]}>
          <View style={styles.leafGroup}>
            <View style={[styles.leaf, styles.leafTopLeft]} />
            <View style={[styles.leaf, styles.leafTopRight]} />
          </View>
          <View style={styles.leafGroup}>
            <View style={[styles.leaf, styles.leafBottomLeft]} />
            <View style={[styles.leaf, styles.leafBottomRight]} />
          </View>
        </Animated.View>

        {renderTitle()}

        <Animated.View style={{ opacity: textAnim, transform: [{ translateY: textSlideAnim }], alignItems: 'center' }}>
          <Text style={styles.taglineText}>
            <Text style={styles.taglineHighlight}>Trust</Text> Every Root,{'\n'}
            <Text style={styles.taglineHighlight}>Trace</Text> Every Harvest.
          </Text>
        </Animated.View>

        <View style={styles.spacer} />

        <Animated.View style={[styles.buttonContainer, { opacity: buttonAnim, transform: [{ translateY: buttonSlideAnim }] }]}>
          <AppButton
            title="Get Started"
            onPress={handleGetStarted}
            showArrow
          />
          <AppButton
            title="Sign in"
            variant="secondary"
            onPress={handleSignIn}
          />
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Slightly darker for better contrast
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  logoContainer: {
    marginTop: 140, // Space from top
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  leafGroup: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  leaf: {
    width: 18,
    height: 18,
    backgroundColor: colors.primaryLight,
  },
  leafTopLeft: {
    borderTopLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  leafTopRight: {
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
  },
  leafBottomLeft: {
    borderTopLeftRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: colors.primary,
  },
  leafBottomRight: {
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    backgroundColor: colors.primary,
  },
  
  // Title Typography
  titleRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  titleLetter: {
    fontSize: 48,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    fontFamily: 'Georgia', // Keep a premium serif look if available
  },
  titleLetterPrimary: {
    color: colors.text.inverse, // White
  },
  titleLetterAccent: {
    color: colors.button.accent, // Vibrant Green
  },

  // Tagline Typography
  taglineText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 28,
    color: colors.text.inverse,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  taglineHighlight: {
    color: colors.button.accent,
  },

  spacer: {
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
  },
});
