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
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface AddRecordModalProps {
  visible: boolean;
  cropName: string;
  onClose: () => void;
  onSave: (record: {
    recordType: string;
    date: string;
    notes?: string;
    photoUri?: string;
  }) => void;
}

const RECORD_TYPES = [
  'Watering',
  'Fertilizing',
  'Pest control',
  'Spraying',
  'Weeding',
  'Observation',
  'Harvest',
  'Other',
];

export const AddRecordModal: React.FC<AddRecordModalProps> = ({
  visible,
  cropName,
  onClose,
  onSave,
}) => {
  const todayFormatted = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const [selectedType, setSelectedType] = useState<string>('Fertilizing');
  const [recordDate, setRecordDate] = useState<string>(todayFormatted);
  const [notes, setNotes] = useState<string>('');
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);

  // Validation errors
  const [typeError, setTypeError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  const resetForm = () => {
    setSelectedType('Fertilizing');
    setRecordDate(todayFormatted);
    setNotes('');
    setPhotoUri(undefined);
    setTypeError(null);
    setDateError(null);
  };

  const handleRequestClose = () => {
    // Check if user has entered unsaved data
    const hasUnsavedData = notes.trim().length > 0 || !!photoUri || selectedType !== 'Fertilizing';
    if (hasUnsavedData) {
      Alert.alert(
        'Discard Record?',
        'You have unsaved changes. Are you sure you want to discard this record?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              resetForm();
              onClose();
            },
          },
        ]
      );
    } else {
      resetForm();
      onClose();
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera Access Required',
          'Please allow camera permissions to take evidence photos.'
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Error taking photo:', e);
      Alert.alert('Error', 'Could not access camera.');
    }
  };

  const handleChooseFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Photo Library Access Required',
          'Please allow photo library access to attach evidence photos.'
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Error choosing gallery photo:', e);
      Alert.alert('Error', 'Could not open photo library.');
    }
  };

  const handleSave = () => {
    let isValid = true;
    if (!selectedType) {
      setTypeError('Please select a record activity type.');
      isValid = false;
    } else {
      setTypeError(null);
    }

    if (!recordDate.trim()) {
      setDateError('Please enter a valid date.');
      isValid = false;
    } else {
      setDateError(null);
    }

    if (!isValid) return;

    onSave({
      recordType: selectedType,
      date: recordDate.trim(),
      notes: notes.trim() || undefined,
      photoUri,
    });

    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleRequestClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={handleRequestClose}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.sheetContainer}>
                {/* Drag Handle */}
                <View style={styles.handleBar} />

                {/* Header */}
                <View style={styles.sheetHeader}>
                  <View>
                    <Text style={styles.sheetTitle}>Add Record</Text>
                    <Text style={styles.sheetSubtitle}>Log an activity for {cropName}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeCircleBtn}
                    activeOpacity={0.7}
                    onPress={handleRequestClose}
                  >
                    <Feather name="x" size={18} color="#556D59" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.formScrollView}
                  contentContainerStyle={styles.formScrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* 1. Record Activity Type */}
                  <Text style={styles.fieldLabel}>
                    Activity Type <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <View style={styles.pillsWrapRow}>
                    {RECORD_TYPES.map((type) => {
                      const isSelected = selectedType === type;
                      return (
                        <TouchableOpacity
                          key={type}
                          style={[styles.typePill, isSelected && styles.typePillSelected]}
                          activeOpacity={0.8}
                          onPress={() => {
                            setSelectedType(type);
                            setTypeError(null);
                          }}
                        >
                          <Text
                            style={[
                              styles.typePillText,
                              isSelected && styles.typePillTextSelected,
                            ]}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {typeError && <Text style={styles.errorText}>{typeError}</Text>}

                  {/* 2. Date */}
                  <Text style={[styles.fieldLabel, { marginTop: 16 }]}>
                    Date <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <View style={styles.dateInputWrapper}>
                    <Feather name="calendar" size={16} color="#657E6B" style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.textInput}
                      value={recordDate}
                      onChangeText={(val) => {
                        setRecordDate(val);
                        setDateError(null);
                      }}
                      placeholder="e.g. 17 Sep 2026"
                      placeholderTextColor="#9EAFA3"
                    />
                  </View>
                  {dateError && <Text style={styles.errorText}>{dateError}</Text>}

                  {/* 3. Notes */}
                  <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Activity Notes</Text>
                  <TextInput
                    style={styles.notesTextArea}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Enter operation details, inputs used, observations, dosage, etc."
                    placeholderTextColor="#9EAFA3"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />

                  {/* 4. Photo Evidence (Optional) */}
                  <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Photo Evidence (Optional)</Text>
                  {photoUri ? (
                    <View style={styles.photoPreviewContainer}>
                      <Image source={{ uri: photoUri }} style={styles.photoPreviewImage} />
                      <TouchableOpacity
                        style={styles.removePhotoBtn}
                        activeOpacity={0.8}
                        onPress={() => setPhotoUri(undefined)}
                      >
                        <Feather name="trash-2" size={14} color="#FFFFFF" />
                        <Text style={styles.removePhotoText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.photoButtonsRow}>
                      <TouchableOpacity
                        style={styles.photoActionBtn}
                        activeOpacity={0.8}
                        onPress={handleTakePhoto}
                      >
                        <Feather name="camera" size={17} color="#204E2D" style={{ marginRight: 6 }} />
                        <Text style={styles.photoActionBtnText}>Take Photo</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.photoActionBtn}
                        activeOpacity={0.8}
                        onPress={handleChooseFromGallery}
                      >
                        <Ionicons name="images-outline" size={17} color="#204E2D" style={{ marginRight: 6 }} />
                        <Text style={styles.photoActionBtnText}>Gallery</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Spacer for bottom actions */}
                  <View style={{ height: 20 }} />
                </ScrollView>

                {/* Bottom Action Buttons: Cancel and Save */}
                <View style={styles.modalFooterRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    activeOpacity={0.7}
                    onPress={handleRequestClose}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveBtn}
                    activeOpacity={0.88}
                    onPress={handleSave}
                  >
                    <Feather name="check" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>Save Record</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 25, 14, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D9DFD9',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#15321B',
  },
  sheetSubtitle: {
    fontSize: 12.5,
    color: '#6F8474',
    marginTop: 2,
  },
  closeCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0EFE8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formScrollView: {
    maxHeight: 460,
  },
  formScrollContent: {
    paddingBottom: 10,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#213E28',
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: '#C63D2F',
  },
  pillsWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typePill: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F4F5ED',
    borderWidth: 1,
    borderColor: '#E6E9DE',
  },
  typePillSelected: {
    backgroundColor: '#1E4426',
    borderColor: '#1E4426',
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B6252',
  },
  typePillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F2',
    borderWidth: 1,
    borderColor: '#E6E9DE',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#15321B',
    padding: 0,
  },
  notesTextArea: {
    backgroundColor: '#F8F8F2',
    borderWidth: 1,
    borderColor: '#E6E9DE',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#15321B',
    minHeight: 88,
  },
  errorText: {
    fontSize: 11.5,
    color: '#C63D2F',
    marginTop: 4,
    fontWeight: '500',
  },
  photoButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF4EC',
    borderWidth: 1,
    borderColor: '#D4E8D7',
    borderRadius: 14,
    paddingVertical: 11,
  },
  photoActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#204E2D',
  },
  photoPreviewContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    height: 120,
    backgroundColor: '#1B3821',
  },
  photoPreviewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  removePhotoText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EFE8',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0EFE8',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#556D59',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 13,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E4426',
    shadowColor: '#17301C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
