import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
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
import { Ionicons, Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../src/lib/theme';

interface FormState {
  farmName: string;
  location: string;
  farmSize: string;
  mainCrops: string;
  experience: string;
  contactNumber: string;
}

interface FormErrors {
  farmName?: string;
  location?: string;
  farmSize?: string;
  mainCrops?: string;
  experience?: string;
  contactNumber?: string;
}

export default function RegisterFarmerScreen() {
  const params = useLocalSearchParams<{ name?: string; email?: string; role?: string }>();

  // Form input state
  const [formData, setFormData] = useState<FormState>({
    farmName: '',
    location: '',
    farmSize: '',
    mainCrops: '',
    experience: '',
    contactNumber: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [focusedField, setFocusedField] = useState<keyof FormState | null>(null);

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

  // Calculate completed fields count and percentage
  const fieldsList: (keyof FormState)[] = [
    'farmName',
    'location',
    'farmSize',
    'mainCrops',
    'experience',
    'contactNumber',
  ];

  const completedCount = fieldsList.filter((f) => formData[f].trim().length > 0).length;
  const completedPercentage = Math.round((completedCount / fieldsList.length) * 100);

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.farmName.trim()) {
      newErrors.farmName = 'Farm name is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location / district is required';
    }
    if (!formData.farmSize.trim()) {
      newErrors.farmSize = 'Farm size is required';
    } else if (isNaN(Number(formData.farmSize)) || Number(formData.farmSize) <= 0) {
      newErrors.farmSize = 'Enter a valid number of acres';
    }
    if (!formData.mainCrops.trim()) {
      newErrors.mainCrops = 'Main crops grown is required';
    }
    if (!formData.experience.trim()) {
      newErrors.experience = 'Years of experience is required';
    } else if (isNaN(Number(formData.experience)) || Number(formData.experience) < 0) {
      newErrors.experience = 'Enter valid years of experience';
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
      // TODO: Connect with Supabase to save farmer profile details
      console.log('Farmer Profile Details Submitted:', {
        user: {
          name: params.name,
          email: params.email,
          role: params.role || 'farmer',
        },
        profile: formData,
      });

      // TODO: Navigate to Farmer Dashboard / Home screen once created
      router.replace('/(farmer)');
    }
  };

  const handleSkip = () => {
    console.log('Farmer profile setup skipped for now');
    // TODO: Navigate to Farmer Dashboard / Home screen once created
    router.replace('/(farmer)');
  };

  const renderInputField = (
    field: keyof FormState,
    label: string,
    placeholder: string,
    iconEmoji: string,
    keyboardType: 'default' | 'numeric' | 'phone-pad' = 'default'
  ) => {
    const isFilled = formData[field].trim().length > 0;
    const isFocused = focusedField === field;
    const error = errors[field];

    return (
      <View key={field} style={styles.fieldWrapper}>
        <View
          style={[
            styles.cardContainer,
            isFocused && styles.cardContainerFocused,
            error && styles.cardContainerError,
          ]}
        >
          {/* Icon Badge */}
          <View style={styles.iconContainer}>
            <Text style={styles.iconEmoji}>{iconEmoji}</Text>
          </View>

          {/* Input details */}
          <View style={styles.inputDetailsContainer}>
            <Text style={styles.inputLabel}>{label}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={placeholder}
              placeholderTextColor="#B8BEB8"
              value={formData[field]}
              onChangeText={(text) => handleInputChange(field, text)}
              onFocus={() => setFocusedField(field)}
              onBlur={() => setFocusedField(null)}
              keyboardType={keyboardType}
              autoCapitalize="sentences"
            />
          </View>

          {/* Right Status Indicator Indicator */}
          <View
            style={[
              styles.statusIndicator,
              isFilled && styles.statusIndicatorFilled,
            ]}
          >
            {isFilled && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
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
            {/* Glowing circular backdrop graphic */}
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
                  <Text style={styles.avatarEmoji}>👨‍🌾</Text>
                </View>
              </View>

              <View style={styles.titleWrapper}>
                <Text style={styles.preTitle}>SET UP YOUR</Text>
                <Text style={styles.mainTitle}>Farmer profile</Text>
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
            {renderInputField(
              'farmName',
              'FARM NAME',
              'e.g. Green Valley Farm',
              '🌾'
            )}
            {renderInputField(
              'location',
              'LOCATION / DISTRICT',
              'e.g. Kandy, Sri Lanka',
              '📍'
            )}
            {renderInputField(
              'farmSize',
              'FARM SIZE (ACRES)',
              'e.g. 5.5',
              '📐',
              'numeric'
            )}
            {renderInputField(
              'mainCrops',
              'MAIN CROPS GROWN',
              'e.g. Tea, Vegetables',
              '🥒'
            )}
            {renderInputField(
              'experience',
              'YEARS OF FARMING EXPERIENCE',
              'e.g. 12',
              '📅',
              'numeric'
            )}
            {renderInputField(
              'contactNumber',
              'CONTACT NUMBER',
              'e.g. +94 77 123 4567',
              '📞',
              'phone-pad'
            )}
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
    backgroundColor: '#F3EFE6', // Soft earthy off-white/beige background matching the screenshot
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  headerSection: {
    backgroundColor: '#0D2714', // Deep organic dark green
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
    color: '#65D446', // Vibrant bright green step indicator
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
    fontSize: 28,
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
  fieldWrapper: {
    marginBottom: 2,
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: '#ECEAE2',
  },
  cardContainerFocused: {
    borderColor: '#1C5B32',
    shadowOpacity: 0.08,
  },
  cardContainerError: {
    borderColor: '#D32F2F',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F5F5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconEmoji: {
    fontSize: 20,
  },
  inputDetailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#768779',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  textInput: {
    fontSize: 15,
    color: '#1C3122',
    fontWeight: '500',
    padding: 0,
    margin: 0,
  },
  statusIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E7ECE8',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  statusIndicatorFilled: {
    backgroundColor: '#2A7A44',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 12,
    fontWeight: '500',
  },
  actionsSection: {
    paddingHorizontal: 18,
    marginTop: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#1E5833', // Deep forest green button
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
