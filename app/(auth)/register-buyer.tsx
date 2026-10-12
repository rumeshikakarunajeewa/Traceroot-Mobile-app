import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ProfileFieldCard } from '../../src/components/common/ProfileFieldCard';

interface BuyerFormState {
  companyName: string;
  businessType: string;
  location: string;
  produceSourcing: string;
  weeklyVolume: string;
  contactNumber: string;
}

interface BuyerFormErrors {
  companyName?: string;
  businessType?: string;
  location?: string;
  produceSourcing?: string;
  weeklyVolume?: string;
  contactNumber?: string;
}

export default function RegisterBuyerScreen() {
  const params = useLocalSearchParams<{ name?: string; email?: string; role?: string }>();

  // Form input state
  const [formData, setFormData] = useState<BuyerFormState>({
    companyName: '',
    businessType: '',
    location: '',
    produceSourcing: '',
    weeklyVolume: '',
    contactNumber: '',
  });

  const [errors, setErrors] = useState<BuyerFormErrors>({});
  const [focusedField, setFocusedField] = useState<keyof BuyerFormState | null>(null);

  // Entrance animations
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(20)).current;
  const fieldsFade = useRef(new Animated.Value(0)).current;
  const fieldsSlide = useRef(new Animated.Value(30)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(20)).current;

  // Button press feedback scale animation
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(headerFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(headerSlide, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fieldsFade, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(fieldsSlide, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(buttonFade, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(buttonSlide, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const fieldsList: (keyof BuyerFormState)[] = [
    'companyName',
    'businessType',
    'location',
    'produceSourcing',
    'weeklyVolume',
    'contactNumber',
  ];

  const completedCount = fieldsList.filter((f) => formData[f].trim().length > 0).length;
  const completedPercentage = Math.round((completedCount / fieldsList.length) * 100);

  const handleInputChange = (field: keyof BuyerFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: BuyerFormErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company / organisation name is required';
    }
    if (!formData.businessType.trim()) {
      newErrors.businessType = 'Business type is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location / city is required';
    }
    if (!formData.produceSourcing.trim()) {
      newErrors.produceSourcing = 'Produce sourcing preference is required';
    }
    if (!formData.weeklyVolume.trim()) {
      newErrors.weeklyVolume = 'Weekly purchase volume is required';
    } else if (isNaN(Number(formData.weeklyVolume)) || Number(formData.weeklyVolume) <= 0) {
      newErrors.weeklyVolume = 'Enter a valid volume in kg';
    }
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const handleSaveAndContinue = () => {
    if (validate()) {
      // TODO: Connect with Supabase to save buyer profile details
      console.log('Buyer Profile Details Submitted:', {
        user: {
          name: params.name,
          email: params.email,
          role: params.role || 'buyer',
        },
        profile: formData,
      });

      // TODO: Navigate to Buyer Dashboard / Home screen once created
      router.replace('/(buyer)');
    }
  };

  const handleSkip = () => {
    console.log('Buyer profile setup skipped for now');
    // TODO: Navigate to Buyer Dashboard / Home screen once created
    router.replace('/(buyer)');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0D2714" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Dark Forest Green Header */}
          <Animated.View
            style={[
              styles.headerSection,
              {
                opacity: headerFade,
                transform: [{ translateY: headerSlide }],
              },
            ]}
          >
            {/* Glowing circular backdrop motif */}
            <View style={styles.glowCircle} />

            {/* Top Bar Navigation */}
            <View style={styles.topNav}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Feather name="arrow-left" size={20} color="#E4EFE7" />
              </TouchableOpacity>

              <Text style={styles.stepBadge}>STEP 2 OF 2</Text>
            </View>

            {/* Profile Header Info */}
            <View style={styles.headerBody}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarEmoji}>🛒</Text>
                </View>
              </View>

              <View style={styles.titleWrapper}>
                <Text style={styles.preTitle}>SET UP YOUR</Text>
                <Text style={styles.mainTitle}>Buyer profile</Text>
                <Text style={styles.progressText}>
                  {completedCount} of {fieldsList.length} done · {completedPercentage}%
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Form Fields Section */}
          <Animated.View
            style={[
              styles.formSection,
              {
                opacity: fieldsFade,
                transform: [{ translateY: fieldsSlide }],
              },
            ]}
          >
            <ProfileFieldCard
              label="COMPANY / ORGANISATION NAME"
              placeholder="e.g. FreshMart Ltd"
              iconEmoji="🏢"
              value={formData.companyName}
              onChangeText={(text) => handleInputChange('companyName', text)}
              onFocus={() => setFocusedField('companyName')}
              onBlur={() => setFocusedField(null)}
              isFocused={focusedField === 'companyName'}
              error={errors.companyName}
            />

            <ProfileFieldCard
              label="BUSINESS TYPE"
              placeholder="e.g. Supermarket, Exporter"
              iconEmoji="🛒"
              value={formData.businessType}
              onChangeText={(text) => handleInputChange('businessType', text)}
              onFocus={() => setFocusedField('businessType')}
              onBlur={() => setFocusedField(null)}
              isFocused={focusedField === 'businessType'}
              error={errors.businessType}
            />

            <ProfileFieldCard
              label="LOCATION / CITY"
              placeholder="e.g. Colombo"
              iconEmoji="📍"
              value={formData.location}
              onChangeText={(text) => handleInputChange('location', text)}
              onFocus={() => setFocusedField('location')}
              onBlur={() => setFocusedField(null)}
              isFocused={focusedField === 'location'}
              error={errors.location}
            />

            <ProfileFieldCard
              label="WHAT PRODUCE ARE YOU SOURCING?"
              placeholder="e.g. Organic vegetables, Rice"
              iconEmoji="🥦"
              value={formData.produceSourcing}
              onChangeText={(text) => handleInputChange('produceSourcing', text)}
              onFocus={() => setFocusedField('produceSourcing')}
              onBlur={() => setFocusedField(null)}
              isFocused={focusedField === 'produceSourcing'}
              error={errors.produceSourcing}
            />

            <ProfileFieldCard
              label="WEEKLY PURCHASE VOLUME (KG)"
              placeholder="e.g. 500"
              iconEmoji="⚖️"
              value={formData.weeklyVolume}
              onChangeText={(text) => handleInputChange('weeklyVolume', text)}
              onFocus={() => setFocusedField('weeklyVolume')}
              onBlur={() => setFocusedField(null)}
              isFocused={focusedField === 'weeklyVolume'}
              error={errors.weeklyVolume}
              keyboardType="numeric"
            />

            <ProfileFieldCard
              label="CONTACT NUMBER"
              placeholder="e.g. +94 11 234 5678"
              iconEmoji="📞"
              value={formData.contactNumber}
              onChangeText={(text) => handleInputChange('contactNumber', text)}
              onFocus={() => setFocusedField('contactNumber')}
              onBlur={() => setFocusedField(null)}
              isFocused={focusedField === 'contactNumber'}
              error={errors.contactNumber}
              keyboardType="phone-pad"
            />
          </Animated.View>

          {/* Action Buttons Section */}
          <Animated.View
            style={[
              styles.actionsSection,
              {
                opacity: buttonFade,
                transform: [{ translateY: buttonSlide }],
              },
            ]}
          >
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.saveButton}
                activeOpacity={0.9}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handleSaveAndContinue}
              >
                <Text style={styles.saveButtonText}>Save & continue →</Text>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={styles.skipButton}
              activeOpacity={0.6}
              onPress={handleSkip}
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D2714',
  },
  keyboardAvoid: {
    flex: 1,
    backgroundColor: '#F3EFE6', // Soft earthy off-white/beige background matching screenshot
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  headerSection: {
    backgroundColor: '#0D2714',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  glowCircle: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(57, 128, 68, 0.28)',
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  stepBadge: {
    color: '#65D446',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  headerBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingRight: 8,
  },
  avatarWrapper: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(101, 212, 70, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 26,
  },
  titleWrapper: {
    flex: 1,
  },
  preTitle: {
    color: '#A0BEAA',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 2,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 4,
  },
  progressText: {
    color: '#55C235',
    fontSize: 13,
    fontWeight: '600',
  },
  formSection: {
    paddingHorizontal: 18,
    paddingTop: 18,
    gap: 11,
  },
  actionsSection: {
    paddingHorizontal: 18,
    marginTop: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#1E5833',
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  skipButtonText: {
    color: '#828E84',
    fontSize: 13,
    fontWeight: '500',
  },
});
