import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ImageBackground, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ActiveContractItem } from '../../types/buyer.types';

interface BuyerContractCardProps {
  contract: ActiveContractItem;
  onPress: (contract: ActiveContractItem) => void;
}

export const BuyerContractCard: React.FC<BuyerContractCardProps> = ({
  contract,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress(contract)}
      style={styles.cardContainer}
    >
      {/* Top Banner Image with Overlay */}
      <ImageBackground
        source={{ uri: contract.coverImageUrl }}
        style={styles.headerImage}
        imageStyle={styles.headerImageStyle}
      >
        <View style={styles.imageOverlay} />

        <View style={styles.headerContent}>
          {/* Top Row: Code and Status Pill */}
          <View style={styles.codeRow}>
            <Text style={styles.contractCode}>{contract.code}</Text>
            <View style={styles.statusPill}>
              <View style={styles.greenDot} />
              <Text style={styles.statusText}>{contract.status}</Text>
            </View>
          </View>

          {/* Bottom Crop Name & Quantity */}
          <Text style={styles.cropTitle}>
            {contract.cropName} — {contract.quantityKg} kg
          </Text>
        </View>
      </ImageBackground>

      {/* Card Body */}
      <View style={styles.bodyContent}>
        {/* Farmer and Due Date */}
        <View style={styles.farmerRow}>
          <MaterialCommunityIcons name="account-outline" size={15} color="#6A7B6B" />
          <Text style={styles.farmerText}>
            {contract.farmerName} • {contract.dueDate}
          </Text>
        </View>

        {/* Farming Progress Labels */}
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>Farming progress</Text>
          <Text style={styles.progressPercentage}>
            {contract.progressPercentage}%
          </Text>
        </View>

        {/* Progress Bar Track and Fill */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(Math.max(contract.progressPercentage, 0), 100)}%` },
            ]}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    marginHorizontal: 20,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 0.5,
    borderColor: '#ECE7DD',
  },
  headerImage: {
    width: '100%',
    height: 110,
    justifyContent: 'space-between',
  },
  headerImageStyle: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(12, 30, 16, 0.45)',
  },
  headerContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contractCode: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
    gap: 5,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2E7D32',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16301A',
  },
  cropTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bodyContent: {
    padding: 16,
  },
  farmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  farmerText: {
    fontSize: 12.5,
    color: '#6A7B6B',
    fontWeight: '500',
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12.5,
    color: '#768776',
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16301A',
  },
  progressBarTrack: {
    width: '100%',
    height: 7,
    backgroundColor: '#E2DFD7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#5D7C49', // Olive green progress fill
    borderRadius: 4,
  },
});
