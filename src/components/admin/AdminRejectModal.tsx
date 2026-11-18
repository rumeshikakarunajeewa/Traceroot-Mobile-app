import React from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity } from 'react-native';
import { VerificationRequestItem } from '../../services/admin.service';

interface AdminRejectModalProps {
  visible: boolean;
  request: VerificationRequestItem | null;
  rejectReason: string;
  isDark: boolean;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export const AdminRejectModal: React.FC<AdminRejectModalProps> = ({
  visible,
  request,
  rejectReason,
  isDark,
  onReasonChange,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalBox, isDark && styles.modalBoxDark]}>
          <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>Reject Request</Text>
          <Text style={[styles.modalDesc, isDark && styles.modalDescDark]}>
            Please provide a reason for rejecting {request?.userName}&apos;s verification:
          </Text>
          <TextInput
            style={[styles.modalInput, isDark && styles.modalInputDark]}
            placeholder="e.g. Document image is unreadable, invalid registration..."
            placeholderTextColor={isDark ? '#5E7D65' : '#999'}
            value={rejectReason}
            onChangeText={onReasonChange}
            multiline
            numberOfLines={3}
          />
          <View style={styles.modalBtnsRow}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={[styles.modalCancelText, isDark && styles.modalCancelTextDark]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalConfirmRejectBtn}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.modalConfirmRejectText}>Confirm Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalBoxDark: {
    backgroundColor: '#162219',
    borderColor: '#24382A',
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C3723',
  },
  modalTitleDark: {
    color: '#E8F5E9',
  },
  modalDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    marginBottom: 10,
  },
  modalDescDark: {
    color: '#9CB3A0',
  },
  modalInput: {
    backgroundColor: '#F7F9F6',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#E2E5DF',
    minHeight: 75,
    textAlignVertical: 'top',
    color: '#1C3723',
  },
  modalInputDark: {
    backgroundColor: '#1F3124',
    borderColor: '#2A4331',
    color: '#E8F5E9',
  },
  modalBtnsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  modalCancelTextDark: {
    color: '#9CB3A0',
  },
  modalConfirmRejectBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalConfirmRejectText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
