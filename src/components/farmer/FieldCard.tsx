import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { FieldItem } from '../../types/farmer.types';

interface FieldCardProps {
  field: FieldItem;
  onPress: () => void;
  onChangePhotoPress: () => void;
  onBookmarkPress?: () => void;
}

export const FieldCard: React.FC<FieldCardProps> = ({
  field,
  onPress,
  onChangePhotoPress,
  onBookmarkPress,
}) => {
  const cardScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(cardScale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(cardScale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const isHarvestSoon = field.statusBadge === 'Harvest soon';

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: cardScale }] }]}>
      <TouchableOpacity
        style={styles.cardContainer}
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        {/* Top Half: Photo with badges */}
        <View style={styles.imageContainer}>
          {field.imageUrl ? (
            <Image source={{ uri: field.imageUrl }} style={styles.fieldImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderEmoji}>{field.cropEmoji}</Text>
              <Text style={styles.placeholderText}>Add photo</Text>
            </View>
          )}

          {/* Top-Right Bookmark & Camera change photo pills */}
          <View style={styles.topActionsRow}>
            {/* Camera / Edit photo button */}
            <TouchableOpacity
              style={styles.photoEditBtn}
              activeOpacity={0.8}
              onPress={onChangePhotoPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="camera" size={13} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Bookmark button */}
            <TouchableOpacity
              style={styles.bookmarkBtn}
              activeOpacity={0.8}
              onPress={onBookmarkPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <FontAwesome name="bookmark-o" size={13} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Bottom Growth percentage pill */}
          <View style={styles.growthBadge}>
            <Text style={styles.growthBadgeText}>🌿 {field.growthPercentage}% grown</Text>
          </View>
        </View>

        {/* Bottom Half: Field Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.cropTitle} numberOfLines={1}>
            {field.cropName}
          </Text>

          <Text style={styles.plotSubtitle} numberOfLines={1}>
            {field.plotName}
          </Text>

          <View style={styles.footerRow}>
            {/* Status Pill */}
            <View
              style={[
                styles.statusPill,
                isHarvestSoon ? styles.harvestSoonPill : styles.healthyPill,
              ]}
            >
              <Text
                style={[
                  styles.statusPillText,
                  isHarvestSoon ? styles.harvestSoonText : styles.healthyText,
                ]}
              >
                {field.statusBadge}
              </Text>
            </View>

            {/* Navigation Arrow Circle Button */}
            <View style={styles.arrowCircle}>
              <Feather name="arrow-up-right" size={14} color="#D6EBD9" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    width: 216,
    marginRight: 14,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1.2,
    borderColor: '#ECEAE2',
  },
  imageContainer: {
    width: '100%',
    height: 136,
    position: 'relative',
    backgroundColor: '#EAE6DD',
  },
  fieldImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3EFE6',
  },
  placeholderEmoji: {
    fontSize: 34,
    marginBottom: 4,
  },
  placeholderText: {
    fontSize: 12,
    color: '#657E6B',
    fontWeight: '600',
  },
  topActionsRow: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    gap: 6,
  },
  bookmarkBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(28, 56, 34, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  photoEditBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(28, 56, 34, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  growthBadge: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    backgroundColor: 'rgba(18, 38, 22, 0.72)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  growthBadgeText: {
    color: '#E8F5E9',
    fontSize: 10,
    fontWeight: '700',
  },
  detailsContainer: {
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  cropTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#15321B',
    marginBottom: 3,
  },
  plotSubtitle: {
    fontSize: 12,
    color: '#6B8270',
    fontWeight: '500',
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  healthyPill: {
    backgroundColor: '#E8F5E9',
  },
  healthyText: {
    color: '#286A36',
    fontSize: 11,
    fontWeight: '700',
  },
  harvestSoonPill: {
    backgroundColor: '#FFF2E8',
  },
  harvestSoonText: {
    color: '#C75D1E',
    fontSize: 11,
    fontWeight: '700',
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E3C25',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
