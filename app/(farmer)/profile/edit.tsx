import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useFarmerProfile } from '../../../src/store/farmerProfileStore';
import { useDarkMode } from '../../../src/store/uiStore';

const FARMING_METHODS = ['Organic', 'Transitioning to Organic', 'Conventional', 'Other'] as const;

export default function EditFarmerProfileScreen() {
  const { profile, updateProfile } = useFarmerProfile();
  const [darkMode] = useDarkMode();

  // Form local state prepopulated with saved profile
  const [fullName, setFullName] = useState(profile.fullName || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [farmName, setFarmName] = useState(profile.farmName || '');
  const [district, setDistrict] = useState(profile.district || '');
  const [province, setProvince] = useState(profile.province || '');
  const [farmSize, setFarmSize] = useState(profile.farmSize || '');
  const [farmingMethod, setFarmingMethod] = useState(profile.farmingMethod || 'Organic');
  const [deliveryAvailable, setDeliveryAvailable] = useState(profile.deliveryAvailable ?? true);

  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check if anything has been modified
  const hasChanges = useMemo(() => {
    return (
      fullName !== (profile.fullName || '') ||
      phone !== (profile.phone || '') ||
      bio !== (profile.bio || '') ||
      avatarUrl !== (profile.avatarUrl || '') ||
      farmName !== (profile.farmName || '') ||
      district !== (profile.district || '') ||
      province !== (profile.province || '') ||
      farmSize !== (profile.farmSize || '') ||
      farmingMethod !== (profile.farmingMethod || 'Organic') ||
      deliveryAvailable !== (profile.deliveryAvailable ?? true)
    );
  }, [
    fullName,
    phone,
    bio,
    avatarUrl,
    farmName,
    district,
    province,
    farmSize,
    farmingMethod,
    deliveryAvailable,
    profile,
  ]);

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard unsaved changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard Changes', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  // Image picking methods
  const handleTakePhoto = async () => {
    setPhotoModalVisible(false);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to take a profile picture.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUrl(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Unable to access camera.');
    }
  };

  const handleChooseFromGallery = async () => {
    setPhotoModalVisible(false);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Photo library permission is needed to select a picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUrl(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Unable to pick photo from gallery.');
    }
  };

  const handleRemovePhoto = () => {
    setPhotoModalVisible(false);
    setAvatarUrl('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80');
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Full Name cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim(),
        farmName: farmName.trim(),
        district: district.trim(),
        province: province.trim(),
        location: district.trim() ? `${district.trim()} District` : profile.location,
        farmSize: farmSize.trim(),
        farmingMethod,
        deliveryAvailable,
      });

      Alert.alert('Profile Updated', 'Your profile information has been successfully saved.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Could not save profile changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, darkMode && styles.safeAreaDark]} edges={['top', 'left', 'right']}>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={[styles.backCircleBtn, darkMode && styles.backCircleBtnDark]}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={20} color={darkMode ? '#E5EFE7' : '#16351E'} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, darkMode && styles.headerTitleDark]}>Edit Profile</Text>

          <TouchableOpacity
            style={[styles.saveHeaderBtn, isSaving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveHeaderBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* A. Profile Picture Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
              <TouchableOpacity
                style={styles.cameraIconBadge}
                onPress={() => setPhotoModalVisible(true)}
                activeOpacity={0.85}
              >
                <Feather name="camera" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setPhotoModalVisible(true)}>
              <Text style={[styles.changePhotoText, darkMode && styles.changePhotoTextDark]}>Change Profile Photo</Text>
            </TouchableOpacity>
          </View>

          {/* B. Personal Details Card */}
          <View style={[styles.formCard, darkMode && styles.formCardDark]}>
            <Text style={[styles.cardSectionTitle, darkMode && styles.cardSectionTitleDark]}>Personal Information</Text>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, darkMode && styles.inputLabelDark]}>Full Name *</Text>
              <TextInput
                style={[styles.textInput, darkMode && styles.textInputDark]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="e.g. Priya Kumari"
                placeholderTextColor={darkMode ? '#647D68' : '#9EB0A1'}
              />
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, darkMode && styles.inputLabelDark]}>Phone Number</Text>
              <TextInput
                style={[styles.textInput, darkMode && styles.textInputDark]}
                value={phone}
                onChangeText={setPhone}
                placeholder="+94 77 123 4567"
                placeholderTextColor={darkMode ? '#647D68' : '#9EB0A1'}
                keyboardType="phone-pad"
              />
            </View>

            {/* Email (Read-Only) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, darkMode && styles.inputLabelDark]}>Email Address (Account ID)</Text>
              <View style={[styles.readOnlyInput, darkMode && styles.readOnlyInputDark]}>
                <Text style={[styles.readOnlyText, darkMode && styles.readOnlyTextDark]}>{profile.email}</Text>
                <View style={styles.verifiedTag}>
                  <Ionicons name="checkmark-circle" size={13} color="#266432" style={{ marginRight: 3 }} />
                  <Text style={styles.verifiedTagText}>Verified</Text>
                </View>
              </View>
            </View>

            {/* Bio */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, darkMode && styles.inputLabelDark]}>Profile Bio</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput, darkMode && styles.textInputDark]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell buyers about your farming methods, crops and values..."
                placeholderTextColor={darkMode ? '#647D68' : '#9EB0A1'}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* C. Farm Information Card */}
          <View style={[styles.formCard, darkMode && styles.formCardDark]}>
            <Text style={[styles.cardSectionTitle, darkMode && styles.cardSectionTitleDark]}>Farm Information</Text>

            {/* Farm Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, darkMode && styles.inputLabelDark]}>Farm Name</Text>
              <TextInput
                style={[styles.textInput, darkMode && styles.textInputDark]}
                value={farmName}
                onChangeText={setFarmName}
                placeholder="e.g. Green Valley Greenhouse"
                placeholderTextColor={darkMode ? '#647D68' : '#9EB0A1'}
              />
            </View>

            {/* District & Province Row */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.inputLabel, darkMode && styles.inputLabelDark]}>District</Text>
                <TextInput
                  style={[styles.textInput, darkMode && styles.textInputDark]}
                  value={district}
                  onChangeText={setDistrict}
                  placeholder="e.g. Kandy"
                  placeholderTextColor={darkMode ? '#647D68' : '#9EB0A1'}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.inputLabel, darkMode && styles.inputLabelDark]}>Province</Text>
                <TextInput
                  style={[styles.textInput, darkMode && styles.textInputDark]}
                  value={province}
                  onChangeText={setProvince}
                  placeholder="e.g. Central"
                  placeholderTextColor={darkMode ? '#647D68' : '#9EB0A1'}
                />
              </View>
            </View>

            {/* Farm Size */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, darkMode && styles.inputLabelDark]}>Farm Size & Unit</Text>
              <TextInput
                style={[styles.textInput, darkMode && styles.textInputDark]}
                value={farmSize}
                onChangeText={setFarmSize}
                placeholder="e.g. 2 acres, 5000 sq ft"
                placeholderTextColor={darkMode ? '#647D68' : '#9EB0A1'}
              />
            </View>

            {/* Farming Method Options */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, darkMode && styles.inputLabelDark]}>Farming Method</Text>
              <View style={styles.methodPillsRow}>
                {FARMING_METHODS.map((method) => {
                  const isSelected = farmingMethod === method;
                  return (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.methodPill,
                        isSelected ? styles.methodPillActive : (darkMode ? styles.methodPillInactiveDark : styles.methodPillInactive),
                      ]}
                      onPress={() => setFarmingMethod(method)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.methodPillText,
                          isSelected ? styles.methodPillTextActive : (darkMode ? styles.methodPillTextInactiveDark : styles.methodPillTextInactive),
                        ]}
                      >
                        {method}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* D. Save Changes Large Button */}
          <TouchableOpacity
            style={[styles.saveLargeBtn, isSaving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="check" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.saveLargeBtnText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Photo Picker Options Modal */}
      <Modal
        visible={photoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.photoOptionsContainer, darkMode && styles.photoOptionsContainerDark]}>
            <Text style={[styles.photoModalTitle, darkMode && styles.photoModalTitleDark]}>Profile Photo</Text>

            <TouchableOpacity style={styles.photoOptionItem} onPress={handleTakePhoto}>
              <Feather name="camera" size={20} color={darkMode ? '#4ADE80' : '#24522C'} style={{ marginRight: 12 }} />
              <Text style={[styles.photoOptionText, darkMode && styles.photoOptionTextDark]}>Take Photo</Text>
            </TouchableOpacity>

            <View style={[styles.photoOptionDivider, darkMode && styles.photoOptionDividerDark]} />

            <TouchableOpacity style={styles.photoOptionItem} onPress={handleChooseFromGallery}>
              <Feather name="image" size={20} color={darkMode ? '#4ADE80' : '#24522C'} style={{ marginRight: 12 }} />
              <Text style={[styles.photoOptionText, darkMode && styles.photoOptionTextDark]}>Choose from Gallery</Text>
            </TouchableOpacity>

            <View style={[styles.photoOptionDivider, darkMode && styles.photoOptionDividerDark]} />

            <TouchableOpacity style={styles.photoOptionItem} onPress={handleRemovePhoto}>
              <Feather name="trash-2" size={20} color="#F87171" style={{ marginRight: 12 }} />
              <Text style={[styles.photoOptionText, { color: '#F87171' }]}>Remove Current Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelModalBtn, darkMode && styles.cancelModalBtnDark]}
              onPress={() => setPhotoModalVisible(false)}
            >
              <Text style={[styles.cancelModalBtnText, darkMode && styles.cancelModalBtnTextDark]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F2EB',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16351E',
  },
  saveHeaderBtn: {
    backgroundColor: '#225129',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 14,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarImg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#EAEAEA',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#225129',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  changePhotoText: {
    color: '#225129',
    fontSize: 13,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 14,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16351E',
    marginBottom: 4,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B6751',
  },
  textInput: {
    backgroundColor: '#F8FAF8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8E2DA',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#16351E',
  },
  multilineInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  readOnlyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF3EF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#DEE5DF',
  },
  readOnlyText: {
    fontSize: 13,
    color: '#657E6B',
    fontWeight: '500',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2EFE4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  verifiedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#266432',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  methodPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  methodPill: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  methodPillActive: {
    backgroundColor: '#225129',
  },
  methodPillInactive: {
    backgroundColor: '#F3F6F3',
    borderWidth: 1,
    borderColor: '#D8E2DA',
  },
  methodPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  methodPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  methodPillTextInactive: {
    color: '#4B6751',
  },
  saveLargeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E4624',
    borderRadius: 22,
    height: 52,
    marginTop: 6,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  saveLargeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 38, 22, 0.65)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  photoOptionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
  },
  photoModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16351E',
    marginBottom: 16,
  },
  photoOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  photoOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#24522C',
  },
  photoOptionDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F0F4F0',
  },
  cancelModalBtn: {
    width: '100%',
    backgroundColor: '#EFF3EF',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  cancelModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#455F4A',
  },
  safeAreaDark: {
    backgroundColor: '#0E1710',
  },
  backCircleBtnDark: {
    backgroundColor: '#18271C',
    borderColor: '#283D2C',
    borderWidth: 1,
  },
  headerTitleDark: {
    color: '#F0F5F1',
  },
  changePhotoTextDark: {
    color: '#4ADE80',
  },
  formCardDark: {
    backgroundColor: '#18271C',
    borderColor: '#283D2C',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  cardSectionTitleDark: {
    color: '#F0F5F1',
  },
  inputLabelDark: {
    color: '#9CB3A0',
  },
  textInputDark: {
    backgroundColor: '#122015',
    borderColor: '#283D2C',
    color: '#F0F5F1',
  },
  readOnlyInputDark: {
    backgroundColor: '#142318',
    borderColor: '#283D2C',
  },
  readOnlyTextDark: {
    color: '#9CB3A0',
  },
  methodPillInactiveDark: {
    backgroundColor: '#122015',
    borderColor: '#283D2C',
  },
  methodPillTextInactiveDark: {
    color: '#9CB3A0',
  },
  photoOptionsContainerDark: {
    backgroundColor: '#18271C',
    borderColor: '#283D2C',
    borderWidth: 1,
  },
  photoModalTitleDark: {
    color: '#F0F5F1',
  },
  photoOptionTextDark: {
    color: '#F0F5F1',
  },
  photoOptionDividerDark: {
    backgroundColor: '#283D2C',
  },
  cancelModalBtnDark: {
    backgroundColor: '#233827',
  },
  cancelModalBtnTextDark: {
    color: '#A0B6A3',
  },
});

