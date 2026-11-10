import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, View, Animated, ActivityIndicator } from 'react-native';
import { colors, typography, spacing, radius } from '../../lib/theme';

interface AppButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'accent';
  showArrow?: boolean;
  loading?: boolean;
}

export function AppButton({ title, variant = 'primary', showArrow = false, loading = false, style, disabled, ...props }: AppButtonProps) {
  const isPrimary = variant === 'primary';
  const isAccent = variant === 'accent';
  
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
    props.onPressIn && props.onPressIn(e);
  };

  const handlePressOut = (e: any) => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
    props.onPressOut && props.onPressOut(e);
  };
  
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={style}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      {...props}
    >
      <Animated.View style={[
        styles.button,
        isPrimary && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        isAccent && styles.accentButton,
        (disabled || loading) && styles.disabledButton,
        { transform: [{ scale: scaleAnim }] }
      ]}>
        <View style={styles.contentContainer}>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={isPrimary || isAccent ? colors.text.primary : colors.text.inverse}
            />
          ) : (
            <>
              <Text style={[
                styles.text, 
                isPrimary || isAccent ? styles.primaryText : styles.secondaryText
              ]}>
                {title}
              </Text>
              {showArrow && (
                <Text style={[
                  styles.arrow, 
                  isPrimary || isAccent ? styles.primaryText : styles.secondaryText
                ]}>
                  {' \u2192'}
                </Text>
              )}
            </>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 56,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.button.primary,
  },
  secondaryButton: {
    backgroundColor: colors.button.secondary,
  },
  accentButton: {
    backgroundColor: colors.button.accent,
  },
  disabledButton: {
    opacity: 0.65,
  },
  text: {
    ...typography.button,
  },
  primaryText: {
    color: colors.text.inverse,
  },
  secondaryText: {
    color: colors.button.secondaryText,
  },
  arrow: {
    ...typography.button,
    marginLeft: 4,
  },
});

