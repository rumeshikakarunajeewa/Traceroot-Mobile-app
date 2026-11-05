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
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { StageActivityTemplate } from '../../constants/stages';
import { RecentRecordItem } from '../../types/farmer.types';

interface ActivityNotesModalProps {
  visible: boolean;
  activity: StageActivityTemplate | null;
  cropName: string;
  batchId?: string;
  existingRecords: RecentRecordItem[];
  onClose: () => void;
  onSave: (notes: string, photoUri?: string) => void;
}

interface ActivityNotesFormProps {
  activity: StageActivityTemplate;
  cropName: string;
  existingRecords: RecentRecordItem[];
  onClose: () => void;
  onSave: (notes: string, photoUri?: string) => void;
}

const ActivityNotesForm: React.FC<ActivityNotesFormProps> = ({
  activity,
  cropName,
  existingRecords,
  onClose,
  onSave,
}) => {
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [showAddAnother, setShowAddAnother] = useState(existingRecords.length === 0);

  const handlePickPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Denied',
          'Camera roll access is needed to attach photo evidence.'
        );
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
    if (!notes.trim()) {
      setNotesError('Please enter activity notes before saving.');
      return;
    }

    onSave(notes.trim(), photoUri);
    setNotes('');
    setPhotoUri(undefined);
    setNotesError(null);
    onClose();
  };

  const isCompleted = existingRecords.length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.modalCard}
    >
      {/* Header */}
      <View style={styles.modalHeader}>
        <View style={styles.headerTitleCol}>
          <View style={styles.titleWithBadgeRow}>
            <Text style={styles.modalTitle}>{activity.name}</Text>
            {isCompleted && (
              <View style={styles.completedBadgePill}>
                <Feather name="check" size={11} color="#1E6F38" style={{ marginRight: 3 }} />
                <Text style={styles.completedBadgeText}>Completed</Text>
              </View>
            )}
          </View>
          <Text style={styles.modalSubtitle}>
            {cropName} • Planting Stage
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Existing Notes History (if any) */}
        {existingRecords.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionHeading}>
              Saved Notes ({existingRecords.length})
            </Text>
            {existingRecords.map((item, idx) => (
              <View key={item.id || item.recordCode || `hist-${idx}`} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyCode}>{item.recordCode}</Text>
                  <Text style={styles.historyDate}>
                    {item.date} {item.time ? `• ${item.time}` : ''}
                  </Text>
                </View>
                <Text style={styles.historyNotesText}>
                  {item.notes || 'Note recorded.'}
                </Text>
                {item.photoUrl && (
                  <Image source={{ uri: item.photoUrl }} style={styles.historyPhotoThumbnail} />
                )}
              </View>
            ))}

            {!showAddAnother && (
              <TouchableOpacity
                style={styles.addAnotherBtn}
                activeOpacity={0.8}
                onPress={() => setShowAddAnother(true)}
              >
                <Feather name="plus-circle" size={16} color="#1E3C25" style={{ marginRight: 6 }} />
                <Text style={styles.addAnotherBtnText}>Add Another Note</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Note Entry Area (Visible if no notes yet or if 'Add Another' is toggled) */}
        {showAddAnother && (
          <View style={styles.formSection}>
            {existingRecords.length > 0 && (
              <Text style={styles.sectionHeading}>New Note</Text>
            )}

            {/* Multiline Text Area */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Activity Notes <Text style={{ color: '#D9534F' }}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput, notesError && styles.inputErrorBorder]}
                placeholder="Enter activity notes (e.g., Prepared the soil, removed weeds, and added organic compost)..."
                placeholderTextColor="#9CB0A1"
                value={notes}
                onChangeText={(val) => {
                  setNotes(val);
                  if (val.trim()) setNotesError(null);
                }}
                multiline
                numberOfLines={4}
              />
              {notesError && <Text style={styles.errorText}>{notesError}</Text>}
            </View>

            {/* Photo Evidence */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Photo Evidence (Optional)</Text>
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
                  activeOpacity={0.8}
                >
                  <Feather name="camera" size={18} color="#2D6A4F" style={{ marginRight: 8 }} />
                  <Text style={styles.attachPhotoText}>Attach Photo Evidence</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelBtnText}>
            {isCompleted && !showAddAnother ? 'Close' : 'Cancel'}
          </Text>
        </TouchableOpacity>

        {showAddAnother && (
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSave}
            activeOpacity={0.88}
          >
            <Text style={styles.submitBtnText}>Save Notes</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export const ActivityNotesModal: React.FC<ActivityNotesModalProps> = ({
  visible,
  activity,
  cropName,
  batchId,
  existingRecords,
  onClose,
  onSave,
}) => {
  if (!activity) return null;

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
            <ActivityNotesForm
              key={`${activity.id}-${existingRecords.length}`}
              activity={activity}
              cropName={cropName}
              existingRecords={existingRecords}
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
  headerTitleCol: {
    flex: 1,
    marginRight: 10,
  },
  titleWithBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16331C',
  },
  completedBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E6F38',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#65816D',
    marginTop: 3,
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
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#496751',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  historySection: {
    marginBottom: 16,
  },
  historyCard: {
    backgroundColor: '#F7FAF7',
    borderWidth: 1,
    borderColor: '#E2ECE3',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2D6A4F',
  },
  historyDate: {
    fontSize: 11.5,
    color: '#768E7C',
  },
  historyNotesText: {
    fontSize: 13.5,
    color: '#1D3823',
    lineHeight: 18,
  },
  historyPhotoThumbnail: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    marginTop: 8,
  },
  addAnotherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF5EE',
    borderWidth: 1,
    borderColor: '#CDE5D4',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  addAnotherBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3C25',
  },
  formSection: {
    marginTop: 4,
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
    height: 95,
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
    height: 130,
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
