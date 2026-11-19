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
  Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { StageApplicabilityRecord } from '../../types/farmer.types';

interface StageActionModalProps {
  visible: boolean;
  stageTitle: string;
  stageNumber: number;
  recordCount: number;
  stageApplicability?: StageApplicabilityRecord;
  onClose: () => void;
  onViewRecords: () => void;
  onConfirmNotApplicable: (reason: string) => void;
  onReactivateStage: () => void;
}

export const StageActionModal: React.FC<StageActionModalProps> = ({
  visible,
  stageTitle,
  stageNumber,
  recordCount,
  stageApplicability,
  onClose,
  onViewRecords,
  onConfirmNotApplicable,
  onReactivateStage,
}) => {
  const [viewState, setViewState] = useState<'menu' | 'confirm_na_form'>('menu');
  const [reason, setReason] = useState('');

  const isAlreadyNotApplicable = stageApplicability?.isNotApplicable ?? false;

  const handleClose = () => {
    setViewState('menu');
    setReason('');
    onClose();
  };

  const handleConfirmSkip = () => {
    if (!reason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason why this entire stage is not applicable for this crop.');
      return;
    }
    onConfirmNotApplicable(reason.trim());
    handleClose();
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
                {viewState === 'menu' ? (
                  // Menu View
                  <View>
                    <View style={styles.headerRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.title}>Stage Options</Text>
                        <Text style={styles.subtitle}>{stageTitle} Stage (#{stageNumber})</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={handleClose}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Feather name="x" size={20} color="#657B6B" />
                      </TouchableOpacity>
                    </View>

                    {isAlreadyNotApplicable && (
                      <View style={styles.naAlertBox}>
                        <View style={styles.naAlertHeader}>
                          <Feather name="minus-circle" size={15} color="#657C6A" style={{ marginRight: 6 }} />
                          <Text style={styles.naAlertTitle}>Stage is marked as Not Applicable</Text>
                        </View>
                        {stageApplicability?.reason ? (
                          <Text style={styles.naAlertReason}>
                            Reason: &quot;{stageApplicability.reason}&quot;
                          </Text>
                        ) : null}
                      </View>
                    )}

                    <View style={styles.optionsList}>
                      {/* Option 1: View Stage Records */}
                      <TouchableOpacity
                        style={styles.optionBtn}
                        activeOpacity={0.8}
                        onPress={() => {
                          handleClose();
                          onViewRecords();
                        }}
                      >
                        <View style={styles.optionIconCircle}>
                          <Ionicons name="document-text-outline" size={18} color="#255932" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.optionTitle}>View Stage Records</Text>
                          <Text style={styles.optionDesc}>
                            {recordCount} {recordCount === 1 ? 'record' : 'records'} logged for {stageTitle}
                          </Text>
                        </View>
                        <Feather name="chevron-right" size={18} color="#7F9B86" />
                      </TouchableOpacity>

                      {/* Option 2: Mark Stage Not Applicable OR Reactivate */}
                      {!isAlreadyNotApplicable ? (
                        <TouchableOpacity
                          style={styles.optionBtnWarning}
                          activeOpacity={0.8}
                          onPress={() => setViewState('confirm_na_form')}
                        >
                          <View style={styles.optionIconCircleWarning}>
                            <Feather name="minus-circle" size={18} color="#8F5938" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.optionTitleWarning}>Mark Stage as Not Applicable</Text>
                            <Text style={styles.optionDesc}>
                              Skip this entire stage if not required for this crop
                            </Text>
                          </View>
                          <Feather name="chevron-right" size={18} color="#A88B77" />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.optionBtnReactivate}
                          activeOpacity={0.8}
                          onPress={() => {
                            onReactivateStage();
                            handleClose();
                          }}
                        >
                          <View style={styles.optionIconCircleReactivate}>
                            <Ionicons name="refresh" size={18} color="#1E5C31" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.optionTitleReactivate}>Reactivate Stage</Text>
                            <Text style={styles.optionDesc}>
                              Mark {stageTitle} as an applicable stage again
                            </Text>
                          </View>
                          <Feather name="check" size={18} color="#1E5C31" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.cancelLink}
                      onPress={handleClose}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cancelLinkText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  // Confirmation Form
                  <View>
                    <View style={styles.headerRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.title}>Mark Stage as Not Applicable?</Text>
                        <Text style={styles.subtitle}>Stage: {stageTitle}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={() => setViewState('menu')}
                      >
                        <Feather name="arrow-left" size={20} color="#657B6B" />
                      </TouchableOpacity>
                    </View>

                    {/* Warning if records already exist */}
                    {recordCount > 0 && (
                      <View style={styles.recordWarningBox}>
                        <Feather name="alert-triangle" size={16} color="#A46328" style={{ marginTop: 2, marginRight: 8 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.recordWarningTitle}>Existing Records Detected</Text>
                          <Text style={styles.recordWarningText}>
                            There are {recordCount} {recordCount === 1 ? 'record' : 'records'} logged for this stage. Marking this stage as Not Applicable will NOT delete these records. They will remain safely in your audit trail.
                          </Text>
                        </View>
                      </View>
                    )}

                    <Text style={styles.explanationText}>
                      Some crops do not require all five stages (e.g., leafy greens harvested before flowering). Provide a reason below:
                    </Text>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        Reason for skipping stage <Text style={styles.requiredStar}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.textArea}
                        placeholder="e.g., Lettuce is harvested as vegetative leafy greens before flowering begins."
                        placeholderTextColor="#9BAE9E"
                        value={reason}
                        onChangeText={setReason}
                        multiline
                        numberOfLines={3}
                        autoFocus
                      />
                    </View>

                    <View style={styles.btnRow}>
                      <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => setViewState('menu')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.backBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.confirmBtn}
                        onPress={handleConfirmSkip}
                        activeOpacity={0.88}
                      >
                        <Text style={styles.confirmBtnText}>Confirm</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
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
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3EE',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#183820',
  },
  subtitle: {
    fontSize: 13,
    color: '#657B6B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  naAlertBox: {
    backgroundColor: '#F5F7F5',
    borderWidth: 1,
    borderColor: '#DFE8E1',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  naAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  naAlertTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B5742',
  },
  naAlertReason: {
    fontSize: 12,
    color: '#55705C',
    fontStyle: 'italic',
    marginTop: 4,
  },
  optionsList: {
    gap: 10,
    marginBottom: 12,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAF7',
    borderWidth: 1,
    borderColor: '#D8E5DA',
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  optionIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E6EFE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D3B24',
  },
  optionDesc: {
    fontSize: 12,
    color: '#66826D',
    marginTop: 2,
  },
  optionBtnWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F4',
    borderWidth: 1,
    borderColor: '#F0D4C5',
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  optionIconCircleWarning: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FAECE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitleWarning: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7A3F20',
  },
  optionBtnReactivate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF5EE',
    borderWidth: 1,
    borderColor: '#BFDFC7',
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  optionIconCircleReactivate: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#D1EBD8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitleReactivate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#154823',
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelLinkText: {
    fontSize: 14,
    color: '#647D6A',
    fontWeight: '600',
  },
  recordWarningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF8EB',
    borderWidth: 1,
    borderColor: '#F1DCB8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  recordWarningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#874B16',
    marginBottom: 2,
  },
  recordWarningText: {
    fontSize: 12,
    color: '#70441E',
    lineHeight: 16,
  },
  explanationText: {
    fontSize: 13,
    color: '#556D5B',
    lineHeight: 18,
    marginBottom: 14,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#284630',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#C84040',
  },
  textArea: {
    backgroundColor: '#F7FAF7',
    borderWidth: 1,
    borderColor: '#D4E2D6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#15321B',
    minHeight: 75,
    textAlignVertical: 'top',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEF3EE',
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F0F4F1',
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#496650',
  },
  confirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#2A5436',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

