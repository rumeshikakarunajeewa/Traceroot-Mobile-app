import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { CreateCropPayload, getCropEmoji } from '../../store/cropStore';
import { useDarkMode } from '../../store/uiStore';
import { FieldItem } from '../../types/farmer.types';

interface AddNewCropModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateCrop: (payload: CreateCropPayload) => Promise<FieldItem | null> | FieldItem | null;
}

const QUICK_CROPS = [
  { name: 'Tomato', emoji: '🍅' },
  { name: 'Cucumber', emoji: '🥒' },
  { name: 'Bell Pepper', emoji: '🫑' },
  { name: 'Chilli', emoji: '🌶️' },
  { name: 'Carrot', emoji: '🥕' },
  { name: 'Strawberry', emoji: '🍓' },
  { name: 'Cabbage', emoji: '🥬' },
  { name: 'Eggplant', emoji: '🍆' },
];

export const AddNewCropModal: React.FC<AddNewCropModalProps> = ({
  visible,
  onClose,
  onCreateCrop,
}) => {
  const [isDark] = useDarkMode();

  const [cropName, setCropName] = useState('');
  const [cropVariety, setCropVariety] = useState('');
  const [farmingType, setFarmingType] = useState<'Greenhouse' | 'Open field'>('Greenhouse');

  // Default cultivation start date to formatted current date
  const todayFormatted = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const [startDate, setStartDate] = useState(todayFormatted);
  const [farmFieldName, setFarmFieldName] = useState('Greenhouse Bay 1');
  const [expectedHarvestDate, setExpectedHarvestDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = () => {
    setCropName('');
    setCropVariety('');
    setFarmingType('Greenhouse');
    setStartDate(todayFormatted);
    setFarmFieldName('Greenhouse Bay 1');
    setExpectedHarvestDate('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleQuickCropSelect = (name: string) => {
    setCropName(name);
    // Auto-update field name suggestion if default
    if (farmFieldName === 'Greenhouse Bay 1' || farmFieldName.includes('Bay')) {
      setFarmFieldName(`${name} Field Plot`);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!cropName.trim()) {
      Alert.alert('Crop Name Required', 'Please enter or select a crop name to continue.');
      return;
    }

    if (!farmFieldName.trim()) {
      Alert.alert('Field Name Required', 'Please enter the farm or field name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await onCreateCrop({
        cropName: cropName.trim(),
        cropVariety: cropVariety.trim() || undefined,
        farmingType,
        cultivationStartDate: startDate.trim() || todayFormatted,
        farmFieldName: farmFieldName.trim(),
        expectedHarvestDate: expectedHarvestDate.trim() || undefined,
      });

      if (created) {
        handleClose();
      }
    } catch {
      Alert.alert('Error', 'Unable to create crop. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewEmoji = cropName.trim() ? getCropEmoji(cropName) : '🌱';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.keyboardView}
            >
              <View style={[styles.modalCard, isDark && styles.modalCardDark]}>
                {/* Header */}
                <View style={styles.headerRow}>
                  <View style={styles.headerIconWrap}>
                    <Text style={styles.previewEmojiText}>{previewEmoji}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                      Add New Crop
                    </Text>
                    <Text style={[styles.modalSubtitle, isDark && styles.modalSubtitleDark]}>
                      Start a new organic cultivation journey
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.closeBtn, isDark && styles.closeBtnDark]}
                    onPress={handleClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Feather name="x" size={20} color={isDark ? '#E5EFE7' : '#657B6B'} />
                  </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <ScrollView
                  style={styles.scrollArea}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Crop Name */}
                  <View style={styles.fieldGroup}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>
                        Crop Name
                      </Text>
                      <Text style={styles.requiredStar}>*</Text>
                    </View>
                    <TextInput
                      style={[styles.textInput, isDark && styles.textInputDark]}
                      placeholder="e.g. Tomato, Cucumber, Bell Pepper"
                      placeholderTextColor={isDark ? '#5B7562' : '#9EB0A2'}
                      value={cropName}
                      onChangeText={setCropName}
                      autoCapitalize="words"
                    />

                    {/* Quick suggestion chips */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.quickChipsRow}
                    >
                      {QUICK_CROPS.map((item) => {
                        const isMatch = cropName.toLowerCase() === item.name.toLowerCase();
                        return (
                          <TouchableOpacity
                            key={item.name}
                            style={[
                              styles.quickChip,
                              isDark && styles.quickChipDark,
                              isMatch && styles.quickChipSelected,
                            ]}
                            onPress={() => handleQuickCropSelect(item.name)}
                            activeOpacity={0.75}
                          >
                            <Text style={styles.quickChipEmoji}>{item.emoji}</Text>
                            <Text
                              style={[
                                styles.quickChipText,
                                isDark && styles.quickChipTextDark,
                                isMatch && styles.quickChipTextSelected,
                              ]}
                            >
                              {item.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Crop Variety (Optional) */}
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>
                      Crop Variety (Optional)
                    </Text>
                    <TextInput
                      style={[styles.textInput, isDark && styles.textInputDark]}
                      placeholder="e.g. Cherry Tomato, Hybrid F1, Roma"
                      placeholderTextColor={isDark ? '#5B7562' : '#9EB0A2'}
                      value={cropVariety}
                      onChangeText={setCropVariety}
                    />
                  </View>

                  {/* Farming Type */}
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>
                      Farming Type
                    </Text>
                    <View style={styles.toggleRow}>
                      <TouchableOpacity
                        style={[
                          styles.toggleOption,
                          isDark && styles.toggleOptionDark,
                          farmingType === 'Greenhouse' && styles.toggleOptionActive,
                        ]}
                        onPress={() => setFarmingType('Greenhouse')}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons
                          name="greenhouse"
                          size={18}
                          color={farmingType === 'Greenhouse' ? '#FFFFFF' : isDark ? '#9CB3A0' : '#457353'}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            styles.toggleOptionText,
                            isDark && styles.toggleOptionTextDark,
                            farmingType === 'Greenhouse' && styles.toggleOptionTextActive,
                          ]}
                        >
                          Greenhouse
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.toggleOption,
                          isDark && styles.toggleOptionDark,
                          farmingType === 'Open field' && styles.toggleOptionActive,
                        ]}
                        onPress={() => setFarmingType('Open field')}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons
                          name="terrain"
                          size={18}
                          color={farmingType === 'Open field' ? '#FFFFFF' : isDark ? '#9CB3A0' : '#457353'}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            styles.toggleOptionText,
                            isDark && styles.toggleOptionTextDark,
                            farmingType === 'Open field' && styles.toggleOptionTextActive,
                          ]}
                        >
                          Open Field
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Farm / Field Name */}
                  <View style={styles.fieldGroup}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>
                        Farm / Field Name
                      </Text>
                      <Text style={styles.requiredStar}>*</Text>
                    </View>
                    <TextInput
                      style={[styles.textInput, isDark && styles.textInputDark]}
                      placeholder="e.g. Greenhouse Bay 1, Plot A"
                      placeholderTextColor={isDark ? '#5B7562' : '#9EB0A2'}
                      value={farmFieldName}
                      onChangeText={setFarmFieldName}
                    />
                  </View>

                  {/* Two Columns: Start Date & Harvest Date */}
                  <View style={styles.twoColRow}>
                    <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                      <View style={styles.labelRow}>
                        <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>
                          Start Date
                        </Text>
                        <Text style={styles.requiredStar}>*</Text>
                      </View>
                      <TextInput
                        style={[styles.textInput, isDark && styles.textInputDark]}
                        placeholder="e.g. 7 Nov 2026"
                        placeholderTextColor={isDark ? '#5B7562' : '#9EB0A2'}
                        value={startDate}
                        onChangeText={setStartDate}
                      />
                    </View>

                    <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>
                        Expected Harvest
                      </Text>
                      <TextInput
                        style={[styles.textInput, isDark && styles.textInputDark]}
                        placeholder="Optional"
                        placeholderTextColor={isDark ? '#5B7562' : '#9EB0A2'}
                        value={expectedHarvestDate}
                        onChangeText={setExpectedHarvestDate}
                      />
                    </View>
                  </View>

                  {/* Batch Info Preview Notice */}
                  <View style={[styles.previewBatchCard, isDark && styles.previewBatchCardDark]}>
                    <MaterialCommunityIcons
                      name="shield-check-outline"
                      size={18}
                      color={isDark ? '#4ADE80' : '#2A6638'}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.previewBatchText, isDark && styles.previewBatchTextDark]}>
                      Initial stage set to <Text style={{ fontWeight: '700' }}>Planting</Text> (0% progress) with automatic batch identification & traceability.
                    </Text>
                  </View>
                </ScrollView>

                {/* Modal Footer Actions */}
                <View style={[styles.actionRow, isDark && styles.actionRowDark]}>
                  <TouchableOpacity
                    style={[styles.cancelBtn, isDark && styles.cancelBtnDark]}
                    onPress={handleClose}
                    disabled={isSubmitting}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.cancelBtnText, isDark && styles.cancelBtnTextDark]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      isDark && styles.submitBtnDark,
                      (!cropName.trim() || isSubmitting) && styles.submitBtnDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={!cropName.trim() || isSubmitting}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.submitBtnText}>
                      {isSubmitting ? 'Creating...' : 'Create Crop & Start Recording'}
                    </Text>
                    {!isSubmitting && (
                      <Feather name="arrow-up-right" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  keyboardView: {
    width: '100%',
    maxWidth: 440,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 8,
  },
  modalCardDark: {
    backgroundColor: '#18271C',
    borderColor: '#283D2C',
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDF5EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewEmojiText: {
    fontSize: 22,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16351E',
  },
  modalTitleDark: {
    color: '#F0F5F1',
  },
  modalSubtitle: {
    fontSize: 12.5,
    color: '#657E6B',
    marginTop: 2,
  },
  modalSubtitleDark: {
    color: '#9CB3A0',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnDark: {
    backgroundColor: '#223827',
  },
  scrollArea: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#284631',
    marginBottom: 6,
  },
  fieldLabelDark: {
    color: '#E5EFE7',
  },
  requiredStar: {
    color: '#D9534F',
    marginLeft: 3,
    marginBottom: 6,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: '#F7FAF7',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D4E2D7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1B3C24',
  },
  textInputDark: {
    backgroundColor: '#111D14',
    borderColor: '#283D2C',
    color: '#F0F5F1',
  },
  quickChipsRow: {
    flexDirection: 'row',
    paddingTop: 8,
    gap: 8,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F5F1',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#D6E5D9',
  },
  quickChipDark: {
    backgroundColor: '#1F3324',
    borderColor: '#2D4E35',
  },
  quickChipSelected: {
    backgroundColor: '#1E3E26',
    borderColor: '#1E3E26',
  },
  quickChipEmoji: {
    fontSize: 13,
    marginRight: 4,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34523C',
  },
  quickChipTextDark: {
    color: '#C6D9CA',
  },
  quickChipTextSelected: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F8F5',
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D6E3D8',
  },
  toggleOptionDark: {
    backgroundColor: '#1E3324',
    borderColor: '#2D4E35',
  },
  toggleOptionActive: {
    backgroundColor: '#1E3E26',
    borderColor: '#1E3E26',
  },
  toggleOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B5942',
  },
  toggleOptionTextDark: {
    color: '#C6D9CA',
  },
  toggleOptionTextActive: {
    color: '#FFFFFF',
  },
  twoColRow: {
    flexDirection: 'row',
  },
  previewBatchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF5EE',
    borderRadius: 12,
    padding: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#D4E4D6',
  },
  previewBatchCardDark: {
    backgroundColor: '#16281B',
    borderColor: '#243D2A',
  },
  previewBatchText: {
    flex: 1,
    fontSize: 11.5,
    color: '#2A6638',
    lineHeight: 16,
  },
  previewBatchTextDark: {
    color: '#9CB3A0',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEF3EE',
  },
  actionRowDark: {
    borderTopColor: '#283D2C',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F7F4',
  },
  cancelBtnDark: {
    backgroundColor: '#223827',
  },
  cancelBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#4B6251',
  },
  cancelBtnTextDark: {
    color: '#9CB3A0',
  },
  submitBtn: {
    flex: 2.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B3C24',
    borderRadius: 14,
    paddingVertical: 12,
  },
  submitBtnDark: {
    backgroundColor: '#2D5936',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

