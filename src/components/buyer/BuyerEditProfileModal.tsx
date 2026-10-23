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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BuyerProfile } from '../../types/buyer.types';

interface BuyerEditProfileModalProps {
  visible: boolean;
  profile: BuyerProfile;
  isDark?: boolean;
  onClose: () => void;
  onSave: (updatedProfile: Partial<BuyerProfile>) => void;
}

const EditProfileForm: React.FC<{
  profile: BuyerProfile;
  isDark?: boolean;
  onClose: () => void;
  onSave: (updatedProfile: Partial<BuyerProfile>) => void;
}> = ({ profile, isDark = false, onClose, onSave }) => {
  const [fullName, setFullName] = useState(profile.fullName);
  const [company, setCompany] = useState(profile.company || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [email, setEmail] = useState(profile.email || '');
  const [businessType, setBusinessType] = useState(profile.businessType || '');
  const [bio, setBio] = useState(profile.bio || '');

  const handleSave = () => {
    onSave({
      fullName: fullName.trim() || profile.fullName,
      company: company.trim() || profile.company,
      phone: phone.trim() || profile.phone,
      email: email.trim() || profile.email,
      businessType: businessType.trim() || profile.businessType,
      bio: bio.trim() || profile.bio,
    });
    onClose();
  };

  return (
    <View style={[styles.modalContainer, isDark && styles.modalContainerDark]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.title, isDark && styles.titleDark]}>Edit Profile</Text>
        <TouchableOpacity
          onPress={onClose}
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
        {/* Full Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Full Name</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            style={[styles.textInput, isDark && styles.textInputDark]}
            placeholder="Enter full name"
            placeholderTextColor={isDark ? '#6E8573' : '#9AA89B'}
          />
        </View>

        {/* Company / Business */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
            Company / Supermarket
          </Text>
          <TextInput
            value={company}
            onChangeText={setCompany}
            style={[styles.textInput, isDark && styles.textInputDark]}
            placeholder="e.g. FreshMart Ltd"
            placeholderTextColor={isDark ? '#6E8573' : '#9AA89B'}
          />
        </View>

        {/* Business Type */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Business Type</Text>
          <TextInput
            value={businessType}
            onChangeText={setBusinessType}
            style={[styles.textInput, isDark && styles.textInputDark]}
            placeholder="e.g. Retail supermarket"
            placeholderTextColor={isDark ? '#6E8573' : '#9AA89B'}
          />
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

        {/* Email */}
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

        {/* Bio statement */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Professional Bio</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            style={[styles.textInput, styles.textArea, isDark && styles.textInputDark]}
            placeholder="Brief summary of your sourcing roles..."
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
            style={[styles.cancelBtn, isDark && styles.cancelBtnDark]}
          >
            <Text style={[styles.cancelBtnText, isDark && styles.cancelBtnTextDark]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSave}
            style={[styles.saveBtn, isDark && styles.saveBtnDark]}
          >
            <Text style={styles.saveBtnText}>Save Changes</Text>
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
    maxHeight: '85%',
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
  inputGroup: {
    marginBottom: 14,
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
});
