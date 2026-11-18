import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { authService } from '../../services/auth.service';

interface AdminHeaderProps {
  isDark: boolean;
  onRefresh?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ isDark, onRefresh }) => {
  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of the Admin Console?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await authService.signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <View style={[styles.header, isDark && styles.headerDark]}>
      <View style={styles.headerLeft}>
        <View style={styles.adminBadge}>
          <MaterialCommunityIcons name="shield-crown" size={13} color="#FFFFFF" />
          <Text style={styles.adminBadgeText}>ADMIN CONSOLE</Text>
        </View>
        <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
          TraceRoot Governance
        </Text>
      </View>

      <View style={styles.headerActions}>
        {onRefresh && (
          <TouchableOpacity
            style={[styles.actionBtn, isDark && styles.actionBtnDark]}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <Feather name="refresh-cw" size={16} color={isDark ? '#E8F5E9' : '#1C3723'} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionBtn, isDark && styles.actionBtnDark]}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Feather name="log-out" size={16} color={isDark ? '#E8F5E9' : '#1C3723'} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  headerDark: {
    backgroundColor: '#162219',
    borderBottomColor: '#1E2F23',
  },
  headerLeft: {
    flex: 1,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#255D35',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C3723',
  },
  headerTitleDark: {
    color: '#E8F5E9',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0EFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDark: {
    backgroundColor: '#24382A',
  },
});
