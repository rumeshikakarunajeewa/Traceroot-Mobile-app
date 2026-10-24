import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface BuyerTraceabilityCardProps {
  onOpenScanner: () => void;
}

export const BuyerTraceabilityCard: React.FC<BuyerTraceabilityCardProps> = ({
  onOpenScanner,
}) => {
  return (
    <View style={styles.cardContainer}>
      {/* Decorative Organic Background Watermark Rings */}
      <View style={styles.decorativeRingOuter} />
      <View style={styles.decorativeRingInner} />

      <View style={styles.content}>
        {/* Top Header Row with Icon and Title */}
        <View style={styles.headerRow}>
          <View style={styles.iconBadge}>
            <MaterialCommunityIcons name="qrcode-scan" size={20} color="#18311B" />
          </View>
          <Text style={styles.title}>Scan QR Traceability</Text>
        </View>

        {/* Descriptive Text */}
        <Text style={styles.description}>
          Scan any TraceRoot QR code to instantly view a crop's complete cultivation
          journey and evidence.
        </Text>

        {/* Action Pill Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onOpenScanner}
          style={styles.openButton}
        >
          <Text style={styles.openButtonText}>Open Scanner</Text>
          <MaterialCommunityIcons
            name="arrow-top-right"
            size={16}
            color="#18311B"
            style={styles.arrowIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 24,
    backgroundColor: '#1E3523',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  decorativeRingOuter: {
    position: 'absolute',
    right: -30,
    bottom: -40,
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 28,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  decorativeRingInner: {
    position: 'absolute',
    right: 0,
    bottom: -10,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  content: {
    padding: 20,
    zIndex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#A6C0A1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#C4D8C1',
    marginBottom: 16,
    maxWidth: '85%',
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  openButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18311B',
  },
  arrowIcon: {
    marginLeft: 4,
  },
});
