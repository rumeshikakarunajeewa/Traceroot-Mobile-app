import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppButton } from '../../src/components/common/AppButton';
import { AppInput } from '../../src/components/common/AppInput';
import { colors, spacing, typography, radius } from '../../src/lib/theme';

type Role = 'farmer' | 'buyer' | 'supplier';

export default function LoginScreen() {
  const [role, setRole] = useState<Role>('buyer'); // Default to buyer as requested
  const [email, setEmail] = useState('saman.perera@buyer.traceroot.com');
  const [password, setPassword] = useState('password123');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Animations
  const bgScale = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const rolesAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(bgScale, {
      toValue: 1.08,
      duration: 30000,
      useNativeDriver: true,
      easing: Easing.linear,
    }).start();

    Animated.stagger(120, [
      Animated.timing(titleAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(rolesAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(formAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const validate = () => {
    let valid = true;
    let newErrors: Record<string, string> = {};

    if (!email.trim() || !email.includes('@')) {
      newErrors.email = 'Please enter a valid email address.';
      valid = false;
    }
    if (password.length < 4) {
      newErrors.password = 'Please enter your password.';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSignIn = () => {
    if (validate()) {
      navigateToRoleHome(role);
    }
  };

  const navigateToRoleHome = (selectedRole: Role) => {
    if (selectedRole === 'buyer') {
      // Direct navigation to Buyer Home Page
      router.replace('/(buyer)');
    } else if (selectedRole === 'farmer') {
      router.replace('/(farmer)');
    } else {
      router.replace('/(supplier)');
    }
  };

  const handleGoogleAuth = () => {
    // If logged in via Google, navigate directly to role's dashboard
    navigateToRoleHome(role);
  };

  const handleSignUp = () => {
    router.push('/(auth)/register');
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  const RoleCard = ({
    type,
    title,
    icon,
  }: {
    type: Role;
    title: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
  }) => {
    const isSelected = role === type;
    return (
      <TouchableOpacity
        style={[styles.roleCard, isSelected && styles.roleCardSelected]}
        onPress={() => setRole(type)}
        activeOpacity={0.75}
      >
        <MaterialCommunityIcons
          name={icon}
          size={24}
          color={isSelected ? colors.button.accent : colors.text.inverse}
        />
        <Text style={[styles.roleText, isSelected && styles.roleTextSelected]}>{title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Animated.Image
        source={require('../../assets/images/auth_sprouts.jpg')}
        style={[styles.bgImage, { transform: [{ scale: bgScale }] }]}
        resizeMode="cover"
      />
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Title */}
          <Animated.View style={{ opacity: titleAnim, marginTop: spacing.xl }}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your TraceRoot account</Text>
          </Animated.View>

          {/* Role Selector */}
          <Animated.View style={[{ opacity: rolesAnim }, styles.rolesSection]}>
            <Text style={styles.label}>SIGN IN AS</Text>
            <View style={styles.rolesRow}>
              <RoleCard type="buyer" title="Buyer" icon="cart-outline" />
              <RoleCard type="farmer" title="Farmer" icon="tractor" />
              <RoleCard type="supplier" title="Supplier" icon="storefront-outline" />
            </View>
          </Animated.View>

          {/* Form Inputs */}
          <Animated.View
            style={[
              { opacity: formAnim, transform: [{ translateY: slideAnim }] },
              styles.formSection,
            ]}
          >
            <AppInput
              icon="email-outline"
              placeholder="example@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
            />

            <AppInput
              icon="lock-outline"
              placeholder="Password"
              isPassword
              value={password}
              onChangeText={setPassword}
              error={errors.password}
            />

            <View style={styles.forgotPasswordRow}>
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Primary Sign In Button */}
            <AppButton
              title={role === 'buyer' ? 'SIGN IN AS BUYER' : 'SIGN IN'}
              variant="accent"
              onPress={handleSignIn}
              style={styles.signInBtn}
            />

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            {/* Google Authentication */}
            <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleAuth}>
              <View style={styles.googleIconCircle}>
                <Text style={{ fontWeight: 'bold', color: colors.primary }}>G</Text>
              </View>
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Link to Sign Up */}
            <View style={styles.signUpRow}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleSignUp}>
                <Text style={styles.signUpLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  bgImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 70,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.heading,
    fontSize: 38,
    color: colors.text.inverse,
    marginBottom: 4,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.inverse,
    opacity: 0.9,
    marginBottom: spacing.xl,
  },
  rolesSection: {
    marginBottom: spacing.xl,
  },
  label: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  rolesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  roleCard: {
    flex: 1,
    height: 86,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCardSelected: {
    borderColor: colors.button.accent,
    backgroundColor: 'rgba(124, 217, 88, 0.15)',
  },
  roleText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  roleTextSelected: {
    color: colors.button.accent,
    fontWeight: '700',
  },
  formSection: {
    width: '100%',
  },
  forgotPasswordRow: {
    alignItems: 'flex-end',
    marginBottom: spacing.md,
    marginTop: -4,
  },
  forgotPasswordText: {
    color: colors.text.inverse,
    fontSize: 13,
    opacity: 0.85,
    textDecorationLine: 'underline',
  },
  signInBtn: {
    marginTop: spacing.xs,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  dividerText: {
    color: colors.text.inverse,
    paddingHorizontal: spacing.sm,
    fontSize: 14,
    opacity: 0.7,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 54,
    borderRadius: radius.full,
    marginBottom: spacing.lg,
  },
  googleIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  googleText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  signUpText: {
    color: colors.text.inverse,
    fontSize: 14,
    opacity: 0.8,
  },
  signUpLink: {
    color: colors.button.accent,
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});