import React from 'react';
import { Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authService } from '../../../src/services/auth.service';
import { setAuthState } from '../../../src/store/authStore';

export default function FarmerProfileScreen() {
  const handleLogout = () => {
    const performLogout = async () => {
      try {
        await authService.signOut();
      } catch (err) {
        console.warn('Error during signOut:', err);
      } finally {
        setAuthState({
          user: null,
          profile: null,
          session: null,
          token: null,
          isLoading: false,
        });
        router.replace('/(auth)/login' as any);
      }
    };

    if (Platform.OS === 'web') {
      const confirmText = 'Log Out\n\nAre you sure you want to log out of your TraceRoot account?';
      if (typeof window !== 'undefined' && window.confirm && window.confirm(confirmText)) {
        performLogout();
      }
      return;
    }

    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your TraceRoot account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: performLogout,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Farmer Profile</Text>
      <Text style={styles.subtitle}>Farm information, certifications and account settings</Text>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleLogout}
        style={styles.logoutButton}
        accessibilityRole="button"
        accessibilityLabel="Log out of your account"
      >
        <MaterialCommunityIcons
          name="logout"
          size={18}
          color="#DC2626"
          style={styles.logoutIcon}
        />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F2EB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#16351E',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#657E6B',
    textAlign: 'center',
    marginBottom: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },
});
