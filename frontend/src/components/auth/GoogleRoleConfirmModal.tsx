import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../lib/theme';
import { UserRole } from '../../types/auth.types';

type AllowedRole = 'buyer' | 'farmer' | 'supplier';

interface RoleOption {
  id: AllowedRole;
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  tag: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'buyer',
    title: 'Buyer',
    subtitle: 'Source fresh farm produce directly from verified farmers with traceability.',
    icon: 'cart-outline',
    tag: 'Retailer / Wholesaler',
  },
  {
    id: 'farmer',
    title: 'Farmer',
    subtitle: 'Sell fresh harvests, manage farm fields, and request agricultural supplies.',
    icon: 'tractor',
    tag: 'Producer / Grower',
  },
  {
    id: 'supplier',
    title: 'Supplier',
    subtitle: 'Supply seeds, fertilizers, compost, and farming machinery.',
    icon: 'storefront-outline',
    tag: 'Inputs & Tools',
  },
];

interface GoogleRoleConfirmModalProps {
  visible: boolean;
  initialRole?: UserRole | null;
  isLoading?: boolean;
  onConfirm: (role: AllowedRole) => void;
  onClose: () => void;
}

export function GoogleRoleConfirmModal({
  visible,
  initialRole = 'buyer',
  isLoading = false,
  onConfirm,
  onClose,
}: GoogleRoleConfirmModalProps) {
  const [userSelectedRole, setUserSelectedRole] = useState<AllowedRole | null>(null);

  const fallbackRole: AllowedRole =
    initialRole === 'farmer' || initialRole === 'supplier' || initialRole === 'buyer'
      ? initialRole
      : 'buyer';

  const selectedRole: AllowedRole = userSelectedRole ?? fallbackRole;

  const handleConfirm = () => {
    if (isLoading) return;
    onConfirm(selectedRole);
  };

  const handleClose = () => {
    setUserSelectedRole(null);
    onClose();
  };

  const getReadableRole = (r: AllowedRole) => {
    return r.charAt(0).toUpperCase() + r.slice(1);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={isLoading ? undefined : handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.googleIconBadge}>
              <Text style={styles.googleLetter}>G</Text>
            </View>
            <View style={styles.headerTextWrapper}>
              <Text style={styles.title}>Confirm Your Role</Text>
              <Text style={styles.subtitle}>
                Select your account role to continue with Google
              </Text>
            </View>
            {!isLoading && (
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="close" size={20} color="#9CB3A0" />
              </TouchableOpacity>
            )}
          </View>

          {/* Role Options */}
          <View style={styles.optionsList}>
            {ROLE_OPTIONS.map((opt) => {
              const isSelected = selectedRole === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.roleCard, isSelected && styles.roleCardSelected]}
                  onPress={() => !isLoading && setUserSelectedRole(opt.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconCircle, isSelected && styles.iconCircleSelected]}>
                    <MaterialCommunityIcons
                      name={opt.icon}
                      size={24}
                      color={isSelected ? '#114B25' : '#E8F5E9'}
                    />
                  </View>

                  <View style={styles.roleContent}>
                    <View style={styles.roleTitleRow}>
                      <Text style={[styles.roleTitle, isSelected && styles.roleTitleSelected]}>
                        {opt.title}
                      </Text>
                      <View style={[styles.roleTag, isSelected && styles.roleTagSelected]}>
                        <Text style={[styles.roleTagText, isSelected && styles.roleTagTextSelected]}>
                          {opt.tag}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.roleSubtitle}>{opt.subtitle}</Text>
                  </View>

                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Note Banner */}
          <View style={styles.noticeBanner}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={18}
              color={colors.button.accent}
            />
            <Text style={styles.noticeText}>
              Signing in as <Text style={styles.boldRole}>{getReadableRole(selectedRole)}</Text>.
              Your initial role is permanently fixed upon account creation and cannot be changed
              later. Existing accounts must sign in with their registered role.
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleClose}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, isLoading && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#114B25" />
              ) : (
                <>
                  <Text style={styles.confirmText}>Continue with Google</Text>
                  <MaterialCommunityIcons name="arrow-right" size={18} color="#114B25" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#16281A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  googleIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  googleLetter: {
    fontSize: 20,
    fontWeight: '700',
    color: '#187A36',
  },
  headerTextWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    color: '#A2BBA6',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  optionsList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  roleCardSelected: {
    borderColor: colors.button.accent,
    backgroundColor: 'rgba(124, 217, 88, 0.12)',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconCircleSelected: {
    backgroundColor: colors.button.accent,
  },
  roleContent: {
    flex: 1,
  },
  roleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  roleTitleSelected: {
    color: colors.button.accent,
  },
  roleTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  roleTagSelected: {
    backgroundColor: 'rgba(124, 217, 88, 0.2)',
  },
  roleTagText: {
    fontSize: 11,
    color: '#A2BBA6',
    fontWeight: '600',
  },
  roleTagTextSelected: {
    color: colors.button.accent,
  },
  roleSubtitle: {
    fontSize: 12,
    color: '#A2BBA6',
    lineHeight: 16,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  radioCircleSelected: {
    borderColor: colors.button.accent,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.button.accent,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 217, 88, 0.08)',
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(124, 217, 88, 0.2)',
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: '#D4E7D6',
    lineHeight: 16,
  },
  boldRole: {
    fontWeight: '700',
    color: colors.button.accent,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#A2BBA6',
  },
  confirmBtn: {
    flex: 2,
    height: 50,
    borderRadius: radius.full,
    backgroundColor: colors.button.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#114B25',
  },
});
