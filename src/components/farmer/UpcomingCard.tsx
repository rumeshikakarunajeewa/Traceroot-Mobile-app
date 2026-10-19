import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { UpcomingItem } from '../../types/farmer.types';

interface UpcomingCardProps {
  items: UpcomingItem[];
  onItemPress: (item: UpcomingItem) => void;
}

export const UpcomingCard: React.FC<UpcomingCardProps> = ({ items, onItemPress }) => {
  return (
    <View style={styles.cardContainer}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <UpcomingRowItem
            key={item.id}
            item={item}
            isLast={isLast}
            onPress={() => onItemPress(item)}
          />
        );
      })}
    </View>
  );
};

interface UpcomingRowItemProps {
  item: UpcomingItem;
  isLast: boolean;
  onPress: () => void;
}

const UpcomingRowItem: React.FC<UpcomingRowItemProps> = ({ item, isLast, onPress }) => {
  const rowScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(rowScale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(rowScale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.rowWrapper}>
      <Animated.View style={{ transform: [{ scale: rowScale }] }}>
        <TouchableOpacity
          style={styles.itemRow}
          activeOpacity={0.88}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
        >
          {/* Circular Left Icon Avatar */}
          <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
            {item.iconType === 'stage' ? (
              <Ionicons name="leaf-outline" size={17} color={item.iconColor} />
            ) : (
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={item.iconColor} />
            )}
          </View>

          {/* Text labels */}
          <View style={styles.textContainer}>
            <Text style={styles.titleText} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.subtitleText} numberOfLines={1}>
              {item.subtitle}
            </Text>
          </View>

          {/* Right Status Dot (e.g. orange dot for unread message) */}
          {item.dotColor && (
            <View style={[styles.rightDot, { backgroundColor: item.dotColor }]} />
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Row Divider between items */}
      {!isLast && <View style={styles.divider} />}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ECEAE2',
    shadowColor: '#1A3320',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
    paddingVertical: 4,
    marginBottom: 8,
  },
  rowWrapper: {
    width: '100%',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  titleText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#15321B',
    lineHeight: 18,
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#768B7C',
  },
  rightDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F2EC',
    marginHorizontal: 16,
  },
});
