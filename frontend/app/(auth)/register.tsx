import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  KeyboardAvoidingView, ScrollView, Platform, Animated, Easing, ActivityIndicator 
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppButton } from '../../src/components/common/AppButton';
import { AppInput } from '../../src/components/common/AppInput';
import { colors, spacing, typography, radius } from '../../src/lib/theme';
import { authService } from '../../src/services/auth.service';
import { GoogleRoleConfirmModal } from '../../src/components/auth/GoogleRoleConfirmModal';

type Role = 'farmer' | 'buyer' | 'supplier' | null;

interface RoleCardProps {
  type: Role;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  isSelected: boolean;
  onSelect: (type: Role) => void;
}

function RoleCard({ type, title, icon, isSelected, onSelect }: RoleCardProps) {
  return (
    <TouchableOpacity 
      style={[styles.roleCard, isSelected && styles.roleCardSelected]}
      onPress={() => onSelect(type)}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons 
        name={icon} 
        size={24} 
        color={isSelected ? colors.button.accent : colors.text.inverse} 
      />
      <Text style={[styles.roleText, isSelected && styles.roleTextSelected]}>{title}</Text>
    </TouchableOpacity>
  );
}

export default function RegisterScreen() {
  const [role, setRole] = useState<Role>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Animations
  const [bgScale] = useState(() => new Animated.Value(1));
  const [slideAnim] = useState(() => new Animated.Value(20));

  // Staggered items
  const [titleAnim] = useState(() => new Animated.Value(0));
  const [rolesAnim] = useState(() => new Animated.Value(0));
  const [formAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    // Slow background zoom
    Animated.timing(bgScale, {
      toValue: 1.1,
      duration: 30000,
      useNativeDriver: true,
      easing: Easing.linear,
    }).start();

    // Entrance animations
    Animated.stagger(150, [
      Animated.timing(titleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(rolesAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(formAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      ])
    ]).start();
  }, [bgScale, formAnim, rolesAnim, slideAnim, titleAnim]);

  const validate = () => {
    let valid = true;
    let newErrors: Record<string, string> = {};

    if (!role) {
      newErrors.role = 'Please select a role to continue.';
      valid = false;
    }
    if (!name.trim()) {
      newErrors.name = 'Full name is required.';
      valid = false;
    }
    if (!email.trim() || !email.includes('@')) {
      newErrors.email = 'Please enter a valid email.';
      valid = false;
    }
    if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSignUp = async () => {
    if (!validate() || !role) return;

    setIsLoading(true);
    setAuthError(null);

    const result = await authService.signUp({
      email,
      password,
      fullName: name,
      role,
    });

    setIsLoading(false);

    if (result.error) {
      setAuthError(result.error);
      return;
    }

    if (role === 'farmer') {
      router.replace({
        pathname: '/(auth)/register-farmer',
        params: { userId: result.user?.id, name, email, role },
      });
    } else if (role === 'buyer') {
      router.replace({
        pathname: '/(auth)/register-buyer',
        params: { userId: result.user?.id, name, email, role },
      });
    } else if (role === 'supplier') {
      router.replace('/(supplier)');
    } else {
      router.replace('/(auth)/login');
    }
  };

  const handleSignIn = () => {
    router.push('/(auth)/login');
  };

  const handleGoogleAuth = () => {
    setAuthError(null);
    setIsRoleModalVisible(true);
  };

  const handleConfirmGoogleAuth = async (confirmedRole: 'buyer' | 'farmer' | 'supplier') => {
    setIsGoogleLoading(true);
    setAuthError(null);

    const result = await authService.signInWithGoogle({ selectedRole: confirmedRole });
    setIsGoogleLoading(false);
    setIsRoleModalVisible(false);

    if (result.error) {
      if (
        result.error.toLowerCase().includes('cancelled') ||
        result.error.toLowerCase().includes('dismiss')
      ) {
        return;
      }
      setAuthError(result.error);
      return;
    }

    if (Platform.OS === 'web') {
      // On web, signInWithOAuth initiates full-page redirect to Google consent screen
      return;
    }

    const targetRole = result.actualRole || result.profile?.role || confirmedRole;

    if (targetRole === 'farmer') {
      if (result.profile?.farm_name) {
        router.replace('/(farmer)');
      } else {
        router.replace({
          pathname: '/(auth)/register-farmer',
          params: {
            userId: result.user?.id,
            name: result.profile?.full_name || '',
            email: result.user?.email || '',
            role: 'farmer',
          },
        });
      }
    } else if (targetRole === 'buyer') {
      router.replace('/(buyer)');
    } else if (targetRole === 'supplier') {
      router.replace('/(supplier)');
    } else if (targetRole === 'admin') {
      router.replace('/(admin)');
    } else {
      router.replace('/(auth)/login');
    }
  };

  const handleRoleSelect = (selected: Role) => {
    setRole(selected);
    setAuthError(null);
    setErrors((prev) => ({ ...prev, role: '' }));
  };

  return (
    <View style={styles.container}>
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
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <Animated.View style={{ opacity: titleAnim, marginTop: spacing.xxl }}>
            <Text style={styles.title}>Join us</Text>
            <Text style={styles.subtitle}>Create your TraceRoot account</Text>
          </Animated.View>

          <Animated.View style={[{ opacity: rolesAnim }, styles.rolesSection]}>
            <Text style={styles.label}>JOIN AS</Text>
            <View style={styles.rolesRow}>
              <RoleCard
                type="farmer"
                title="Farmer"
                icon="tractor"
                isSelected={role === 'farmer'}
                onSelect={handleRoleSelect}
              />
              <RoleCard
                type="buyer"
                title="Buyer"
                icon="cart-outline"
                isSelected={role === 'buyer'}
                onSelect={handleRoleSelect}
              />
              <RoleCard
                type="supplier"
                title="Supplier"
                icon="storefront-outline"
                isSelected={role === 'supplier'}
                onSelect={handleRoleSelect}
              />
            </View>
            {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}
          </Animated.View>

          <Animated.View style={[{ opacity: formAnim, transform: [{ translateY: slideAnim }] }, styles.formSection]}>
            <AppInput 
              icon="account-outline"
              placeholder="Full name"
              value={name}
              onChangeText={setName}
              error={errors.name}
            />
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

            {authError && (
              <View style={styles.errorBanner}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#FF6B6B" />
                <Text style={styles.errorBannerText}>{authError}</Text>
              </View>
            )}

            <AppButton 
              title="SIGN UP" 
              variant="accent" 
              loading={isLoading}
              onPress={handleSignUp} 
              style={styles.signUpBtn}
            />

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity
              style={[
                styles.googleBtn,
                (isLoading || isGoogleLoading) && styles.googleBtnDisabled,
              ]}
              onPress={handleGoogleAuth}
              disabled={isLoading || isGoogleLoading}
              activeOpacity={0.8}
            >
              {isGoogleLoading ? (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={{ marginRight: spacing.sm }}
                />
              ) : (
                <View style={styles.googleIconCircle}>
                  <Text style={{ fontWeight: 'bold', color: colors.primary }}>G</Text>
                </View>
              )}
              <Text style={styles.googleText}>
                {isGoogleLoading ? 'Connecting to Google...' : 'Sign up with Google'}
              </Text>
            </TouchableOpacity>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={handleSignIn}>
                <Text style={styles.loginLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>

      <GoogleRoleConfirmModal
        visible={isRoleModalVisible}
        initialRole={role}
        isLoading={isGoogleLoading}
        onConfirm={handleConfirmGoogleAuth}
        onClose={() => setIsRoleModalVisible(false)}
      />
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)', // Dark overlay for text readability
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.heading,
    fontSize: 40,
    color: colors.text.inverse,
    marginBottom: 4,
    fontFamily: 'Georgia',
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
    height: 90,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCardSelected: {
    borderColor: colors.button.accent,
    backgroundColor: 'rgba(76, 175, 80, 0.15)', // Light green tint
  },
  roleText: {
    color: colors.text.inverse,
    fontSize: 13,
    marginTop: 8,
    fontWeight: '600',
  },
  roleTextSelected: {
    color: colors.button.accent,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: spacing.sm,
  },
  formSection: {
    flex: 1,
  },
  signUpBtn: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: colors.text.inverse,
    paddingHorizontal: spacing.md,
    fontSize: 12,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'transparent',
    marginBottom: spacing.xl,
  },
  googleBtnDisabled: {
    opacity: 0.65,
  },
  googleIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  googleText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: colors.text.inverse,
    fontSize: 14,
  },
  loginLink: {
    color: colors.button.accent,
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    gap: 8,
  },
  errorBannerText: {
    color: '#FF8080',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});