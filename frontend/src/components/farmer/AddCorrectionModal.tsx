import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { RecentRecordItem } from '../../types/farmer.types';

interface AddCorrectionModalProps {
  visible: boolean;
  record: RecentRecordItem | null;
  onClose: () => void;
  onSave: (correction: {
    reason: string;
    correctedNotes?: string;
    correctedInputs?: string[];
    photoUri?: string;
  }) => void;
}

interface CorrectionFormContentProps {
  record: RecentRecordItem;
  onClose: () => void;
  onSave: (correction: {
    reason: string;
    correctedNotes?: string;
    correctedInputs?: string[];
    photoUri?: string;
  }) => void;
}

const CorrectionFormContent: React.FC<CorrectionFormContentProps> = ({
  record,
  onClose,
  onSave,
}) => {
  const [reason, setReason] = useState('');
  const [correctedNotes, setCorrectedNotes] = useState(record.notes || '');
  const [correctedInputsText, setCorrectedInputsText] = useState(
    record.inputs ? record.inputs.join(', ') : ''
  );
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [reasonError, setReasonError] = useState<string | null>(null);

  const handlePickPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera roll access is needed to attach correction photo evidence.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Could not open image picker.');
    }
  };

  const handleSave = () => {
    if (!reason.trim()) {
      setReasonError('Please provide a reason for the record correction.');
      return;
    }

    const inputsArray = correctedInputsText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    onSave({
      reason: reason.trim(),
      correctedNotes: correctedNotes.trim() || undefined,
      correctedInputs: inputsArray.length > 0 ? inputsArray : undefined,
      photoUri,
    });

    onClose();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.modalCard}
    >
      {/* Header */}
      <View style={styles.modalHeader}>
        <View>
          <Text style={styles.modalTitle}>Add Record Correction</Text>
          <Text style={styles.modalSubtitle}>
            Linking to {record.recordCode} · {record.title}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="x" size={20} color="#3C5441" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollBody}
        showsVerticalScrollIndicator={false}
      >
        {/* Immutable Ledger Notice */}
        <View style={styles.ledgerNoticeBox}>
          <Ionicons name="shield-checkmark" size={18} color="#2D6A4F" style={{ marginRight: 8 }} />
          <Text style={styles.ledgerNoticeText}>
            In TraceRoot, original records are permanently locked to guarantee organic traceability. This will create a verified linked correction without overwriting the original.
          </Text>
        </View>

        {/* Reason for Correction (Required) */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            Reason for Correction <Text style={{ color: '#D9534F' }}>*</Text>
          </Text>
          <TextInput
            style={[styles.textInput, reasonError && styles.inputErrorBorder]}
            placeholder="e.g. Adjusted fertilizer volume, corrected plot name"
            placeholderTextColor="#9CB0A1"
            value={reason}
            onChangeText={(val) => {
              setReason(val);
              if (val.trim()) setReasonError(null);
            }}
          />
          {reasonError && (
            <Text style={styles.errorText}>{reasonError}</Text>
          )}
        </View>

        {/* Updated Inputs/Materials */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Corrected Inputs (comma separated)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. NPK 2.5kg, Water 6L"
            placeholderTextColor="#9CB0A1"
            value={correctedInputsText}
            onChangeText={setCorrectedInputsText}
          />
        </View>

        {/* Corrected Notes */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Corrected Activity Notes</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            placeholder="Enter updated notes or clarifications..."
            placeholderTextColor="#9CB0A1"
            value={correctedNotes}
            onChangeText={setCorrectedNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Evidence Photo */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Supporting Photo Evidence</Text>
          {photoUri ? (
            <View style={styles.photoPreviewWrapper}>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              <TouchableOpacity
                style={styles.removePhotoBtn}
                onPress={() => setPhotoUri(undefined)}
              >
                <Feather name="trash-2" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.attachPhotoBtn}
              onPress={handlePickPhoto}
            >
              <Feather name="camera" size={18} color="#2D6A4F" style={{ marginRight: 8 }} />
              <Text style={styles.attachPhotoText}>Attach New Photo Evidence</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onClose}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSave}
        >
          <Text style={styles.submitBtnText}>Submit Correction</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export const AddCorrectionModal: React.FC<AddCorrectionModalProps> = ({
  visible,
  record,
  onClose,
  onSave,
}) => {
  if (!record) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <CorrectionFormContent
              key={record.recordCode}
              record={record}
              onClose={onClose}
              onSave={onSave}
            />
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2EE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16331C',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#65816D',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0F4F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  ledgerNoticeBox: {
    flexDirection: 'row',
    backgroundColor: '#EAF5EE',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4EAD9',
    marginBottom: 16,
    alignItems: 'center',
  },
  ledgerNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: '#26543A',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2B4A33',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAF8',
    borderWidth: 1,
    borderColor: '#D8E2D9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1C3521',
  },
  multilineInput: {
    height: 75,
    textAlignVertical: 'top',
  },
  inputErrorBorder: {
    borderColor: '#D9534F',
  },
  errorText: {
    color: '#D9534F',
    fontSize: 11.5,
    marginTop: 4,
  },
  attachPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#2D6A4F',
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: '#F6FAF7',
  },
  attachPhotoText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#2D6A4F',
  },
  photoPreviewWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    height: 120,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#EEF2EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B6351',
  },
  submitBtn: {
    flex: 1.8,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#1E3C25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
