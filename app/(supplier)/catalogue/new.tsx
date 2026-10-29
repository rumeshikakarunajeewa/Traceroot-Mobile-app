import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { addCatalogueProduct } from '../../../src/store/supplierCatalogueStore';
import { useDarkMode } from '../../../src/store/uiStore';
import { useLanguage } from '../../../src/i18n/languageStore';
import { CatalogueProduct } from '../../../src/types/supplier.types';

type CategoryType = 'Seeds' | 'Fertilizers' | 'Pesticides' | 'Compost';

interface CategoryOption {
  key: CategoryType;
  label: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  { key: 'Seeds', label: 'Seeds', iconName: 'seed-outline' },
  { key: 'Fertilizers', label: 'Fertilizers', iconName: 'water-outline' },
  { key: 'Pesticides', label: 'Pesticides', iconName: 'leaf' },
  { key: 'Compost', label: 'Compost', iconName: 'sprout-outline' },
];

const UNIT_OPTIONS = ['kg', 'g', 'L', 'mL', 'pack'];
const SUITABLE_CROPS = ['Tomato', 'Rice', 'Onion', 'Chilli', 'Cabbage', 'Any'];

const DEFAULT_SEED_IMAGE = require('../../../assets/images/supplier_seed_sack.jpg');

export default function SupplierNewProductScreen() {
  const [isDark] = useDarkMode();
  const { t } = useLanguage();

  const getCategoryLabel = (cat: CategoryType) => {
    switch (cat) {
      case 'Seeds':
        return t('catSeeds');
      case 'Fertilizers':
        return t('catFertilizers');
      case 'Pesticides':
        return t('catPesticides');
      case 'Compost':
        return t('catCompost');
      default:
        return cat;
    }
  };

  const getCropLabel = (crop: string) => {
    switch (crop) {
      case 'Tomato':
        return t('cropTomato');
      case 'Rice':
        return t('cropRice');
      case 'Onion':
        return t('cropOnion');
      case 'Chilli':
        return t('cropChilli');
      case 'Cabbage':
        return t('cropCabbage');
      case 'Any':
        return t('cropAny');
      default:
        return crop;
    }
  };

  // Form State
  const [category, setCategory] = useState<CategoryType>('Seeds');
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState('kg');
  const [description, setDescription] = useState('');
  const [suitableFor, setSuitableFor] = useState<string[]>(['Tomato']);
  const [isOrganicCertified, setIsOrganicCertified] = useState(true);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Success State View
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Dynamic progress calculation matching Figma badge (25% default -> 100%)
  const progressPercent = useMemo(() => {
    let score = 25; // Base starting progress
    if (productName.trim().length > 0) score += 20;
    if (price.trim().length > 0 && Number(price) > 0) score += 15;
    if (stock.trim().length > 0 && Number(stock) > 0) score += 15;
    if (description.trim().length > 0) score += 15;
    if (photoUri) score += 10;
    return Math.min(score, 100);
  }, [productName, price, stock, description, photoUri]);

  // Handle Photo Picker
  const handlePhotoPress = () => {
    Alert.alert(
      'Upload Product Photo',
      'Choose a photo from your gallery or take a new one.',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            try {
              const perm = await ImagePicker.requestCameraPermissionsAsync();
              if (!perm.granted) {
                Alert.alert(
                  'Permission Required',
                  'Camera permission is required to capture product photos.'
                );
                return;
              }
              const res = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.85,
              });
              if (!res.canceled && res.assets && res.assets[0]?.uri) {
                setPhotoUri(res.assets[0].uri);
              }
            } catch (err) {
              console.error('Error opening camera:', err);
            }
          },
        },
        {
          text: 'Choose from Library',
          onPress: async () => {
            try {
              const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!perm.granted) {
                Alert.alert(
                  'Permission Required',
                  'Media library permission is required to select photos.'
                );
                return;
              }
              const res = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.85,
              });
              if (!res.canceled && res.assets && res.assets[0]?.uri) {
                setPhotoUri(res.assets[0].uri);
              }
            } catch (err) {
              console.error('Error selecting photo:', err);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Toggle crop chips
  const toggleCrop = (crop: string) => {
    if (crop === 'Any') {
      setSuitableFor(['Any']);
      return;
    }

    if (suitableFor.includes('Any')) {
      setSuitableFor([crop]);
      return;
    }

    if (suitableFor.includes(crop)) {
      if (suitableFor.length > 1) {
        setSuitableFor(suitableFor.filter((c) => c !== crop));
      }
    } else {
      setSuitableFor([...suitableFor, crop]);
    }
  };

  // Publish Product to Catalogue
  const handlePublish = () => {
    const trimmedTitle = productName.trim() || 'Hybrid Tomato Seeds';
    const parsedPrice = price.trim() ? Math.max(0, parseFloat(price)) : 850;
    const parsedStock = stock.trim() ? Math.max(0, parseInt(stock, 10)) : 50;

    const newProduct: CatalogueProduct = {
      id: `cat-${Date.now()}`,
      title: trimmedTitle,
      category,
      packageSize: `1 ${unit} pack`,
      price: parsedPrice,
      currency: 'LKR',
      stock: parsedStock,
      maxStock: Math.max(parsedStock * 2, 100),
      isLowStock: parsedStock < 10,
      imageUrl: photoUri ? { uri: photoUri } : DEFAULT_SEED_IMAGE,
      soldPer: unit,
      description: description.trim(),
      suitableFor,
      isOrganicCertified,
    };

    addCatalogueProduct(newProduct);
    setIsSubmitted(true);
  };

  // Reset form for "Add another"
  const handleAddAnother = () => {
    setProductName('');
    setPrice('');
    setStock('');
    setDescription('');
    setPhotoUri(null);
    setCategory('Seeds');
    setUnit('kg');
    setSuitableFor(['Tomato']);
    setIsOrganicCertified(true);
    setIsSubmitted(false);
  };

  // Done button handler
  const handleDone = () => {
    router.replace('/(supplier)/catalogue');
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, isDark && styles.safeAreaDark]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Screen 2: SUCCESS VIEW ("Planted in your catalogue") */}
      {isSubmitted ? (
        <View style={styles.successWrapper}>
          <View style={styles.successContent}>
            {/* Green Checkmark Circle */}
            <View style={styles.successCheckCircle}>
              <MaterialCommunityIcons name="check" size={48} color="#FFFFFF" />
            </View>

            {/* Title */}
            <Text style={[styles.successTitle, isDark && styles.successTitleDark]}>
              {t('plantedInYour')}{' '}
              <Text style={styles.successTitleItalic}>{t('catalogueItalic')}</Text>
            </Text>

            {/* Subtitle */}
            <Text
              style={[
                styles.successSubtitle,
                isDark && styles.successSubtitleDark,
              ]}
            >
              {t('visibleToFarmersGrowing')}{' '}
              {suitableFor.includes('Any')
                ? t('cropAny')
                : suitableFor.map(getCropLabel).join(', ')}
              .
            </Text>

            {/* Action Buttons Row */}
            <View style={styles.successButtonRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleAddAnother}
                style={[
                  styles.addAnotherButton,
                  isDark && styles.addAnotherButtonDark,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('addAnotherBtn')}
              >
                <Text
                  style={[
                    styles.addAnotherButtonText,
                    isDark && styles.addAnotherButtonTextDark,
                  ]}
                >
                  {t('addAnotherBtn')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleDone}
                style={[styles.doneButton, isDark && styles.doneButtonDark]}
                accessibilityRole="button"
                accessibilityLabel={t('doneBtn')}
              >
                <Text style={styles.doneButtonText}>{t('doneBtn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        /* Screen 1: ADD PRODUCT FORM VIEW */
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header: Back Button, Title with highlight, Progress pill */}
            <View style={styles.headerRow}>
              {/* Circular Back Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.back()}
                style={[styles.backCircle, isDark && styles.backCircleDark]}
                accessibilityRole="button"
                accessibilityLabel="Back to Catalogue"
              >
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={24}
                  color={isDark ? '#E5EFE7' : '#2C402E'}
                />
              </TouchableOpacity>

              {/* Title Block */}
              <View style={styles.titleBlock}>
                <View style={styles.newListingBadgeRow}>
                  <Text
                    style={[
                      styles.newListingText,
                      isDark && styles.newListingTextDark,
                    ]}
                  >
                    {t('newListingBadge')}
                  </Text>
                </View>

                <View style={styles.headingRow}>
                  <Text
                    style={[
                      styles.headingAddText,
                      isDark && styles.headingAddTextDark,
                    ]}
                  >
                    {t('addProductTitleAdd')}{' '}
                  </Text>
                  <View
                    style={[
                      styles.headingHighlight,
                      isDark && styles.headingHighlightDark,
                    ]}
                  >
                    <Text
                      style={[
                        styles.headingProductText,
                        isDark && styles.headingProductTextDark,
                      ]}
                    >
                      {t('addProductTitleProduct')}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Completion Progress Badge */}
              <View
                style={[styles.progressPill, isDark && styles.progressPillDark]}
              >
                <Text
                  style={[
                    styles.progressText,
                    isDark && styles.progressTextDark,
                  ]}
                >
                  {progressPercent}%
                </Text>
              </View>
            </View>

            {/* Live Farmer Preview Card */}
            <View style={styles.previewCardContainer}>
              <Image
                source={photoUri ? { uri: photoUri } : DEFAULT_SEED_IMAGE}
                style={styles.previewImage}
                resizeMode="cover"
              />

              {/* Gradient Overlays */}
              <LinearGradient
                colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(12,28,16,0.92)']}
                style={styles.gradientOverlay}
              />

              {/* Top Row: Category glass badge & Photo picker button */}
              <View style={styles.previewTopRow}>
                <View style={styles.categoryGlassBadge}>
                  <MaterialCommunityIcons
                    name={
                      category === 'Seeds'
                        ? 'seed-outline'
                        : category === 'Fertilizers'
                        ? 'water-outline'
                        : category === 'Pesticides'
                        ? 'leaf'
                        : 'sprout-outline'
                    }
                    size={14}
                    color="#FFFFFF"
                    style={{ marginRight: 5 }}
                  />
                  <Text style={styles.categoryGlassText}>
                    {getCategoryLabel(category)}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handlePhotoPress}
                  style={styles.photoButton}
                  accessibilityRole="button"
                  accessibilityLabel="Upload or take photo"
                >
                  <MaterialCommunityIcons
                    name="camera-outline"
                    size={16}
                    color="#2C402E"
                  />
                  <Text style={styles.photoButtonText}>
                    {t('photoButtonText')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Bottom Info: Live Farmer View */}
              <View style={styles.previewBottomInfo}>
                <Text style={styles.previewCaption}>
                  {t('previewAsFarmersSeeIt')}
                </Text>
                <Text style={styles.previewProductName} numberOfLines={1}>
                  {productName.trim() || t('defaultProductName')}
                </Text>

                <View style={styles.previewMetricsRow}>
                  <View style={styles.priceContainer}>
                    <Text style={styles.previewCurrencyText}>LKR </Text>
                    <Text style={styles.previewPriceNumber}>
                      {price.trim() ? Number(price).toLocaleString() : '0'}
                    </Text>
                    <Text style={styles.previewUnitText}> / {unit}</Text>
                  </View>

                  <View style={styles.stockStatusContainer}>
                    <View style={styles.stockProgressBarBg}>
                      <View
                        style={[
                          styles.stockProgressBarFill,
                          {
                            width: `${Math.min(
                              100,
                              Math.max(10, parseInt(stock || '0', 10))
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.stockStatusText}>
                      {stock.trim() ? stock : '0'} {t('unitsInStock')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Category Selector Section */}
            <View style={styles.sectionContainer}>
              <Text
                style={[
                  styles.sectionTitle,
                  isDark && styles.sectionTitleDark,
                ]}
              >
                {t('categoryLabel')}
              </Text>

              <View style={styles.categoryCardsRow}>
                {CATEGORY_OPTIONS.map((item) => {
                  const isSelected = category === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      activeOpacity={0.85}
                      onPress={() => setCategory(item.key)}
                      style={[
                        styles.categoryCard,
                        isSelected
                          ? isDark
                            ? styles.categoryCardSelectedDark
                            : styles.categoryCardSelected
                          : isDark
                          ? styles.categoryCardUnselectedDark
                          : styles.categoryCardUnselected,
                      ]}
                      accessibilityRole="button"
                      accessibilityState={isSelected ? { selected: true } : {}}
                      accessibilityLabel={`Category ${getCategoryLabel(item.key)}`}
                    >
                      <View
                        style={[
                          styles.categoryIconCircle,
                          isSelected
                            ? isDark
                              ? styles.categoryIconCircleSelectedDark
                              : styles.categoryIconCircleSelected
                            : isDark
                            ? styles.categoryIconCircleUnselectedDark
                            : styles.categoryIconCircleUnselected,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={item.iconName}
                          size={22}
                          color={
                            isSelected
                              ? '#D8E8D5'
                              : isDark
                              ? '#97B69B'
                              : '#355A3B'
                          }
                        />
                      </View>
                      <Text
                        style={[
                          styles.categoryCardLabel,
                          isSelected
                            ? styles.categoryCardLabelSelected
                            : isDark
                            ? styles.categoryCardLabelUnselectedDark
                            : styles.categoryCardLabelUnselected,
                        ]}
                      >
                        {getCategoryLabel(item.key)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Product Details Form Card */}
            <View style={[styles.formCard, isDark && styles.formCardDark]}>
              {/* Product Name */}
              <View style={styles.fieldGroup}>
                <Text
                  style={[
                    styles.fieldLabel,
                    isDark && styles.fieldLabelDark,
                  ]}
                >
                  {t('productNameLabel')}
                </Text>
                <TextInput
                  value={productName}
                  onChangeText={setProductName}
                  placeholder={t('productNamePlaceholder')}
                  placeholderTextColor={isDark ? '#6E8572' : '#9E9A8E'}
                  style={[
                    styles.textInput,
                    isDark && styles.textInputDark,
                  ]}
                />
              </View>

              {/* Price & Stock in Two Columns */}
              <View style={styles.twoColumnRow}>
                <View style={styles.columnField}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      isDark && styles.fieldLabelDark,
                    ]}
                  >
                    {t('priceLabel')}
                  </Text>
                  <TextInput
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={isDark ? '#6E8572' : '#9E9A8E'}
                    style={[
                      styles.textInput,
                      isDark && styles.textInputDark,
                    ]}
                  />
                </View>

                <View style={styles.columnField}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      isDark && styles.fieldLabelDark,
                    ]}
                  >
                    {t('stockLabel')}
                  </Text>
                  <TextInput
                    value={stock}
                    onChangeText={setStock}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={isDark ? '#6E8572' : '#9E9A8E'}
                    style={[
                      styles.textInput,
                      isDark && styles.textInputDark,
                    ]}
                  />
                </View>
              </View>

              {/* Sold per unit selector */}
              <View style={styles.fieldGroup}>
                <Text
                  style={[
                    styles.fieldLabel,
                    isDark && styles.fieldLabelDark,
                  ]}
                >
                  {t('soldPerLabel')}
                </Text>
                <View
                  style={[
                    styles.unitSegmentedContainer,
                    isDark && styles.unitSegmentedContainerDark,
                  ]}
                >
                  {UNIT_OPTIONS.map((opt) => {
                    const isUnitSelected = unit === opt;
                    return (
                      <TouchableOpacity
                        key={opt}
                        activeOpacity={0.8}
                        onPress={() => setUnit(opt)}
                        style={[
                          styles.unitPill,
                          isUnitSelected &&
                            (isDark
                              ? styles.unitPillActiveDark
                              : styles.unitPillActive),
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Unit ${opt}`}
                      >
                        <Text
                          style={[
                            styles.unitPillText,
                            isUnitSelected
                              ? styles.unitPillTextActive
                              : isDark
                              ? styles.unitPillTextInactiveDark
                              : styles.unitPillTextInactive,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Description */}
              <View style={styles.fieldGroup}>
                <Text
                  style={[
                    styles.fieldLabel,
                    isDark && styles.fieldLabelDark,
                  ]}
                >
                  {t('descriptionLabel')}
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholder={t('descriptionPlaceholder')}
                  placeholderTextColor={isDark ? '#6E8572' : '#9E9A8E'}
                  style={[
                    styles.textInput,
                    styles.textArea,
                    isDark && styles.textInputDark,
                  ]}
                />
              </View>
            </View>

            {/* Suitable For Section */}
            <View style={styles.sectionContainer}>
              <Text
                style={[
                  styles.sectionTitle,
                  isDark && styles.sectionTitleDark,
                ]}
              >
                {t('suitableForLabel')}
              </Text>

              <View style={styles.cropChipsWrapper}>
                {SUITABLE_CROPS.map((crop) => {
                  const isCropSelected = suitableFor.includes(crop);
                  return (
                    <TouchableOpacity
                      key={crop}
                      activeOpacity={0.8}
                      onPress={() => toggleCrop(crop)}
                      style={[
                        styles.cropChip,
                        isCropSelected
                          ? isDark
                            ? styles.cropChipSelectedDark
                            : styles.cropChipSelected
                          : isDark
                          ? styles.cropChipUnselectedDark
                          : styles.cropChipUnselected,
                      ]}
                      accessibilityRole="button"
                      accessibilityState={
                        isCropSelected ? { selected: true } : {}
                      }
                      accessibilityLabel={`Suitable for ${getCropLabel(crop)}`}
                    >
                      <Text
                        style={[
                          styles.cropChipText,
                          isCropSelected
                            ? styles.cropChipTextSelected
                            : isDark
                            ? styles.cropChipTextUnselectedDark
                            : styles.cropChipTextUnselected,
                        ]}
                      >
                        {getCropLabel(crop)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Organic Certified Toggle Card */}
            <View
              style={[
                styles.organicCard,
                isDark && styles.organicCardDark,
              ]}
            >
              <View style={styles.organicLeftRow}>
                <View
                  style={[
                    styles.organicShieldCircle,
                    isDark && styles.organicShieldCircleDark,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="shield-check-outline"
                    size={22}
                    color={isDark ? '#8FD697' : '#395E3F'}
                  />
                </View>
                <View style={styles.organicTextContainer}>
                  <Text
                    style={[
                      styles.organicTitle,
                      isDark && styles.organicTitleDark,
                    ]}
                  >
                    {t('organicCertifiedTitle')}
                  </Text>
                  <Text
                    style={[
                      styles.organicSubtitle,
                      isDark && styles.organicSubtitleDark,
                    ]}
                  >
                    {t('organicCertifiedSubtitle')}
                  </Text>
                </View>
              </View>

              <Switch
                value={isOrganicCertified}
                onValueChange={setIsOrganicCertified}
                trackColor={{
                  false: isDark ? '#2D3F30' : '#D4CDC0',
                  true: isDark ? '#467A4D' : '#426340',
                }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={isDark ? '#2D3F30' : '#D4CDC0'}
              />
            </View>

            {/* Publish Action Button */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handlePublish}
              style={[
                styles.publishButton,
                isDark && styles.publishButtonDark,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('publishToCatalogueBtn')}
            >
              <MaterialCommunityIcons
                name="sprout"
                size={22}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.publishButtonText}>
                {t('publishToCatalogueBtn')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const serifFont = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F2EB', // Warm natural linen cream matching Figma
  },
  safeAreaDark: {
    backgroundColor: '#0E1710',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 130, // Clearance for bottom navigation tab bar
  },

  /* HEADER */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 4,
  },
  backCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E4DA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  backCircleDark: {
    backgroundColor: '#16271A',
    borderColor: '#263D2B',
  },
  titleBlock: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  newListingBadgeRow: {
    marginBottom: 2,
  },
  newListingText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#556E58',
    letterSpacing: 0.2,
  },
  newListingTextDark: {
    color: '#9CB39F',
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headingAddText: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: serifFont,
    color: '#1C3723',
    letterSpacing: -0.3,
  },
  headingAddTextDark: {
    color: '#F0F5F1',
  },
  headingHighlight: {
    backgroundColor: '#D7E5D4',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  headingHighlightDark: {
    backgroundColor: '#26442C',
  },
  headingProductText: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: serifFont,
    color: '#1C3723',
    letterSpacing: -0.3,
  },
  headingProductTextDark: {
    color: '#D4E8D7',
  },
  progressPill: {
    backgroundColor: '#E0ECE0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  progressPillDark: {
    backgroundColor: '#1E3823',
  },
  progressText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#335C38',
  },
  progressTextDark: {
    color: '#9BD6A4',
  },

  /* FARMER PREVIEW CARD */
  previewCardContainer: {
    height: 220,
    borderRadius: 26,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
    backgroundColor: '#1C3723',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  previewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 2,
  },
  categoryGlassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  categoryGlassText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6.5,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  photoButtonText: {
    color: '#2C402E',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 5,
  },
  previewBottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingBottom: 16,
    zIndex: 2,
  },
  previewCaption: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 11.5,
    fontWeight: '500',
    marginBottom: 2,
    letterSpacing: 0.1,
  },
  previewProductName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: serifFont,
    letterSpacing: -0.3,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowRadius: 3,
  },
  previewMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  previewCurrencyText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: serifFont,
  },
  previewPriceNumber: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
    fontFamily: serifFont,
  },
  previewUnitText: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 12.5,
    fontWeight: '500',
  },
  stockStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockProgressBarBg: {
    width: 68,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    overflow: 'hidden',
  },
  stockProgressBarFill: {
    height: '100%',
    backgroundColor: '#86EFAC',
    borderRadius: 2,
  },
  stockStatusText: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 11.5,
    fontWeight: '600',
  },

  /* CATEGORY SECTION */
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#4B614E',
    marginBottom: 10,
    letterSpacing: 0.1,
  },
  sectionTitleDark: {
    color: '#95AB98',
  },
  categoryCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryCard: {
    flex: 1,
    minHeight: 90,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  categoryCardSelected: {
    backgroundColor: '#1C3723',
    shadowColor: '#1C3723',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  categoryCardSelectedDark: {
    backgroundColor: '#203D28',
    borderColor: '#376241',
    borderWidth: 1,
  },
  categoryCardUnselected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE6D9',
  },
  categoryCardUnselectedDark: {
    backgroundColor: '#16271A',
    borderColor: '#263D2B',
    borderWidth: 1,
  },
  categoryIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryIconCircleSelected: {
    backgroundColor: '#2A4D33',
  },
  categoryIconCircleSelectedDark: {
    backgroundColor: '#2F5739',
  },
  categoryIconCircleUnselected: {
    backgroundColor: '#E6EFE4',
  },
  categoryIconCircleUnselectedDark: {
    backgroundColor: '#223826',
  },
  categoryCardLabel: {
    fontSize: 12,
    letterSpacing: 0.1,
  },
  categoryCardLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  categoryCardLabelUnselected: {
    color: '#28402D',
    fontWeight: '600',
  },
  categoryCardLabelUnselectedDark: {
    color: '#C6D8C8',
    fontWeight: '600',
  },

  /* FORM CARD */
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECE6D9',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  formCardDark: {
    backgroundColor: '#16271A',
    borderColor: '#263D2B',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B614E',
    marginBottom: 6,
  },
  fieldLabelDark: {
    color: '#95AB98',
  },
  textInput: {
    backgroundColor: '#F5F2EA',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12.5,
    fontSize: 14.5,
    color: '#1C3723',
  },
  textInputDark: {
    backgroundColor: '#101F14',
    color: '#F0F5F1',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  columnField: {
    flex: 1,
  },
  unitSegmentedContainer: {
    backgroundColor: '#F5F2EA',
    borderRadius: 18,
    padding: 3.5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitSegmentedContainerDark: {
    backgroundColor: '#101F14',
  },
  unitPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  unitPillActive: {
    backgroundColor: '#1C3723',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  unitPillActiveDark: {
    backgroundColor: '#274B30',
  },
  unitPillText: {
    fontSize: 13.5,
  },
  unitPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  unitPillTextInactive: {
    color: '#556857',
    fontWeight: '500',
  },
  unitPillTextInactiveDark: {
    color: '#8BA18E',
    fontWeight: '500',
  },
  textArea: {
    minHeight: 90,
    paddingTop: 12,
  },

  /* SUITABLE FOR CHIPS */
  cropChipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cropChip: {
    paddingVertical: 8.5,
    paddingHorizontal: 18,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropChipSelected: {
    backgroundColor: '#426340', // Rich moss green matching Figma
    shadowColor: '#426340',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  cropChipSelectedDark: {
    backgroundColor: '#4D754B',
  },
  cropChipUnselected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFD8CC',
  },
  cropChipUnselectedDark: {
    backgroundColor: '#16271A',
    borderWidth: 1,
    borderColor: '#263D2B',
  },
  cropChipText: {
    fontSize: 13.5,
  },
  cropChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cropChipTextUnselected: {
    color: '#344C36',
    fontWeight: '500',
  },
  cropChipTextUnselectedDark: {
    color: '#B2C6B5',
    fontWeight: '500',
  },

  /* ORGANIC CERTIFIED CARD */
  organicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ECE6D9',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  organicCardDark: {
    backgroundColor: '#16271A',
    borderColor: '#263D2B',
  },
  organicLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  organicShieldCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E7F0E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  organicShieldCircleDark: {
    backgroundColor: '#203925',
  },
  organicTextContainer: {
    flex: 1,
  },
  organicTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C3723',
    marginBottom: 2,
  },
  organicTitleDark: {
    color: '#F0F5F1',
  },
  organicSubtitle: {
    fontSize: 12,
    color: '#6A7D6C',
  },
  organicSubtitleDark: {
    color: '#95A997',
  },

  /* PUBLISH BUTTON */
  publishButton: {
    backgroundColor: '#1C3723',
    borderRadius: 28,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#1C3723',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  publishButtonDark: {
    backgroundColor: '#24472D',
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* SUCCESS VIEW STYLES */
  successWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 80,
  },
  successContent: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
  },
  successCheckCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#4A6B3D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#4A6B3D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: serifFont,
    color: '#1C3723',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  successTitleDark: {
    color: '#F0F5F1',
  },
  successTitleItalic: {
    fontStyle: 'italic',
    color: '#4A6B3D',
  },
  successSubtitle: {
    fontSize: 15.5,
    color: '#6A7D6C',
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 40,
  },
  successSubtitleDark: {
    color: '#9DB3A0',
  },
  successButtonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  addAnotherButton: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F5F2EA',
    borderWidth: 1.5,
    borderColor: '#D8D2C5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAnotherButtonDark: {
    backgroundColor: '#16271A',
    borderColor: '#2E4C35',
  },
  addAnotherButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C3723',
  },
  addAnotherButtonTextDark: {
    color: '#DCE8DE',
  },
  doneButton: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1C3723',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  doneButtonDark: {
    backgroundColor: '#26422C',
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
