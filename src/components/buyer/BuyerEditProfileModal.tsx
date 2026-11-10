import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { BuyerProfile } from '../../types/buyer.types';
import {
  getCurrentGpsLocation,
  formatCoordinates,
  parseCoordinates,
  resolveDistrictInfo,
  getStaticMapUrl,
} from '../../services/location.service';

interface BuyerEditProfileModalProps {
  visible: boolean;
  profile: BuyerProfile;
  isDark?: boolean;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (
    updatedProfile: Partial<BuyerProfile>,
    localAvatarUri?: string,
    avatarBase64?: string
  ) => void;
}

const BUSINESS_TYPES = [
  { key: 'supermarket', label: 'Supermarket', icon: 'cart-outline' },
  { key: 'retailer', label: 'Retailer', icon: 'storefront-outline' },
  { key: 'restaurant', label: 'Restaurant', icon: 'silverware-fork-knife' },
] as const;

const EditProfileForm: React.FC<{
  profile: BuyerProfile;
  isDark?: boolean;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (
    updatedProfile: Partial<BuyerProfile>,
    localAvatarUri?: string,
    avatarBase64?: string
  ) => void;
}> = ({ profile, isDark = false, isSaving = false, onClose, onSave }) => {
  const [fullName, setFullName] = useState(profile.fullName?.trim() || '');
  const [company, setCompany] = useState(profile.company?.trim() || '');
  const [phone, setPhone] = useState(profile.phone?.trim() || '');
  const [email, setEmail] = useState(profile.email?.trim() || '');
  const [businessType, setBusinessType] = useState<'supermarket' | 'retailer' | 'restaurant'>(
    profile.businessType?.toLowerCase().includes('retail')
      ? 'retailer'
      : profile.businessType?.toLowerCase().includes('rest')
      ? 'restaurant'
      : 'supermarket'
  );
  const [district, setDistrict] = useState(profile.district?.trim() || '');
  const [province, setProvince] = useState(profile.province?.trim() || '');
  const [address, setAddress] = useState(profile.address?.trim() || '');
  const [coordinates, setCoordinates] = useState(profile.coordinates?.trim() || '');
  const [latitude, setLatitude] = useState<number | undefined>(profile.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(profile.longitude);
  const [isLocating, setIsLocating] = useState(false);
  const [registrationId, setRegistrationId] = useState(profile.registrationId?.trim() || '');
  const [bio, setBio] = useState(profile.bio?.trim() || '');

  // Local avatar selection state
  const [selectedAvatarUri, setSelectedAvatarUri] = useState<string | null>(null);
  const [selectedAvatarBase64, setSelectedAvatarBase64] = useState<string | null>(null);

  const handleDetectLocation = async () => {
    setIsLocating(true);
    const result = await getCurrentGpsLocation();
    setIsLocating(false);

    if (result.success && result.latitude && result.longitude) {
      setLatitude(result.latitude);
      setLongitude(result.longitude);
      if (result.coordinates) setCoordinates(result.coordinates);
      if (result.district) setDistrict(result.district);
      if (result.province) setProvince(result.province);
      if (result.address) setAddress(result.address);
      Alert.alert(
        'GPS Location Detected',
        `Updated to ${result.district || 'Location'}${result.province ? ', ' + result.province : ''}\nCoordinates: ${result.coordinates || ''}`
      );
    } else {
      Alert.alert(
        'Location Detection Failed',
        result.error || 'Could not access GPS location. Please check device permissions.'
      );
    }
  };

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Needed',
          'Please allow photo library access in device settings to change your avatar.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedAvatarUri(result.assets[0].uri);
        setSelectedAvatarBase64(result.assets[0].base64 || null);
      }
    } catch (err) {
      console.warn('Error selecting image from gallery:', err);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Needed',
          'Please allow camera access in device settings to take a profile photo.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedAvatarUri(result.assets[0].uri);
        setSelectedAvatarBase64(result.assets[0].base64 || null);
      }
    } catch (err) {
      console.warn('Error taking photo:', err);
    }
  };

  const handlePhotoOptions = () => {
    Alert.alert('Profile Photo', 'Choose an option to update your profile photo', [
      { text: 'Choose from Gallery', onPress: handlePickImage },
      { text: 'Take Photo', onPress: handleTakePhoto },
      ...(selectedAvatarUri || profile.avatarUrl
        ? [
            {
              text: 'Remove Photo',
              style: 'destructive' as const,
              onPress: () => {
                setSelectedAvatarUri('');
                setSelectedAvatarBase64(null);
              },
            },
          ]
        : []),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = () => {
    if (!fullName.trim()) {
      Alert.alert('Required Field', 'Please enter your Full Name.');
      return;
    }

    const hasPhotoRemoval = selectedAvatarUri === '';
    const hasNewLocalPhoto = Boolean(selectedAvatarUri && selectedAvatarUri !== '');

    const finalCoords =
      coordinates.trim() ||
      (latitude !== undefined && longitude !== undefined
        ? formatCoordinates(latitude, longitude)
        : undefined);

    onSave(
      {
        fullName: fullName.trim(),
        company: company.trim(),
        phone: phone.trim(),
        email: email.trim(),
        businessType,
        district: district.trim(),
        province: province.trim(),
        address: address.trim(),
        coordinates: finalCoords,
        latitude,
        longitude,
        registrationId: registrationId.trim(),
        bio: bio.trim(),
        avatarUrl: hasPhotoRemoval ? null : (hasNewLocalPhoto ? selectedAvatarUri! : profile.avatarUrl),
      },
      hasNewLocalPhoto ? selectedAvatarUri! : undefined,
      hasNewLocalPhoto && selectedAvatarBase64 ? selectedAvatarBase64 : undefined
    );
  };

  const currentCoords = parseCoordinates(
    coordinates || (latitude && longitude ? `${latitude}, ${longitude}` : undefined),
    district
  );
  const previewLat = latitude ?? currentCoords.latitude;
  const previewLng = longitude ?? currentCoords.longitude;
  const previewMapUrl = getStaticMapUrl(previewLat, previewLng, 13, 200, 150);

  const currentDisplayAvatar =
    selectedAvatarUri === ''
      ? undefined
      : selectedAvatarUri || profile.avatarUrl;

  return (
    <View style={[styles.modalContainer, isDark && styles.modalContainerDark]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.title, isDark && styles.titleDark]}>Edit Buyer Profile</Text>
        <TouchableOpacity
          onPress={onClose}
          disabled={isSaving}
          style={[styles.closeButton, isDark && styles.closeButtonDark]}
        >
          <MaterialCommunityIcons
            name="close"
            size={22}
            color={isDark ? '#E8F0EA' : '#16301A'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Avatar Upload Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handlePhotoOptions}
            style={styles.avatarWrapper}
          >
            {currentDisplayAvatar ? (
              <Image source={{ uri: currentDisplayAvatar }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, isDark && styles.avatarPlaceholderDark]}>
                <Text style={styles.avatarInitials}>{profile.initials || 'TR'}</Text>
              </View>
            )}
            <View style={styles.cameraPill}>
              <MaterialCommunityIcons name="camera" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePhotoOptions} style={styles.changePhotoBtn}>
            <Text style={[styles.changePhotoText, isDark && styles.changePhotoTextDark]}>
              Change Profile Photo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Full Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
            Full Name <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            style={[styles.textInput, isDark && styles.textInputDark]}
            placeholder="Enter your full name"
            placeholderTextColor={isDark ? '#6E8573' : '#9AA89B'}
          />
        </View>

        {/* Company / Business */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
            Company / Supermarket Name
          </Text>
          <TextInput
            value={company}
            onChangeText={setCompany}
            style={[styles.textInput, isDark && styles.textInputDark]}
            placeholder="e.g. FreshMart Lanka"
            placeholderTextColor={isDark ? '#6E8573' : '#9AA89B'}
          />
        </View>

        {/* Business Type Selector (Strict Database Constraint Match) */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Business Type</Text>
          <View style={styles.businessTypeRow}>
            {BUSINESS_TYPES.map((item) => {
              const isSelected = businessType === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.75}
                  onPress={() => setBusinessType(item.key)}
                  style={[
                    styles.typeChip,
                    isDark && styles.typeChipDark,
                    isSelected && (isDark ? styles.typeChipSelectedDark : styles.typeChipSelected),
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={15}
                    color={
                      isSelected
                        ? '#FFFFFF'
                        : isDark
                        ? '#9EC7A3'
                        : '#35533A'
                    }
                  />
                  <Text
                    style={[
                      styles.typeChipText,
                      isDark && styles.typeChipTextDark,
                      isSelected && styles.typeChipTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Phone */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Contact Phone</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            style={[styles.textInput, isDark && styles.textInputDark]}
            placeholder="+94 7X XXX XXXX"
            keyboardType="phone-pad"
            placeholderTextColor={isDark ? '#6E8573' : '#9AA89B'}
          />
        </View>

        {/* Work Email */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Work Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={[styles.textInput, isDark && styles.textInputDark]}
            placeholder="buyer@freshmart.lk"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={isDark ? '#6E8573' : '#9AA89B'}
          />
        </View>

        {/* Location Section Header + GPS Button */}
        <View style={styles.locationHeaderRow}>
          <Text style={[styles.inputLabel, isDark && styles.inputLabelDark, { marginBottom: 0 }]}>
            Real Location & GPS
          </Text>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleDetectLocation}
            disabled={isLocating}
            style={[styles.gpsButton, isDark && styles.gpsButtonDark]}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color="#16301A" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="crosshairs-gps"
                  size={14}
                  color={isDark ? '#4ADE80' : '#1B3220'}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.gpsButtonText, isDark && styles.gpsButtonTextDark]}>
                  Use Current GPS
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* District & Province Row */}
        <View style={styles.rowTwoCols}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.subInputLabel, isDark && styles.subInputLabelDark]}>District</Text>
            <TextInput
              value={district}
              onChangeText={(text) => {
                setDistrict(text);
                const info = resolveDistrictInfo(text);
                if (info) {
                  setLatitude(info.lat);
                  setLongitude(info.lng);
                  setCoordinates(formatCoordinates(info.lat, info.lng));
                  if (!province) setProvince(info.province);
                }
              }}
              style={[styles.textInput, isDark && styles.textInputDark]}
              placeholder="e.g. Colombo"
              placeholderTextColor={isDark ? '#6E8573' : '#9AA89B'}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.subInputLabel, isDark && styles.subInputLabelDark]}>Province</Text>
            <TextInput
              value={province}
              onChangeText={setProvince}
              style={[styles.textInput, isDark && styles.textInputDark]}
              placeholder="e.g. Western"
              placeholderTextColor={isDark ? '#6E8573' : '#9AA89B'}
            />
          </View>
        </View>

        {/* Physical / Delivery Address */}
        <View style={styles.inputGroup}>
          <Text style={[styles.subInputLabel, isDark && styles.subInputLabelDark]}>
            Physical / Delivery Address
          </Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            style={[styles.textInput, isDark && styles.textInputDark]}
            placeholder="e.g. 45 Main Street, Colombo 03"
            placeholderTextColor={isDark ? '#6E8573' : '#9AA89B'}
          />
        </View>

        {/* Coordinates & Map Preview Banner */}
        <View style={[styles.modalMapPreviewBox, isDark && styles.modalMapPreviewBoxDark]}>
          <View style={styles.modalMapThumbnailContainer}>
            <Image
              source={{ uri: previewMapUrl }}
              style={styles.modalMapThumbnail}
              resizeMode="cover"
            />
            <MaterialCommunityIcons
              name="map-marker"
              size={20}
              color="#F97316"
              style={styles.modalMapMarkerIcon}
            />
          </View>
          <View style={styles.modalMapPreviewTextCol}>
            <Text style={[styles.modalMapCoordsLabel, isDark && styles.modalMapCoordsLabelDark]}>
              GPS Coordinates:
            </Text>
            <Text style={[styles.modalMapCoordsVal, isDark && styles.modalMapCoordsValDark]}>
              {coordinates || formatCoordinates(previewLat, previewLng)}
            </Text>
          </View>
        </View>

        {/* Business Registration (BR) Number */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>BR Number</Text>
          <TextInput
            value={registrationId}
            onChangeText={setRegistrationId}
            style={[styles.textInput, isDark && styles.textInputDark]}
            placeholder="e.g. PV-10294"
            placeholderTextColor={isDark ? '#6E8573' : '#9AA89B'}
          />
        </View>

        {/* Bio statement */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Professional Bio</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            style={[styles.textInput, styles.textArea, isDark && styles.textInputDark]}
            placeholder="Brief summary of your sourcing roles and produce requirements..."
            multiline={true}
            numberOfLines={3}
            placeholderTextColor={isDark ? '#6E8573' : '#9AA89B'}
          />
        </View>

        {/* Action buttons */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            disabled={isSaving}
            style={[styles.cancelBtn, isDark && styles.cancelBtnDark]}
          >
            <Text style={[styles.cancelBtnText, isDark && styles.cancelBtnTextDark]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={isSaving}
            style={[styles.saveBtn, isDark && styles.saveBtnDark, isSaving && { opacity: 0.7 }]}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export const BuyerEditProfileModal: React.FC<BuyerEditProfileModalProps> = ({
  visible,
  profile,
  isDark = false,
  isSaving = false,
  onClose,
  onSave,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        {visible && (
          <EditProfileForm
            profile={profile}
            isDark={isDark}
            isSaving={isSaving}
            onClose={onClose}
            onSave={onSave}
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 24, 14, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#F7F4EC',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalContainerDark: {
    backgroundColor: '#16251B',
    borderTopWidth: 1,
    borderTopColor: '#2B4230',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E3D7',
  },
  headerDark: {
    borderBottomColor: '#253B2A',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16301A',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  titleDark: {
    color: '#F0F5F1',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBE5D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonDark: {
    backgroundColor: '#263B2B',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarWrapper: {
    position: 'relative',
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#DDE8DF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderDark: {
    backgroundColor: '#223D29',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: '#26482B',
  },
  cameraPill: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  changePhotoBtn: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#256D35',
  },
  changePhotoTextDark: {
    color: '#55C26F',
  },
  inputGroup: {
    marginBottom: 14,
  },
  requiredStar: {
    color: '#E53935',
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#344E38',
    marginBottom: 6,
  },
  inputLabelDark: {
    color: '#A8C2AC',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFD9CB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#16301A',
  },
  textInputDark: {
    backgroundColor: '#1E3223',
    borderColor: '#2D4733',
    color: '#FFFFFF',
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
  },
  businessTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#EBE6DA',
    borderWidth: 1,
    borderColor: '#DED8CA',
  },
  typeChipDark: {
    backgroundColor: '#203425',
    borderColor: '#2C4933',
  },
  typeChipSelected: {
    backgroundColor: '#1E4620',
    borderColor: '#1E4620',
  },
  typeChipSelectedDark: {
    backgroundColor: '#2B6A35',
    borderColor: '#2B6A35',
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#35533A',
  },
  typeChipTextDark: {
    color: '#A3C4A8',
  },
  typeChipTextSelected: {
    color: '#FFFFFF',
  },
  textArea: {
    minHeight: 74,
    textAlignVertical: 'top',
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#E7E0D2',
    alignItems: 'center',
  },
  cancelBtnDark: {
    backgroundColor: '#263B2B',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495B4C',
  },
  cancelBtnTextDark: {
    color: '#C2D5C5',
  },
  saveBtn: {
    flex: 1.4,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#1B3220',
    alignItems: 'center',
  },
  saveBtnDark: {
    backgroundColor: '#257039',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 4,
  },
  subInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#657E6B',
    marginBottom: 4,
  },
  subInputLabelDark: {
    color: '#9CB3A0',
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F1EA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#C6DCB8',
  },
  gpsButtonDark: {
    backgroundColor: '#1E3524',
    borderColor: '#36583E',
  },
  gpsButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B3220',
  },
  gpsButtonTextDark: {
    color: '#4ADE80',
  },
  modalMapPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 8,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: '#E2DBD0',
  },
  modalMapPreviewBoxDark: {
    backgroundColor: '#1C2E21',
    borderColor: '#29432F',
  },
  modalMapThumbnailContainer: {
    width: 64,
    height: 52,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F2314',
  },
  modalMapThumbnail: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  modalMapMarkerIcon: {
    position: 'absolute',
  },
  modalMapPreviewTextCol: {
    marginLeft: 10,
    flex: 1,
  },
  modalMapCoordsLabel: {
    fontSize: 11,
    color: '#6E8070',
    fontWeight: '500',
  },
  modalMapCoordsLabelDark: {
    color: '#A0B7A4',
  },
  modalMapCoordsVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16301A',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
    marginTop: 2,
  },
  modalMapCoordsValDark: {
    color: '#F0F5F1',
  },
});
