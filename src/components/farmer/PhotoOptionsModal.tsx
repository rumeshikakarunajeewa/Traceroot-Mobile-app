import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface PhotoOptionsModalProps {
  visible: boolean;
  fieldName: string;
  onClose: () => void;
  onTakePhoto: () => void;
  onChooseFromGallery: () => void;
  onRemovePhoto: () => void;
  hasPhoto: boolean;
}

export const PhotoOptionsModal: React.FC<PhotoOptionsModalProps> = ({
  visible,
  fieldName,
  onClose,
  onTakePhoto,
  onChooseFromGallery,
  onRemovePhoto,
  hasPhoto,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              <View style={styles.handleBar} />

              <Text style={styles.sheetTitle}>Field Photo</Text>
              <Text style={styles.sheetSubtitle}>Update photo for {fieldName}</Text>

              {/* Action Options */}
              <View style={styles.optionsList}>
                <TouchableOpacity
                  style={styles.optionItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    onClose();
                    onTakePhoto();
                  }}
                >
                  <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                    <Feather name="camera" size={20} color="#187A36" />
                  </View>
                  <Text style={styles.optionLabel}>Take photo</Text>
                  <Feather name="chevron-right" size={18} color="#8A9E8D" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.optionItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    onClose();
                    onChooseFromGallery();
                  }}
                >
                  <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
                    <Ionicons name="images-outline" size={20} color="#1976D2" />
                  </View>
                  <Text style={styles.optionLabel}>Choose from gallery</Text>
                  <Feather name="chevron-right" size={18} color="#8A9E8D" />
                </TouchableOpacity>

                {hasPhoto && (
                  <TouchableOpacity
                    style={[styles.optionItem, styles.removeOption]}
                    activeOpacity={0.7}
                    onPress={() => {
                      onClose();
                      onRemovePhoto();
                    }}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: '#FFEBEE' }]}>
                      <MaterialCommunityIcons name="trash-can-outline" size={20} color="#D32F2F" />
                    </View>
                    <Text style={[styles.optionLabel, { color: '#D32F2F' }]}>Remove photo</Text>
                    <Feather name="chevron-right" size={18} color="#EF9A9A" />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.cancelBtn}
                activeOpacity={0.75}
                onPress={onClose}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D6D4CC',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#15321B',
    textAlign: 'center',
  },
  sheetSubtitle: {
    fontSize: 13,
    color: '#657E6B',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 20,
  },
  optionsList: {
    gap: 10,
    marginBottom: 18,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F6F0',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  removeOption: {
    backgroundColor: '#FFF8F8',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1C3122',
  },
  cancelBtn: {
    backgroundColor: '#F0ECE1',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#556958',
  },
});
