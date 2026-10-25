import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { QuickActionItem } from '../../types/buyer.types';
import { useDarkMode } from '../../store/uiStore';

interface BuyerQuickActionsProps {
  actions: QuickActionItem[];
  onActionPress: (action: QuickActionItem) => void;
}

export const BuyerQuickActions: React.FC<BuyerQuickActionsProps> = ({
  actions,
  onActionPress,
}) => {
  const [isDark] = useDarkMode();

  return (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
        Quick Actions
      </Text>

      <View style={styles.gridRow}>
        {actions.map((action) => {
          const isActive = !!action.isActive;
          return (
            <TouchableOpacity
              key={action.id}
              activeOpacity={0.85}
              style={[
                styles.actionCard,
                isActive
                  ? [styles.activeCard, isDark && styles.activeCardDark]
                  : [styles.inactiveCard, isDark && styles.inactiveCardDark],
              ]}
              onPress={() => onActionPress(action)}
            >
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name={action.iconName as any}
                  size={24}
                  color={isActive ? '#FFFFFF' : isDark ? '#4ADE80' : '#2A5531'}
                />
              </View>
              <Text
                style={[
                  styles.actionLabel,
                  isActive
                    ? styles.activeLabel
                    : [styles.inactiveLabel, isDark && styles.inactiveLabelDark],
                ]}
              >
                {action.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 26,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16301A',
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  sectionTitleDark: {
    color: '#F0F5F1',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionCard: {
    flex: 1,
    height: 86,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  activeCard: {
    backgroundColor: '#203924',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  activeCardDark: {
    backgroundColor: '#2E7D42',
  },
  inactiveCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE7DC',
    shadowColor: '#1B3220',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  inactiveCardDark: {
    backgroundColor: '#18271C',
    borderColor: '#263B2B',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeLabel: {
    color: '#FFFFFF',
  },
  inactiveLabel: {
    color: '#16301A',
  },
  inactiveLabelDark: {
    color: '#F0F5F1',
  },
});
