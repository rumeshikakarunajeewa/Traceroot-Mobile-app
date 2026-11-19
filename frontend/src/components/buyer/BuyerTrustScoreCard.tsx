import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';

interface BuyerTrustScoreCardProps {
  score?: number;
  label?: string;
  detail?: string;
  isDark?: boolean;
  onPress?: () => void;
}

export const BuyerTrustScoreCard: React.FC<BuyerTrustScoreCardProps> = ({
  score = 96,
  label = 'Exemplary',
  detail = 'Payments settled on time • 142 orders',
  isDark = false,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      style={[
        styles.container,
        isDark && styles.containerDark,
      ]}
    >
      {/* Circular Trust Score Ring */}
      <View style={[styles.scoreCircle, isDark && styles.scoreCircleDark]}>
        <Text style={[styles.scoreValue, isDark && styles.scoreValueDark]}>{score}</Text>
      </View>

      {/* Trust Details Column */}
      <View style={styles.detailsColumn}>
        <Text style={[styles.trustTag, isDark && styles.trustTagDark]}>Trust score</Text>
        <Text style={[styles.trustHeadline, isDark && styles.trustHeadlineDark]}>{label}</Text>
        <Text style={[styles.trustDetail, isDark && styles.trustDetailDark]}>{detail}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#16301A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: '#ECE8DF',
  },
  containerDark: {
    backgroundColor: '#1B2A1F',
    borderColor: '#293E2E',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
  },
  scoreCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 3,
    borderColor: '#26482B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    backgroundColor: '#FAF8F4',
  },
  scoreCircleDark: {
    backgroundColor: '#132116',
    borderColor: '#34D399',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16301A',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  scoreValueDark: {
    color: '#FFFFFF',
  },
  detailsColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  trustTag: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9C6237', // Warm amber
    letterSpacing: 0.2,
    marginBottom: 1,
  },
  trustTagDark: {
    color: '#FBBF24',
  },
  trustHeadline: {
    fontSize: 17,
    fontWeight: '700',
    color: '#16301A',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  trustHeadlineDark: {
    color: '#FFFFFF',
  },
  trustDetail: {
    fontSize: 12,
    color: '#6E8070',
    fontWeight: '400',
  },
  trustDetailDark: {
    color: '#A0B7A4',
  },
});
