import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WaitingAlertInfo } from '../../types/supplier.types';
import { useLanguage } from '../../i18n/languageStore';

interface SupplierWaitingAlertProps {
  alert: WaitingAlertInfo;
  onPress?: () => void;
}

export const SupplierWaitingAlert: React.FC<SupplierWaitingAlertProps> = ({
  alert,
  onPress,
}) => {
  const { t } = useLanguage();
  const titleText = `${alert.waitingCount} ${
    alert.waitingCount === 1 ? t('farmerWaitingSingle') : t('farmersWaitingTitle')
  }`;
  const subtitleText = t('fulfilKeepCropsOnTrack');

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={styles.wrapper}
      accessibilityRole="button"
      accessibilityLabel={`${titleText}: ${subtitleText}`}
    >
      <LinearGradient
        colors={['#173420', '#1C3B24', '#2F3C23']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.container}
      >
        {/* Left: Vibrant Orange Shopping Basket Badge */}
        <View style={styles.orangeCircle}>
          <MaterialCommunityIcons name="basket" size={22} color="#FFFFFF" />
        </View>

        {/* Middle: Waiting Title & Prompt Subtitle */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{titleText}</Text>
          <Text style={styles.subtitle}>{subtitleText}</Text>
        </View>

        {/* Right: Up-Right Arrow Icon */}
        <View style={styles.arrowContainer}>
          <MaterialCommunityIcons name="arrow-top-right" size={22} color="#FFFFFF" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#122718',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 22,
  },
  orangeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E66826', // High-contrast orange badge
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  textContainer: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 11.5,
    color: '#C2D9C5',
    lineHeight: 16,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
