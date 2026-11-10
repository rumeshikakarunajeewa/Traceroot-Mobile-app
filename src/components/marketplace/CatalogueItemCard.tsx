import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';

export interface CatalogueItemCardProps {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  unit: string;
  stockQty: number;
  supplierName: string;
  imageUrl?: string;
  onPress: (id: string) => void;
}

export const CatalogueItemCard: React.FC<CatalogueItemCardProps> = ({
  id,
  name,
  category,
  price,
  currency,
  unit,
  stockQty,
  supplierName,
  imageUrl,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(id)}
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${currency} ${price} per ${unit}`}
    >
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <MaterialCommunityIcons name="package-variant-closed" size={24} color="#8A9E8D" />
          </View>
        )}
      </View>

      <View style={styles.details}>
        <View style={styles.categoryRow}>
          <Text style={styles.categoryBadge}>{category}</Text>
          <Text style={styles.stockText}>{stockQty > 0 ? `${stockQty} in stock` : 'Out of stock'}</Text>
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.supplierText} numberOfLines={1}>
          By {supplierName}
        </Text>

        <View style={styles.bottomRow}>
          <Text style={styles.priceText}>
            {currency} {price}
            <Text style={styles.unitText}>/{unit}</Text>
          </Text>
          <View style={styles.addButton}>
            <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default CatalogueItemCard;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#ECE8DF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  imageContainer: {
    width: 74,
    height: 74,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F0ECE1',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#284E34',
    textTransform: 'uppercase',
  },
  stockText: {
    fontSize: 10.5,
    color: '#6A7B6B',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.buyer.textDark,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  supplierText: {
    fontSize: 11.5,
    color: '#6A7B6B',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.buyer.textDark,
  },
  unitText: {
    fontSize: 11,
    color: '#6A7B6B',
    fontWeight: '400',
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.buyer.forestDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
