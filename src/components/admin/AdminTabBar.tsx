import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDarkMode } from '@/store/uiStore';

export interface AdminTabBarProps {
  activeTab?: 'overview' | 'users' | 'records' | 'reports' | 'profile';
}

/**
 * Decorative bottom tab bar for the Admin panel.
 * Represents the 5-tab shell matching the design reference:
 * [Overview] [Users] [Records] [Reports] [Profile]
 *
 * In Step 2 (single-page build), only Overview is active.
 * The other four destinations are disabled to avoid broken navigation.
 */
export const AdminTabBar: React.FC<AdminTabBarProps> = ({ activeTab = 'overview' }) => {
  const [isDark] = useDarkMode();
  const insets = useSafeAreaInsets();
  const bottomMargin = Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : 16;

  return (
    <View style={styles.outerWrapper} pointerEvents="box-none">
      <View style={[styles.barContainer, isDark && styles.barContainerDark, { marginBottom: bottomMargin }]}>
        {/* Tab 1: Overview (Active) */}
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.8}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'overview' }}
          accessibilityLabel="Overview tab"
        >
          <MaterialCommunityIcons
            name="view-dashboard"
            size={22}
            color="#FFFFFF"
          />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>
            Overview
          </Text>
          <View style={styles.activeIndicator} />
        </TouchableOpacity>

        {/* Tab 2: Users (Disabled) */}
        <TouchableOpacity
          style={[styles.tabItem, styles.tabItemDisabled]}
          disabled={true}
          accessibilityRole="tab"
          accessibilityState={{ disabled: true }}
          accessibilityLabel="Users tab (unavailable)"
        >
          <Feather
            name="users"
            size={20}
            color="#88A38E"
          />
          <Text style={styles.tabLabel}>
            Users
          </Text>
          <View style={styles.inactiveIndicator} />
        </TouchableOpacity>

        {/* Tab 3: Records (Disabled) */}
        <TouchableOpacity
          style={[styles.tabItem, styles.tabItemDisabled]}
          disabled={true}
          accessibilityRole="tab"
          accessibilityState={{ disabled: true }}
          accessibilityLabel="Records tab (unavailable)"
        >
          <MaterialCommunityIcons
            name="file-document-outline"
            size={20}
            color="#88A38E"
          />
          <Text style={styles.tabLabel}>
            Records
          </Text>
          <View style={styles.inactiveIndicator} />
        </TouchableOpacity>

        {/* Tab 4: Reports (Disabled) */}
        <TouchableOpacity
          style={[styles.tabItem, styles.tabItemDisabled]}
          disabled={true}
          accessibilityRole="tab"
          accessibilityState={{ disabled: true }}
          accessibilityLabel="Reports tab (unavailable)"
        >
          <MaterialCommunityIcons
            name="chart-bar"
            size={20}
            color="#88A38E"
          />
          <Text style={styles.tabLabel}>
            Reports
          </Text>
          <View style={styles.inactiveIndicator} />
        </TouchableOpacity>

        {/* Tab 5: Profile (Disabled) */}
        <TouchableOpacity
          style={[styles.tabItem, styles.tabItemDisabled]}
          disabled={true}
          accessibilityRole="tab"
          accessibilityState={{ disabled: true }}
          accessibilityLabel="Profile tab (unavailable)"
        >
          <Feather
            name="user"
            size={20}
            color="#88A38E"
          />
          <Text style={styles.tabLabel}>
            Profile
          </Text>
          <View style={styles.inactiveIndicator} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#183821',
    width: '92%',
    height: 64,
    borderRadius: 34,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  barContainerDark: {
    backgroundColor: '#142517',
    borderColor: '#283D2C',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.45,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },
  tabItemDisabled: {
    opacity: 0.45,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    color: '#88A38E',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  activeIndicator: {
    width: 14,
    height: 3,
    borderRadius: 1.5,
    marginTop: 3,
    backgroundColor: '#E57338',
  },
  inactiveIndicator: {
    width: 14,
    height: 3,
    borderRadius: 1.5,
    marginTop: 3,
    backgroundColor: 'transparent',
  },
});

