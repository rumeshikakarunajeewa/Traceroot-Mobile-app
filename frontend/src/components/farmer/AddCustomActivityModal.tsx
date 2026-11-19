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
import { Feather } from '@expo/vector-icons';

interface AddCustomActivityModalProps {
  visible: boolean;
  stageTitle: string;
  onClose: () => void;
  onAdd: (data: {
    name: string;
    description?: string;
    date?: string;
    notes?: string;
  }) => { success: boolean; error?: string };
}

export const AddCustomActivityModal: React.FC<AddCustomActivityModalProps> = ({
  visible,
  stageTitle,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleReset = () => {
    setName('');
    setDescription('');
    setDate('');
    setNotes('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter an activity name.');
      return;
    }

    const result = onAdd({
      name: name.trim(),
      description: description.trim() || undefined,
      date: date.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    if (result.success) {
      handleClose();
    } else if (result.error) {
      Alert.alert('Cannot Add Activity', result.error);
    }
  };

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
              <View style={styles.modalCard}>
                {/* Header */}
                <View style={styles.headerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>Add Custom Activity</Text>
                    <Text style={styles.modalSubtitle}>{stageTitle} Stage</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={handleClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Feather name="x" size={20} color="#657B6B" />
                  </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <ScrollView
                  style={styles.formScroll}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>
                      Activity Name <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Mulching, Trellis Repair"
                      placeholderTextColor="#9BAE9E"
                      value={name}
                      onChangeText={setName}
                      autoFocus
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Activity Description (optional)</Text>
                    <TextInput
                      style={[styles.input, styles.multilineInput]}
                      placeholder="e.g., Applied dry organic leaves around plants."
                      placeholderTextColor="#9BAE9E"
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={2}
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Activity Date (optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 28 Sep 2026"
                      placeholderTextColor="#9BAE9E"
                      value={date}
                      onChangeText={setDate}
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Initial Notes (optional)</Text>
                    <TextInput
                      style={[styles.input, styles.multilineInput, { minHeight: 65 }]}
                      placeholder="Optional notes or details about this activity..."
                      placeholderTextColor="#9BAE9E"
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </ScrollView>

                {/* Footer Buttons */}
                <View style={styles.footerRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={handleClose}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleSubmit}
                    activeOpacity={0.88}
                  >
                    <Feather name="plus" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.submitBtnText}>Add Activity</Text>
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
    backgroundColor: 'rgba(16, 32, 20, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  keyboardView: {
    width: '100%',
    maxWidth: 440,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3EE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#183820',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#657B6B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  formScroll: {
    maxHeight: 340,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#284630',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#C84040',
  },
  input: {
    backgroundColor: '#F7FAF7',
    borderWidth: 1,
    borderColor: '#D4E2D6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#15321B',
  },
  multilineInput: {
    minHeight: 55,
    textAlignVertical: 'top',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#EEF3EE',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F0F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#496650',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1E3E26',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
