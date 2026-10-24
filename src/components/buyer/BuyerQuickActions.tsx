import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { QuickActionItem } from '../../types/buyer.types';

interface BuyerQuickActionsProps {
  actions: QuickActionItem[];
  onActionPress: (action: QuickActionItem) => void;
}

export const BuyerQuickActions: React.FC<BuyerQuickActionsProps> = ({
  actions,
  onActionPress,
}) => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.gridRow}>
        {actions.map((action) => {
          const isActive = !!action.isActive;
          return (
            <TouchableOpacity
              key={action.id}
              activeOpacity={0.85}
              style={[
                styles.actionCard,
                isActive ? styles.activeCard : styles.inactiveCard,
              ]}
              onPress={() => onActionPress(action)}
            >
              <View
                style={[
                  styles.iconContainer,
                  isActive ? styles.activeIconContainer : styles.inactiveIconContainer,
                ]}
              >
                <MaterialCommunityIcons
                  name={action.iconName as any}
                  size={24}
                  color={isActive ? '#FFFFFF' : '#2A5531'}
                />
              </View>
              <Text
                style={[
                  styles.actionLabel,
                  isActive ? styles.activeLabel : styles.inactiveLabel,
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
    // Completely remove box shadow for the active/pressed card
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  inactiveCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE7DC',
    // Extremely subtle, soft ambient light without harsh box edges
    shadowColor: '#1B3220',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  activeIconContainer: {
    backgroundColor: 'transparent',
  },
  inactiveIconContainer: {
    backgroundColor: 'transparent',
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
});
