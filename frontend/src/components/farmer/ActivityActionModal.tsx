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
import { StageActivityTemplate } from '../../constants/stages';
import { ActivityApplicabilityRecord } from '../../types/farmer.types';

interface ActivityActionModalProps {
  visible: boolean;
  activity: StageActivityTemplate | null;
  applicabilityRecord?: ActivityApplicabilityRecord;
  onClose: () => void;
  onAddRecord: () => void;
  onConfirmNotApplicable: (reason: string, notes?: string) => void;
  onReactivateActivity: () => void;
}

export const ActivityActionModal: React.FC<ActivityActionModalProps> = ({
  visible,
  activity,
  applicabilityRecord,
  onClose,
  onAddRecord,
  onConfirmNotApplicable,
  onReactivateActivity,
}) => {
  const [viewState, setViewState] = useState<'menu' | 'not_applicable_form'>('menu');
  const [reason, setReason] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const isAlreadyNotApplicable = applicabilityRecord?.isNotApplicable ?? false;

  const handleClose = () => {
    setViewState('menu');
    setReason('');
    setAdditionalNotes('');
    onClose();
  };

  const handleConfirmSkip = () => {
    if (!reason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason why this activity is not applicable.');
      return;
    }
    onConfirmNotApplicable(reason.trim(), additionalNotes.trim() || undefined);
    handleClose();
  };

  if (!activity) return null;

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
                  // Step 1: Action Selection Menu
                  <View>
                    <View style={styles.headerRow}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.activityTitle}>{activity.name}</Text>
                        {activity.isCustom && (
                          <View style={styles.customBadge}>
                            <Text style={styles.customBadgeText}>Custom Activity</Text>
                          </View>
                        )}
                        {isAlreadyNotApplicable && (
                          <View style={styles.naBadge}>
                            <Feather name="minus-circle" size={13} color="#7F8D83" style={{ marginRight: 4 }} />
                            <Text style={styles.naBadgeText}>Currently marked as Not Applicable</Text>
                          </View>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={handleClose}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Feather name="x" size={20} color="#657B6B" />
                      </TouchableOpacity>
                    </View>

                    {isAlreadyNotApplicable && applicabilityRecord?.reason ? (
                      <View style={styles.reasonNoticeBox}>
                        <Text style={styles.reasonNoticeLabel}>Recorded Skip Reason:</Text>
                        <Text style={styles.reasonNoticeText}>{applicabilityRecord.reason}</Text>
                        {applicabilityRecord.additionalNotes ? (
                          <Text style={styles.reasonNoticeNotes}>
                            Notes: {applicabilityRecord.additionalNotes}
                          </Text>
                        ) : null}
                      </View>
                    ) : null}

                    <Text style={styles.menuPromptText}>Select an action for this activity:</Text>

                    <View style={styles.menuOptionsList}>
                      {/* Option 1: Add Record */}
                      <TouchableOpacity
                        style={styles.menuOptionBtnPrimary}
                        activeOpacity={0.85}
                        onPress={() => {
                          handleClose();
                          onAddRecord();
                        }}
                      >
                        <View style={styles.menuOptionIconWrapPrimary}>
                          <Feather name="plus-circle" size={18} color="#FFFFFF" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.menuOptionTitlePrimary}>Add Record</Text>
                          <Text style={styles.menuOptionSubPrimary}>
                            Log observations, measurements, or notes
                          </Text>
                        </View>
                        <Feather name="chevron-right" size={18} color="#FFFFFF" />
                      </TouchableOpacity>

                      {/* Option 2: Mark Not Applicable OR Reactivate */}
                      {!isAlreadyNotApplicable ? (
                        <TouchableOpacity
                          style={styles.menuOptionBtnSecondary}
                          activeOpacity={0.8}
                          onPress={() => setViewState('not_applicable_form')}
                        >
                          <View style={styles.menuOptionIconWrapSecondary}>
                            <Feather name="minus-circle" size={18} color="#556F5C" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.menuOptionTitleSecondary}>Mark Not Applicable</Text>
                            <Text style={styles.menuOptionSubSecondary}>
                              Skip this activity if not needed for this crop
                            </Text>
                          </View>
                          <Feather name="chevron-right" size={18} color="#859E8C" />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.menuOptionBtnReactivate}
                          activeOpacity={0.8}
                          onPress={() => {
                            onReactivateActivity();
                            handleClose();
                          }}
                        >
                          <View style={styles.menuOptionIconWrapReactivate}>
                            <Ionicons name="refresh" size={18} color="#215930" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.menuOptionTitleReactivate}>Reactivate Activity</Text>
                            <Text style={styles.menuOptionSubSecondary}>
                              Mark this activity as applicable again
                            </Text>
                          </View>
                          <Feather name="check" size={18} color="#215930" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.cancelFullBtn}
                      activeOpacity={0.7}
                      onPress={handleClose}
                    >
                      <Text style={styles.cancelFullBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  // Step 2: Confirmation Form for Not Applicable
                  <View>
                    <View style={styles.headerRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.activityTitle}>Mark as Not Applicable</Text>
                        <Text style={styles.activitySubtitle}>{activity.name}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={() => setViewState('menu')}
                      >
                        <Feather name="arrow-left" size={20} color="#657B6B" />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.instructionText}>
                      Please specify why this activity is not applicable for your crop. This will be preserved in your traceability audit history.
                    </Text>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        Reason for skipping <Text style={styles.requiredStar}>*</Text>
                      </Text>
                      <TextInput
                        style={[styles.textInput, styles.multilineInput]}
                        placeholder="e.g., No assisted pollination was required for this crop."
                        placeholderTextColor="#9BAE9E"
                        value={reason}
                        onChangeText={setReason}
                        multiline
                        numberOfLines={3}
                        autoFocus
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Additional Notes (optional)</Text>
                      <TextInput
                        style={[styles.textInput, styles.multilineInput, { minHeight: 50 }]}
                        placeholder="Any additional context or agronomic observation..."
                        placeholderTextColor="#9BAE9E"
                        value={additionalNotes}
                        onChangeText={setAdditionalNotes}
                        multiline
                        numberOfLines={2}
                      />
                    </View>

                    <View style={styles.confirmRow}>
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => setViewState('menu')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cancelBtnText}>Back</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.confirmSkipBtn}
                        onPress={handleConfirmSkip}
                        activeOpacity={0.88}
                      >
                        <Feather name="minus-circle" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.confirmSkipBtnText}>Confirm Not Applicable</Text>
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
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3EE',
  },
  activityTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#183820',
  },
  activitySubtitle: {
    fontSize: 13,
    color: '#657B6B',
    marginTop: 2,
  },
  customBadge: {
    backgroundColor: '#E8F2EA',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  customBadgeText: {
    fontSize: 11,
    color: '#285834',
    fontWeight: '600',
  },
  naBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F3F1',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  naBadgeText: {
    fontSize: 11,
    color: '#637568',
    fontWeight: '500',
  },
  reasonNoticeBox: {
    backgroundColor: '#F5F8F6',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#7A9A80',
  },
  reasonNoticeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#496B52',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  reasonNoticeText: {
    fontSize: 13,
    color: '#1F3826',
    fontStyle: 'italic',
  },
  reasonNoticeNotes: {
    fontSize: 12,
    color: '#55725E',
    marginTop: 4,
  },
  menuPromptText: {
    fontSize: 13,
    color: '#607967',
    marginBottom: 12,
  },
  menuOptionsList: {
    gap: 10,
    marginBottom: 14,
  },
  menuOptionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3E26',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  menuOptionIconWrapPrimary: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuOptionTitlePrimary: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  menuOptionSubPrimary: {
    fontSize: 12,
    color: '#D4E6D8',
    marginTop: 2,
  },
  menuOptionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F7F4',
    borderWidth: 1,
    borderColor: '#D8E4D9',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  menuOptionIconWrapSecondary: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6ECE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuOptionTitleSecondary: {
    fontSize: 14,
    fontWeight: '700',
    color: '#284630',
  },
  menuOptionSubSecondary: {
    fontSize: 12,
    color: '#6A8471',
    marginTop: 2,
  },
  menuOptionBtnReactivate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF4ED',
    borderWidth: 1,
    borderColor: '#BDDEC5',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  menuOptionIconWrapReactivate: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#CFE6D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuOptionTitleReactivate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C4A26',
  },
  cancelFullBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelFullBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#657B6B',
  },
  instructionText: {
    fontSize: 13,
    color: '#526A59',
    lineHeight: 18,
    marginBottom: 14,
  },
  fieldGroup: {
    marginBottom: 12,
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
  textInput: {
    backgroundColor: '#F7FAF7',
    borderWidth: 1,
    borderColor: '#D4E2D6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#15321B',
  },
  multilineInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
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
  confirmSkipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#4A6B53',
    justifyContent: 'center',
  },
  confirmSkipBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 4,
  },
});
