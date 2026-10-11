import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface BuyerBottomTabBarProps {
  state: {
    index: number;
    routes: Array<{ key: string; name: string }>;
  };
  navigation: {
    emit: (event: { type: string; target?: string; canPreventDefault?: boolean }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
  descriptors?: Record<string, any>;
}

interface TabConfig {
  name: string;
  label: string;
  badge?: number;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  focusedIconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  size?: number;
}

const BUYER_TABS: TabConfig[] = [
  {
    name: 'index',
    label: 'Home',
    iconName: 'home',
    focusedIconName: 'home',
    size: 24,
  },
  {
    name: 'explore',
    label: 'Market',
    iconName: 'storefront-outline',
    focusedIconName: 'storefront',
    size: 22,
  },
  {
    name: 'orders',
    label: 'Orders',
    iconName: 'basket-outline',
    focusedIconName: 'basket',
    size: 22,
  },
  {
    name: 'messages',
    label: 'Messages',
    badge: 1,
    iconName: 'chat-outline',
    focusedIconName: 'chat',
    size: 22,
  },
  {
    name: 'profile',
    label: 'Profile',
    iconName: 'account-cowboy-hat-outline',
    focusedIconName: 'account-cowboy-hat',
    size: 24,
  },
];

export const BuyerBottomTabBar: React.FC<any> = ({
  state,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const bottomMargin = Platform.OS === 'ios' ? Math.max(insets.bottom, 16) : 20;

  return (
    <View style={styles.outerWrapper} pointerEvents="box-none">
      <View style={[styles.barContainer, { marginBottom: bottomMargin }]}>
        {BUYER_TABS.map((tab) => {
          const routeIndex = state.routes.findIndex((r: { name: string }) => r.name === tab.name);
          const isFocused = state.index === routeIndex;

          const activeColor = '#FFFFFF';
          const inactiveColor = '#8A9E8D'; // Soft sage green matching design screenshot
          const color = isFocused ? activeColor : inactiveColor;
          const iconToRender = isFocused
            ? tab.focusedIconName || tab.iconName
            : tab.iconName;

          const handlePress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: state.routes[routeIndex]?.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(tab.name);
            }
          };

          return (
            <TouchableOpacity
              key={tab.name}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={tab.label}
              onPress={handlePress}
              activeOpacity={0.75}
              style={styles.tabItem}
            >
              {/* Icon Container with Optional Badge */}
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons
                  name={iconToRender}
                  size={tab.size || 22}
                  color={color}
                />

                {tab.badge !== undefined && (
                  <View style={styles.badgePill}>
                    <Text style={styles.badgeNumber}>{tab.badge}</Text>
                  </View>
                )}
              </View>

              {/* Tab Title Label */}
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color,
                    fontWeight: isFocused ? '600' : '500',
                  },
                ]}
              >
                {tab.label}
              </Text>

              {/* Orange Active Indicator Dash Under Label */}
              <View
                style={[
                  styles.indicatorDash,
                  { backgroundColor: isFocused ? '#E66E26' : 'transparent' },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  barContainer: {
    flexDirection: 'row',
    width: '92%',
    maxWidth: 420,
    height: 72,
    backgroundColor: '#1D3724', // Deep hunter/forest green matching the uploaded image
    borderRadius: 36, // Fully rounded floating pill / capsule
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingTop: 8,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 2,
  },
  badgePill: {
    position: 'absolute',
    top: -3,
    right: -7,
    backgroundColor: '#E66722', // Vibrant orange notification badge
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#1D3724', // Matches capsule background
  },
  badgeNumber: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  tabLabel: {
    fontSize: 11.5,
    letterSpacing: 0.1,
  },
  indicatorDash: {
    width: 14,
    height: 3.5,
    borderRadius: 2,
    marginTop: 2.5,
  },
});
