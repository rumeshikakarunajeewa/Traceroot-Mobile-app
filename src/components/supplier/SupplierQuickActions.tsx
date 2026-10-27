import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SupplierQuickActionItem } from '../../types/supplier.types';
import { useDarkMode } from '../../store/uiStore';

interface SupplierQuickActionsProps {
  actions: SupplierQuickActionItem[];
  onActionPress: (action: SupplierQuickActionItem) => void;
}

export const SupplierQuickActions: React.FC<SupplierQuickActionsProps> = ({
  actions,
  onActionPress,
}) => {
  const [isDark] = useDarkMode();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
        Quick Actions
      </Text>

      <View style={styles.actionsRow}>
        {actions.map((action) => {
          const isPrimary = action.isPrimary;

          return (
            <TouchableOpacity
              key={action.id}
              activeOpacity={0.82}
              onPress={() => onActionPress(action)}
              style={[
                styles.actionCard,
                isPrimary
                  ? styles.actionCardPrimary
                  : [
                      styles.actionCardSecondary,
                      isDark && styles.actionCardSecondaryDark,
                    ],
              ]}
              accessibilityRole="button"
              accessibilityLabel={action.title}
            >
              {/* Inner Round Icon Badge */}
              <View
                style={[
                  styles.iconCircle,
                  isPrimary
                    ? styles.iconCirclePrimary
                    : [
                        styles.iconCircleSecondary,
                        isDark && styles.iconCircleSecondaryDark,
                      ],
                ]}
              >
                <MaterialCommunityIcons
                  name={action.iconName as any}
                  size={20}
                  color={
                    isPrimary
                      ? '#FFFFFF'
                      : isDark
                      ? '#A4D6A9'
                      : '#2A4E32'
                  }
                />
              </View>

              {/* Action Label */}
              <Text
                numberOfLines={1}
                style={[
                  styles.actionLabel,
                  isPrimary
                    ? styles.actionLabelPrimary
                    : [
                        styles.actionLabelSecondary,
                        isDark && styles.actionLabelSecondaryDark,
                      ],
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
  container: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#162E1D',
    letterSpacing: 0.2,
    marginBottom: 14,
  },
  sectionTitleDark: {
    color: '#F0F5F1',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionCard: {
    flex: 1,
    height: 94,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  actionCardPrimary: {
    backgroundColor: '#183823', // Deep forest hunter green matching Figma
    shadowColor: '#102A18',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  actionCardSecondary: {
    backgroundColor: '#FAF8F3', // Cream linen white
    borderWidth: 1,
    borderColor: '#ECE7DC',
  },
  actionCardSecondaryDark: {
    backgroundColor: '#18271C',
    borderColor: '#253B2A',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconCirclePrimary: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  iconCircleSecondary: {
    backgroundColor: '#DFE9DE', // Soft sage green circle
  },
  iconCircleSecondaryDark: {
    backgroundColor: '#243A2A',
  },
  actionLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionLabelPrimary: {
    color: '#FFFFFF',
  },
  actionLabelSecondary: {
    color: '#203925',
  },
  actionLabelSecondaryDark: {
    color: '#DCE8DE',
  },
});
