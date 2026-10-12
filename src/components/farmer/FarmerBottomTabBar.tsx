import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface FarmerBottomTabBarProps {
  state: any;
  navigation: any;
  descriptors?: Record<string, any>;
  onAddPress?: () => void;
  [key: string]: any;
}

export const FarmerBottomTabBar: React.FC<FarmerBottomTabBarProps> = ({
  state,
  navigation,
  onAddPress,
}) => {
  const insets = useSafeAreaInsets();
  const bottomMargin = Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : 16;

  const currentRouteName = state.routes[state.index]?.name;

  const navigateTab = (routeName: string) => {
    const routeIndex = state.routes.findIndex((r: any) => r.name === routeName);
    if (routeIndex !== -1) {
      const event = navigation.emit({
        type: 'tabPress',
        target: state.routes[routeIndex].key,
        canPreventDefault: true,
      });
      if (currentRouteName !== routeName && !event.defaultPrevented) {
        navigation.navigate(routeName);
      }
    }
  };

  const isHomeFocused = currentRouteName === 'index';
  const isCropsFocused = currentRouteName === 'crops';
  const isOrdersFocused = currentRouteName === 'orders';
  const isMessagesFocused = currentRouteName === 'messages';

  return (
    <View style={styles.outerWrapper} pointerEvents="box-none">
      <View style={[styles.barContainer, { marginBottom: bottomMargin }]}>
        {/* Tab 1: Home */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigateTab('index')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={isHomeFocused ? 'home' : 'home-outline'}
            size={22}
            color={isHomeFocused ? '#FFFFFF' : '#88A38E'}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: isHomeFocused ? '#FFFFFF' : '#88A38E', fontWeight: isHomeFocused ? '700' : '500' },
            ]}
          >
            Home
          </Text>
          {/* Orange active indicator dash */}
          <View
            style={[
              styles.activeIndicator,
              { backgroundColor: isHomeFocused ? '#E57338' : 'transparent' },
            ]}
          />
        </TouchableOpacity>

        {/* Tab 2: Crops */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigateTab('crops')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="sprout"
            size={20}
            color={isCropsFocused ? '#FFFFFF' : '#88A38E'}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: isCropsFocused ? '#FFFFFF' : '#88A38E', fontWeight: isCropsFocused ? '700' : '500' },
            ]}
          >
            Crops
          </Text>
          <View
            style={[
              styles.activeIndicator,
              { backgroundColor: isCropsFocused ? '#E57338' : 'transparent' },
            ]}
          />
        </TouchableOpacity>

        {/* Center Floating Plus (+) Action Button */}
        <View style={styles.centerButtonWrapper}>
          <TouchableOpacity
            style={styles.plusButton}
            onPress={onAddPress}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={26} color="#18361F" />
          </TouchableOpacity>
        </View>

        {/* Tab 3: Orders (with badge '2') */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigateTab('orders')}
          activeOpacity={0.7}
        >
          <View style={styles.iconWithBadge}>
            <MaterialCommunityIcons
              name={isOrdersFocused ? 'basket' : 'basket-outline'}
              size={20}
              color={isOrdersFocused ? '#FFFFFF' : '#88A38E'}
            />
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </View>
          <Text
            style={[
              styles.tabLabel,
              { color: isOrdersFocused ? '#FFFFFF' : '#88A38E', fontWeight: isOrdersFocused ? '700' : '500' },
            ]}
          >
            Orders
          </Text>
          <View
            style={[
              styles.activeIndicator,
              { backgroundColor: isOrdersFocused ? '#E57338' : 'transparent' },
            ]}
          />
        </TouchableOpacity>

        {/* Tab 4: Messages (with badge '1') */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigateTab('messages')}
          activeOpacity={0.7}
        >
          <View style={styles.iconWithBadge}>
            <MaterialCommunityIcons
              name={isMessagesFocused ? 'chat' : 'chat-outline'}
              size={20}
              color={isMessagesFocused ? '#FFFFFF' : '#88A38E'}
            />
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>1</Text>
            </View>
          </View>
          <Text
            style={[
              styles.tabLabel,
              { color: isMessagesFocused ? '#FFFFFF' : '#88A38E', fontWeight: isMessagesFocused ? '700' : '500' },
            ]}
          >
            Messages
          </Text>
          <View
            style={[
              styles.activeIndicator,
              { backgroundColor: isMessagesFocused ? '#E57338' : 'transparent' },
            ]}
          />
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
    backgroundColor: '#183821', // Dark curved pill matching screenshot
    width: '92%',
    height: 64,
    borderRadius: 34,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },
  iconWithBadge: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePill: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: '#E86629', // Orange notification pill badge
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  activeIndicator: {
    width: 14,
    height: 3,
    borderRadius: 1.5,
    marginTop: 2,
  },
  centerButtonWrapper: {
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#A6CFA8', // Soft sage/mint circle
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
