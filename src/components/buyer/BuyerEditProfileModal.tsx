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
  onClose: () => void;
  onSave: (updatedProfile: Partial<BuyerProfile>) => void;
}

const EditProfileForm: React.FC<{
  profile: BuyerProfile;
  onClose: () => void;
  onSave: (updatedProfile: Partial<BuyerProfile>) => void;
}> = ({ profile, onClose, onSave }) => {
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
    <View style={styles.modalContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialCommunityIcons name="close" size={22} color="#16301A" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Full Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            style={styles.textInput}
            placeholder="Enter full name"
            placeholderTextColor="#9AA89B"
          />
        </View>

        {/* Company / Business */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Company / Supermarket</Text>
          <TextInput
            value={company}
            onChangeText={setCompany}
            style={styles.textInput}
            placeholder="e.g. FreshMart Ltd"
            placeholderTextColor="#9AA89B"
          />
        </View>

        {/* Business Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Business Type</Text>
          <TextInput
            value={businessType}
            onChangeText={setBusinessType}
            style={styles.textInput}
            placeholder="e.g. Retail supermarket"
            placeholderTextColor="#9AA89B"
          />
        </View>

        {/* Phone */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Contact Phone</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            style={styles.textInput}
            placeholder="+94 7X XXX XXXX"
            keyboardType="phone-pad"
            placeholderTextColor="#9AA89B"
          />
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Work Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={styles.textInput}
            placeholder="buyer@freshmart.lk"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#9AA89B"
          />
        </View>

        {/* Bio statement */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Professional Bio</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            style={[styles.textInput, styles.textArea]}
            placeholder="Brief summary of your sourcing roles..."
            multiline={true}
            numberOfLines={3}
            placeholderTextColor="#9AA89B"
          />
        </View>

        {/* Action buttons */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            style={styles.cancelBtn}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSave}
            style={styles.saveBtn}
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
    backgroundColor: 'rgba(18, 38, 22, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#F7F4EC',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16301A',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBE5D8',
    alignItems: 'center',
    justifyContent: 'center',
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
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495B4C',
  },
  saveBtn: {
    flex: 1.4,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#1B3220',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
