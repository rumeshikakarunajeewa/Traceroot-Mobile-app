import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDarkMode } from '../../../src/store/uiStore';

export default function SupplierNewProductScreen() {
  const [isDark] = useDarkMode();

  return (
    <SafeAreaView
      style={[styles.safeArea, isDark && styles.safeAreaDark]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.back()}
          style={[styles.backPill, isDark && styles.backPillDark]}
          accessibilityRole="button"
          accessibilityLabel="Back to Catalogue"
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={18}
            color={isDark ? '#DCE8DE' : '#2D4030'}
          />
          <Text style={[styles.backPillText, isDark && styles.backPillTextDark]}>
            Catalogue
          </Text>
        </TouchableOpacity>

        {/* Screen Title */}
        <Text style={[styles.screenTitle, isDark && styles.screenTitleDark]}>
          Add New Product
        </Text>

        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.infoTitle, isDark && styles.infoTitleDark]}>
            New Catalogue Entry
          </Text>
          <Text style={[styles.infoDescription, isDark && styles.infoDescriptionDark]}>
            List agricultural raw materials, seeds, fertilizers, or plant protection for farmers across Sri Lanka.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F2EB',
  },
  safeAreaDark: {
    backgroundColor: '#0E1710',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: '#E2DDD2',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backPillDark: {
    backgroundColor: '#16271A',
    borderColor: '#263D2B',
  },
  backPillText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#28402D',
    marginLeft: 3,
  },
  backPillTextDark: {
    color: '#DCE8DE',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C3723',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 16,
  },
  screenTitleDark: {
    color: '#F0F5F1',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ECE7DC',
  },
  cardDark: {
    backgroundColor: '#18271C',
    borderColor: '#253B2A',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#162E1D',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 8,
  },
  infoTitleDark: {
    color: '#F0F5F1',
  },
  infoDescription: {
    fontSize: 14,
    color: '#6B7E6F',
    lineHeight: 20,
  },
  infoDescriptionDark: {
    color: '#95A997',
  },
});
