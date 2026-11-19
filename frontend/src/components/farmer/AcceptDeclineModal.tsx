import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Order } from '../../lib/api/orders';

interface AcceptDeclineModalProps {
  action: 'accept' | 'decline';
  order: Order;
  onCancel: () => void;
  onConfirm: (reason?: string) => void;
}

export default function AcceptDeclineModal({
  action,
  order,
  onCancel,
  onConfirm,
}: AcceptDeclineModalProps) {
  const [reason, setReason] = useState('');

  const isAccept = action === 'accept';

  const handleConfirm = () => {
    if (isAccept) {
      onConfirm();
    } else {
      onConfirm(reason.trim() || undefined);
    }
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.backdrop}>
          <View style={styles.container}>
            {/* Header Icon */}
            <View
              style={[
                styles.iconWrapper,
                { backgroundColor: isAccept ? '#E1EFE3' : '#FDE8E8' },
              ]}
            >
              <Feather
                name={isAccept ? 'check-circle' : 'alert-circle'}
                size={28}
                color={isAccept ? '#225129' : '#9B1C1C'}
              />
            </View>

            <Text style={styles.title}>
              {isAccept ? 'Accept Buyer Order' : 'Decline Buyer Order'}
            </Text>

            <Text style={styles.subtitle}>
              {order.id} • {order.crop_name} ({order.quantity} {order.unit})
            </Text>

            <Text style={styles.buyerInfo}>
              Buyer: {order.buyer_name} • Total: LKR {order.total_price.toLocaleString()}
            </Text>

            {isAccept ? (
              <Text style={styles.confirmPrompt}>
                By accepting this order, you commit to preparing and packaging the requested quantity for delivery.
              </Text>
            ) : (
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Reason for declining (optional):</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Stock exhausted, weather delay..."
                  placeholderTextColor="#9AADA0"
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}

            <View style={styles.buttonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  { backgroundColor: isAccept ? '#225129' : '#C8402A' },
                ]}
                onPress={handleConfirm}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmBtnText}>
                  {isAccept ? 'Confirm Accept' : 'Decline Order'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 30, 18, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 360,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16351E',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B5742',
    textAlign: 'center',
  },
  buyerInfo: {
    fontSize: 12,
    color: '#768B7A',
    marginTop: 4,
    marginBottom: 14,
    textAlign: 'center',
  },
  confirmPrompt: {
    fontSize: 13,
    color: '#4B6251',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 18,
    backgroundColor: '#F7FAF7',
    padding: 12,
    borderRadius: 14,
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    color: '#4B6251',
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D4E0D6',
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    color: '#16351E',
    minHeight: 70,
    textAlignVertical: 'top',
    backgroundColor: '#FAFBF9',
  },
  buttonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#EAEFEA',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#455F4A',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1.3,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
