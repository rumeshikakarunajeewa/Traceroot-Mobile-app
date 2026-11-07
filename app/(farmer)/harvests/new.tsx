import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCropsStore, CreateCropPayload } from '../../../src/store/cropStore';
import { useDarkMode } from '../../../src/store/uiStore';
import { AddNewCropModal } from '../../../src/components/farmer/AddNewCropModal';
import { FieldItem } from '../../../src/types/farmer.types';
import {
  FARMING_STAGES,
  FarmingStageKeyType,
  STAGE_ACTIVITIES,
  StageActivityTemplate,
} from '../../../src/constants/stages';
import { stageIndex } from '../../../src/utils/stageHelpers';
import { FarmerBottomTabBar } from '../../../src/components/farmer/FarmerBottomTabBar';

const { width } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (width - 44) / 2;

// Taglines and icons for canonical activities in Step 2 grid
const ACTIVITY_META: Record<string, { icon: string; iconFamily: 'mci' | 'feather' | 'ion'; subtitle: string }> = {
  // Planting
  'act-p-crop-details': { icon: 'sprout', iconFamily: 'mci', subtitle: 'Variety → Cultivar Info' },
  'act-p-land-soil': { icon: 'layers-triple-outline', iconFamily: 'mci', subtitle: 'Bed Prep → Soil Tillage' },
  'act-p-seed-source': { icon: 'seed', iconFamily: 'mci', subtitle: 'Nursery → Seed Lot' },
  'act-p-planting-details': { icon: 'ruler', iconFamily: 'mci', subtitle: 'Spacing → Bed Layout' },
  'act-p-compost-fertilizer': { icon: 'bottle-tonic-outline', iconFamily: 'mci', subtitle: 'Basal → Organic Inputs' },
  'act-p-initial-watering': { icon: 'water-outline', iconFamily: 'mci', subtitle: 'First Soak → Soil Moisture' },

  // Vegetative Growth
  'act-vg-watering': { icon: 'water-outline', iconFamily: 'mci', subtitle: 'Irrigation → Soil & Weather' },
  'act-vg-fertilizer': { icon: 'bottle-tonic-outline', iconFamily: 'mci', subtitle: 'Inputs → Coverage' },
  'act-vg-weeding': { icon: 'content-cut', iconFamily: 'mci', subtitle: 'Field Work → Soil Care' },
  'act-vg-pest': { icon: 'magnify', iconFamily: 'mci', subtitle: 'Inspection → Treatment' },
  'act-vg-growth': { icon: 'chart-line', iconFamily: 'mci', subtitle: 'Measurements → Plant Health' },
  'act-vg-env': { icon: 'thermometer', iconFamily: 'mci', subtitle: 'Sensors → Microclimate' },

  // Flowering
  'flowering_observation': { icon: 'flower-outline', iconFamily: 'mci', subtitle: 'Bloom Count → Blossom Set' },
  'pollination_monitoring': { icon: 'bee', iconFamily: 'mci', subtitle: 'Pollinators → Blossom Activity' },
  'flowering_irrigation': { icon: 'water-outline', iconFamily: 'mci', subtitle: 'Watering → Petal Care' },
  'flowering_fertilizer': { icon: 'bottle-tonic-outline', iconFamily: 'mci', subtitle: 'Bloom Booster → Foliar' },
  'flowering_pest_management': { icon: 'shield-alert-outline', iconFamily: 'mci', subtitle: 'Blossom Blight → Protection' },
  'flower_health_monitoring': { icon: 'heart-pulse', iconFamily: 'mci', subtitle: 'Drop Rate → Pollen Health' },

  // Crop Maturity
  'crop_growth_development': { icon: 'fruit-cherries', iconFamily: 'mci', subtitle: 'Fruit Sizing → Canopy' },
  'ripeness_maturity_monitoring': { icon: 'palette-outline', iconFamily: 'mci', subtitle: 'Color Change → Ripeness' },
  'maturity_irrigation': { icon: 'water-outline', iconFamily: 'mci', subtitle: 'Maturity Water → Sugar Balance' },
  'maturity_fertilizer': { icon: 'bottle-tonic-outline', iconFamily: 'mci', subtitle: 'Potash → Fruit Density' },
  'maturity_pest_management': { icon: 'shield-check-outline', iconFamily: 'mci', subtitle: 'Cluster Netting → Care' },
  'crop_quality_assessment': { icon: 'check-decagram-outline', iconFamily: 'mci', subtitle: 'Firmness → Skin Quality' },
  'harvest_readiness_assessment': { icon: 'clock-check-outline', iconFamily: 'mci', subtitle: 'Brix & Timing → Readiness' },

  // Harvesting
  'harvest_details': { icon: 'basket-outline', iconFamily: 'mci', subtitle: 'Picking → Field Collection' },
  'harvest_quantity': { icon: 'scale', iconFamily: 'mci', subtitle: 'Yield → Weight & Units' },
  'quality_grading': { icon: 'star-circle-outline', iconFamily: 'mci', subtitle: 'Grade A/B/C → Standards' },
  'sorting_cleaning': { icon: 'broom', iconFamily: 'mci', subtitle: 'Sort & Clean → Wash' },
  'harvest_packaging': { icon: 'package-variant-closed', iconFamily: 'mci', subtitle: 'Crates & Bags → Packhouse' },
  'storage_conditions': { icon: 'snowflake', iconFamily: 'mci', subtitle: 'Cold Store → Temp & RH' },
  'batch_identification': { icon: 'qrcode-scan', iconFamily: 'mci', subtitle: 'Batch ID → QR Traceability' },
};

export default function NewFarmingRecordScreen() {
  const [isDark, setDarkMode] = useDarkMode();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    cropId?: string;
    stageNumber?: string;
    stageId?: string;
    activityId?: string;
  }>();

  const { fields, getFieldById, customActivities, saveActivityNotes, createNewCrop } = useCropsStore();

  const [addCropModalVisible, setAddCropModalVisible] = useState(false);

  // Selected crop (defaults to param or primary crop)
  const initialCrop = useMemo(() => {
    if (params.cropId) {
      return fields.find((f) => f.id === params.cropId) || fields[0] || null;
    }
    return fields[0] || null;
  }, [params.cropId, fields]);

  const [selectedCrop, setSelectedCrop] = useState<FieldItem | null>(initialCrop);

  // Keep selectedCrop synced if fields load or change
  useEffect(() => {
    if (!selectedCrop && fields.length > 0) {
      setSelectedCrop(fields[0]);
    } else if (selectedCrop && !fields.some((f) => f.id === selectedCrop.id)) {
      setSelectedCrop(fields[0] || null);
    }
  }, [fields]);

  const handleSelectCrop = (crop: FieldItem) => {
    setSelectedCrop(crop);
    // Switch to crop's current stage index
    const stageIdx = crop.currentStageIndex ?? 1;
    setSelectedStageNumber(stageIdx);
    // Clear stale activity
    setSelectedActivity(null);
  };

  const handleCreateNewCrop = async (payload: CreateCropPayload) => {
    const newCrop = await createNewCrop(payload);
    if (newCrop) {
      setSelectedCrop(newCrop);
      setSelectedStageNumber(1);
      setSelectedActivity(null);
      return newCrop;
    }
    return null;
  };

  // Initial stage determination
  const initialStageNumber = useMemo(() => {
    if (params.stageNumber) {
      const parsed = parseInt(params.stageNumber, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) return parsed;
    }
    if (params.stageId) {
      return stageIndex(params.stageId);
    }
    return selectedCrop?.currentStageIndex ?? 3;
  }, [params.stageNumber, params.stageId, selectedCrop?.currentStageIndex]);

  // Multi-step Wizard State (Steps 1 to 6)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedStageNumber, setSelectedStageNumber] = useState<number>(initialStageNumber);
  const [selectedActivity, setSelectedActivity] = useState<StageActivityTemplate | null>(null);
  const [notes, setNotes] = useState<string>('');

  // Step 3 Activity Details State
  const [inputName, setInputName] = useState<string>('NPK Organic Compound');
  const [inputQuantity, setInputQuantity] = useState<string>('2.5');
  const [inputUnit, setInputUnit] = useState<string>('kg');
  const [applicationMethod, setApplicationMethod] = useState<string>('Broadcast');
  const [waterQuantity, setWaterQuantity] = useState<string>('500');
  const [waterUnit, setWaterUnit] = useState<string>('L');
  const [qualityGrade, setQualityGrade] = useState<string>('Grade A');
  const [packagingType, setPackagingType] = useState<string>('Perforated Crates');
  const [storageMethod, setStorageMethod] = useState<string>('Controlled Cold Storage');
  const [locationName, setLocationName] = useState<string>(selectedCrop?.name || 'Greenhouse Bay 1');

  // Purpose-Specific Activity Fields (Planting, Vegetative, Flowering, Maturity, Harvesting)
  const [cropVariety, setCropVariety] = useState<string>('');
  const [soilType, setSoilType] = useState<string>('Loam with Organic Compost');
  const [soilPrepMethod, setSoilPrepMethod] = useState<string>('Raised Beds');
  const [seedSource, setSeedSource] = useState<string>('');
  const [seedBatchNo, setSeedBatchNo] = useState<string>('');
  const [germinationRate, setGerminationRate] = useState<string>('92%');
  const [plantingMethod, setPlantingMethod] = useState<string>('Transplanting');
  const [plantSpacing, setPlantSpacing] = useState<string>('45cm x 60cm');

  const [weedingMethod, setWeedingMethod] = useState<string>('Manual Hand Weeding');
  const [pestObserved, setPestObserved] = useState<string>('');
  const [pestSeverity, setPestSeverity] = useState<string>('None');
  const [plantHeight, setPlantHeight] = useState<string>('');
  const [cropVigor, setCropVigor] = useState<string>('Excellent');
  const [envTemperature, setEnvTemperature] = useState<string>('26°C');
  const [envHumidity, setEnvHumidity] = useState<string>('75% RH');
  const [soilMoisture, setSoilMoisture] = useState<string>('Optimal');

  const [bloomProgress, setBloomProgress] = useState<string>('Full Bloom (70%)');
  const [pollinatorActivity, setPollinatorActivity] = useState<string>('High (Active)');
  const [flowerRetention, setFlowerRetention] = useState<string>('Excellent');

  const [fruitSize, setFruitSize] = useState<string>('');
  const [ripenessLevel, setRipenessLevel] = useState<string>('Breaker / Turning');
  const [cropDamage, setCropDamage] = useState<string>('Zero Damage (Clean)');
  const [harvestReadiness, setHarvestReadiness] = useState<string>('Ready in 2-3 Days');

  const [harvestMethod, setHarvestMethod] = useState<string>('Manual Hand Picking');
  const [cropCondition, setCropCondition] = useState<string>('Fully ripe, firm, morning harvest');
  const [sortingMethod, setSortingMethod] = useState<string>('Manual Hand Sorting');
  const [cleaningMethod, setCleaningMethod] = useState<string>('Wipe Clean');
  const [acceptedQty, setAcceptedQty] = useState<string>('');
  const [rejectedQty, setRejectedQty] = useState<string>('');
  const [harvestBatchCode, setHarvestBatchCode] = useState<string>('');

  // Validation
  const [notesError, setNotesError] = useState<string | null>(null);

  // Step 4/5 Photo State
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedRecordCode, setSubmittedRecordCode] = useState<string | null>(null);

  // Active Stage Definition
  const activeStage = FARMING_STAGES.find((s) => s.stageNumber === selectedStageNumber) || FARMING_STAGES[0];

  // Activities list for current selected stage (canonical + custom)
  const stageActivitiesList = useMemo(() => {
    const key = activeStage.key as FarmingStageKeyType;
    const defaultList = STAGE_ACTIVITIES[key] || [];

    const customList: StageActivityTemplate[] = customActivities
      .filter((ca) => ca.cropId === selectedCrop?.id && ca.stageKey === key)
      .map((ca) => ({
        id: ca.id,
        name: ca.name,
        matchKeywords: [ca.name.toLowerCase()],
        isCustom: true,
        description: ca.description,
        date: ca.date,
      }));

    return [...defaultList, ...customList];
  }, [activeStage, customActivities, selectedCrop]);

  // Handle stage selection in Step 1
  const handleSelectStage = (stageNum: number) => {
    setSelectedStageNumber(stageNum);
    setSelectedActivity(null);
  };

  // Handle camera photo capture
  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera Permission Required', 'Please enable camera access in system settings.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Camera Error', 'Could not access device camera.');
    }
  };

  // Handle gallery photo upload
  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Gallery Permission Required', 'Please enable gallery access in system settings.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Gallery Error', 'Could not open photo library.');
    }
  };

  // Handle Navigation Back
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  // Check activity types
  const isFertilizerActivity = useMemo(() => {
    if (!selectedActivity) return false;
    const name = selectedActivity.name.toLowerCase();
    const id = selectedActivity.id.toLowerCase();
    return (
      name.includes('fertilizer') ||
      name.includes('compost') ||
      id.includes('fertilizer') ||
      id.includes('compost')
    );
  }, [selectedActivity]);

  const isWateringActivity = useMemo(() => {
    if (!selectedActivity) return false;
    const name = selectedActivity.name.toLowerCase();
    const id = selectedActivity.id.toLowerCase();
    return (
      name.includes('watering') ||
      name.includes('irrigation') ||
      id.includes('watering') ||
      id.includes('irrigation')
    );
  }, [selectedActivity]);

  // Handle Photo Options Dialog
  const handlePickPhotoOptions = () => {
    Alert.alert(
      'Attach Photo Evidence',
      'Select a source for verified proof',
      [
        { text: 'Take Live Photo', onPress: handleTakePhoto },
        { text: 'Choose from Gallery', onPress: handlePickFromGallery },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Submit and lock record
  const handleSubmitAndLock = () => {
    if (!selectedCrop) {
      Alert.alert('Crop Required', 'Please select a crop to record activity.');
      return;
    }
    if (!selectedActivity) {
      Alert.alert('Missing Activity', 'Please select an activity.');
      return;
    }

    setIsSubmitting(true);

    const details: Record<string, string> = {};
    const inputs: string[] = [];

    // Collect relevant inputs based on stage & activity
    if (isFertilizerActivity) {
      details['inputName'] = inputName;
      details['quantity'] = `${inputQuantity} ${inputUnit}`;
      details['applicationMethod'] = applicationMethod;
      inputs.push(`${inputName} (${inputQuantity} ${inputUnit})`);
      inputs.push(applicationMethod);
    } else if (isWateringActivity) {
      details['waterQuantity'] = `${waterQuantity} ${waterUnit}`;
      details['irrigationMethod'] = applicationMethod;
      inputs.push(`${waterQuantity} ${waterUnit}`);
      inputs.push(applicationMethod);
    } else if (selectedActivity.id === 'harvest_quantity' || selectedActivity.name.toLowerCase().includes('quantity')) {
      details['harvestQuantity'] = `${inputQuantity} ${inputUnit}`;
      if (acceptedQty) details['quantityAccepted'] = acceptedQty;
      if (rejectedQty) details['quantityRejected'] = rejectedQty;
      inputs.push(`${inputQuantity} ${inputUnit}`);
    } else if (selectedActivity.id === 'quality_grading' || selectedActivity.name.toLowerCase().includes('grading')) {
      details['qualityGrade'] = qualityGrade;
      inputs.push(qualityGrade);
    } else if (selectedActivity.id === 'harvest_packaging' || selectedActivity.name.toLowerCase().includes('packaging')) {
      details['packagingType'] = packagingType;
      inputs.push(packagingType);
    } else if (selectedActivity.id === 'storage_conditions' || selectedActivity.name.toLowerCase().includes('storage')) {
      details['storageMethod'] = storageMethod;
      inputs.push(storageMethod);
    } else if (selectedActivity.id === 'harvest_details') {
      details['harvestMethod'] = harvestMethod;
      details['cropCondition'] = cropCondition;
      inputs.push(harvestMethod);
    } else if (selectedActivity.id === 'sorting_cleaning') {
      details['sortingMethod'] = sortingMethod;
      details['cleaningMethod'] = cleaningMethod;
      inputs.push(sortingMethod);
      inputs.push(cleaningMethod);
    } else if (selectedActivity.id === 'batch_identification') {
      details['harvestBatchId'] = harvestBatchCode || `HARV-${selectedCrop.batchId || 'BATCH-01'}`;
      inputs.push(details['harvestBatchId']);
    } else if (selectedActivity.id === 'act-p-crop-details') {
      if (cropVariety) details['variety'] = cropVariety;
      inputs.push(cropVariety || selectedCrop.cropName);
    } else if (selectedActivity.id === 'act-p-land-soil') {
      details['soilType'] = soilType;
      details['tillageMethod'] = soilPrepMethod;
      inputs.push(soilPrepMethod);
    } else if (selectedActivity.id === 'act-p-seed-source') {
      if (seedSource) details['seedSource'] = seedSource;
      if (seedBatchNo) details['seedBatchNo'] = seedBatchNo;
      details['germinationRate'] = germinationRate;
      inputs.push(seedSource || 'Certified Seed Source');
    } else if (selectedActivity.id === 'act-p-planting-details') {
      details['plantingMethod'] = plantingMethod;
      details['spacing'] = plantSpacing;
      inputs.push(plantingMethod);
      inputs.push(plantSpacing);
    } else if (selectedActivity.id === 'act-vg-weeding') {
      details['weedingMethod'] = weedingMethod;
      inputs.push(weedingMethod);
    } else if (
      selectedActivity.id === 'act-vg-pest' ||
      selectedActivity.id === 'flowering_pest_management' ||
      selectedActivity.id === 'maturity_pest_management'
    ) {
      if (pestObserved) details['pestObserved'] = pestObserved;
      details['pestSeverity'] = pestSeverity;
      if (cropDamage) details['damageAssessment'] = cropDamage;
      inputs.push(`Severity: ${pestSeverity}`);
    } else if (selectedActivity.id === 'act-vg-growth') {
      if (plantHeight) details['plantHeight'] = plantHeight;
      details['cropVigor'] = cropVigor;
      inputs.push(cropVigor);
    } else if (selectedActivity.id === 'act-vg-env') {
      details['temperature'] = envTemperature;
      details['humidity'] = envHumidity;
      details['soilMoisture'] = soilMoisture;
      inputs.push(`${envTemperature}, ${envHumidity}`);
    } else if (selectedActivity.id === 'flowering_observation') {
      details['bloomProgress'] = bloomProgress;
      inputs.push(bloomProgress);
    } else if (selectedActivity.id === 'pollination_monitoring') {
      details['pollinatorActivity'] = pollinatorActivity;
      inputs.push(`Pollinators: ${pollinatorActivity}`);
    } else if (selectedActivity.id === 'flower_health_monitoring') {
      details['flowerRetention'] = flowerRetention;
      inputs.push(flowerRetention);
    } else if (selectedActivity.id === 'crop_growth_development') {
      if (fruitSize) details['fruitSize'] = fruitSize;
      inputs.push(fruitSize || 'Uniform sizing');
    } else if (selectedActivity.id === 'ripeness_maturity_monitoring') {
      details['ripenessLevel'] = ripenessLevel;
      inputs.push(ripenessLevel);
    } else if (selectedActivity.id === 'crop_quality_assessment') {
      details['qualityGrade'] = qualityGrade;
      inputs.push(qualityGrade);
    } else if (selectedActivity.id === 'harvest_readiness_assessment') {
      details['harvestReadiness'] = harvestReadiness;
      inputs.push(harvestReadiness);
    }

    details['location'] = locationName;
    if (inputQuantity && !inputs.includes(`${inputQuantity} ${inputUnit}`)) {
      inputs.push(`${inputQuantity} ${inputUnit}`);
    }

    const finalNotes = notes.trim() || `Verified ${selectedActivity.name} performed for ${selectedCrop.cropName}.`;

    try {
      const saved = saveActivityNotes({
        cropId: selectedCrop.id,
        activityId: selectedActivity.id,
        activityName: selectedActivity.name,
        notes: finalNotes,
        photoUri,
        details,
        inputs,
        stage: activeStage.title,
        batchId: selectedCrop.batchId,
      });

      setSubmittedRecordCode(saved.recordCode);
      setIsSubmitting(false);
    } catch {
      setIsSubmitting(false);
      Alert.alert('Save Failed', 'Unable to record farming activity. Please retry.');
    }
  };

  // Validate and advance from Step 3 (Activity Details Form) to Step 4 (Activity Summary)
  const handleContinueToSummary = () => {
    // Validate required fields
    if (isFertilizerActivity) {
      if (!inputName.trim()) {
        Alert.alert('Required Field', 'Please enter fertilizer or compost name.');
        return;
      }
      if (!inputQuantity.trim() || isNaN(parseFloat(inputQuantity)) || parseFloat(inputQuantity) <= 0) {
        Alert.alert('Invalid Quantity', 'Please enter a valid amount.');
        return;
      }
    } else if (isWateringActivity) {
      if (!waterQuantity.trim() || isNaN(parseFloat(waterQuantity)) || parseFloat(waterQuantity) <= 0) {
        Alert.alert('Invalid Water Quantity', 'Please enter a valid water volume.');
        return;
      }
    } else if (selectedActivity?.id === 'harvest_quantity' || selectedActivity?.name?.toLowerCase().includes('quantity')) {
      if (!inputQuantity.trim() || isNaN(parseFloat(inputQuantity)) || parseFloat(inputQuantity) <= 0) {
        Alert.alert('Invalid Quantity', 'Please enter a valid harvest quantity.');
        return;
      }
    }

    if (!notes.trim()) {
      setNotesError('Please enter activity notes before continuing.');
      return;
    }

    setNotesError(null);
    setCurrentStep(4);
  };

  return (
    <View style={[styles.screenContainer, isDark && styles.screenContainerDark]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Top Header */}
      <View style={[styles.headerContainer, isDark && styles.headerContainerDark, { paddingTop: Math.max(insets.top, 14) }]}>
        <View style={styles.headerTopRow}>
          {/* Circular Back Button */}
          <TouchableOpacity
            style={[styles.backCircleBtn, isDark && styles.backCircleBtnDark]}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="chevron-left" size={20} color={isDark ? '#E5EFE7' : '#1E3B2B'} />
          </TouchableOpacity>

          {/* Step Indicator */}
          <View style={[styles.stepIndicatorWrapper, isDark && styles.stepIndicatorWrapperDark]}>
            <Text style={[styles.stepIndicatorText, isDark && styles.stepIndicatorTextDark]}>
              Step {currentStep} of 4 ·{' '}
              {currentStep === 1
                ? 'Stage'
                : currentStep === 2
                ? 'Activity'
                : currentStep === 3
                ? 'Details'
                : 'Summary'}
            </Text>
          </View>

          {/* Top-Right Theme Toggle Ring Icon */}
          <TouchableOpacity
            style={[styles.statusCircleBtn, isDark && styles.statusCircleBtnDark]}
            onPress={() => setDarkMode(!isDark)}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name={isDark ? 'moon' : 'sun'} size={16} color={isDark ? '#4ADE80' : '#457353'} />
          </TouchableOpacity>
        </View>

        {/* Big Serif Heading with Mint Highlight */}
        <View style={styles.titleWrapper}>
          <Text style={[styles.mainTitle, isDark && styles.mainTitleDark]}>
            New <Text style={[styles.highlightedTitle, isDark && styles.highlightedTitleDark]}>Farming Record</Text>
          </Text>
        </View>

        {/* 4-Segment Horizontal Step Progress Bar */}
        <View style={styles.progressBarRow}>
          {[1, 2, 3, 4].map((s) => (
            <View
              key={s}
              style={[
                styles.progressSegment,
                s < currentStep
                  ? styles.segmentCompleted
                  : s === currentStep
                  ? styles.segmentActive
                  : isDark
                  ? styles.segmentInactiveDark
                  : styles.segmentInactive,
              ]}
            />
          ))}
        </View>

        {/* In Steps 2-6: Show compact indicator of selected crop in header */}
        {currentStep > 1 && selectedCrop && (
          <View style={[styles.activeCropPillHeader, isDark && styles.activeCropPillHeaderDark]}>
            <Text style={styles.activeCropEmoji}>{selectedCrop.cropEmoji || '🌱'}</Text>
            <Text style={[styles.activeCropPillText, isDark && styles.activeCropPillTextDark]}>
              {selectedCrop.cropName} · {selectedCrop.batchId || 'BATCH-01'} ({activeStage.title})
            </Text>
          </View>
        )}
      </View>

      {/* Main Body */}
      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Platform.OS === 'ios' ? 120 : 100 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─────────────────────────────────────────────────────────────
              STEP 1: Which stage is your crop in?
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 1 && (
            <View style={styles.stepSection}>
              {/* ─────────────────────────────────────────────────────────
                  NEW SECTION: My Crops (Add New Crop + Existing Crops)
                  ───────────────────────────────────────────────────────── */}
              <View style={styles.myCropsSection}>
                <View style={styles.myCropsHeaderRow}>
                  <Text style={[styles.myCropsTitle, isDark && styles.myCropsTitleDark]}>
                    My Crops
                  </Text>
                  {selectedCrop && (
                    <View style={[styles.cropActiveBadge, isDark && styles.cropActiveBadgeDark]}>
                      <Text style={[styles.cropActiveBadgeText, isDark && styles.cropActiveBadgeTextDark]}>
                        {selectedCrop.cropName} · {selectedCrop.stageName || 'Planting'} ({selectedCrop.growthPercentage || 0}%)
                      </Text>
                    </View>
                  )}
                </View>

                {fields.length === 0 ? (
                  <View style={[styles.emptyCropsBanner, isDark && styles.emptyCropsBannerDark]}>
                    <MaterialCommunityIcons
                      name="sprout-outline"
                      size={28}
                      color={isDark ? '#4ADE80' : '#2A6638'}
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.emptyCropsText, isDark && styles.emptyCropsTextDark]}>
                        No crops added yet.
                      </Text>
                      <Text style={[styles.emptyCropsSubtext, isDark && styles.emptyCropsSubtextDark]}>
                        Create a new crop batch to start recording cultivation stages.
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.emptyAddBtn}
                      onPress={() => setAddCropModalVisible(true)}
                      activeOpacity={0.8}
                    >
                      <Feather name="plus" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.emptyAddBtnText}>Add Crop</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    nestedScrollEnabled={true}
                    contentContainerStyle={styles.myCropsScrollContent}
                    style={styles.myCropsScroll}
                    keyboardShouldPersistTaps="handled"
                  >
                    {/* 1. + Add New Crop Button at beginning of row */}
                    <TouchableOpacity
                      style={[styles.addNewCropBtn, isDark && styles.addNewCropBtnDark]}
                      onPress={() => setAddCropModalVisible(true)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.addNewCropIconWrap}>
                        <Feather name="plus" size={15} color="#FFFFFF" />
                      </View>
                      <Text style={styles.addNewCropBtnText}>Add New Crop</Text>
                    </TouchableOpacity>

                    {/* 2. All existing crops added by the logged-in farmer */}
                    {fields.map((field) => {
                      const isSelected = selectedCrop?.id === field.id;
                      return (
                        <TouchableOpacity
                          key={field.id}
                          style={[
                            styles.cropCardChip,
                            isDark && styles.cropCardChipDark,
                            isSelected && (isDark ? styles.cropCardChipSelectedDark : styles.cropCardChipSelected),
                          ]}
                          onPress={() => handleSelectCrop(field)}
                          activeOpacity={0.8}
                        >
                          <View
                            style={[
                              styles.cropCardEmojiWrap,
                              isSelected && styles.cropCardEmojiWrapSelected,
                            ]}
                          >
                            <Text style={styles.cropCardEmoji}>{field.cropEmoji || '🌱'}</Text>
                          </View>
                          <View style={{ marginLeft: 8 }}>
                            <Text
                              style={[
                                styles.cropCardName,
                                isDark && styles.cropCardNameDark,
                                isSelected && styles.cropCardNameSelected,
                              ]}
                              numberOfLines={1}
                            >
                              {field.cropName}
                            </Text>
                            <Text
                              style={[
                                styles.cropCardBatch,
                                isDark && styles.cropCardBatchDark,
                                isSelected && styles.cropCardBatchSelected,
                              ]}
                              numberOfLines={1}
                            >
                              {field.batchId || 'BATCH-01'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              {/* Heading: Which stage is your crop in? */}
              <Text style={[styles.questionHeading, isDark && styles.questionHeadingDark]}>
                Which stage is your crop in?
              </Text>

              <View style={styles.stagesList}>
                {FARMING_STAGES.map((stg) => {
                  const isSelected = selectedStageNumber === stg.stageNumber;
                  const cropCurrentStage = selectedCrop?.currentStageIndex ?? 1;
                  const cropRecordCount = selectedCrop?.recordCount ?? 0;

                  let statusLabel = 'Upcoming';
                  let isCompleted = false;

                  if (stg.stageNumber < cropCurrentStage) {
                    statusLabel = 'Completed';
                    isCompleted = true;
                  } else if (stg.stageNumber === cropCurrentStage) {
                    if (cropRecordCount === 0 && stg.stageNumber === 1) {
                      statusLabel = 'Not Started';
                    } else {
                      statusLabel = 'Current stage';
                    }
                  } else {
                    statusLabel = 'Upcoming';
                  }

                  return (
                    <TouchableOpacity
                      key={stg.key}
                      style={[
                        styles.stageCard,
                        isDark && styles.stageCardDark,
                        isSelected && (isDark ? styles.stageCardSelectedDark : styles.stageCardSelected),
                      ]}
                      onPress={() => handleSelectStage(stg.stageNumber)}
                      activeOpacity={0.8}
                    >
                      {/* Left Icon */}
                      <View
                        style={[
                          styles.stageIconWrap,
                          isDark && styles.stageIconWrapDark,
                          isSelected && styles.stageIconWrapSelected,
                          isCompleted && !isSelected && styles.stageIconWrapCompleted,
                        ]}
                      >
                        {isCompleted && !isSelected ? (
                          <Feather name="check" size={17} color="#27673A" />
                        ) : (
                          <MaterialCommunityIcons
                            name={
                              stg.stageNumber === 1
                                ? 'sprout'
                                : stg.stageNumber === 2
                                ? 'leaf'
                                : stg.stageNumber === 3
                                ? 'flower-outline'
                                : stg.stageNumber === 4
                                ? 'fruit-cherries'
                                : 'basket-outline'
                            }
                            size={20}
                            color={isSelected ? '#75C590' : isDark ? '#4ADE80' : '#457353'}
                          />
                        )}
                      </View>

                      {/* Stage Name & Status */}
                      <View style={styles.stageTextCol}>
                        <Text
                          style={[
                            styles.stageNameText,
                            isDark && styles.stageNameTextDark,
                            isSelected && styles.stageNameTextSelected,
                          ]}
                        >
                          {stg.title}
                        </Text>
                        <Text
                          style={[
                            styles.stageStatusText,
                            isDark && styles.stageStatusTextDark,
                            isSelected && styles.stageStatusTextSelected,
                          ]}
                        >
                          {statusLabel}
                        </Text>
                      </View>

                      {/* Right Checkmark Indicator */}
                      {isSelected ? (
                        <View style={styles.orangeCheckBadge}>
                          <Feather name="check" size={13} color="#FFFFFF" />
                        </View>
                      ) : (
                        <View style={[styles.unselectedRadioCircle, isDark && styles.unselectedRadioCircleDark]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Bottom Action Button */}
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  isDark && styles.continueButtonDark,
                  (!selectedCrop || fields.length === 0) && styles.continueButtonDisabled,
                ]}
                activeOpacity={0.85}
                onPress={() => {
                  if (!selectedCrop || fields.length === 0) {
                    Alert.alert('Crop Required', 'Please add or select a crop to record farming activities.');
                    return;
                  }
                  setCurrentStep(2);
                }}
                disabled={!selectedCrop || fields.length === 0}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
                <Feather name="arrow-up-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </TouchableOpacity>

              {(!selectedCrop || fields.length === 0) && (
                <Text style={[styles.disabledHintText, isDark && styles.disabledHintTextDark]}>
                  Please add or select a crop above to continue
                </Text>
              )}
            </View>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 2: What did you do today? (2-column activity grid)
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 2 && (
            <View style={styles.stepSection}>
              <Text style={styles.questionHeading}>What did you do today?</Text>
              <Text style={styles.subHeadingNotice}>
                Showing verified activities for {activeStage.title} Stage
              </Text>

              {/* 2-Column Grid */}
              <View style={styles.gridContainer}>
                {stageActivitiesList.map((act) => {
                  const isSelected = selectedActivity?.id === act.id;
                  const meta = ACTIVITY_META[act.id] || {
                    icon: 'sprout',
                    iconFamily: 'mci',
                    subtitle: 'Cultivation Task',
                  };

                  return (
                    <TouchableOpacity
                      key={act.id}
                      style={[
                        styles.gridCard,
                        isSelected && styles.gridCardSelected,
                      ]}
                      onPress={() => setSelectedActivity(act)}
                      activeOpacity={0.8}
                    >
                      {/* Top icon and optional select badge */}
                      <View style={styles.gridCardTopRow}>
                        <View
                          style={[
                            styles.gridIconCircle,
                            isSelected && styles.gridIconCircleSelected,
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={meta.icon as any}
                            size={20}
                            color={isSelected ? '#63C989' : '#2C5D3B'}
                          />
                        </View>
                        {isSelected && (
                          <View style={styles.orangeMiniCheck}>
                            <Feather name="check" size={11} color="#FFFFFF" />
                          </View>
                        )}
                      </View>

                      {/* Activity Title */}
                      <Text
                        style={[styles.gridTitle, isSelected && styles.gridTitleSelected]}
                        numberOfLines={2}
                      >
                        {act.name}
                      </Text>

                      {/* Subtitle / agricultural process */}
                      <Text
                        style={[styles.gridSubtitle, isSelected && styles.gridSubtitleSelected]}
                        numberOfLines={1}
                      >
                        {meta.subtitle}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Optional Note Section */}
              <View style={styles.noteSectionWrapper}>
                <Text style={styles.noteLabel}>Optional note</Text>
                <TextInput
                  style={styles.noteTextInput}
                  placeholder="Anything worth remembering..."
                  placeholderTextColor="#9EB1A2"
                  multiline
                  numberOfLines={3}
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>

              {/* Bottom Action Button */}
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  !selectedActivity && styles.continueButtonDisabled,
                ]}
                disabled={!selectedActivity}
                activeOpacity={0.85}
                onPress={() => setCurrentStep(3)}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
                <Feather name="arrow-up-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 3: What fertilizer did you apply? / Activity details
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 3 && (
            <View style={styles.stepSection}>
              <Text style={[styles.questionHeading, isDark && styles.questionHeadingDark]}>
                {isFertilizerActivity
                  ? 'What fertilizer did you apply?'
                  : isWateringActivity
                  ? 'Watering & Irrigation Details'
                  : selectedActivity?.id === 'harvest_quantity'
                  ? 'Harvest Quantity Measurement'
                  : selectedActivity?.id === 'quality_grading'
                  ? 'Quality Grading Assessment'
                  : selectedActivity?.name?.toLowerCase().endsWith('details')
                  ? selectedActivity.name
                  : `${selectedActivity?.name || 'Activity'} Details`}
              </Text>

              {/* WATERING AND FERTILIZER ACTIVITIES: UNCHANGED AS PER REQUIREMENT 2 */}
              {(isFertilizerActivity || isWateringActivity) ? (
                <>
                  <View style={[styles.detailsFormCard, isDark && styles.detailsFormCardDark]}>
                    {/* Activity badge preview */}
                    <View style={[styles.selectedActivityPill, isDark && styles.selectedActivityPillDark]}>
                      <MaterialCommunityIcons
                        name="sprout"
                        size={15}
                        color={isDark ? '#4ADE80' : '#2B5A39'}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.selectedActivityPillText, isDark && styles.selectedActivityPillTextDark]}>
                        {activeStage.title} · {selectedActivity?.name}
                      </Text>
                    </View>

                    {/* Fertilizer application form */}
                    {isFertilizerActivity && (
                      <>
                        <View style={styles.formGroup}>
                          <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Input 1</Text>
                          <TextInput
                            style={[styles.fieldInput, isDark && styles.fieldInputDark]}
                            placeholder="e.g. NPK Fertilizer / Compost Tea"
                            placeholderTextColor={isDark ? '#6E8A75' : '#9CB0A1'}
                            value={inputName}
                            onChangeText={setInputName}
                          />
                        </View>

                        <View style={styles.formGroup}>
                          <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Amount & Unit</Text>
                          <View style={styles.amountRow}>
                            <TextInput
                              style={[styles.amountInput, isDark && styles.amountInputDark]}
                              keyboardType="numeric"
                              placeholder="0"
                              placeholderTextColor={isDark ? '#6E8A75' : '#9CB0A1'}
                              value={inputQuantity}
                              onChangeText={setInputQuantity}
                            />
                            <View style={styles.unitPillsRow}>
                              {['kg', 'g', 'L', 'mL'].map((u) => (
                                <TouchableOpacity
                                  key={u}
                                  style={[
                                    styles.unitPill,
                                    isDark && styles.unitPillDark,
                                    inputUnit === u && styles.unitPillSelected,
                                    inputUnit === u && isDark && styles.methodPillSelectedDark,
                                  ]}
                                  onPress={() => setInputUnit(u)}
                                >
                                  <Text
                                    style={[
                                      styles.unitPillText,
                                      isDark && styles.unitPillTextDark,
                                      inputUnit === u && styles.unitPillTextSelected,
                                    ]}
                                  >
                                    {u}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                        </View>

                        <View style={styles.formGroup}>
                          <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Application method</Text>
                          <View style={styles.optionsWrapRow}>
                            {['Broadcast', 'Side-dress', 'Foliar', 'Fertigation'].map((m) => (
                              <TouchableOpacity
                                key={m}
                                style={[
                                  styles.methodPill,
                                  isDark && styles.methodPillDark,
                                  applicationMethod === m && styles.methodPillSelected,
                                  applicationMethod === m && isDark && styles.methodPillSelectedDark,
                                ]}
                                onPress={() => setApplicationMethod(m)}
                              >
                                <Text
                                  style={[
                                    styles.methodPillText,
                                    isDark && styles.methodPillTextDark,
                                    applicationMethod === m && styles.methodPillTextSelected,
                                  ]}
                                >
                                  {m}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </>
                    )}

                    {/* Watering & irrigation form */}
                    {isWateringActivity && (
                      <>
                        <View style={styles.formGroup}>
                          <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Water Volume & Unit</Text>
                          <View style={styles.amountRow}>
                            <TextInput
                              style={[styles.amountInput, isDark && styles.amountInputDark]}
                              keyboardType="numeric"
                              placeholder="500"
                              placeholderTextColor={isDark ? '#6E8A75' : '#9CB0A1'}
                              value={waterQuantity}
                              onChangeText={setWaterQuantity}
                            />
                            <View style={styles.unitPillsRow}>
                              {['L', 'm³', 'gal'].map((u) => (
                                <TouchableOpacity
                                  key={u}
                                  style={[
                                    styles.unitPill,
                                    isDark && styles.unitPillDark,
                                    waterUnit === u && styles.unitPillSelected,
                                    waterUnit === u && isDark && styles.methodPillSelectedDark,
                                  ]}
                                  onPress={() => setWaterUnit(u)}
                                >
                                  <Text
                                    style={[
                                      styles.unitPillText,
                                      isDark && styles.unitPillTextDark,
                                      waterUnit === u && styles.unitPillTextSelected,
                                    ]}
                                  >
                                    {u}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                        </View>

                        <View style={styles.formGroup}>
                          <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Irrigation method</Text>
                          <View style={styles.optionsWrapRow}>
                            {['Drip Irrigation', 'Sprinkler', 'Furrow', 'Manual Watering'].map((m) => (
                              <TouchableOpacity
                                key={m}
                                style={[
                                  styles.methodPill,
                                  isDark && styles.methodPillDark,
                                  applicationMethod === m && styles.methodPillSelected,
                                  applicationMethod === m && isDark && styles.methodPillSelectedDark,
                                ]}
                                onPress={() => setApplicationMethod(m)}
                              >
                                <Text
                                  style={[
                                    styles.methodPillText,
                                    isDark && styles.methodPillTextDark,
                                    applicationMethod === m && styles.methodPillTextSelected,
                                  ]}
                                >
                                  {m}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </>
                    )}

                    <View style={styles.formGroup}>
                      <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Location or Field</Text>
                      <TextInput
                        style={[styles.fieldInput, isDark && styles.fieldInputDark]}
                        placeholder="e.g. Greenhouse Bay 1"
                        placeholderTextColor={isDark ? '#6E8A75' : '#9CB0A1'}
                        value={locationName}
                        onChangeText={setLocationName}
                      />
                    </View>

                    {/* Activity Notes */}
                    <View style={styles.formGroup}>
                      <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>
                        Activity Notes <Text style={{ color: '#D9534F' }}>*</Text>
                      </Text>
                      <TextInput
                        style={[
                          styles.notesTextInput,
                          notesError && styles.inputErrorBorder,
                          isDark && styles.notesTextInputDark,
                        ]}
                        placeholder="Enter detailed activity notes and observations..."
                        placeholderTextColor={isDark ? '#6E8A75' : '#9CB0A1'}
                        value={notes}
                        onChangeText={(val) => {
                          setNotes(val);
                          if (val.trim()) setNotesError(null);
                        }}
                        multiline
                        numberOfLines={4}
                      />
                      {notesError && <Text style={styles.errorText}>{notesError}</Text>}
                    </View>

                    {/* Photo Evidence (Optional) */}
                    <View style={styles.formGroup}>
                      <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>
                        Photo Evidence (Optional)
                      </Text>
                      {photoUri ? (
                        <View style={styles.photoPreviewWrapper}>
                          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                          <TouchableOpacity
                            style={styles.removePhotoBtn}
                            onPress={() => setPhotoUri(undefined)}
                            activeOpacity={0.8}
                          >
                            <Feather name="trash-2" size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[styles.attachPhotoBtn, isDark && styles.attachPhotoBtnDark]}
                          onPress={handlePickPhotoOptions}
                          activeOpacity={0.8}
                        >
                          <Feather
                            name="camera"
                            size={18}
                            color={isDark ? '#55D483' : '#2D6A4F'}
                            style={{ marginRight: 8 }}
                          />
                          <Text style={[styles.attachPhotoText, isDark && styles.attachPhotoTextDark]}>
                            Attach Photo Evidence
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.continueButton}
                    activeOpacity={0.85}
                    onPress={handleContinueToSummary}
                  >
                    <Text style={styles.continueButtonText}>Continue</Text>
                    <Feather name="arrow-up-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </>
              ) : (
                /* ALL OTHER ACTIVITIES: NEW REFERENCE DESIGN (AS PER SCREENSHOT) */
                <View style={styles.formSectionWrapper}>
                  <View style={[styles.detailsFormCard, isDark && styles.detailsFormCardDark]}>
                    {/* Activity badge preview */}
                    <View style={[styles.selectedActivityPill, isDark && styles.selectedActivityPillDark]}>
                      <MaterialCommunityIcons
                        name="sprout"
                        size={15}
                        color={isDark ? '#4ADE80' : '#2B5A39'}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.selectedActivityPillText, isDark && styles.selectedActivityPillTextDark]}>
                        {activeStage.title} · {selectedActivity?.name}
                      </Text>
                    </View>

                    {/* ─── STAGE 1: PLANTING ACTIVITIES ─── */}
                    {selectedActivity?.id === 'act-p-crop-details' && (
                      <>
                        <View style={styles.formGroup}>
                          <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Crop Variety / Cultivar</Text>
                          <TextInput
                            style={[styles.fieldInput, isDark && styles.fieldInputDark]}
                            placeholder={`e.g. ${selectedCrop?.cropName || 'Tomato'} Roma VF Heirloom`}
                            placeholderTextColor={isDark ? '#6E8A75' : '#9CB0A1'}
                            value={cropVariety}
                            onChangeText={setCropVariety}
                          />
                        </View>
                        <View style={styles.formGroup}>
                          <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Expected Days to Maturity</Text>
                          <TextInput
                            style={[styles.fieldInput, isDark && styles.fieldInputDark]}
                            placeholder="e.g. 75 - 85 days"
                            placeholderTextColor={isDark ? '#6E8A75' : '#9CB0A1'}
                            value={inputQuantity}
                            onChangeText={setInputQuantity}
                          />
                        </View>
                      </>
                    )}

                    {selectedActivity?.id === 'act-p-land-soil' && (
                      <>
                        <View style={styles.formGroup}>
                          <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Tillage & Bed Method</Text>
                          <View style={styles.optionsWrapRow}>
                            {['Raised Beds', 'Deep Tilling', 'Minimum Tillage', 'Broadforking'].map((m) => (
                              <TouchableOpacity
                                key={m}
                                style={[
                                  styles.methodPill,
                                  isDark && styles.methodPillDark,
                                  soilPrepMethod === m && styles.methodPillSelected,
                                  soilPrepMethod === m && isDark && styles.methodPillSelectedDark,
                                ]}
                                onPress={() => setSoilPrepMethod(m)}
                              >
                                <Text
                                  style={[
                                    styles.methodPillText,
                                    isDark && styles.methodPillTextDark,
                                    soilPrepMethod === m && styles.methodPillTextSelected,
                                  ]}
                                >
                                  {m}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                        <View style={styles.formGroup}>
                          <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Soil Type & Amendments</Text>
                          <TextInput
                            style={[styles.fieldInput, isDark && styles.fieldInputDark]}
                            placeholder="e.g. Loam with Vermicompost & Biochar"
                            placeholderTextColor={isDark ? '#6E8A75' : '#9CB0A1'}
                            value={soilType}
                            onChangeText={setSoilType}
                          />
                        </View>
                      </>
                    )}

                    {selectedActivity?.id === 'act-p-seed-source' && (
                      <>
                        <View style={styles.formGroup}>
                          <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Seed / Seedling Provider</Text>
                          <TextInput
                            style={[styles.fieldInput, isDark && styles.fieldInputDark]}
                            placeholder="e.g. Certified Organic Nursery / Farm Saved"
                            placeholderTextColor={isDark ? '#6E8A75' : '#9CB0A1'}
                            value={seedSource}
                            onChangeText={setSeedSource}
                          />
                        </View>
                        <View style={styles.formGroup}>
                          <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Seed Lot / Batch No. (Optional)</Text>
                          <TextInput
                            style={[styles.fieldInput, isDark && styles.fieldInputDark]}
                            placeholder="e.g. LOT-SL-2026-88"
                            placeholderTextColor={isDark ? '#6E8A75' : '#9CB0A1'}
                            value={seedBatchNo}
                            onChangeText={setSeedBatchNo}
                          />
                        </View>
                        <View style={styles.formGroup}>
                          <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Germination Rate</Text>
                          <TextInput
                            style={[styles.fieldInput, isDark && styles.fieldInputDark]}
                            placeholder="e.g. 92%"
                            placeholderTextColor={isDark ? '#6E8A75' : '#9CB0A1'}
                            value={germinationRate}
                            onChangeText={setGerminationRate}
                          />
                        </View>
                      </>
                    )}

                    {selectedActivity?.id === 'act-p-planting-details' && (
                      <>
                        <View style={styles.formGroup}>
                          <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Planting Method</Text>
                          <View style={styles.optionsWrapRow}>
                            {['Transplanting', 'Direct Seeding', 'Nursery Tray'].map((m) => (
                              <TouchableOpacity
                                key={m}
                                style={[
                                  styles.methodPill,
                                  isDark && styles.methodPillDark,
                                  plantingMethod === m && styles.methodPillSelected,
                                  plantingMethod === m && isDark && styles.methodPillSelectedDark,
                                ]}
                                onPress={() => setPlantingMethod(m)}
                              >
                                <Text
                                  style={[
                                    styles.methodPillText,
                                    isDark && styles.methodPillTextDark,
                                    plantingMethod === m && styles.methodPillTextSelected,
                                  ]}
                                >
                                  {m}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                        <View style={styles.formGroup}>
                          <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Spacing (Row × Plant)</Text>
                          <TextInput
                            style={[styles.fieldInput, isDark && styles.fieldInputDark]}
                            placeholder="e.g. 45 cm × 60 cm"
                            placeholderTextColor={isDark ? '#6E8A75' : '#9CB0A1'}
                            value={plantSpacing}
                            onChangeText={setPlantSpacing}
                          />
                        </View>
                      </>
                    )}

                    {/* ─── STAGE 2: VEGETATIVE GROWTH ACTIVITIES ─── */}
                    {selectedActivity?.id === 'act-vg-weeding' && (
                      <View style={styles.formGroup}>
                        <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Weeding Method</Text>
                        <View style={styles.optionsWrapRow}>
                          {['Manual Hand Weeding', 'Organic Mulching', 'Mechanical Hoeing', 'Cover Cropping'].map((m) => (
                            <TouchableOpacity
                              key={m}
                              style={[
                                styles.methodPill,
                                isDark && styles.methodPillDark,
                                weedingMethod === m && styles.methodPillSelected,
                                weedingMethod === m && isDark && styles.methodPillSelectedDark,
                              ]}
                              onPress={() => setWeedingMethod(m)}
                            >
                              <Text
                                style={[
                                  styles.methodPillText,
                                  isDark && styles.methodPillTextDark,
                                  weedingMethod === m && styles.methodPillTextSelected,
                                ]}
                              >
                                {m}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {(selectedActivity?.id === 'act-vg-pest' ||
                      selectedActivity?.id === 'flowering_pest_management' ||
                      selectedActivity?.id === 'maturity_pest_management') && (
                      <>
                        <View style={styles.formGroup}>
                          <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Pest / Disease Observed</Text>
                          <TextInput
                            style={[styles.fieldInput, isDark && styles.fieldInputDark]}
                            placeholder="e.g. Zero pests / Whiteflies under control"
                            placeholderTextColor={isDark ? '#6E8A75' : '#9CB0A1'}
                            value={pestObserved}
                            onChangeText={setPestObserved}
                          />
                        </View>
                        <View style={styles.formGroup}>
                          <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Severity Level</Text>
                          <View style={styles.optionsWrapRow}>
                            {['None', 'Low (Trace)', 'Moderate', 'High'].map((s) => (
                              <TouchableOpacity
                                key={s}
                                style={[
                                  styles.methodPill,
                                  isDark && styles.methodPillDark,
                                  pestSeverity === s && styles.methodPillSelected,
                                  pestSeverity === s && isDark && styles.methodPillSelectedDark,
                                ]}
                                onPress={() => setPestSeverity(s)}
                              >
                                <Text
                                  style={[
                                    styles.methodPillText,
                                    isDark && styles.methodPillTextDark,
                                    pestSeverity === s && styles.methodPillTextSelected,
                                  ]}
                                >
                                  {s}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </>
                    )}

                    {selectedActivity?.id === 'act-vg-growth' && (
                      <>
                        <View style={styles.formGroup}>
                          <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Average Plant Height</Text>
                          <TextInput
                            style={[styles.fieldInput, isDark && styles.fieldInputDark]}
                            placeholder="e.g. 35 cm"
                            placeholderTextColor={isDark ? '#6E8A75' : '#9CB0A1'}
                            value={plantHeight}
                            onChangeText={setPlantHeight}
                          />
                        </View>
                        <View style={styles.formGroup}>
                          <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Crop Vigor & Health</Text>
                          <View style={styles.optionsWrapRow}>
                            {['Excellent', 'Good', 'Fair', 'Stressed'].map((v) => (
                              <TouchableOpacity
                                key={v}
                                style={[
                                  styles.methodPill,
                                  isDark && styles.methodPillDark,
                                  cropVigor === v && styles.methodPillSelected,
                                  cropVigor === v && isDark && styles.methodPillSelectedDark,
                                ]}
                                onPress={() => setCropVigor(v)}
                              >
                                <Text
                                  style={[
                                    styles.methodPillText,
                                    isDark && styles.methodPillTextDark,
                                    cropVigor === v && styles.methodPillTextSelected,
                                  ]}
                                >
                                  {v}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </>
                    )}

                    {selectedActivity?.id === 'act-vg-env' && (
                      <>
                        <View style={styles.formGroup}>
                          <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Temperature (°C)</Text>
                          <TextInput
                            style={[styles.fieldInput, isDark && styles.fieldInputDark]}
                            placeholder="e.g. 26°C"
                            placeholderTextColor={isDark ? '#6E8A75' : '#9CB0A1'}
                            value={envTemperature}
                            onChangeText={setEnvTemperature}
                          />
                        </View>
                        <View style={styles.formGroup}>
                          <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Relative Humidity</Text>
                          <TextInput
                            style={[styles.fieldInput, isDark && styles.fieldInputDark]}
                            placeholder="e.g. 75% RH"
                            placeholderTextColor={isDark ? '#6E8A75' : '#9CB0A1'}
                            value={envHumidity}
                            onChangeText={setEnvHumidity}
                          />
                        </View>
                        <View style={styles.formGroup}>
                          <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Soil Moisture</Text>
                          <View style={styles.optionsWrapRow}>
                            {['Optimal', 'Slightly Moist', 'Dry', 'Waterlogged'].map((sm) => (
                              <TouchableOpacity
                                key={sm}
                                style={[
                                  styles.methodPill,
                                  isDark && styles.methodPillDark,
                                  soilMoisture === sm && styles.methodPillSelected,
                                  soilMoisture === sm && isDark && styles.methodPillSelectedDark,
                                ]}
                                onPress={() => setSoilMoisture(sm)}
                              >
                                <Text
                                  style={[
                                    styles.methodPillText,
                                    isDark && styles.methodPillTextDark,
                                    soilMoisture === sm && styles.methodPillTextSelected,
                                  ]}
                                >
                                  {sm}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </>
                    )}

                    {/* ─── STAGE 3: FLOWERING ACTIVITIES ─── */}
                    {selectedActivity?.id === 'flowering_observation' && (
                      <View style={styles.formGroup}>
                        <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Bloom Progress</Text>
                        <View style={styles.optionsWrapRow}>
                          {['Budding (10%)', 'Early Bloom (30%)', 'Full Bloom (70%)', 'Peak Bloom (100%)'].map((bp) => (
                            <TouchableOpacity
                              key={bp}
                              style={[
                                styles.methodPill,
                                isDark && styles.methodPillDark,
                                bloomProgress === bp && styles.methodPillSelected,
                                bloomProgress === bp && isDark && styles.methodPillSelectedDark,
                              ]}
                              onPress={() => setBloomProgress(bp)}
                            >
                              <Text
                                style={[
                                  styles.methodPillText,
                                  isDark && styles.methodPillTextDark,
                                  bloomProgress === bp && styles.methodPillTextSelected,
                                ]}
                              >
                                {bp}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {selectedActivity?.id === 'pollination_monitoring' && (
                      <View style={styles.formGroup}>
                        <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Pollinator Activity</Text>
                        <View style={styles.optionsWrapRow}>
                          {['High (Active)', 'Moderate', 'Low'].map((pa) => (
                            <TouchableOpacity
                              key={pa}
                              style={[
                                styles.methodPill,
                                isDark && styles.methodPillDark,
                                pollinatorActivity === pa && styles.methodPillSelected,
                                pollinatorActivity === pa && isDark && styles.methodPillSelectedDark,
                              ]}
                              onPress={() => setPollinatorActivity(pa)}
                            >
                              <Text
                                style={[
                                  styles.methodPillText,
                                  isDark && styles.methodPillTextDark,
                                  pollinatorActivity === pa && styles.methodPillTextSelected,
                                ]}
                              >
                                {pa}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {selectedActivity?.id === 'flower_health_monitoring' && (
                      <View style={styles.formGroup}>
                        <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Flower Health & Retention</Text>
                        <View style={styles.optionsWrapRow}>
                          {['Excellent', 'Normal Retention', 'Minor Flower Drop'].map((fr) => (
                            <TouchableOpacity
                              key={fr}
                              style={[
                                styles.methodPill,
                                isDark && styles.methodPillDark,
                                flowerRetention === fr && styles.methodPillSelected,
                                flowerRetention === fr && isDark && styles.methodPillSelectedDark,
                              ]}
                              onPress={() => setFlowerRetention(fr)}
                            >
                              <Text
                                style={[
                                  styles.methodPillText,
                                  isDark && styles.methodPillTextDark,
                                  flowerRetention === fr && styles.methodPillTextSelected,
                                ]}
                              >
                                {fr}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* ─── STAGE 4: CROP MATURITY ACTIVITIES ─── */}
                    {selectedActivity?.id === 'crop_growth_development' && (
                      <View style={styles.formGroup}>
                        <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Average Fruit / Crop Size</Text>
                        <TextInput
                          style={[styles.fieldInput, isDark && styles.fieldInputDark]}
                          placeholder="e.g. 6.5 - 7.5 cm diameter"
                          placeholderTextColor={isDark ? '#6E8A75' : '#9CB0A1'}
                          value={fruitSize}
                          onChangeText={setFruitSize}
                        />
                      </View>
                    )}

                    {selectedActivity?.id === 'ripeness_maturity_monitoring' && (
                      <View style={styles.formGroup}>
                        <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Ripeness Stage</Text>
                        <View style={styles.optionsWrapRow}>
                          {['Breaker / Turning', 'Pink Stage', 'Light Red', 'Fully Ripe'].map((rl) => (
                            <TouchableOpacity
                              key={rl}
                              style={[
                                styles.methodPill,
                                isDark && styles.methodPillDark,
                                ripenessLevel === rl && styles.methodPillSelected,
                                ripenessLevel === rl && isDark && styles.methodPillSelectedDark,
                              ]}
                              onPress={() => setRipenessLevel(rl)}
                            >
                              <Text
                                style={[
                                  styles.methodPillText,
                                  isDark && styles.methodPillTextDark,
                                  ripenessLevel === rl && styles.methodPillTextSelected,
                                ]}
                              >
                                {rl}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {selectedActivity?.id === 'harvest_readiness_assessment' && (
                      <View style={styles.formGroup}>
                        <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Harvest Readiness</Text>
                        <View style={styles.optionsWrapRow}>
                          {['Ready Now', 'Ready in 1-2 Days', 'Ready in 3-5 Days'].map((hr) => (
                            <TouchableOpacity
                              key={hr}
                              style={[
                                styles.methodPill,
                                isDark && styles.methodPillDark,
                                harvestReadiness === hr && styles.methodPillSelected,
                                harvestReadiness === hr && isDark && styles.methodPillSelectedDark,
                              ]}
                              onPress={() => setHarvestReadiness(hr)}
                            >
                              <Text
                                style={[
                                  styles.methodPillText,
                                  isDark && styles.methodPillTextDark,
                                  harvestReadiness === hr && styles.methodPillTextSelected,
                                ]}
                              >
                                {hr}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* ─── STAGE 5: HARVESTING ACTIVITIES ─── */}
                    {selectedActivity?.id === 'harvest_details' && (
                      <>
                        <View style={styles.formGroup}>
                          <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Harvest Method</Text>
                          <View style={styles.optionsWrapRow}>
                            {['Manual Hand Picking', 'Pruning Shears', 'Crate Collection'].map((m) => (
                              <TouchableOpacity
                                key={m}
                                style={[
                                  styles.methodPill,
                                  isDark && styles.methodPillDark,
                                  harvestMethod === m && styles.methodPillSelected,
                                  harvestMethod === m && isDark && styles.methodPillSelectedDark,
                                ]}
                                onPress={() => setHarvestMethod(m)}
                              >
                                <Text
                                  style={[
                                    styles.methodPillText,
                                    isDark && styles.methodPillTextDark,
                                    harvestMethod === m && styles.methodPillTextSelected,
                                  ]}
                                >
                                  {m}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                        <View style={styles.formGroup}>
                          <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Crop Condition at Harvest</Text>
                          <TextInput
                            style={[styles.fieldInput, isDark && styles.fieldInputDark]}
                            placeholder="e.g. Fully ripe, firm, morning harvest"
                            placeholderTextColor={isDark ? '#6E8A75' : '#9CB0A1'}
                            value={cropCondition}
                            onChangeText={setCropCondition}
                          />
                        </View>
                      </>
                    )}

                    {(selectedActivity?.id === 'harvest_quantity' ||
                      selectedActivity?.name.toLowerCase().includes('quantity')) && (
                      <View style={styles.formGroup}>
                        <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Total Harvested Quantity</Text>
                        <View style={styles.amountRow}>
                          <TextInput
                            style={[styles.amountInput, isDark && styles.amountInputDark]}
                            keyboardType="numeric"
                            placeholder="150"
                            placeholderTextColor={isDark ? '#6E8A75' : '#9CB0A1'}
                            value={inputQuantity}
                            onChangeText={setInputQuantity}
                          />
                          <View style={styles.unitPillsRow}>
                            {['kg', 'tonnes', 'crates', 'pieces'].map((u) => (
                              <TouchableOpacity
                                key={u}
                                style={[
                                  styles.unitPill,
                                  isDark && styles.unitPillDark,
                                  inputUnit === u && styles.unitPillSelected,
                                  inputUnit === u && isDark && styles.methodPillSelectedDark,
                                ]}
                                onPress={() => setInputUnit(u)}
                              >
                                <Text
                                  style={[
                                    styles.unitPillText,
                                    isDark && styles.unitPillTextDark,
                                    inputUnit === u && styles.unitPillTextSelected,
                                  ]}
                                >
                                  {u}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </View>
                    )}

                    {(selectedActivity?.id === 'quality_grading' ||
                      selectedActivity?.id === 'crop_quality_assessment' ||
                      selectedActivity?.name.toLowerCase().includes('grading')) && (
                      <View style={styles.formGroup}>
                        <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Quality Grade</Text>
                        <View style={styles.optionsWrapRow}>
                          {['Grade A', 'Grade B', 'Grade C', 'Ungraded'].map((g) => (
                            <TouchableOpacity
                              key={g}
                              style={[
                                styles.methodPill,
                                isDark && styles.methodPillDark,
                                qualityGrade === g && styles.methodPillSelected,
                                qualityGrade === g && isDark && styles.methodPillSelectedDark,
                              ]}
                              onPress={() => setQualityGrade(g)}
                            >
                              <Text
                                style={[
                                  styles.methodPillText,
                                  isDark && styles.methodPillTextDark,
                                  qualityGrade === g && styles.methodPillTextSelected,
                                ]}
                              >
                                {g}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {selectedActivity?.id === 'sorting_cleaning' && (
                      <>
                        <View style={styles.formGroup}>
                          <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Sorting Method</Text>
                          <View style={styles.optionsWrapRow}>
                            {['Manual Hand Sorting', 'Conveyor Table', 'Optical Sorter'].map((sm) => (
                              <TouchableOpacity
                                key={sm}
                                style={[
                                  styles.methodPill,
                                  isDark && styles.methodPillDark,
                                  sortingMethod === sm && styles.methodPillSelected,
                                  sortingMethod === sm && isDark && styles.methodPillSelectedDark,
                                ]}
                                onPress={() => setSortingMethod(sm)}
                              >
                                <Text
                                  style={[
                                    styles.methodPillText,
                                    isDark && styles.methodPillTextDark,
                                    sortingMethod === sm && styles.methodPillTextSelected,
                                  ]}
                                >
                                  {sm}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                        <View style={styles.formGroup}>
                          <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Cleaning Method</Text>
                          <View style={styles.optionsWrapRow}>
                            {['Wipe Clean', 'Dry Brushing', 'Water Wash', 'No Cleaning'].map((cm) => (
                              <TouchableOpacity
                                key={cm}
                                style={[
                                  styles.methodPill,
                                  isDark && styles.methodPillDark,
                                  cleaningMethod === cm && styles.methodPillSelected,
                                  cleaningMethod === cm && isDark && styles.methodPillSelectedDark,
                                ]}
                                onPress={() => setCleaningMethod(cm)}
                              >
                                <Text
                                  style={[
                                    styles.methodPillText,
                                    isDark && styles.methodPillTextDark,
                                    cleaningMethod === cm && styles.methodPillTextSelected,
                                  ]}
                                >
                                  {cm}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </>
                    )}

                    {(selectedActivity?.id === 'harvest_packaging' ||
                      selectedActivity?.name.toLowerCase().includes('packaging')) && (
                      <View style={styles.formGroup}>
                        <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Packaging Material</Text>
                        <View style={styles.optionsWrapRow}>
                          {['Perforated Crates', 'Eco Jute Bags', 'Corrugated Boxes', 'Biodegradable Punnet'].map((p) => (
                            <TouchableOpacity
                              key={p}
                              style={[
                                styles.methodPill,
                                isDark && styles.methodPillDark,
                                packagingType === p && styles.methodPillSelected,
                                packagingType === p && isDark && styles.methodPillSelectedDark,
                              ]}
                              onPress={() => setPackagingType(p)}
                            >
                              <Text
                                style={[
                                  styles.methodPillText,
                                  isDark && styles.methodPillTextDark,
                                  packagingType === p && styles.methodPillTextSelected,
                                ]}
                              >
                                {p}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {(selectedActivity?.id === 'storage_conditions' ||
                      selectedActivity?.name.toLowerCase().includes('storage')) && (
                      <View style={styles.formGroup}>
                        <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Storage Method</Text>
                        <View style={styles.optionsWrapRow}>
                          {['Controlled Cold Storage', 'Ventilated Dry Store', 'Ambient Curing'].map((sm) => (
                            <TouchableOpacity
                              key={sm}
                              style={[
                                styles.methodPill,
                                isDark && styles.methodPillDark,
                                storageMethod === sm && styles.methodPillSelected,
                                storageMethod === sm && isDark && styles.methodPillSelectedDark,
                              ]}
                              onPress={() => setStorageMethod(sm)}
                            >
                              <Text
                                style={[
                                  styles.methodPillText,
                                  isDark && styles.methodPillTextDark,
                                  storageMethod === sm && styles.methodPillTextSelected,
                                ]}
                              >
                                {sm}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {selectedActivity?.id === 'batch_identification' && (
                      <View style={styles.formGroup}>
                        <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Harvest Batch ID</Text>
                        <TextInput
                          style={[styles.fieldInput, isDark && styles.fieldInputDark]}
                          placeholder={`e.g. HARV-${selectedCrop?.batchId || 'BATCH-01'}`}
                          placeholderTextColor={isDark ? '#6E8A75' : '#9CB0A1'}
                          value={harvestBatchCode}
                          onChangeText={setHarvestBatchCode}
                        />
                      </View>
                    )}

                    {/* Common Field: Location or Field */}
                    <View style={styles.formGroup}>
                      <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Location or Field</Text>
                      <TextInput
                        style={[styles.fieldInput, isDark && styles.fieldInputDark]}
                        placeholder="e.g. Greenhouse Bay 1"
                        placeholderTextColor={isDark ? '#6E8A75' : '#9CB0A1'}
                        value={locationName}
                        onChangeText={setLocationName}
                      />
                    </View>

                    {/* ─── REFERENCE DESIGN: ACTIVITY NOTES * ─── */}
                    <View style={styles.formGroup}>
                      <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>
                        Activity Notes <Text style={{ color: '#D9534F' }}>*</Text>
                      </Text>
                      <TextInput
                        style={[
                          styles.notesTextInput,
                          notesError && styles.inputErrorBorder,
                          isDark && styles.notesTextInputDark,
                        ]}
                        placeholder="Enter detailed activity notes and observations..."
                        placeholderTextColor={isDark ? '#6E8A75' : '#9CB0A1'}
                        value={notes}
                        onChangeText={(val) => {
                          setNotes(val);
                          if (val.trim()) setNotesError(null);
                        }}
                        multiline
                        numberOfLines={4}
                      />
                      {notesError && <Text style={styles.errorText}>{notesError}</Text>}
                    </View>

                    {/* ─── REFERENCE DESIGN: PHOTO EVIDENCE (OPTIONAL) ─── */}
                    <View style={styles.formGroup}>
                      <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>
                        Photo Evidence (Optional)
                      </Text>
                      {photoUri ? (
                        <View style={styles.photoPreviewWrapper}>
                          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                          <TouchableOpacity
                            style={styles.removePhotoBtn}
                            onPress={() => setPhotoUri(undefined)}
                            activeOpacity={0.8}
                          >
                            <Feather name="trash-2" size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[styles.attachPhotoBtn, isDark && styles.attachPhotoBtnDark]}
                          onPress={handlePickPhotoOptions}
                          activeOpacity={0.8}
                        >
                          <Feather
                            name="camera"
                            size={18}
                            color={isDark ? '#55D483' : '#2D6A4F'}
                            style={{ marginRight: 8 }}
                          />
                          <Text style={[styles.attachPhotoText, isDark && styles.attachPhotoTextDark]}>
                            Attach Photo Evidence
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Continue Button to Activity Summary */}
                  <TouchableOpacity
                    style={styles.continueButton}
                    activeOpacity={0.85}
                    onPress={handleContinueToSummary}
                  >
                    <Text style={styles.continueButtonText}>Continue</Text>
                    <Feather name="arrow-up-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 4: Activity Summary (Review & Submit Record)
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 4 && (
            <View style={styles.stepSection}>
              <Text style={[styles.questionHeading, isDark && styles.questionHeadingDark]}>
                Activity Summary
              </Text>
              <Text style={[styles.subHeadingNotice, isDark && styles.subHeadingNoticeDark]}>
                Review all entered details before locking this verified record into the traceability ledger.
              </Text>

              {/* Summary Card */}
              <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
                <View style={styles.summaryTopBadge}>
                  <Ionicons name="shield-checkmark" size={14} color="#27673A" style={{ marginRight: 5 }} />
                  <Text style={styles.summaryTopBadgeText}>Tamper-Proof Organic Ledger Preview</Text>
                </View>

                {/* Crop & Batch */}
                <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                  <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Crop & Batch</Text>
                  <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                    {selectedCrop?.cropName || 'Crop'} ({selectedCrop?.batchId || 'BATCH-01'})
                  </Text>
                </View>

                {/* Stage */}
                <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                  <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Farming Stage</Text>
                  <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                    {activeStage.title} Stage
                  </Text>
                </View>

                {/* Activity */}
                <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                  <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Activity</Text>
                  <Text style={[styles.summaryValue, { color: isDark ? '#4ADE80' : '#27673A', fontWeight: '700' }]}>
                    {selectedActivity?.name}
                  </Text>
                </View>

                {/* Location & Time */}
                <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                  <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Location & Date</Text>
                  <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                    {locationName || 'Greenhouse Bay 1'} · Today
                  </Text>
                </View>

                {/* ─── DYNAMIC ACTIVITY-SPECIFIC DETAILS ─── */}
                {isFertilizerActivity && (
                  <>
                    <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                      <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Input Applied</Text>
                      <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                        {inputName} ({inputQuantity} {inputUnit})
                      </Text>
                    </View>
                    <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                      <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Application Method</Text>
                      <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                        {applicationMethod}
                      </Text>
                    </View>
                  </>
                )}

                {isWateringActivity && (
                  <>
                    <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                      <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Water Volume</Text>
                      <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                        {waterQuantity} {waterUnit}
                      </Text>
                    </View>
                    <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                      <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Irrigation Method</Text>
                      <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                        {applicationMethod}
                      </Text>
                    </View>
                  </>
                )}

                {selectedActivity?.id === 'act-p-crop-details' && (
                  <>
                    <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                      <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Crop Variety</Text>
                      <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                        {cropVariety || selectedCrop?.cropName}
                      </Text>
                    </View>
                    {inputQuantity ? (
                      <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                        <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Maturity Period</Text>
                        <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                          {inputQuantity}
                        </Text>
                      </View>
                    ) : null}
                  </>
                )}

                {selectedActivity?.id === 'act-p-land-soil' && (
                  <>
                    <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                      <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Tillage & Bed Method</Text>
                      <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                        {soilPrepMethod}
                      </Text>
                    </View>
                    <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                      <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Soil & Amendments</Text>
                      <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                        {soilType}
                      </Text>
                    </View>
                  </>
                )}

                {selectedActivity?.id === 'act-p-seed-source' && (
                  <>
                    <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                      <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Seed Provider</Text>
                      <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                        {seedSource || 'Certified Organic Nursery'}
                      </Text>
                    </View>
                    {seedBatchNo ? (
                      <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                        <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Lot / Batch No.</Text>
                        <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                          {seedBatchNo}
                        </Text>
                      </View>
                    ) : null}
                    <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                      <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Germination Rate</Text>
                      <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                        {germinationRate}
                      </Text>
                    </View>
                  </>
                )}

                {selectedActivity?.id === 'act-p-planting-details' && (
                  <>
                    <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                      <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Planting Method</Text>
                      <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                        {plantingMethod}
                      </Text>
                    </View>
                    <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                      <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Spacing</Text>
                      <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                        {plantSpacing}
                      </Text>
                    </View>
                  </>
                )}

                {selectedActivity?.id === 'act-vg-weeding' && (
                  <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                    <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Weeding Method</Text>
                    <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                      {weedingMethod}
                    </Text>
                  </View>
                )}

                {(selectedActivity?.id === 'act-vg-pest' ||
                  selectedActivity?.id === 'flowering_pest_management' ||
                  selectedActivity?.id === 'maturity_pest_management') && (
                  <>
                    <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                      <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Pest / Disease</Text>
                      <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                        {pestObserved || 'None detected'}
                      </Text>
                    </View>
                    <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                      <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Severity Level</Text>
                      <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                        {pestSeverity}
                      </Text>
                    </View>
                  </>
                )}

                {selectedActivity?.id === 'act-vg-growth' && (
                  <>
                    {plantHeight ? (
                      <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                        <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Plant Height</Text>
                        <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                          {plantHeight}
                        </Text>
                      </View>
                    ) : null}
                    <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                      <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Crop Vigor</Text>
                      <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                        {cropVigor}
                      </Text>
                    </View>
                  </>
                )}

                {selectedActivity?.id === 'act-vg-env' && (
                  <>
                    <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                      <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Temp & Humidity</Text>
                      <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                        {envTemperature} · {envHumidity}
                      </Text>
                    </View>
                    <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                      <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Soil Moisture</Text>
                      <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                        {soilMoisture}
                      </Text>
                    </View>
                  </>
                )}

                {selectedActivity?.id === 'flowering_observation' && (
                  <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                    <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Bloom Progress</Text>
                    <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                      {bloomProgress}
                    </Text>
                  </View>
                )}

                {selectedActivity?.id === 'pollination_monitoring' && (
                  <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                    <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Pollinator Activity</Text>
                    <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                      {pollinatorActivity}
                    </Text>
                  </View>
                )}

                {selectedActivity?.id === 'flower_health_monitoring' && (
                  <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                    <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Flower Retention</Text>
                    <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                      {flowerRetention}
                    </Text>
                  </View>
                )}

                {selectedActivity?.id === 'crop_growth_development' && (
                  <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                    <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Fruit / Crop Size</Text>
                    <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                      {fruitSize || 'Uniform sizing'}
                    </Text>
                  </View>
                )}

                {selectedActivity?.id === 'ripeness_maturity_monitoring' && (
                  <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                    <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Ripeness Stage</Text>
                    <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                      {ripenessLevel}
                    </Text>
                  </View>
                )}

                {selectedActivity?.id === 'harvest_readiness_assessment' && (
                  <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                    <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Harvest Readiness</Text>
                    <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                      {harvestReadiness}
                    </Text>
                  </View>
                )}

                {selectedActivity?.id === 'harvest_details' && (
                  <>
                    <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                      <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Harvest Method</Text>
                      <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                        {harvestMethod}
                      </Text>
                    </View>
                    <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                      <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Crop Condition</Text>
                      <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                        {cropCondition}
                      </Text>
                    </View>
                  </>
                )}

                {(selectedActivity?.id === 'harvest_quantity' || selectedActivity?.name?.toLowerCase().includes('quantity')) && (
                  <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                    <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Harvested Quantity</Text>
                    <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                      {inputQuantity} {inputUnit}
                    </Text>
                  </View>
                )}

                {(selectedActivity?.id === 'quality_grading' || selectedActivity?.id === 'crop_quality_assessment' || selectedActivity?.name?.toLowerCase().includes('grading')) && (
                  <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                    <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Quality Grade</Text>
                    <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                      {qualityGrade}
                    </Text>
                  </View>
                )}

                {selectedActivity?.id === 'sorting_cleaning' && (
                  <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                    <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Sorting & Cleaning</Text>
                    <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                      {sortingMethod} · {cleaningMethod}
                    </Text>
                  </View>
                )}

                {(selectedActivity?.id === 'harvest_packaging' || selectedActivity?.name?.toLowerCase().includes('packaging')) && (
                  <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                    <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Packaging Type</Text>
                    <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                      {packagingType}
                    </Text>
                  </View>
                )}

                {(selectedActivity?.id === 'storage_conditions' || selectedActivity?.name?.toLowerCase().includes('storage')) && (
                  <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                    <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Storage Method</Text>
                    <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                      {storageMethod}
                    </Text>
                  </View>
                )}

                {selectedActivity?.id === 'batch_identification' && (
                  <View style={[styles.summaryRow, isDark && styles.summaryRowDark]}>
                    <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Harvest Batch ID</Text>
                    <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                      {harvestBatchCode || `HARV-${selectedCrop?.batchId || 'BATCH-01'}`}
                    </Text>
                  </View>
                )}

                {/* Notes Box */}
                <View style={[styles.summaryNotesBox, isDark && styles.summaryNotesBoxDark]}>
                  <Text style={[styles.summaryNotesLabel, isDark && styles.summaryNotesLabelDark]}>Activity Notes:</Text>
                  <Text style={[styles.summaryNotesText, isDark && styles.summaryNotesTextDark]}>
                    {notes.trim() || `Verified ${selectedActivity?.name} recorded.`}
                  </Text>
                </View>

                {/* Photo Evidence in Summary */}
                {photoUri ? (
                  <View style={[styles.summaryPhotoRow, isDark && styles.summaryPhotoRowDark]}>
                    <Image source={{ uri: photoUri }} style={styles.summaryThumbnail} />
                    <View style={styles.summaryPhotoMeta}>
                      <Text style={[styles.summaryPhotoTitle, isDark && styles.summaryPhotoTitleDark]}>
                        Photo Evidence Attached
                      </Text>
                      <Text style={[styles.summaryPhotoSubtitle, isDark && styles.summaryPhotoSubtitleDark]}>
                        GPS stamped & cryptographically signed
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.summaryNoPhotoRow, isDark && styles.summaryNoPhotoRowDark]}>
                    <MaterialCommunityIcons name="camera-off-outline" size={16} color={isDark ? '#6E8A75' : '#8A9E8F'} style={{ marginRight: 6 }} />
                    <Text style={[styles.summaryNoPhotoText, isDark && styles.summaryNoPhotoTextDark]}>
                      No photo evidence attached (Optional)
                    </Text>
                  </View>
                )}

                {/* Immutable Ledger Hash Box */}
                <View style={[styles.hashPreviewBox, isDark && styles.hashPreviewBoxDark]}>
                  <MaterialCommunityIcons name="shield-check" size={15} color={isDark ? '#4ADE80' : '#357A49'} style={{ marginRight: 6 }} />
                  <Text style={[styles.hashPreviewText, isDark && styles.hashPreviewTextDark]}>
                    Hash: 0x8F4A...B219 · 100% Certified Organic Ledger
                  </Text>
                </View>
              </View>

              {/* ─── SUMMARY ACTIONS: BACK / EDIT & SUBMIT RECORD ─── */}
              <View style={styles.summaryActionsRow}>
                <TouchableOpacity
                  style={[styles.summaryEditBtn, isDark && styles.summaryEditBtnDark]}
                  onPress={() => setCurrentStep(3)}
                  activeOpacity={0.7}
                  disabled={isSubmitting}
                >
                  <Feather name="edit-2" size={16} color={isDark ? '#4ADE80' : '#27673A'} style={{ marginRight: 6 }} />
                  <Text style={[styles.summaryEditBtnText, isDark && styles.summaryEditBtnTextDark]}>
                    Back / Edit
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.summarySubmitBtn,
                    isDark && styles.summarySubmitBtnDark,
                    isSubmitting && styles.submitButtonDisabled,
                  ]}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                  onPress={handleSubmitAndLock}
                >
                  <Ionicons name="lock-closed" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.summarySubmitBtnText}>
                    {isSubmitting ? 'Securing on Ledger...' : 'Submit Record'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Bottom Navigation Bar */}
      <FarmerBottomTabBar />

      {/* Success Modal */}
      {submittedRecordCode && (
        <View style={styles.successModalOverlay}>
          <View style={[styles.successModalCard, isDark && styles.successModalCardDark]}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={48} color="#27673A" />
            </View>
            <Text style={[styles.successTitle, isDark && styles.successTitleDark]}>Record Locked & Verified!</Text>
            <Text style={styles.successRecordCode}>{submittedRecordCode}</Text>
            <Text style={[styles.successMessage, isDark && styles.successMessageDark]}>
              Your activity &quot;{selectedActivity?.name}&quot; has been recorded and automatically checked off
              in the {activeStage.title} Stage Activities checklist.
            </Text>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              activeOpacity={0.85}
              onPress={() => {
                setSubmittedRecordCode(null);
                router.replace(
                  `/(farmer)/harvests/${selectedCrop?.id || 'field-tomato'}/stage?stageNumber=${selectedStageNumber}` as any
                );
              }}
            >
              <Text style={styles.modalPrimaryBtnText}>Return to {activeStage.title} Stage</Text>
              <Feather name="arrow-right" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSecondaryBtn}
              activeOpacity={0.7}
              onPress={() => {
                setSubmittedRecordCode(null);
                router.replace(
                  `/(farmer)/harvests/${selectedCrop?.id || 'field-tomato'}/stage?stageNumber=${selectedStageNumber}` as any
                );
              }}
            >
              <Text style={[styles.modalSecondaryBtnText, isDark && styles.modalSecondaryBtnTextDark]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Add New Crop Modal */}
      <AddNewCropModal
        visible={addCropModalVisible}
        onClose={() => setAddCropModalVisible(false)}
        onCreateCrop={handleCreateNewCrop}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#F5F3EC',
  },
  headerContainer: {
    backgroundColor: '#F5F3EC',
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  backCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  stepIndicatorWrapper: {
    backgroundColor: '#EAE6DB',
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 20,
  },
  stepIndicatorText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#3B5944',
  },
  statusCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E5EDE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrapper: {
    marginTop: 6,
    marginBottom: 10,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#183820',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: -0.3,
  },
  highlightedTitle: {
    backgroundColor: '#D9E8DC',
    color: '#16361E',
  },
  progressBarRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  progressSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  segmentCompleted: {
    backgroundColor: '#265233',
  },
  segmentActive: {
    backgroundColor: '#E57338',
  },
  segmentInactive: {
    backgroundColor: '#D6E0D7',
  },
  cropSelectorScroll: {
    maxHeight: 38,
    marginBottom: 4,
  },
  cropSelectorContent: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  cropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2DFD6',
  },
  cropChipSelected: {
    backgroundColor: '#1C3A24',
    borderColor: '#1C3A24',
  },
  cropChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34523C',
  },
  cropChipTextSelected: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  stepSection: {
    width: '100%',
  },
  questionHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#163820',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 6,
    marginTop: 4,
  },
  subHeadingNotice: {
    fontSize: 13,
    color: '#657E6C',
    marginBottom: 14,
    lineHeight: 18,
  },

  // Step 1: Stages
  stagesList: {
    gap: 10,
    marginBottom: 20,
  },
  stageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ECEAE2',
    shadowColor: '#173420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  stageCardSelected: {
    backgroundColor: '#193822',
    borderColor: '#193822',
  },
  stageIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8F2EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  stageIconWrapSelected: {
    backgroundColor: '#264A30',
  },
  stageIconWrapCompleted: {
    backgroundColor: '#DCEDE0',
  },
  stageTextCol: {
    flex: 1,
  },
  stageNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A3320',
    marginBottom: 2,
  },
  stageNameTextSelected: {
    color: '#FFFFFF',
  },
  stageStatusText: {
    fontSize: 12.5,
    color: '#768B7C',
  },
  stageStatusTextSelected: {
    color: '#A0BDA8',
  },
  orangeCheckBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E57338',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unselectedRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CCD6CD',
  },

  // Step 2: 2-column Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  gridCard: {
    width: GRID_ITEM_WIDTH,
    minHeight: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E5DD',
    justifyContent: 'space-between',
    shadowColor: '#173420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  gridCardSelected: {
    backgroundColor: '#193822',
    borderColor: '#193822',
  },
  gridCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E5F0E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridIconCircleSelected: {
    backgroundColor: '#274E32',
  },
  orangeMiniCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E57338',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1B3522',
    marginBottom: 3,
  },
  gridTitleSelected: {
    color: '#FFFFFF',
  },
  gridSubtitle: {
    fontSize: 11,
    color: '#768B7C',
    fontWeight: '500',
  },
  gridSubtitleSelected: {
    color: '#A0BDA8',
  },
  noteSectionWrapper: {
    marginBottom: 18,
  },
  noteLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#496651',
    marginBottom: 6,
  },
  noteTextInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#173620',
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#E5E2D9',
    textAlignVertical: 'top',
  },

  // Step 3: Details form
  detailsFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECEAE2',
    marginBottom: 20,
  },
  selectedActivityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF3EC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  selectedActivityPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#215930',
  },
  formGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D4E36',
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: '#F8FAF8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#173620',
    borderWidth: 1,
    borderColor: '#DDE6DE',
  },
  amountRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
    backgroundColor: '#F8FAF8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#173620',
    borderWidth: 1,
    borderColor: '#DDE6DE',
  },
  unitPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  unitPill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F0EFE8',
    borderWidth: 1,
    borderColor: '#DFDCD2',
  },
  unitPillSelected: {
    backgroundColor: '#1E3B2B',
    borderColor: '#1E3B2B',
  },
  unitPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#496651',
  },
  unitPillTextSelected: {
    color: '#FFFFFF',
  },
  optionsWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodPill: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#F5F3EC',
    borderWidth: 1,
    borderColor: '#E2DFD5',
  },
  methodPillSelected: {
    backgroundColor: '#1E3B2B',
    borderColor: '#1E3B2B',
  },
  methodPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#34523C',
  },
  methodPillTextSelected: {
    color: '#FFFFFF',
  },

  // Step 4/5: Photo
  cameraViewfinderBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#D7E5DA',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  cornerBracket: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#3D724D',
  },
  topLeftBracket: {
    top: 10,
    left: 10,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRightBracket: {
    top: 10,
    right: 10,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeftBracket: {
    bottom: 10,
    left: 10,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRightBracket: {
    bottom: 10,
    right: 10,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  cameraCenterIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E7F2EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  viewfinderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#163820',
    marginBottom: 4,
  },
  viewfinderSubtitle: {
    fontSize: 12.5,
    color: '#718878',
    textAlign: 'center',
    marginBottom: 20,
  },
  captureOptionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cameraActionBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B3A23',
    paddingVertical: 12,
    borderRadius: 16,
  },
  cameraActionBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  galleryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF3EC',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CFE0D2',
  },
  galleryActionBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#215930',
  },
  photoPreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEAE2',
    marginVertical: 10,
  },
  photoPreviewImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 10,
  },
  photoVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5EB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    marginBottom: 14,
  },
  photoVerifiedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#235D33',
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  retakeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#F5F3EC',
    borderWidth: 1,
    borderColor: '#DFDCD2',
  },
  retakeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2A5938',
  },
  usePhotoBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#1B3A23',
  },
  usePhotoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#768B7C',
  },
  continueButtonInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#193822',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
  },

  // Step 6: Summary & Submit
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECEAE2',
    marginBottom: 20,
  },
  summaryTopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F1FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  summaryTopBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#554DD1',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F3ED',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#738A79',
  },
  summaryValue: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1A3320',
  },
  summaryNotesBox: {
    backgroundColor: '#F6FAF7',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#2B6B3C',
  },
  summaryNotesLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#215930',
    marginBottom: 3,
  },
  summaryNotesText: {
    fontSize: 13,
    color: '#344F3C',
    lineHeight: 18,
  },
  summaryPhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F5F9F6',
  },
  summaryThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 10,
  },
  summaryPhotoMeta: {
    flex: 1,
  },
  summaryPhotoTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#215930',
  },
  summaryPhotoSubtitle: {
    fontSize: 11,
    color: '#65806E',
  },
  hashPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF4ED',
    borderRadius: 12,
    padding: 10,
    marginTop: 14,
  },
  hashPreviewText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#255D35',
  },

  // General Buttons
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#193822',
    borderRadius: 26,
    paddingVertical: 14,
    shadowColor: '#193822',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    marginTop: 10,
  },
  continueButtonDisabled: {
    backgroundColor: '#A8BAAD',
  },
  continueButtonText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#193822',
    borderRadius: 26,
    paddingVertical: 15,
    shadowColor: '#193822',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#7A9A84',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Success Modal
  successModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 9999,
  },
  successModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E7F5EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#163820',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  successRecordCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A6D3B',
    backgroundColor: '#EAF4ED',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 13.5,
    color: '#556E5D',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  modalPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#193822',
    borderRadius: 22,
    paddingVertical: 13,
    width: '100%',
    marginBottom: 10,
  },
  modalPrimaryBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSecondaryBtn: {
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#637A6A',
  },

  // Dark Mode Tokens
  screenContainerDark: {
    backgroundColor: '#0E1710',
  },
  headerContainerDark: {
    backgroundColor: '#0E1710',
  },
  backCircleBtnDark: {
    backgroundColor: '#18271C',
    borderColor: '#283D2C',
    borderWidth: 1,
  },
  stepIndicatorWrapperDark: {
    backgroundColor: '#18271C',
    borderColor: '#283D2C',
    borderWidth: 1,
  },
  stepIndicatorTextDark: {
    color: '#9CB3A0',
  },
  statusCircleBtnDark: {
    backgroundColor: '#18271C',
    borderColor: '#283D2C',
    borderWidth: 1,
  },
  mainTitleDark: {
    color: '#F0F5F1',
  },
  highlightedTitleDark: {
    backgroundColor: '#1E3E26',
    color: '#4ADE80',
  },
  segmentInactiveDark: {
    backgroundColor: '#283D2C',
  },
  questionHeadingDark: {
    color: '#F0F5F1',
  },
  subHeadingNoticeDark: {
    color: '#9CB3A0',
  },
  stageCardDark: {
    backgroundColor: '#18271C',
    borderColor: '#283D2C',
  },
  stageCardSelectedDark: {
    backgroundColor: '#1E3E26',
    borderColor: '#4ADE80',
  },
  stageIconWrapDark: {
    backgroundColor: '#223827',
  },
  stageNameTextDark: {
    color: '#F0F5F1',
  },
  stageStatusTextDark: {
    color: '#9CB3A0',
  },
  unselectedRadioCircleDark: {
    borderColor: '#3A523E',
  },
  continueButtonDark: {
    backgroundColor: '#2D5936',
  },

  // My Crops Section Styles
  myCropsSection: {
    marginBottom: 16,
  },
  myCropsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  myCropsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#163820',
    letterSpacing: -0.2,
  },
  myCropsTitleDark: {
    color: '#F0F5F1',
  },
  cropActiveBadge: {
    backgroundColor: '#EDF5EE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4E4D6',
  },
  cropActiveBadgeDark: {
    backgroundColor: '#1E3324',
    borderColor: '#2D4E35',
  },
  cropActiveBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2A6638',
  },
  cropActiveBadgeTextDark: {
    color: '#4ADE80',
  },
  myCropsScroll: {
    marginBottom: 4,
  },
  myCropsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 24,
    paddingVertical: 2,
  },
  addNewCropBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3E26',
    borderRadius: 22,
    paddingHorizontal: 13,
    paddingVertical: 9,
    shadowColor: '#173420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  addNewCropBtnDark: {
    backgroundColor: '#2D5936',
  },
  addNewCropIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  addNewCropBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cropCardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 6,
    paddingHorizontal: 10,
    paddingRight: 14,
    borderWidth: 1,
    borderColor: '#E2DFD6',
    shadowColor: '#173420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cropCardChipDark: {
    backgroundColor: '#18271C',
    borderColor: '#283D2C',
  },
  cropCardChipSelected: {
    backgroundColor: '#1C3A24',
    borderColor: '#1C3A24',
    shadowOpacity: 0.18,
    elevation: 4,
  },
  cropCardChipSelectedDark: {
    backgroundColor: '#1C3E25',
    borderColor: '#4ADE80',
  },
  cropCardEmojiWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EDF5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropCardEmojiWrapSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  cropCardEmoji: {
    fontSize: 15,
  },
  cropCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16351E',
  },
  cropCardNameDark: {
    color: '#F0F5F1',
  },
  cropCardNameSelected: {
    color: '#FFFFFF',
  },
  cropCardBatch: {
    fontSize: 10.5,
    color: '#657E6B',
    marginTop: 1,
    fontWeight: '500',
  },
  cropCardBatchDark: {
    color: '#9CB3A0',
  },
  cropCardBatchSelected: {
    color: '#B2D8BD',
  },
  cropCardStageBadge: {
    backgroundColor: '#F0F5F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cropCardStageBadgeDark: {
    backgroundColor: '#223827',
  },
  cropCardStageBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cropCardStageText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2A6638',
  },
  cropCardStageTextDark: {
    color: '#9CB3A0',
  },
  cropCardStageTextSelected: {
    color: '#FFFFFF',
  },
  emptyCropsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2DFD6',
  },
  emptyCropsBannerDark: {
    backgroundColor: '#18271C',
    borderColor: '#283D2C',
  },
  emptyCropsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16351E',
  },
  emptyCropsTextDark: {
    color: '#F0F5F1',
  },
  emptyCropsSubtext: {
    fontSize: 12,
    color: '#657E6B',
    marginTop: 2,
  },
  emptyCropsSubtextDark: {
    color: '#9CB3A0',
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3E26',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  emptyAddBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disabledHintText: {
    fontSize: 12,
    color: '#8A9E8F',
    textAlign: 'center',
    marginTop: 8,
  },
  disabledHintTextDark: {
    color: '#657E6B',
  },
  activeCropPillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2DFD6',
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  activeCropPillHeaderDark: {
    backgroundColor: '#18271C',
    borderColor: '#283D2C',
  },
  activeCropEmoji: {
    fontSize: 13,
    marginRight: 6,
  },
  activeCropPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16351E',
  },
  activeCropPillTextDark: {
    color: '#4ADE80',
  },

  // Step 3 New Reference Design Form styles
  formSectionWrapper: {
    width: '100%',
  },
  notesTextInput: {
    backgroundColor: '#F8FAF8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#173620',
    minHeight: 88,
    borderWidth: 1,
    borderColor: '#D8E2D9',
    textAlignVertical: 'top',
  },
  notesTextInputDark: {
    backgroundColor: '#15271B',
    borderColor: '#26422E',
    color: '#E5EFE7',
  },
  inputErrorBorder: {
    borderColor: '#D9534F',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#D9534F',
    fontSize: 12,
    marginTop: 5,
    fontWeight: '600',
  },
  attachPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#2D6A4F',
    borderRadius: 14,
    paddingVertical: 15,
    backgroundColor: '#F6FAF7',
  },
  attachPhotoBtnDark: {
    borderColor: '#4ADE80',
    backgroundColor: '#152B1E',
  },
  attachPhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D6A4F',
  },
  attachPhotoTextDark: {
    color: '#55D483',
  },
  photoPreviewWrapper: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
  },
  photoPreview: {
    width: '100%',
    height: 140,
    borderRadius: 14,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    marginBottom: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#EBEFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnDark: {
    backgroundColor: '#1E3827',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D5538',
  },
  cancelBtnTextDark: {
    color: '#A5CBB0',
  },
  saveNotesBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#1E3C25',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#173620',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  saveNotesBtnDark: {
    backgroundColor: '#266437',
  },
  saveNotesBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailsFormCardDark: {
    backgroundColor: '#142519',
    borderColor: '#243F2B',
  },
  selectedActivityPillDark: {
    backgroundColor: '#1E3C27',
  },
  selectedActivityPillTextDark: {
    color: '#55D483',
  },
  fieldLabelDark: {
    color: '#E5EFE7',
  },
  fieldInputDark: {
    backgroundColor: '#182C1E',
    borderColor: '#26452E',
    color: '#E5EFE7',
  },
  amountInputDark: {
    backgroundColor: '#182C1E',
    borderColor: '#26452E',
    color: '#E5EFE7',
  },
  unitPillDark: {
    backgroundColor: '#1C3524',
    borderColor: '#2A4D34',
  },
  unitPillTextDark: {
    color: '#9CB3A0',
  },
  methodPillDark: {
    backgroundColor: '#182C1D',
    borderColor: '#26452E',
  },
  methodPillSelectedDark: {
    backgroundColor: '#27673A',
    borderColor: '#27673A',
  },
  methodPillTextDark: {
    color: '#9CB3A0',
  },
  methodPillTextSelectedDark: {
    color: '#FFFFFF',
  },

  // Step 4 Summary Actions and Dark Mode Styles
  summaryActionsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  summaryEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#27673A',
    borderRadius: 20,
    paddingVertical: 14,
  },
  summaryEditBtnDark: {
    backgroundColor: '#182C1E',
    borderColor: '#4ADE80',
  },
  summaryEditBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#27673A',
  },
  summaryEditBtnTextDark: {
    color: '#4ADE80',
  },
  summarySubmitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3C25',
    borderRadius: 20,
    paddingVertical: 14,
    shadowColor: '#173620',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
  },
  summarySubmitBtnDark: {
    backgroundColor: '#266437',
  },
  summarySubmitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryNoPhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAF7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 10,
  },
  summaryNoPhotoRowDark: {
    backgroundColor: '#172B1D',
  },
  summaryNoPhotoText: {
    fontSize: 12.5,
    color: '#768E7C',
  },
  summaryNoPhotoTextDark: {
    color: '#9CB3A0',
  },
  summaryCardDark: {
    backgroundColor: '#142519',
    borderColor: '#243F2B',
  },
  summaryRowDark: {
    borderBottomColor: '#203A26',
  },
  summaryLabelDark: {
    color: '#9CB3A0',
  },
  summaryValueDark: {
    color: '#F0F5F1',
  },
  summaryNotesBoxDark: {
    backgroundColor: '#182C1E',
    borderColor: '#26452E',
  },
  summaryNotesLabelDark: {
    color: '#9CB3A0',
  },
  summaryNotesTextDark: {
    color: '#F0F5F1',
  },
  summaryPhotoRowDark: {
    backgroundColor: '#182C1E',
  },
  summaryPhotoTitleDark: {
    color: '#F0F5F1',
  },
  summaryPhotoSubtitleDark: {
    color: '#9CB3A0',
  },
  hashPreviewBoxDark: {
    backgroundColor: '#182C1E',
    borderColor: '#26452E',
  },
  hashPreviewTextDark: {
    color: '#A0BDA8',
  },
  successModalCardDark: {
    backgroundColor: '#16281B',
    borderColor: '#25422D',
  },
  successTitleDark: {
    color: '#F0F5F1',
  },
  successMessageDark: {
    color: '#9CB3A0',
  },
  modalSecondaryBtnTextDark: {
    color: '#9CB3A0',
  },
});
