import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSupplierCatalogue, updateCatalogueProduct, removeCatalogueProduct } from '../../../src/store/supplierCatalogueStore';
import { catalogueService } from '../../../src/services/catalogue.service';
import { useDarkMode } from '../../../src/store/uiStore';
import { CatalogueProduct } from '../../../src/types/supplier.types';

const DEFAULT_SEED_IMAGE = require('../../../assets/images/supplier_seed_sack.jpg');
const UNIT_OPTIONS = ['kg', 'g', 'L', 'mL', 'pack'];

export default function SupplierEditProductScreen() {
  const navigation = useNavigation<any>();
  const [isDark] = useDarkMode();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [products] = useSupplierCatalogue();

  const [product, setProduct] = useState<CatalogueProduct | null>(() => {
    return products.find((p) => p.id === id) || null;
  });

  const [title, setTitle] = useState(product?.title || '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [stock, setStock] = useState(product ? String(product.stock) : '');
  const [unit, setUnit] = useState(product?.soldPer || 'kg');
  const [description, setDescription] = useState(product?.description || '');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const found = products.find((p) => p.id === id);
      if (found) {
        setProduct(found);
        setTitle(found.title);
        setPrice(String(found.price));
        setStock(String(found.stock));
        setUnit(found.soldPer || 'kg');
        setDescription(found.description || '');
      } else {
        const live = await catalogueService.getCatalogueProductById(id);
        if (live) {
          setProduct(live);
          setTitle(live.title);
          setPrice(String(live.price));
          setStock(String(live.stock));
          setUnit(live.soldPer || 'kg');
          setDescription(live.description || '');
        }
      }
    }
    load();
  }, [id, products]);

  const handleStockAdjust = (delta: number) => {
    const cur = parseInt(stock, 10) || 0;
    setStock(String(Math.max(0, cur + delta)));
  };

  const handleResetPhoto = () => {
    setPhotoUri(null);
    setPhotoBase64(null);
  };

  const handleBackToCatalogue = () => {
    try {
      navigation.navigate('catalogue/index');
    } catch {
      router.replace('/catalogue' as any);
    }
  };

  const handlePickImage = () => {
    Alert.alert(
      'Change Product Photo',
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
                base64: true,
              });
              if (!res.canceled && res.assets && res.assets[0]?.uri) {
                setPhotoUri(res.assets[0].uri);
                setPhotoBase64(res.assets[0].base64 || null);
              }
            } catch (err) {
              console.error('Error opening camera:', err);
            }
          },
        },
        {
          text: 'Choose from Gallery',
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
                base64: true,
              });
              if (!res.canceled && res.assets && res.assets[0]?.uri) {
                setPhotoUri(res.assets[0].uri);
                setPhotoBase64(res.assets[0].base64 || null);
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

  const handleSaveChanges = async () => {
    if (!id || !product) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Validation Error', 'Product title cannot be empty.');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      Alert.alert('Validation Error', 'Please enter a valid price.');
      return;
    }
    const numStock = parseInt(stock, 10);
    if (isNaN(numStock) || numStock < 0) {
      Alert.alert('Validation Error', 'Please enter a valid stock quantity.');
      return;
    }

    setIsSaving(true);
    try {
      updateCatalogueProduct(
        id,
        {
          title: trimmedTitle,
          price: numPrice,
          stock: numStock,
          soldPer: unit,
          packageSize: `1 ${unit} pack`,
          description: description.trim(),
        },
        photoUri || undefined,
        photoBase64 || undefined
      );
      Alert.alert('Product Saved', 'Catalogue item details and inventory have been updated.');
      handleBackToCatalogue();
    } catch (e: any) {
      Alert.alert('Save Error', e.message || 'Failed to update product.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(
      'Delete Product',
      `Are you sure you want to remove "${title}" from your catalogue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeCatalogueProduct(id);
            Alert.alert('Product Removed', 'Item has been deleted from your catalogue.');
            handleBackToCatalogue();
          },
        },
      ]
    );
  };

  if (!product) {
    return (
      <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator color={isDark ? '#4ADE80' : '#1C3723'} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, isDark && styles.safeAreaDark]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Back Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleBackToCatalogue}
          style={[styles.backPill, isDark && styles.backPillDark]}
          accessibilityRole="button"
          accessibilityLabel="Back to Catalogue"
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={18}
            color={isDark ? '#DCE8DE' : '#2D4030'}
          />
          <Text style={[styles.backPillText, isDark && styles.backPillTextDark]}>
            Catalogue
          </Text>
        </TouchableOpacity>

        {/* Screen Title */}
        <Text style={[styles.screenTitle, isDark && styles.screenTitleDark]}>
          Edit Product & Stock
        </Text>

        {/* Edit Form Card */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          {/* Product Image Section */}
          <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Product Image</Text>
          <View style={[styles.imagePreviewContainer, isDark && styles.imagePreviewContainerDark]}>
            <Image
              source={
                photoUri
                  ? { uri: photoUri }
                  : product.imageUrl || DEFAULT_SEED_IMAGE
              }
              style={styles.previewImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'transparent', 'rgba(12,28,16,0.75)']}
              style={styles.imageGradientOverlay}
            />

            {/* Action Buttons Row */}
            <View style={styles.imageActionsRow}>
              {photoUri && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleResetPhoto}
                  style={[styles.revertPill, isDark && styles.revertPillDark]}
                  accessibilityRole="button"
                  accessibilityLabel="Reset to original photo"
                >
                  <MaterialCommunityIcons name="undo" size={14} color="#DC2626" />
                  <Text style={styles.revertPillText}>Reset</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handlePickImage}
                style={[styles.changePhotoPill, isDark && styles.changePhotoPillDark]}
                accessibilityRole="button"
                accessibilityLabel="Change product photo"
              >
                <MaterialCommunityIcons
                  name="camera-outline"
                  size={15}
                  color={isDark ? '#4ADE80' : '#1C3723'}
                />
                <Text
                  style={[
                    styles.changePhotoPillText,
                    isDark && styles.changePhotoPillTextDark,
                  ]}
                >
                  {photoUri ? 'Change' : 'Change Photo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Product Title</Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            value={title}
            onChangeText={setTitle}
            placeholder="Product title"
            placeholderTextColor={isDark ? '#7E9983' : '#8A998E'}
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Price (LKR)</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={isDark ? '#7E9983' : '#8A998E'}
              />
            </View>
            <View style={styles.col}>
              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Category</Text>
              <View style={[styles.readOnlyBox, isDark && styles.readOnlyBoxDark]}>
                <Text style={[styles.readOnlyText, isDark && styles.readOnlyTextDark]}>
                  {product.category}
                </Text>
              </View>
            </View>
          </View>

          {/* Stock Stepper */}
          <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Current Inventory Stock (units)</Text>
          <View style={styles.stockControlRow}>
            <TouchableOpacity
              onPress={() => handleStockAdjust(-10)}
              style={[styles.adjustBtn, isDark && styles.adjustBtnDark]}
            >
              <Text style={[styles.adjustBtnText, isDark && styles.adjustBtnTextDark]}>-10</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleStockAdjust(-1)}
              style={[styles.adjustBtn, isDark && styles.adjustBtnDark]}
            >
              <MaterialCommunityIcons name="minus" size={18} color={isDark ? '#4ADE80' : '#1C3723'} />
            </TouchableOpacity>
            <TextInput
              style={[styles.stockInput, isDark && styles.stockInputDark]}
              value={stock}
              onChangeText={setStock}
              keyboardType="numeric"
            />
            <TouchableOpacity
              onPress={() => handleStockAdjust(1)}
              style={[styles.adjustBtn, isDark && styles.adjustBtnDark]}
            >
              <MaterialCommunityIcons name="plus" size={18} color={isDark ? '#4ADE80' : '#1C3723'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleStockAdjust(10)}
              style={[styles.adjustBtn, isDark && styles.adjustBtnDark]}
            >
              <Text style={[styles.adjustBtnText, isDark && styles.adjustBtnTextDark]}>+10</Text>
            </TouchableOpacity>
          </View>

          {/* Sold Per Segmented Control */}
          <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Sold per</Text>
          <View style={[styles.unitSegmentedContainer, isDark && styles.unitSegmentedContainerDark]}>
            {UNIT_OPTIONS.map((opt) => {
              const isSelected = unit === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  activeOpacity={0.8}
                  onPress={() => setUnit(opt)}
                  style={[
                    styles.unitPill,
                    isSelected && (isDark ? styles.unitPillActiveDark : styles.unitPillActive),
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Sold per ${opt}`}
                >
                  <Text
                    style={[
                      styles.unitPillText,
                      isSelected
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

          {/* Description */}
          <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Description & Application</Text>
          <TextInput
            style={[styles.input, styles.textArea, isDark && styles.inputDark]}
            value={description}
            onChangeText={setDescription}
            placeholder="Suitable soil types, usage guidelines, dosage..."
            placeholderTextColor={isDark ? '#7E9983' : '#8A998E'}
            multiline
            numberOfLines={3}
          />

          {/* Action Buttons */}
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isSaving}
            onPress={handleSaveChanges}
            style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save-outline" size={18} color="#FFF" />
                <Text style={styles.saveBtnText}>Save Product Changes</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleDelete}
            style={styles.deleteBtn}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={16} color="#DC2626" />
            <Text style={styles.deleteBtnText}>Remove from Catalogue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F2EB',
  },
  safeAreaDark: {
    backgroundColor: '#0E1710',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: '#E2DDD2',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backPillDark: {
    backgroundColor: '#16271A',
    borderColor: '#263D2B',
  },
  backPillText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#28402D',
    marginLeft: 3,
  },
  backPillTextDark: {
    color: '#DCE8DE',
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1C3723',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 16,
  },
  screenTitleDark: {
    color: '#F0F5F1',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ECE7DC',
  },
  cardDark: {
    backgroundColor: '#18271C',
    borderColor: '#253B2A',
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#344E39',
    marginBottom: 6,
    marginTop: 8,
  },
  inputLabelDark: {
    color: '#98B39B',
  },
  input: {
    backgroundColor: '#F7F5EE',
    borderWidth: 1,
    borderColor: '#DDD7CA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#162E1D',
  },
  inputDark: {
    backgroundColor: '#1E2F22',
    borderColor: '#36533B',
    color: '#F0F5F1',
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  readOnlyBox: {
    backgroundColor: '#EBE7DC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  readOnlyBoxDark: {
    backgroundColor: '#1E2E20',
  },
  readOnlyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2B4330',
  },
  readOnlyTextDark: {
    color: '#B6D1B9',
  },
  stockControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginVertical: 4,
  },
  adjustBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E2DFD4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustBtnDark: {
    backgroundColor: '#263B2B',
  },
  adjustBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1C3723',
  },
  adjustBtnTextDark: {
    color: '#4ADE80',
  },
  stockInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F7F5EE',
    borderWidth: 1,
    borderColor: '#DDD7CA',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#162E1D',
  },
  stockInputDark: {
    backgroundColor: '#1E2F22',
    borderColor: '#36533B',
    color: '#F0F5F1',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#187A36',
    borderRadius: 22,
    paddingVertical: 14,
    gap: 8,
    marginTop: 22,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    marginTop: 8,
  },
  deleteBtnText: {
    color: '#DC2626',
    fontSize: 13.5,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    height: 180,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#EAE6DB',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ECE7DC',
  },
  imagePreviewContainerDark: {
    backgroundColor: '#1E2F22',
    borderColor: '#263B2B',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  imageActionsRow: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changePhotoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  changePhotoPillDark: {
    backgroundColor: 'rgba(24, 39, 28, 0.95)',
    borderWidth: 1,
    borderColor: '#36533B',
  },
  changePhotoPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1C3723',
  },
  changePhotoPillTextDark: {
    color: '#4ADE80',
  },
  revertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  revertPillDark: {
    backgroundColor: 'rgba(40, 20, 20, 0.95)',
    borderWidth: 1,
    borderColor: '#7F1D1D',
  },
  revertPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  unitSegmentedContainer: {
    backgroundColor: '#F5F2EA',
    borderRadius: 16,
    padding: 3.5,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  unitSegmentedContainerDark: {
    backgroundColor: '#101F14',
    borderWidth: 1,
    borderColor: '#263B2B',
  },
  unitPill: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
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
    fontWeight: '600',
  },
  unitPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  unitPillTextInactive: {
    color: '#5C7362',
  },
  unitPillTextInactiveDark: {
    color: '#7E9983',
  },
});
