import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '../../src/services/auth.service';

type AdminTab = 'overview' | 'verifications' | 'users' | 'contracts' | 'traceability' | 'disputes';

interface TabItem {
  key: AdminTab;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}

const TABS: TabItem[] = [
  { key: 'overview', label: 'Overview', icon: 'grid' },
  { key: 'verifications', label: 'Verifications', icon: 'check-circle' },
  { key: 'users', label: 'Users', icon: 'users' },
  { key: 'contracts', label: 'Contracts', icon: 'file-text' },
  { key: 'traceability', label: 'Traceability', icon: 'shield' },
  { key: 'disputes', label: 'Disputes', icon: 'alert-triangle' },
];

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to exit Admin mode?', [
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

  const currentTab = TABS.find((t) => t.key === activeTab);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <View style={styles.badge}>
            <MaterialCommunityIcons name="shield-crown" size={12} color="#FFFFFF" />
            <Text style={styles.badgeText}>ADMIN CONSOLE</Text>
          </View>
          <Text style={styles.headerTitle}>TraceRoot Admin</Text>
        </View>

        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Feather name="log-out" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Sub-tabs Navigation */}
      <View style={styles.tabBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Feather
                  name={tab.icon}
                  size={14}
                  color={isActive ? '#FFFFFF' : '#888888'}
                />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Empty Black Canvas for active tab */}
      <View style={styles.content}>
        <View style={styles.emptyCard}>
          <Feather
            name={currentTab?.icon || 'grid'}
            size={40}
            color="#333333"
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>{currentTab?.label}</Text>
          <Text style={styles.emptySubtitle}>Empty Screen</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerTitleWrap: {
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#888888',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  signOutBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#141414',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#222222',
  },
  tabBar: {
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    paddingVertical: 10,
  },
  tabScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#222222',
  },
  tabItemActive: {
    backgroundColor: '#222222',
    borderColor: '#444444',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#CCCCCC',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#555555',
    marginTop: 4,
  },
});
