import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { authService } from '../../src/services/auth.service';
import { colors, typography, spacing } from '../../src/lib/theme';
import { AppButton } from '../../src/components/common/AppButton';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{
    code?: string;
    error?: string;
    error_description?: string;
  }>();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function processAuth() {
      try {
        if (params.error || params.error_description) {
          if (isMounted) {
            setErrorMessage(params.error_description || params.error || 'Authentication failed.');
            setIsProcessing(false);
          }
          return;
        }

        // On web, read window.location.href to capture hash fragments (#access_token=...)
        let callbackUrl = '';
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.href) {
          callbackUrl = window.location.href;
        } else {
          const initialUrl = await Linking.getInitialURL();
          callbackUrl =
            initialUrl ||
            Linking.createURL('auth/callback', {
              queryParams: params as Record<string, string>,
            });
        }

        const result = await authService.handleAuthCallbackUrl(callbackUrl);

        if (!isMounted) return;

        if (result.error) {
          setErrorMessage(result.error);
          setIsProcessing(false);
          return;
        }

        const role = result.actualRole || result.profile?.role || 'buyer';
        if (role === 'farmer') {
          router.replace('/(farmer)');
        } else if (role === 'supplier') {
          router.replace('/(supplier)');
        } else if (role === 'admin') {
          router.replace('/(admin)');
        } else {
          router.replace('/(buyer)');
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message || 'An unexpected error occurred during authentication.');
          setIsProcessing(false);
        }
      }
    }

    processAuth();

    return () => {
      isMounted = false;
    };
  }, [params]);

  const handleBackToLogin = () => {
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      {isProcessing ? (
        <View style={styles.content}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.title}>Completing Google Sign-In...</Text>
          <Text style={styles.subtitle}>Securing your session with TraceRoot</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.errorTitle}>Sign-In Incomplete</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <AppButton
            title="Back to Sign In"
            onPress={handleBackToLogin}
            style={styles.backButton}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
  },
  title: {
    ...typography.subheading,
    color: colors.text.primary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  errorTitle: {
    ...typography.subheading,
    color: '#EF4444',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  backButton: {
    width: '100%',
  },
});
