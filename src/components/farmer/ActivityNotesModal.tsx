import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { FarmingStageKeyType, StageActivityTemplate } from '../../constants/stages';
import { RecentRecordItem } from '../../types/farmer.types';
import { getCropSpecificFields } from '../../constants/cropSpecificFields';

interface ActivityNotesModalProps {
  visible: boolean;
  activity: StageActivityTemplate | null;
  cropName: string;
  stageName?: string;
  stageKey?: FarmingStageKeyType;
  batchId?: string;
  existingRecords: RecentRecordItem[];
  onClose: () => void;
  onSave: (
    notes: string,
    photoUri?: string,
    details?: Record<string, string>,
    inputs?: string[]
  ) => void;
}

interface ActivityNotesFormProps {
  activity: StageActivityTemplate;
  cropName: string;
  stageName?: string;
  stageKey?: FarmingStageKeyType;
  batchId?: string;
  existingRecords: RecentRecordItem[];
  onClose: () => void;
  onSave: (
    notes: string,
    photoUri?: string,
    details?: Record<string, string>,
    inputs?: string[]
  ) => void;
}

function getStageKeyFallback(stageName?: string, activityId?: string): FarmingStageKeyType {
  const norm = (stageName || '').toLowerCase();
  if (norm.includes('plant')) return 'planting';
  if (norm.includes('vegetative')) return 'vegetative_growth';
  if (norm.includes('flower')) return 'flowering';
  if (norm.includes('matur')) return 'crop_maturity';
  if (norm.includes('harvest')) return 'harvesting';
  if (activityId?.startsWith('act-p-')) return 'planting';
  if (activityId?.startsWith('act-vg-')) return 'vegetative_growth';
  if (activityId?.startsWith('flowering_') || activityId === 'pollination_monitoring') return 'flowering';
  if (activityId?.startsWith('maturity_') || activityId?.startsWith('crop_') || activityId?.includes('ripeness')) return 'crop_maturity';
  return 'harvesting';
}

function formatDetailLabel(key: string): string {
  switch (key) {
    // Crop-Specific Fields (Tomato, Rice, Carrot, Lettuce, Banana)
    case 'fruitColor':
      return 'Fruit Color';
    case 'fruitSize':
      return 'Fruit Size';
    case 'ripenessLevel':
      return 'Ripeness Level';
    case 'maturityPercentage':
      return 'Maturity %';
    case 'grainMaturity':
      return 'Grain Maturity';
    case 'grainMoisture':
      return 'Grain Moisture %';
    case 'panicleCondition':
      return 'Panicle Condition';
    case 'rootDiameter':
      return 'Root Diameter (cm)';
    case 'rootLength':
      return 'Root Length (cm)';
    case 'rootCondition':
      return 'Root Condition';
    case 'leafSize':
      return 'Leaf Size';
    case 'leafCount':
      return 'Leaf Count';
    case 'leafColor':
      return 'Leaf Color';
    case 'plantHealth':
      return 'Plant Health';
    case 'numBunches':
      return 'Bunches';
    case 'bunchWeight':
      return 'Bunch Weight (kg)';
    case 'fruitMaturity':
      return 'Fruit Maturity';
    case 'totalQuantity':
      return 'Total Harvested (kg)';
    // Harvest Stage
    case 'harvestDate':
      return 'Harvest Date';
    case 'harvestTime':
      return 'Harvest Time';
    case 'harvestMethod':
      return 'Harvest Method';
    case 'harvestLocation':
      return 'Location';
    case 'cropCondition':
      return 'Condition';
    case 'harvestQuantity':
      return 'Total Harvested';
    case 'quantityUnit':
      return 'Unit';
    case 'numberContainers':
      return 'Containers';
    case 'rejectedQuantity':
      return 'Rejected';
    case 'qualityGrade':
      return 'Quality Grade';
    case 'gradingCriteria':
      return 'Grading Criteria';
    case 'sortingMethod':
      return 'Sorting Method';
    case 'cleaningMethod':
      return 'Cleaning Method';
    case 'quantityAccepted':
      return 'Accepted';
    case 'rejectionReason':
      return 'Rejection Reason';
    case 'packagingMaterial':
      return 'Packaging Material';
    case 'numberPackages':
      return 'Packages';
    case 'quantityPerPackage':
      return 'Qty / Package';
    case 'packagingMethod':
      return 'Packaging Method';
    case 'storageStartDate':
      return 'Storage Start';
    case 'storageLocation':
      return 'Storage Location';
    case 'storageMethod':
      return 'Storage Method';
    case 'storageDuration':
      return 'Duration';
    case 'harvestBatchId':
      return 'Harvest Batch ID';
    case 'cropBatchId':
      return 'Crop Batch ID';
    case 'batchQuantity':
      return 'Batch Quantity';
    case 'packagingReference':
      return 'Ref / Lot';
    // Crop Maturity
    case 'cropDimensions':
      return 'Dimensions';
    case 'cropWeight':
      return 'Avg Weight';
    case 'growthCondition':
      return 'Growth Condition';
    case 'maturityStage':
      return 'Maturity Stage';
    case 'colorAppearance':
      return 'Color / Appearance';
    case 'ripenessPercentage':
      return 'Ripeness';
    case 'wateringFrequency':
      return 'Frequency';
    case 'applicationMethod':
      return 'Application Method';
    case 'severityLevel':
      return 'Severity';
    case 'cropAppearance':
      return 'Appearance';
    case 'qualityCondition':
      return 'Quality';
    case 'visibleDefects':
      return 'Defects / Damage';
    case 'expectedHarvestDate':
      return 'Expected Harvest';
    case 'harvestReadiness':
      return 'Harvest Readiness';
    case 'maturityObservations':
      return 'Maturity Observations';
    // Flowering
    case 'firstFloweringDate':
      return 'First Flowering Date';
    case 'floweringProgress':
      return 'Flowering Progress';
    case 'approxFlowerCount':
      return 'Flower Count';
    case 'observationDate':
      return 'Observation Date';
    case 'assessmentDate':
      return 'Assessment Date';
    case 'pollinationMethod':
      return 'Pollination Method';
    case 'pollinatorObservations':
      return 'Pollinators';
    case 'wateringDate':
      return 'Watering Date';
    case 'waterQuantity':
      return 'Water Quantity';
    case 'irrigationMethod':
      return 'Irrigation Method';
    case 'fertilizerName':
      return 'Fertilizer Name';
    case 'fertilizerType':
      return 'Fertilizer Type';
    case 'fertilizerQuantity':
      return 'Quantity';
    case 'applicationDate':
      return 'Application Date';
    case 'organicCertStatus':
      return 'Organic Status';
    case 'weedingDate':
      return 'Weeding Date';
    case 'weedingMethod':
      return 'Method';
    case 'soilCareActivities':
      return 'Soil Care';
    case 'pestIdentified':
      return 'Pest/Disease';
    case 'symptoms':
      return 'Symptoms/Damage';
    case 'treatment':
      return 'Treatment';
    case 'flowerHealthCondition':
    case 'healthCondition':
      return 'Health Condition';
    case 'flowerDamageDrop':
      return 'Damage / Dropping';
    case 'possibleCauses':
      return 'Possible Causes';
    case 'plantHeight':
      return 'Height';
    case 'leafDevelopment':
      return 'Leaves';
    case 'recordingDate':
      return 'Recording Date';
    case 'temperature':
      return 'Temperature';
    case 'humidity':
      return 'Humidity';
    case 'soilMoisture':
      return 'Soil Moisture';
    default:
      return key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
  }
}

const ActivityNotesForm: React.FC<ActivityNotesFormProps> = ({
  activity,
  cropName,
  stageName,
  stageKey,
  batchId,
  existingRecords,
  onClose,
  onSave,
}) => {
  // Today's formatted date string
  const todayDate = useMemo(() => {
    const now = new Date();
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(now);
  }, []);

  const computedStageKey = stageKey || getStageKeyFallback(stageName, activity.id);
  const cropSpecificFields = useMemo(() => {
    return getCropSpecificFields(cropName, computedStageKey, activity.id, activity.name);
  }, [cropName, computedStageKey, activity.id, activity.name]);

  const [cropSpecificValues, setCropSpecificValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    const fields = getCropSpecificFields(cropName, computedStageKey, activity.id, activity.name);
    if (fields) {
      fields.forEach((f) => {
        if (f.defaultValue) initial[f.id] = f.defaultValue;
        else if (f.type === 'date') initial[f.id] = todayDate;
        else if (f.type === 'select' && f.options && f.options.length > 0) {
          initial[f.id] = f.options[0].value;
        }
      });
    }
    return initial;
  });

  const [customActDate, setCustomActDate] = useState(activity.date || todayDate);

  // Common fields
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [showAddAnother, setShowAddAnother] = useState(existingRecords.length === 0);

  // ─── HARVEST STAGE ACTIVITIES ─────────────────────────────────────────────
  // 1. Harvest Details
  const [hvHarvestDate, setHvHarvestDate] = useState(todayDate);
  const [hvHarvestTime, setHvHarvestTime] = useState('08:30 AM');
  const [hvHarvestMethod, setHvHarvestMethod] = useState('Manual Picking');
  const [hvHarvestLocation, setHvHarvestLocation] = useState('Kandy Farm · Field A');
  const [hvCropCondition, setHvCropCondition] = useState('');

  // 2. Harvest Quantity
  const [hvMeasurementDate, setHvMeasurementDate] = useState(todayDate);
  const [hvTotalQuantity, setHvTotalQuantity] = useState('150');
  const [hvQuantityUnit, setHvQuantityUnit] = useState('kg');
  const [hvNumberContainers, setHvNumberContainers] = useState('10 crates');
  const [hvRejectedQuantity, setHvRejectedQuantity] = useState('');

  // 3. Quality Grading
  const [hvGradingDate, setHvGradingDate] = useState(todayDate);
  const [hvQualityGrade, setHvQualityGrade] = useState('Grade A');
  const [hvGradingCriteria, setHvGradingCriteria] = useState('');
  const [hvGradingAppearance, setHvGradingAppearance] = useState('');
  const [hvGradingDefects, setHvGradingDefects] = useState('');

  // 4. Sorting & Cleaning
  const [hvSortingDate, setHvSortingDate] = useState(todayDate);
  const [hvSortingMethod, setHvSortingMethod] = useState('Manual Hand Sorting');
  const [hvCleaningMethod, setHvCleaningMethod] = useState('Wipe Clean');
  const [hvQuantityAccepted, setHvQuantityAccepted] = useState('145 kg');
  const [hvQuantityRejected, setHvQuantityRejected] = useState('5 kg');
  const [hvRejectionReason, setHvRejectionReason] = useState('');

  // 5. Packaging
  const [hvPackagingDate, setHvPackagingDate] = useState(todayDate);
  const [hvPackagingMaterial, setHvPackagingMaterial] = useState('Ventilated Cartons');
  const [hvNumberPackages, setHvNumberPackages] = useState('15 packages');
  const [hvQuantityPerPackage, setHvQuantityPerPackage] = useState('10 kg/carton');
  const [hvPackagingMethod, setHvPackagingMethod] = useState('Manual Packing');

  // 6. Storage Conditions
  const [hvStorageStartDate, setHvStorageStartDate] = useState(todayDate);
  const [hvStorageLocation, setHvStorageLocation] = useState('Cold Room Bay 1');
  const [hvStorageMethod, setHvStorageMethod] = useState('Controlled Cold Storage');
  const [hvTemperature, setHvTemperature] = useState('12°C');
  const [hvRelativeHumidity, setHvRelativeHumidity] = useState('85% RH');
  const [hvStorageDuration, setHvStorageDuration] = useState('3-5 days');

  // 7. Batch Identification
  const [hvHarvestBatchId, setHvHarvestBatchId] = useState('HARV-TOM-2026-10');
  const [hvCropBatchId, setHvCropBatchId] = useState(batchId || 'BATCH-TOM-2026-09');
  const [hvBatchDate, setHvBatchDate] = useState(todayDate);
  const [hvBatchLocation, setHvBatchLocation] = useState('Kandy Farm · Packhouse A');
  const [hvBatchQuantity, setHvBatchQuantity] = useState('150 kg');
  const [hvPackagingReference, setHvPackagingReference] = useState('CRATE-LOT-01..15, Bay B');

  // ─── CROP MATURITY ACTIVITIES ─────────────────────────────────────────────
  const [cmGrowthDate, setCmGrowthDate] = useState(todayDate);
  const [cmCropDimensions, setCmCropDimensions] = useState('');
  const [cmCropWeight, setCmCropWeight] = useState('');
  const [cmGrowthCondition, setCmGrowthCondition] = useState('Optimal Sizing');

  const [cmRipenessDate, setCmRipenessDate] = useState(todayDate);
  const [cmMaturityStage, setCmMaturityStage] = useState('Developing');
  const [cmColorAppearance, setCmColorAppearance] = useState('');
  const [cmRipenessPercentage, setCmRipenessPercentage] = useState('');

  const [cmWateringDate, setCmWateringDate] = useState(todayDate);
  const [cmIrrigationMethod, setCmIrrigationMethod] = useState('Drip');
  const [cmWaterQuantity, setCmWaterQuantity] = useState('');
  const [cmWateringFrequency, setCmWateringFrequency] = useState('');

  const [cmFertilizerName, setCmFertilizerName] = useState('');
  const [cmFertilizerType, setCmFertilizerType] = useState('Organic Potash');
  const [cmQuantityUnit, setCmQuantityUnit] = useState('');
  const [cmFertilizerDate, setCmFertilizerDate] = useState(todayDate);
  const [cmApplicationMethod, setCmApplicationMethod] = useState('');
  const [cmOrganicStatus, setCmOrganicStatus] = useState('');

  const [cmPestDate, setCmPestDate] = useState(todayDate);
  const [cmPestIdentified, setCmPestIdentified] = useState('');
  const [cmSymptoms, setCmSymptoms] = useState('');
  const [cmSeverityLevel, setCmSeverityLevel] = useState('None');
  const [cmTreatment, setCmTreatment] = useState('');

  const [cmQualityDate, setCmQualityDate] = useState(todayDate);
  const [cmCropAppearance, setCmCropAppearance] = useState('');
  const [cmQualityCondition, setCmQualityCondition] = useState('Premium (Grade A)');
  const [cmVisibleDefects, setCmVisibleDefects] = useState('');
  const [cmQualityGrade, setCmQualityGrade] = useState('');

  const [cmReadinessDate, setCmReadinessDate] = useState(todayDate);
  const [cmExpectedHarvestDate, setCmExpectedHarvestDate] = useState('2 Oct 2026');
  const [cmHarvestReadiness, setCmHarvestReadiness] = useState('1 Week Away');
  const [cmMaturityObservations, setCmMaturityObservations] = useState('');

  // ─── FLOWERING STAGE ACTIVITIES ──────────────────────────────────────────
  const [firstFloweringDate, setFirstFloweringDate] = useState(todayDate);
  const [floweringProgress, setFloweringProgress] = useState('Early Bloom (10-25%)');
  const [approxFlowerCount, setApproxFlowerCount] = useState('');

  const [pollinationObsDate, setPollinationObsDate] = useState(todayDate);
  const [pollinationMethod, setPollinationMethod] = useState('Natural');
  const [pollinatorObservations, setPollinatorObservations] = useState('');

  const [flWateringDate, setFlWateringDate] = useState(todayDate);
  const [flIrrigationMethod, setFlIrrigationMethod] = useState('Drip');
  const [flWaterQuantity, setFlWaterQuantity] = useState('');

  const [flFertilizerName, setFlFertilizerName] = useState('');
  const [flFertilizerType, setFlFertilizerType] = useState('Liquid Foliar');
  const [flQuantityUnit, setFlQuantityUnit] = useState('');
  const [flFertilizerDate, setFlFertilizerDate] = useState(todayDate);
  const [flOrganicCertStatus, setFlOrganicCertStatus] = useState('');

  const [flPestDate, setFlPestDate] = useState(todayDate);
  const [flPestIdentified, setFlPestIdentified] = useState('');
  const [flSymptoms, setFlSymptoms] = useState('');
  const [flTreatment, setFlTreatment] = useState('');

  const [flHealthDate, setFlHealthDate] = useState(todayDate);
  const [flHealthCondition, setFlHealthCondition] = useState('Good / Healthy');
  const [flDamageDrop, setFlDamageDrop] = useState('Zero Drop');
  const [flPossibleCauses, setFlPossibleCauses] = useState('');

  // ─── VEGETATIVE GROWTH ACTIVITIES ────────────────────────────────────────
  const [vgWateringDate, setVgWateringDate] = useState(todayDate);
  const [vgWaterQuantity, setVgWaterQuantity] = useState('');
  const [vgIrrigationMethod, setVgIrrigationMethod] = useState('');

  const [vgFertilizerName, setVgFertilizerName] = useState('');
  const [vgFertilizerQuantity, setVgFertilizerQuantity] = useState('');
  const [vgFertilizerDate, setVgFertilizerDate] = useState(todayDate);

  const [vgWeedingDate, setVgWeedingDate] = useState(todayDate);
  const [vgWeedingMethod, setVgWeedingMethod] = useState('');
  const [vgSoilCareActivities, setVgSoilCareActivities] = useState('');

  const [vgPestDate, setVgPestDate] = useState(todayDate);
  const [vgPestIdentified, setVgPestIdentified] = useState('');
  const [vgSymptoms, setVgSymptoms] = useState('');
  const [vgTreatment, setVgTreatment] = useState('');

  const [vgGrowthDate, setVgGrowthDate] = useState(todayDate);
  const [vgPlantHeight, setVgPlantHeight] = useState('');
  const [vgLeafDevelopment, setVgLeafDevelopment] = useState('');
  const [vgHealthCondition, setVgHealthCondition] = useState('');

  const [vgEnvDate, setVgEnvDate] = useState(todayDate);
  const [vgTemperature, setVgTemperature] = useState('');
  const [vgHumidity, setVgHumidity] = useState('');
  const [vgSoilMoisture, setVgSoilMoisture] = useState('');

  // ─── Activity Identity Matching ──────────────────────────────────────────
  const actId = activity.id;
  const actName = activity.name;

  // Harvest activities
  const isHarvestDetails = actId === 'harvest_details' || actName === 'Harvest Details';
  const isHarvestQuantity = actId === 'harvest_quantity' || actName === 'Harvest Quantity';
  const isQualityGrading = actId === 'quality_grading' || actName === 'Quality Grading';
  const isSortingCleaning = actId === 'sorting_cleaning' || actName === 'Sorting & Cleaning';
  const isHarvestPackaging = actId === 'harvest_packaging' || actName === 'Packaging';
  const isStorageConditions = actId === 'storage_conditions' || actName === 'Storage Conditions';
  const isBatchIdentification = actId === 'batch_identification' || actName === 'Batch Identification';

  // Crop Maturity activities
  const isCropGrowth = actId === 'crop_growth_development' || actName === 'Crop Growth & Development';
  const isRipeness = actId === 'ripeness_maturity_monitoring' || actName === 'Ripeness & Maturity Monitoring';
  const isMaturityIrrigation = actId === 'maturity_irrigation';
  const isMaturityFertilizer = actId === 'maturity_fertilizer';
  const isMaturityPest = actId === 'maturity_pest_management';
  const isQualityAssessment = actId === 'crop_quality_assessment' || actName === 'Crop Quality Assessment';
  const isHarvestReadiness = actId === 'harvest_readiness_assessment' || actName === 'Harvest Readiness Assessment';

  // Flowering activities
  const isFloweringObs = actId === 'flowering_observation' || actName === 'Flowering Observation';
  const isPollination = actId === 'pollination_monitoring' || actName === 'Pollination Monitoring';
  const isFloweringIrrigation = actId === 'flowering_irrigation';
  const isFloweringFertilizer = actId === 'flowering_fertilizer';
  const isFloweringPest = actId === 'flowering_pest_management';
  const isFlowerHealth = actId === 'flower_health_monitoring' || actName === 'Flower Health Monitoring';

  // Vegetative Growth activities
  const isVgWatering =
    actId === 'act-vg-watering' ||
    (!isFloweringIrrigation && !isMaturityIrrigation && actName === 'Watering & Irrigation' && stageName?.toLowerCase().includes('vegetative'));
  const isVgFertilizer =
    actId === 'act-vg-fertilizer' ||
    (!isFloweringFertilizer && !isMaturityFertilizer && actName === 'Organic Fertilizer Application' && stageName?.toLowerCase().includes('vegetative'));
  const isVgWeeding = actId === 'act-vg-weeding' || actName === 'Weeding & Soil Care';
  const isVgPest =
    actId === 'act-vg-pest' ||
    (!isFloweringPest && !isMaturityPest && actName.toLowerCase().includes('pest') && stageName?.toLowerCase().includes('vegetative'));
  const isVgGrowth = actId === 'act-vg-growth' || actName === 'Plant Growth Observation';
  const isVgEnv = actId === 'act-vg-env' || actName === 'Environmental Monitoring';

  const handlePickPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Denied',
          'Camera roll access is needed to attach photo evidence.'
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Could not open image picker.');
    }
  };

  const handleSave = () => {
    if (!notes.trim()) {
      setNotesError('Please enter activity notes before saving.');
      return;
    }

    const details: Record<string, string> = {};
    const inputs: string[] = [];

    // ─── CROP-SPECIFIC OVERRIDE ───
    if (cropSpecificFields && cropSpecificFields.length > 0) {
      for (const f of cropSpecificFields) {
        const val = cropSpecificValues[f.id];
        if (f.required && (!val || !val.trim())) {
          Alert.alert('Required Field', `Please provide a value for ${f.label}.`);
          return;
        }
        if ((f.type === 'number' || f.type === 'percentage') && val) {
          const numVal = parseFloat(val);
          if (isNaN(numVal) || numVal < 0) {
            Alert.alert('Invalid Number', `Please enter a valid non-negative number for ${f.label}.`);
            return;
          }
        }
      }
      Object.entries(cropSpecificValues).forEach(([k, v]) => {
        if (v && v.trim()) {
          details[k] = v.trim();
          inputs.push(`${formatDetailLabel(k)}: ${v.trim()}`);
        }
      });
    } else if (activity.isCustom) {
      if (customActDate.trim()) details['date'] = customActDate.trim();
      if (activity.description) details['description'] = activity.description;
      inputs.push('Custom Activity');
    }
    // ─── HARVEST STAGE ───
    else if (isHarvestDetails) {
      if (hvHarvestDate.trim()) details['harvestDate'] = hvHarvestDate.trim();
      if (hvHarvestTime.trim()) details['harvestTime'] = hvHarvestTime.trim();
      if (hvHarvestMethod.trim()) {
        details['harvestMethod'] = hvHarvestMethod.trim();
        inputs.push(hvHarvestMethod.trim());
      }
      if (hvHarvestLocation.trim()) details['harvestLocation'] = hvHarvestLocation.trim();
      if (hvCropCondition.trim()) details['cropCondition'] = hvCropCondition.trim();
    } else if (isHarvestQuantity) {
      if (hvMeasurementDate.trim()) details['measurementDate'] = hvMeasurementDate.trim();
      if (hvTotalQuantity.trim()) {
        details['harvestQuantity'] = `${hvTotalQuantity.trim()} ${hvQuantityUnit.trim()}`;
        inputs.push(`${hvTotalQuantity.trim()} ${hvQuantityUnit.trim()}`);
      }
      if (hvQuantityUnit.trim()) details['quantityUnit'] = hvQuantityUnit.trim();
      if (hvNumberContainers.trim()) {
        details['numberContainers'] = hvNumberContainers.trim();
        inputs.push(hvNumberContainers.trim());
      }
      if (hvRejectedQuantity.trim()) details['rejectedQuantity'] = hvRejectedQuantity.trim();
    } else if (isQualityGrading) {
      if (hvGradingDate.trim()) details['assessmentDate'] = hvGradingDate.trim();
      if (hvQualityGrade.trim()) {
        details['qualityGrade'] = hvQualityGrade.trim();
        inputs.push(hvQualityGrade.trim());
      }
      if (hvGradingCriteria.trim()) details['gradingCriteria'] = hvGradingCriteria.trim();
      if (hvGradingAppearance.trim()) details['cropAppearance'] = hvGradingAppearance.trim();
      if (hvGradingDefects.trim()) details['visibleDefects'] = hvGradingDefects.trim();
    } else if (isSortingCleaning) {
      if (hvSortingDate.trim()) details['sortingDate'] = hvSortingDate.trim();
      if (hvSortingMethod.trim()) {
        details['sortingMethod'] = hvSortingMethod.trim();
        inputs.push(hvSortingMethod.trim());
      }
      if (hvCleaningMethod.trim()) {
        details['cleaningMethod'] = hvCleaningMethod.trim();
        inputs.push(hvCleaningMethod.trim());
      }
      if (hvQuantityAccepted.trim()) details['quantityAccepted'] = hvQuantityAccepted.trim();
      if (hvQuantityRejected.trim()) details['quantityRejected'] = hvQuantityRejected.trim();
      if (hvRejectionReason.trim()) details['rejectionReason'] = hvRejectionReason.trim();
    } else if (isHarvestPackaging) {
      if (hvPackagingDate.trim()) details['packagingDate'] = hvPackagingDate.trim();
      if (hvPackagingMaterial.trim()) {
        details['packagingMaterial'] = hvPackagingMaterial.trim();
        inputs.push(hvPackagingMaterial.trim());
      }
      if (hvNumberPackages.trim()) {
        details['numberPackages'] = hvNumberPackages.trim();
        inputs.push(hvNumberPackages.trim());
      }
      if (hvQuantityPerPackage.trim()) details['quantityPerPackage'] = hvQuantityPerPackage.trim();
      if (hvPackagingMethod.trim()) details['packagingMethod'] = hvPackagingMethod.trim();
    } else if (isStorageConditions) {
      if (hvStorageStartDate.trim()) details['storageStartDate'] = hvStorageStartDate.trim();
      if (hvStorageLocation.trim()) {
        details['storageLocation'] = hvStorageLocation.trim();
        inputs.push(hvStorageLocation.trim());
      }
      if (hvStorageMethod.trim()) details['storageMethod'] = hvStorageMethod.trim();
      if (hvTemperature.trim()) {
        details['temperature'] = hvTemperature.trim();
        inputs.push(hvTemperature.trim());
      }
      if (hvRelativeHumidity.trim()) {
        details['humidity'] = hvRelativeHumidity.trim();
        inputs.push(hvRelativeHumidity.trim());
      }
      if (hvStorageDuration.trim()) details['storageDuration'] = hvStorageDuration.trim();
    } else if (isBatchIdentification) {
      if (hvHarvestBatchId.trim()) {
        details['harvestBatchId'] = hvHarvestBatchId.trim();
        inputs.push(hvHarvestBatchId.trim());
      }
      if (hvCropBatchId.trim()) details['cropBatchId'] = hvCropBatchId.trim();
      if (hvBatchDate.trim()) details['harvestDate'] = hvBatchDate.trim();
      if (hvBatchLocation.trim()) details['harvestLocation'] = hvBatchLocation.trim();
      if (hvBatchQuantity.trim()) {
        details['batchQuantity'] = hvBatchQuantity.trim();
        inputs.push(hvBatchQuantity.trim());
      }
      if (hvPackagingReference.trim()) details['packagingReference'] = hvPackagingReference.trim();
    }
    // ─── CROP MATURITY ───
    else if (isCropGrowth) {
      if (cmGrowthDate.trim()) details['observationDate'] = cmGrowthDate.trim();
      if (cmCropDimensions.trim()) {
        details['cropDimensions'] = cmCropDimensions.trim();
        inputs.push(cmCropDimensions.trim());
      }
      if (cmCropWeight.trim()) {
        details['cropWeight'] = cmCropWeight.trim();
        inputs.push(cmCropWeight.trim());
      }
      if (cmGrowthCondition.trim()) {
        details['growthCondition'] = cmGrowthCondition.trim();
        inputs.push(cmGrowthCondition.trim());
      }
    } else if (isRipeness) {
      if (cmRipenessDate.trim()) details['observationDate'] = cmRipenessDate.trim();
      if (cmMaturityStage.trim()) {
        details['maturityStage'] = cmMaturityStage.trim();
        inputs.push(cmMaturityStage.trim());
      }
      if (cmColorAppearance.trim()) details['colorAppearance'] = cmColorAppearance.trim();
      if (cmRipenessPercentage.trim()) {
        details['ripenessPercentage'] = cmRipenessPercentage.trim();
        inputs.push(`${cmRipenessPercentage.trim()} Ripeness`);
      }
    } else if (isMaturityIrrigation) {
      if (cmWateringDate.trim()) details['wateringDate'] = cmWateringDate.trim();
      if (cmIrrigationMethod.trim()) {
        details['irrigationMethod'] = cmIrrigationMethod.trim();
        inputs.push(cmIrrigationMethod.trim());
      }
      if (cmWaterQuantity.trim()) {
        details['waterQuantity'] = cmWaterQuantity.trim();
        inputs.push(cmWaterQuantity.trim());
      }
      if (cmWateringFrequency.trim()) details['wateringFrequency'] = cmWateringFrequency.trim();
    } else if (isMaturityFertilizer) {
      if (cmFertilizerName.trim()) details['fertilizerName'] = cmFertilizerName.trim();
      if (cmFertilizerType.trim()) details['fertilizerType'] = cmFertilizerType.trim();
      if (cmQuantityUnit.trim()) {
        details['quantityUnit'] = cmQuantityUnit.trim();
        if (cmFertilizerName.trim()) {
          inputs.push(`${cmFertilizerName.trim()} ${cmQuantityUnit.trim()}`);
        } else {
          inputs.push(cmQuantityUnit.trim());
        }
      } else if (cmFertilizerName.trim()) {
        inputs.push(cmFertilizerName.trim());
      }
      if (cmFertilizerDate.trim()) details['applicationDate'] = cmFertilizerDate.trim();
      if (cmApplicationMethod.trim()) details['applicationMethod'] = cmApplicationMethod.trim();
      if (cmOrganicStatus.trim()) {
        details['organicCertStatus'] = cmOrganicStatus.trim();
        inputs.push(cmOrganicStatus.trim());
      }
    } else if (isMaturityPest) {
      if (cmPestDate.trim()) details['observationDate'] = cmPestDate.trim();
      if (cmPestIdentified.trim()) {
        details['pestIdentified'] = cmPestIdentified.trim();
        inputs.push(cmPestIdentified.trim());
      }
      if (cmSymptoms.trim()) details['symptoms'] = cmSymptoms.trim();
      if (cmSeverityLevel.trim()) {
        details['severityLevel'] = cmSeverityLevel.trim();
        inputs.push(`Severity: ${cmSeverityLevel.trim()}`);
      }
      if (cmTreatment.trim()) details['treatment'] = cmTreatment.trim();
    } else if (isQualityAssessment) {
      if (cmQualityDate.trim()) details['assessmentDate'] = cmQualityDate.trim();
      if (cmCropAppearance.trim()) details['cropAppearance'] = cmCropAppearance.trim();
      if (cmQualityCondition.trim()) {
        details['qualityCondition'] = cmQualityCondition.trim();
        inputs.push(cmQualityCondition.trim());
      }
      if (cmVisibleDefects.trim()) details['visibleDefects'] = cmVisibleDefects.trim();
      if (cmQualityGrade.trim()) {
        details['qualityGrade'] = cmQualityGrade.trim();
        inputs.push(`Grade: ${cmQualityGrade.trim()}`);
      }
    } else if (isHarvestReadiness) {
      if (cmReadinessDate.trim()) details['assessmentDate'] = cmReadinessDate.trim();
      if (cmExpectedHarvestDate.trim()) {
        details['expectedHarvestDate'] = cmExpectedHarvestDate.trim();
        inputs.push(`Harvest: ${cmExpectedHarvestDate.trim()}`);
      }
      if (cmHarvestReadiness.trim()) {
        details['harvestReadiness'] = cmHarvestReadiness.trim();
        inputs.push(cmHarvestReadiness.trim());
      }
      if (cmMaturityObservations.trim()) details['maturityObservations'] = cmMaturityObservations.trim();
    }
    // ─── FLOWERING ───
    else if (isFloweringObs) {
      if (firstFloweringDate.trim()) details['firstFloweringDate'] = firstFloweringDate.trim();
      if (floweringProgress.trim()) {
        details['floweringProgress'] = floweringProgress.trim();
        inputs.push(floweringProgress.trim());
      }
      if (approxFlowerCount.trim()) {
        details['approxFlowerCount'] = approxFlowerCount.trim();
        inputs.push(approxFlowerCount.trim());
      }
    } else if (isPollination) {
      if (pollinationObsDate.trim()) details['observationDate'] = pollinationObsDate.trim();
      if (pollinationMethod.trim()) {
        details['pollinationMethod'] = pollinationMethod.trim();
        inputs.push(pollinationMethod.trim());
      }
      if (pollinatorObservations.trim()) {
        details['pollinatorObservations'] = pollinatorObservations.trim();
      }
    } else if (isFloweringIrrigation) {
      if (flWateringDate.trim()) details['wateringDate'] = flWateringDate.trim();
      if (flIrrigationMethod.trim()) {
        details['irrigationMethod'] = flIrrigationMethod.trim();
        inputs.push(flIrrigationMethod.trim());
      }
      if (flWaterQuantity.trim()) {
        details['waterQuantity'] = flWaterQuantity.trim();
        inputs.push(flWaterQuantity.trim());
      }
    } else if (isFloweringFertilizer) {
      if (flFertilizerName.trim()) details['fertilizerName'] = flFertilizerName.trim();
      if (flFertilizerType.trim()) details['fertilizerType'] = flFertilizerType.trim();
      if (flQuantityUnit.trim()) {
        details['quantityUnit'] = flQuantityUnit.trim();
        if (flFertilizerName.trim()) {
          inputs.push(`${flFertilizerName.trim()} ${flQuantityUnit.trim()}`);
        } else {
          inputs.push(flQuantityUnit.trim());
        }
      } else if (flFertilizerName.trim()) {
        inputs.push(flFertilizerName.trim());
      }
      if (flFertilizerDate.trim()) details['applicationDate'] = flFertilizerDate.trim();
      if (flOrganicCertStatus.trim()) {
        details['organicCertStatus'] = flOrganicCertStatus.trim();
        inputs.push(flOrganicCertStatus.trim());
      }
    } else if (isFloweringPest) {
      if (flPestDate.trim()) details['observationDate'] = flPestDate.trim();
      if (flPestIdentified.trim()) {
        details['pestIdentified'] = flPestIdentified.trim();
        inputs.push(flPestIdentified.trim());
      }
      if (flSymptoms.trim()) details['symptoms'] = flSymptoms.trim();
      if (flTreatment.trim()) details['treatment'] = flTreatment.trim();
    } else if (isFlowerHealth) {
      if (flHealthDate.trim()) details['observationDate'] = flHealthDate.trim();
      if (flHealthCondition.trim()) {
        details['flowerHealthCondition'] = flHealthCondition.trim();
        inputs.push(flHealthCondition.trim());
      }
      if (flDamageDrop.trim()) {
        details['flowerDamageDrop'] = flDamageDrop.trim();
        inputs.push(flDamageDrop.trim());
      }
      if (flPossibleCauses.trim()) details['possibleCauses'] = flPossibleCauses.trim();
    }
    // ─── VEGETATIVE GROWTH ───
    else if (isVgWatering) {
      if (vgWateringDate.trim()) details['wateringDate'] = vgWateringDate.trim();
      if (vgWaterQuantity.trim()) {
        details['waterQuantity'] = vgWaterQuantity.trim();
        inputs.push(vgWaterQuantity.trim());
      }
      if (vgIrrigationMethod.trim()) {
        details['irrigationMethod'] = vgIrrigationMethod.trim();
        inputs.push(vgIrrigationMethod.trim());
      }
    } else if (isVgFertilizer) {
      if (vgFertilizerName.trim()) details['fertilizerName'] = vgFertilizerName.trim();
      if (vgFertilizerQuantity.trim()) details['fertilizerQuantity'] = vgFertilizerQuantity.trim();
      if (vgFertilizerDate.trim()) details['applicationDate'] = vgFertilizerDate.trim();
      if (vgFertilizerName.trim() && vgFertilizerQuantity.trim()) {
        inputs.push(`${vgFertilizerName.trim()} ${vgFertilizerQuantity.trim()}`);
      } else if (vgFertilizerName.trim()) {
        inputs.push(vgFertilizerName.trim());
      }
    } else if (isVgWeeding) {
      if (vgWeedingDate.trim()) details['weedingDate'] = vgWeedingDate.trim();
      if (vgWeedingMethod.trim()) {
        details['weedingMethod'] = vgWeedingMethod.trim();
        inputs.push(vgWeedingMethod.trim());
      }
      if (vgSoilCareActivities.trim()) {
        details['soilCareActivities'] = vgSoilCareActivities.trim();
      }
    } else if (isVgPest) {
      if (vgPestDate.trim()) details['observationDate'] = vgPestDate.trim();
      if (vgPestIdentified.trim()) {
        details['pestIdentified'] = vgPestIdentified.trim();
        inputs.push(vgPestIdentified.trim());
      }
      if (vgSymptoms.trim()) details['symptoms'] = vgSymptoms.trim();
      if (vgTreatment.trim()) details['treatment'] = vgTreatment.trim();
    } else if (isVgGrowth) {
      if (vgGrowthDate.trim()) details['observationDate'] = vgGrowthDate.trim();
      if (vgPlantHeight.trim()) {
        details['plantHeight'] = vgPlantHeight.trim();
        inputs.push(`Height: ${vgPlantHeight.trim()}`);
      }
      if (vgLeafDevelopment.trim()) details['leafDevelopment'] = vgLeafDevelopment.trim();
      if (vgHealthCondition.trim()) {
        details['healthCondition'] = vgHealthCondition.trim();
        inputs.push(vgHealthCondition.trim());
      }
    } else if (isVgEnv) {
      if (vgEnvDate.trim()) details['recordingDate'] = vgEnvDate.trim();
      if (vgTemperature.trim()) {
        details['temperature'] = vgTemperature.trim();
        inputs.push(vgTemperature.trim());
      }
      if (vgHumidity.trim()) {
        details['humidity'] = vgHumidity.trim();
        inputs.push(vgHumidity.trim());
      }
      if (vgSoilMoisture.trim()) {
        details['soilMoisture'] = vgSoilMoisture.trim();
        inputs.push(`Moisture: ${vgSoilMoisture.trim()}`);
      }
    }

    onSave(
      notes.trim(),
      photoUri,
      Object.keys(details).length > 0 ? details : undefined,
      inputs.length > 0 ? inputs : undefined
    );
    setNotes('');
    setPhotoUri(undefined);
    setNotesError(null);
    onClose();
  };

  const isCompleted = existingRecords.length > 0;
  const stageDisplayLabel =
    stageName?.toLowerCase() === 'harvesting' || stageName?.toLowerCase() === 'harvest'
      ? 'Harvest Stage'
      : stageName
      ? `${stageName} Stage`
      : 'Stage';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.modalCard}
    >
      {/* Header */}
      <View style={styles.modalHeader}>
        <View style={styles.headerTitleCol}>
          <View style={styles.titleWithBadgeRow}>
            <Text style={styles.modalTitle}>{activity.name}</Text>
            {isCompleted && (
              <View style={styles.completedBadgePill}>
                <Feather name="check" size={11} color="#1E6F38" style={{ marginRight: 3 }} />
                <Text style={styles.completedBadgeText}>Completed</Text>
              </View>
            )}
          </View>
          <Text style={styles.modalSubtitle}>
            {cropName} • {stageDisplayLabel}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="x" size={20} color="#3C5441" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollBody}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Existing Notes History (if any) */}
        {existingRecords.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionHeading}>
              Saved Records ({existingRecords.length})
            </Text>
            {existingRecords.map((item, idx) => (
              <View key={item.id || item.recordCode || `hist-${idx}`} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyCode}>{item.recordCode}</Text>
                  <Text style={styles.historyDate}>
                    {item.date} {item.time ? `• ${item.time}` : ''}
                  </Text>
                </View>

                {/* Input Badges (if any) */}
                {item.inputs && item.inputs.length > 0 && (
                  <View style={styles.historyInputsRow}>
                    {item.inputs.map((inp, i) => (
                      <View key={i} style={styles.inputBadge}>
                        <Text style={styles.inputBadgeText}>{inp}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Activity Detail Tags (if any) */}
                {item.details && (
                  <View style={styles.historyDetailsRow}>
                    {Object.entries(item.details).map(([key, val]) => {
                      if (!val) return null;
                      return (
                        <View key={key} style={styles.detailTagPill}>
                          <Text style={styles.detailTagLabel}>{formatDetailLabel(key)}: </Text>
                          <Text style={styles.detailTagVal}>{String(val)}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                <Text style={styles.historyNotesText}>
                  {item.notes || 'Activity recorded.'}
                </Text>
                {item.photoUrl && (
                  <Image source={{ uri: item.photoUrl }} style={styles.historyPhotoThumbnail} />
                )}
              </View>
            ))}

            {!showAddAnother && (
              <TouchableOpacity
                style={styles.addAnotherBtn}
                activeOpacity={0.8}
                onPress={() => setShowAddAnother(true)}
              >
                <Feather name="plus-circle" size={16} color="#1E3C25" style={{ marginRight: 6 }} />
                <Text style={styles.addAnotherBtnText}>+ Add Another Record</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Note & Detail Fields Area (Visible if no records yet or if 'Add Another' is toggled) */}
        {showAddAnother && (
          <View style={styles.formSection}>
            {existingRecords.length > 0 && (
              <Text style={styles.sectionHeading}>New Record</Text>
            )}

            {/* ─── CROP-SPECIFIC FIELD OBSERVATIONS ─── */}
            {cropSpecificFields && cropSpecificFields.length > 0 && (
              <View style={styles.cropSpecificBox}>
                <View style={styles.cropSpecificHeader}>
                  <Feather name="sliders" size={15} color="#1E4C29" style={{ marginRight: 6 }} />
                  <Text style={styles.cropSpecificTitle}>
                    {cropName} • Specific Field Observations
                  </Text>
                </View>

                {cropSpecificFields.map((field) => (
                  <View key={field.id} style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      {field.label} {field.unit ? `(${field.unit})` : ''}{' '}
                      {field.required && <Text style={{ color: '#D9534F' }}>*</Text>}
                    </Text>

                    {field.type === 'select' && field.options ? (
                      <View style={styles.optionPillGroup}>
                        {field.options.map((opt) => {
                          const isSelected =
                            (cropSpecificValues[field.id] || field.defaultValue) === opt.value;
                          return (
                            <TouchableOpacity
                              key={opt.value}
                              style={[
                                styles.optionPill,
                                isSelected && styles.optionPillSelected,
                              ]}
                              onPress={() =>
                                setCropSpecificValues((prev) => ({
                                  ...prev,
                                  [field.id]: opt.value,
                                }))
                              }
                            >
                              <Text
                                style={[
                                  styles.optionPillText,
                                  isSelected && styles.optionPillTextSelected,
                                ]}
                              >
                                {opt.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : (
                      <TextInput
                        style={styles.textInput}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        placeholderTextColor="#9CB0A1"
                        value={cropSpecificValues[field.id] || ''}
                        onChangeText={(val) =>
                          setCropSpecificValues((prev) => ({
                            ...prev,
                            [field.id]: val,
                          }))
                        }
                        keyboardType={
                          field.type === 'number' || field.type === 'percentage'
                            ? 'numeric'
                            : 'default'
                        }
                      />
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* ─── CUSTOM ACTIVITY INFO & DATE ─── */}
            {!cropSpecificFields && activity.isCustom && (
              <View style={styles.customActivityBox}>
                <View style={styles.customActivityHeader}>
                  <Feather name="bookmark" size={15} color="#1E4C29" style={{ marginRight: 6 }} />
                  <Text style={styles.customActivityTitle}>Farmer-Created Custom Activity</Text>
                </View>
                {activity.description ? (
                  <Text style={styles.customActivityDesc}>{activity.description}</Text>
                ) : null}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Activity Date</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 28 Sep 2026"
                    placeholderTextColor="#9CB0A1"
                    value={customActDate}
                    onChangeText={setCustomActDate}
                  />
                </View>
              </View>
            )}

            {/* Default activity fields (rendered when no crop-specific configuration matches and not custom) */}
            {!cropSpecificFields && !activity.isCustom && (
              <>
                {/* ─── HARVEST: 1. Harvest Details ─── */}
                {isHarvestDetails && (
              <>
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Harvest Date</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 15 Oct 2026"
                      placeholderTextColor="#9CB0A1"
                      value={hvHarvestDate}
                      onChangeText={setHvHarvestDate}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Harvest Time (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 08:30 AM"
                      placeholderTextColor="#9CB0A1"
                      value={hvHarvestTime}
                      onChangeText={setHvHarvestTime}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Harvest Method</Text>
                  <View style={styles.optionPillGroup}>
                    {['Manual Picking', 'Mechanical Harvester'].map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.optionPill,
                          hvHarvestMethod === m && styles.optionPillSelected,
                        ]}
                        onPress={() => setHvHarvestMethod(m)}
                      >
                        <Text
                          style={[
                            styles.optionPillText,
                            hvHarvestMethod === m && styles.optionPillTextSelected,
                          ]}
                        >
                          {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Harvest Location or Field</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Kandy Farm · Field A"
                    placeholderTextColor="#9CB0A1"
                    value={hvHarvestLocation}
                    onChangeText={setHvHarvestLocation}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Crop Condition at Harvest</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Fully ripe, firm, dry weather morning harvest"
                    placeholderTextColor="#9CB0A1"
                    value={hvCropCondition}
                    onChangeText={setHvCropCondition}
                  />
                </View>
              </>
            )}

            {/* ─── HARVEST: 2. Harvest Quantity ─── */}
            {isHarvestQuantity && (
              <>
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Measurement Date</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 15 Oct 2026"
                      placeholderTextColor="#9CB0A1"
                      value={hvMeasurementDate}
                      onChangeText={setHvMeasurementDate}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Total Harvested Quantity</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 150"
                      keyboardType="numeric"
                      placeholderTextColor="#9CB0A1"
                      value={hvTotalQuantity}
                      onChangeText={setHvTotalQuantity}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Quantity Unit</Text>
                  <View style={styles.optionPillGroup}>
                    {['kg', 'tonnes', 'pieces', 'crates'].map((u) => (
                      <TouchableOpacity
                        key={u}
                        style={[
                          styles.optionPill,
                          hvQuantityUnit === u && styles.optionPillSelected,
                        ]}
                        onPress={() => setHvQuantityUnit(u)}
                      >
                        <Text
                          style={[
                            styles.optionPillText,
                            hvQuantityUnit === u && styles.optionPillTextSelected,
                          ]}
                        >
                          {u}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Number of Containers (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 10 crates"
                      placeholderTextColor="#9CB0A1"
                      value={hvNumberContainers}
                      onChangeText={setHvNumberContainers}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Rejected Quantity (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 5 kg"
                      placeholderTextColor="#9CB0A1"
                      value={hvRejectedQuantity}
                      onChangeText={setHvRejectedQuantity}
                    />
                  </View>
                </View>
              </>
            )}

            {/* ─── HARVEST: 3. Quality Grading ─── */}
            {isQualityGrading && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Assessment Date</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 15 Oct 2026"
                    placeholderTextColor="#9CB0A1"
                    value={hvGradingDate}
                    onChangeText={setHvGradingDate}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Quality Grade</Text>
                  <View style={styles.optionPillGroup}>
                    {['Grade A', 'Grade B', 'Grade C', 'Ungraded'].map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[
                          styles.optionPill,
                          hvQualityGrade === g && styles.optionPillSelected,
                        ]}
                        onPress={() => setHvQualityGrade(g)}
                      >
                        <Text
                          style={[
                            styles.optionPillText,
                            hvQualityGrade === g && styles.optionPillTextSelected,
                          ]}
                        >
                          {g}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Quality Assessment Criteria</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Brix > 5.0, diameter 6-8cm, uniform color"
                    placeholderTextColor="#9CB0A1"
                    value={hvGradingCriteria}
                    onChangeText={setHvGradingCriteria}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Crop Appearance</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Glossy, blemish-free skin"
                      placeholderTextColor="#9CB0A1"
                      value={hvGradingAppearance}
                      onChangeText={setHvGradingAppearance}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Visible Defects or Damage</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Zero cracking, none"
                      placeholderTextColor="#9CB0A1"
                      value={hvGradingDefects}
                      onChangeText={setHvGradingDefects}
                    />
                  </View>
                </View>
              </>
            )}

            {/* ─── HARVEST: 4. Sorting & Cleaning ─── */}
            {isSortingCleaning && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Sorting Date</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 15 Oct 2026"
                    placeholderTextColor="#9CB0A1"
                    value={hvSortingDate}
                    onChangeText={setHvSortingDate}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Sorting Method</Text>
                  <View style={styles.optionPillGroup}>
                    {['Manual Hand Sorting', 'Conveyor Table', 'Optical Sorter'].map((sm) => (
                      <TouchableOpacity
                        key={sm}
                        style={[
                          styles.optionPill,
                          hvSortingMethod === sm && styles.optionPillSelected,
                        ]}
                        onPress={() => setHvSortingMethod(sm)}
                      >
                        <Text
                          style={[
                            styles.optionPillText,
                            hvSortingMethod === sm && styles.optionPillTextSelected,
                          ]}
                        >
                          {sm}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Cleaning Method</Text>
                  <View style={styles.optionPillGroup}>
                    {['Dry Brushing', 'Wipe Clean', 'Water Wash', 'No Cleaning (Not required)'].map((cm) => (
                      <TouchableOpacity
                        key={cm}
                        style={[
                          styles.optionPill,
                          hvCleaningMethod === cm && styles.optionPillSelected,
                        ]}
                        onPress={() => setHvCleaningMethod(cm)}
                      >
                        <Text
                          style={[
                            styles.optionPillText,
                            hvCleaningMethod === cm && styles.optionPillTextSelected,
                          ]}
                        >
                          {cm}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Quantity Accepted (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 145 kg"
                      placeholderTextColor="#9CB0A1"
                      value={hvQuantityAccepted}
                      onChangeText={setHvQuantityAccepted}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Quantity Rejected (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 5 kg"
                      placeholderTextColor="#9CB0A1"
                      value={hvQuantityRejected}
                      onChangeText={setHvQuantityRejected}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Reason for Rejection (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Undersized, minor skin blemishes"
                    placeholderTextColor="#9CB0A1"
                    value={hvRejectionReason}
                    onChangeText={setHvRejectionReason}
                  />
                </View>
              </>
            )}

            {/* ─── HARVEST: 5. Packaging ─── */}
            {isHarvestPackaging && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Packaging Date</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 16 Oct 2026"
                    placeholderTextColor="#9CB0A1"
                    value={hvPackagingDate}
                    onChangeText={setHvPackagingDate}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Packaging Material or Type</Text>
                  <View style={styles.optionPillGroup}>
                    {['Biodegradable Crates', 'Ventilated Cartons', 'Paper Bags', 'Organic Fiber Sacks'].map((pm) => (
                      <TouchableOpacity
                        key={pm}
                        style={[
                          styles.optionPill,
                          hvPackagingMaterial === pm && styles.optionPillSelected,
                        ]}
                        onPress={() => setHvPackagingMaterial(pm)}
                      >
                        <Text
                          style={[
                            styles.optionPillText,
                            hvPackagingMaterial === pm && styles.optionPillTextSelected,
                          ]}
                        >
                          {pm}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Number of Packages</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 15 packages"
                      placeholderTextColor="#9CB0A1"
                      value={hvNumberPackages}
                      onChangeText={setHvNumberPackages}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Quantity per Package (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 10 kg/carton"
                      placeholderTextColor="#9CB0A1"
                      value={hvQuantityPerPackage}
                      onChangeText={setHvQuantityPerPackage}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Packaging Method</Text>
                  <View style={styles.optionPillGroup}>
                    {['Manual Packing', 'Eco Flow-Pack', 'Sealed Container'].map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.optionPill,
                          hvPackagingMethod === m && styles.optionPillSelected,
                        ]}
                        onPress={() => setHvPackagingMethod(m)}
                      >
                        <Text
                          style={[
                            styles.optionPillText,
                            hvPackagingMethod === m && styles.optionPillTextSelected,
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

            {/* ─── HARVEST: 6. Storage Conditions ─── */}
            {isStorageConditions && (
              <>
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Storage Start Date</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 16 Oct 2026"
                      placeholderTextColor="#9CB0A1"
                      value={hvStorageStartDate}
                      onChangeText={setHvStorageStartDate}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Storage Location</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Cold Room Bay 1"
                      placeholderTextColor="#9CB0A1"
                      value={hvStorageLocation}
                      onChangeText={setHvStorageLocation}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Storage Method</Text>
                  <View style={styles.optionPillGroup}>
                    {['Controlled Cold Storage', 'Ventilated Dry Store', 'Ambient Curing'].map((sm) => (
                      <TouchableOpacity
                        key={sm}
                        style={[
                          styles.optionPill,
                          hvStorageMethod === sm && styles.optionPillSelected,
                        ]}
                        onPress={() => setHvStorageMethod(sm)}
                      >
                        <Text
                          style={[
                            styles.optionPillText,
                            hvStorageMethod === sm && styles.optionPillTextSelected,
                          ]}
                        >
                          {sm}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 6 }]}>
                    <Text style={styles.inputLabel}>Temperature (Opt)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 12°C"
                      placeholderTextColor="#9CB0A1"
                      value={hvTemperature}
                      onChangeText={setHvTemperature}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginHorizontal: 3 }]}>
                    <Text style={styles.inputLabel}>Humidity (Opt)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 85% RH"
                      placeholderTextColor="#9CB0A1"
                      value={hvRelativeHumidity}
                      onChangeText={setHvRelativeHumidity}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 6 }]}>
                    <Text style={styles.inputLabel}>Duration (Opt)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 3-5 days"
                      placeholderTextColor="#9CB0A1"
                      value={hvStorageDuration}
                      onChangeText={setHvStorageDuration}
                    />
                  </View>
                </View>
              </>
            )}

            {/* ─── HARVEST: 7. Batch Identification ─── */}
            {isBatchIdentification && (
              <>
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Harvest Batch ID</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. HARV-TOM-2026-10"
                      placeholderTextColor="#9CB0A1"
                      value={hvHarvestBatchId}
                      onChangeText={setHvHarvestBatchId}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Crop Batch ID</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: '#F0F4F0' }]}
                      placeholder="e.g. BATCH-TOM-2026-09"
                      placeholderTextColor="#9CB0A1"
                      value={hvCropBatchId}
                      onChangeText={setHvCropBatchId}
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Harvest Date</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 15 Oct 2026"
                      placeholderTextColor="#9CB0A1"
                      value={hvBatchDate}
                      onChangeText={setHvBatchDate}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Batch Quantity</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 150 kg"
                      placeholderTextColor="#9CB0A1"
                      value={hvBatchQuantity}
                      onChangeText={setHvBatchQuantity}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Harvest Location</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Kandy Farm · Packhouse A"
                    placeholderTextColor="#9CB0A1"
                    value={hvBatchLocation}
                    onChangeText={setHvBatchLocation}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Packaging or Storage Reference (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. CRATE-LOT-01..15, Bay B"
                    placeholderTextColor="#9CB0A1"
                    value={hvPackagingReference}
                    onChangeText={setHvPackagingReference}
                  />
                </View>
              </>
            )}

            {/* ─── CROP MATURITY: 1. Crop Growth & Development ─── */}
            {isCropGrowth && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Observation Date</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 25 Sep 2026"
                    placeholderTextColor="#9CB0A1"
                    value={cmGrowthDate}
                    onChangeText={setCmGrowthDate}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Crop Dimensions (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 6.5 cm diameter"
                      placeholderTextColor="#9CB0A1"
                      value={cmCropDimensions}
                      onChangeText={setCmCropDimensions}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Average Weight (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 150g per fruit"
                      placeholderTextColor="#9CB0A1"
                      value={cmCropWeight}
                      onChangeText={setCmCropWeight}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Growth Condition</Text>
                  <View style={styles.optionPillGroup}>
                    {['Optimal Sizing', 'Normal Growth', 'Slow Development', 'Stunted'].map((cond) => (
                      <TouchableOpacity
                        key={cond}
                        style={[
                          styles.optionPill,
                          cmGrowthCondition === cond && styles.optionPillSelected,
                        ]}
                        onPress={() => setCmGrowthCondition(cond)}
                      >
                        <Text
                          style={[
                            styles.optionPillText,
                            cmGrowthCondition === cond && styles.optionPillTextSelected,
                          ]}
                        >
                          {cond}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* ─── CROP MATURITY: 2. Ripeness & Maturity Monitoring ─── */}
            {isRipeness && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Observation Date</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 25 Sep 2026"
                    placeholderTextColor="#9CB0A1"
                    value={cmRipenessDate}
                    onChangeText={setCmRipenessDate}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Maturity Stage</Text>
                  <View style={styles.optionPillGroup}>
                    {['Immature', 'Developing', 'Nearly Mature', 'Mature'].map((stg) => (
                      <TouchableOpacity
                        key={stg}
                        style={[
                          styles.optionPill,
                          cmMaturityStage === stg && styles.optionPillSelected,
                        ]}
                        onPress={() => setCmMaturityStage(stg)}
                      >
                        <Text
                          style={[
                            styles.optionPillText,
                            cmMaturityStage === stg && styles.optionPillTextSelected,
                          ]}
                        >
                          {stg}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Color / Appearance Changes</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Turning from green to light red / orange"
                    placeholderTextColor="#9CB0A1"
                    value={cmColorAppearance}
                    onChangeText={setCmColorAppearance}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Estimated Ripeness Percentage (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 70%"
                    placeholderTextColor="#9CB0A1"
                    value={cmRipenessPercentage}
                    onChangeText={setCmRipenessPercentage}
                  />
                </View>
              </>
            )}

            {/* ─── CROP MATURITY: 3. Watering & Irrigation ─── */}
            {isMaturityIrrigation && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Watering Date</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 25 Sep 2026"
                    placeholderTextColor="#9CB0A1"
                    value={cmWateringDate}
                    onChangeText={setCmWateringDate}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Irrigation Method</Text>
                  <View style={styles.optionPillGroup}>
                    {['Drip', 'Sprinkler', 'Manual Furrow', 'Reduced Irrigation'].map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.optionPill,
                          cmIrrigationMethod === m && styles.optionPillSelected,
                        ]}
                        onPress={() => setCmIrrigationMethod(m)}
                      >
                        <Text
                          style={[
                            styles.optionPillText,
                            cmIrrigationMethod === m && styles.optionPillTextSelected,
                          ]}
                        >
                          {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Water Quantity (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 3L/plant, 10mm"
                      placeholderTextColor="#9CB0A1"
                      value={cmWaterQuantity}
                      onChangeText={setCmWaterQuantity}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Watering Frequency (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Every 2 days"
                      placeholderTextColor="#9CB0A1"
                      value={cmWateringFrequency}
                      onChangeText={setCmWateringFrequency}
                    />
                  </View>
                </View>
              </>
            )}

            {/* ─── CROP MATURITY: 4. Organic Fertilizer Application ─── */}
            {isMaturityFertilizer && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Fertilizer Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Organic Potassium Sulfate, Wood Ash Extract, Compost Tea"
                    placeholderTextColor="#9CB0A1"
                    value={cmFertilizerName}
                    onChangeText={setCmFertilizerName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Fertilizer Type</Text>
                  <View style={styles.optionPillGroup}>
                    {['Liquid Foliar', 'Granular Soil', 'Organic Potash', 'Bio-fertilizer'].map((ft) => (
                      <TouchableOpacity
                        key={ft}
                        style={[
                          styles.optionPill,
                          cmFertilizerType === ft && styles.optionPillSelected,
                        ]}
                        onPress={() => setCmFertilizerType(ft)}
                      >
                        <Text
                          style={[
                            styles.optionPillText,
                            cmFertilizerType === ft && styles.optionPillTextSelected,
                          ]}
                        >
                          {ft}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Quantity and Unit</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 1.5 kg, 250 ml"
                      placeholderTextColor="#9CB0A1"
                      value={cmQuantityUnit}
                      onChangeText={setCmQuantityUnit}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Application Date</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 25 Sep 2026"
                      placeholderTextColor="#9CB0A1"
                      value={cmFertilizerDate}
                      onChangeText={setCmFertilizerDate}
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Application Method (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Drip fertigation, Soil drench"
                      placeholderTextColor="#9CB0A1"
                      value={cmApplicationMethod}
                      onChangeText={setCmApplicationMethod}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Organic Status / Evidence (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Certified Organic (OMRI)"
                      placeholderTextColor="#9CB0A1"
                      value={cmOrganicStatus}
                      onChangeText={setCmOrganicStatus}
                    />
                  </View>
                </View>
              </>
            )}

            {/* ─── CROP MATURITY: 5. Pest & Disease Management ─── */}
            {isMaturityPest && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Observation Date</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 25 Sep 2026"
                    placeholderTextColor="#9CB0A1"
                    value={cmPestDate}
                    onChangeText={setCmPestDate}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Pest or Disease Identified</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Fruit fly, Blossom end rot, None detected"
                    placeholderTextColor="#9CB0A1"
                    value={cmPestIdentified}
                    onChangeText={setCmPestIdentified}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Symptoms or Crop Damage</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Minor skin scarring, zero internal damage, none"
                    placeholderTextColor="#9CB0A1"
                    value={cmSymptoms}
                    onChangeText={setCmSymptoms}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Severity Level (Optional)</Text>
                  <View style={styles.optionPillGroup}>
                    {['None', 'Low (<5%)', 'Moderate (5-15%)', 'High (>15%)'].map((sev) => (
                      <TouchableOpacity
                        key={sev}
                        style={[
                          styles.optionPill,
                          cmSeverityLevel === sev && styles.optionPillSelected,
                        ]}
                        onPress={() => setCmSeverityLevel(sev)}
                      >
                        <Text
                          style={[
                            styles.optionPillText,
                            cmSeverityLevel === sev && styles.optionPillTextSelected,
                          ]}
                        >
                          {sev}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Treatment Applied (Optional — Monitoring only if blank)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Optional — e.g. Organic lure trap, or blank (monitoring only)"
                    placeholderTextColor="#9CB0A1"
                    value={cmTreatment}
                    onChangeText={setCmTreatment}
                  />
                </View>
              </>
            )}

            {/* ─── CROP MATURITY: 6. Crop Quality Assessment ─── */}
            {isQualityAssessment && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Assessment Date</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 25 Sep 2026"
                    placeholderTextColor="#9CB0A1"
                    value={cmQualityDate}
                    onChangeText={setCmQualityDate}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Crop Appearance</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Uniform shape, smooth glossy skin, rich red color"
                    placeholderTextColor="#9CB0A1"
                    value={cmCropAppearance}
                    onChangeText={setCmCropAppearance}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Quality Condition</Text>
                  <View style={styles.optionPillGroup}>
                    {['Premium (Grade A)', 'Standard (Grade B)', 'Acceptable', 'Cull / Rejected'].map((qc) => (
                      <TouchableOpacity
                        key={qc}
                        style={[
                          styles.optionPill,
                          cmQualityCondition === qc && styles.optionPillSelected,
                        ]}
                        onPress={() => setCmQualityCondition(qc)}
                      >
                        <Text
                          style={[
                            styles.optionPillText,
                            cmQualityCondition === qc && styles.optionPillTextSelected,
                          ]}
                        >
                          {qc}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Visible Defects or Damage</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Zero cracking, minor sunscald on 2%"
                      placeholderTextColor="#9CB0A1"
                      value={cmVisibleDefects}
                      onChangeText={setCmVisibleDefects}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Quality Grade (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Grade A Export, Class 1"
                      placeholderTextColor="#9CB0A1"
                      value={cmQualityGrade}
                      onChangeText={setCmQualityGrade}
                    />
                  </View>
                </View>
              </>
            )}

            {/* ─── CROP MATURITY: 7. Harvest Readiness Assessment ─── */}
            {isHarvestReadiness && (
              <>
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Assessment Date</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 25 Sep 2026"
                      placeholderTextColor="#9CB0A1"
                      value={cmReadinessDate}
                      onChangeText={setCmReadinessDate}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Expected Harvest Date</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 2 Oct 2026"
                      placeholderTextColor="#9CB0A1"
                      value={cmExpectedHarvestDate}
                      onChangeText={setCmExpectedHarvestDate}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Harvest Readiness Status</Text>
                  <View style={styles.optionPillGroup}>
                    {['Ready for Harvest', '1-3 Days Away', '1 Week Away', 'Not Ready'].map((hr) => (
                      <TouchableOpacity
                        key={hr}
                        style={[
                          styles.optionPill,
                          cmHarvestReadiness === hr && styles.optionPillSelected,
                        ]}
                        onPress={() => setCmHarvestReadiness(hr)}
                      >
                        <Text
                          style={[
                            styles.optionPillText,
                            cmHarvestReadiness === hr && styles.optionPillTextSelected,
                          ]}
                        >
                          {hr}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Maturity Observations</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Firmness optimal, Brix sugar 5.2, separation clean"
                    placeholderTextColor="#9CB0A1"
                    value={cmMaturityObservations}
                    onChangeText={setCmMaturityObservations}
                  />
                </View>
              </>
            )}

            {/* ─── FLOWERING: 1. Flowering Observation ─── */}
            {isFloweringObs && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>First Flowering Date</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 14 Sep 2026"
                    placeholderTextColor="#9CB0A1"
                    value={firstFloweringDate}
                    onChangeText={setFirstFloweringDate}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Flowering Progress</Text>
                  <View style={styles.optionPillGroup}>
                    {['Early Bloom (10-25%)', 'Mid Bloom (25-50%)', 'Full Bloom (50-75%)', 'Peak Flowering (75%+)'].map((prog) => (
                      <TouchableOpacity
                        key={prog}
                        style={[
                          styles.optionPill,
                          floweringProgress === prog && styles.optionPillSelected,
                        ]}
                        onPress={() => setFloweringProgress(prog)}
                      >
                        <Text
                          style={[
                            styles.optionPillText,
                            floweringProgress === prog && styles.optionPillTextSelected,
                          ]}
                        >
                          {prog}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Approximate Flower Count (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 14 per truss or 25 total"
                    placeholderTextColor="#9CB0A1"
                    value={approxFlowerCount}
                    onChangeText={setApproxFlowerCount}
                  />
                </View>
              </>
            )}

            {/* ─── FLOWERING: 2. Pollination Monitoring ─── */}
            {isPollination && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Observation Date</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 14 Sep 2026"
                    placeholderTextColor="#9CB0A1"
                    value={pollinationObsDate}
                    onChangeText={setPollinationObsDate}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Pollination Method</Text>
                  <View style={styles.optionPillGroup}>
                    {['Natural', 'Manual', 'Assisted', 'Unknown'].map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.optionPill,
                          pollinationMethod === m && styles.optionPillSelected,
                        ]}
                        onPress={() => setPollinationMethod(m)}
                      >
                        <Text
                          style={[
                            styles.optionPillText,
                            pollinationMethod === m && styles.optionPillTextSelected,
                          ]}
                        >
                          {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Pollinator Observations</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Bees visiting flowers during morning hours"
                    placeholderTextColor="#9CB0A1"
                    value={pollinatorObservations}
                    onChangeText={setPollinatorObservations}
                  />
                </View>
              </>
            )}

            {/* ─── FLOWERING: 3. Watering & Irrigation ─── */}
            {isFloweringIrrigation && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Watering Date</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 14 Sep 2026"
                    placeholderTextColor="#9CB0A1"
                    value={flWateringDate}
                    onChangeText={setFlWateringDate}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Irrigation Method</Text>
                  <View style={styles.optionPillGroup}>
                    {['Drip', 'Sprinkler', 'Manual furrow', 'Sub-surface'].map((method) => (
                      <TouchableOpacity
                        key={method}
                        style={[
                          styles.optionPill,
                          flIrrigationMethod === method && styles.optionPillSelected,
                        ]}
                        onPress={() => setFlIrrigationMethod(method)}
                      >
                        <Text
                          style={[
                            styles.optionPillText,
                            flIrrigationMethod === method && styles.optionPillTextSelected,
                          ]}
                        >
                          {method}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Water Quantity (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 5L, 10L/plant, 15mm"
                    placeholderTextColor="#9CB0A1"
                    value={flWaterQuantity}
                    onChangeText={setFlWaterQuantity}
                  />
                </View>
              </>
            )}

            {/* ─── FLOWERING: 4. Organic Fertilizer Application ─── */}
            {isFloweringFertilizer && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Fertilizer Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Organic Bloom Booster, Bone Meal, Fish Hydrolysate"
                    placeholderTextColor="#9CB0A1"
                    value={flFertilizerName}
                    onChangeText={setFlFertilizerName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Fertilizer Type</Text>
                  <View style={styles.optionPillGroup}>
                    {['Liquid Foliar', 'Granular Soil', 'Compost Tea', 'Bio-fertilizer'].map((ft) => (
                      <TouchableOpacity
                        key={ft}
                        style={[
                          styles.optionPill,
                          flFertilizerType === ft && styles.optionPillSelected,
                        ]}
                        onPress={() => setFlFertilizerType(ft)}
                      >
                        <Text
                          style={[
                            styles.optionPillText,
                            flFertilizerType === ft && styles.optionPillTextSelected,
                          ]}
                        >
                          {ft}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Quantity and Unit</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 2 kg, 500 ml"
                      placeholderTextColor="#9CB0A1"
                      value={flQuantityUnit}
                      onChangeText={setFlQuantityUnit}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Application Date</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 14 Sep 2026"
                      placeholderTextColor="#9CB0A1"
                      value={flFertilizerDate}
                      onChangeText={setFlFertilizerDate}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Organic Certification / Status (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Certified Organic (OMRI), Bio-Gro verified"
                    placeholderTextColor="#9CB0A1"
                    value={flOrganicCertStatus}
                    onChangeText={setFlOrganicCertStatus}
                  />
                </View>
              </>
            )}

            {/* ─── FLOWERING: 5. Pest & Disease Management ─── */}
            {isFloweringPest && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Observation Date</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 14 Sep 2026"
                    placeholderTextColor="#9CB0A1"
                    value={flPestDate}
                    onChangeText={setFlPestDate}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Pest or Disease Identified</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Thrips, Blossom blight, None detected"
                    placeholderTextColor="#9CB0A1"
                    value={flPestIdentified}
                    onChangeText={setFlPestIdentified}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Symptoms or Damage</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Flower browning, petal distortion, no damage"
                    placeholderTextColor="#9CB0A1"
                    value={flSymptoms}
                    onChangeText={setFlSymptoms}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Treatment Applied (Optional — Monitoring only if blank)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Optional — e.g. Organic Neem spray, or leave blank"
                    placeholderTextColor="#9CB0A1"
                    value={flTreatment}
                    onChangeText={setFlTreatment}
                  />
                </View>
              </>
            )}

            {/* ─── FLOWERING: 6. Flower Health Monitoring ─── */}
            {isFlowerHealth && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Observation Date</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 14 Sep 2026"
                    placeholderTextColor="#9CB0A1"
                    value={flHealthDate}
                    onChangeText={setFlHealthDate}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Flower Health Condition</Text>
                  <View style={styles.optionPillGroup}>
                    {['Optimal', 'Good / Healthy', 'Moderate', 'Poor / Stressed'].map((cond) => (
                      <TouchableOpacity
                        key={cond}
                        style={[
                          styles.optionPill,
                          flHealthCondition === cond && styles.optionPillSelected,
                        ]}
                        onPress={() => setFlHealthCondition(cond)}
                      >
                        <Text
                          style={[
                            styles.optionPillText,
                            flHealthCondition === cond && styles.optionPillTextSelected,
                          ]}
                        >
                          {cond}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Flower Damage or Dropping</Text>
                  <View style={styles.optionPillGroup}>
                    {['Zero Drop', 'Minor (<5%)', 'Moderate (5-15%)', 'High (>15%)'].map((drop) => (
                      <TouchableOpacity
                        key={drop}
                        style={[
                          styles.optionPill,
                          flDamageDrop === drop && styles.optionPillSelected,
                        ]}
                        onPress={() => setFlDamageDrop(drop)}
                      >
                        <Text
                          style={[
                            styles.optionPillText,
                            flDamageDrop === drop && styles.optionPillTextSelected,
                          ]}
                        >
                          {drop}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Possible Causes (If known)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Temperature fluctuation, dry wind, low humidity"
                    placeholderTextColor="#9CB0A1"
                    value={flPossibleCauses}
                    onChangeText={setFlPossibleCauses}
                  />
                </View>
              </>
            )}

            {/* ─── VEGETATIVE GROWTH: 1. Watering & Irrigation Specific Fields ─── */}
            {isVgWatering && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Watering Date</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 18 Sep 2026"
                    placeholderTextColor="#9CB0A1"
                    value={vgWateringDate}
                    onChangeText={setVgWateringDate}
                  />
                </View>
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Water Quantity</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 15L or 20mm"
                      placeholderTextColor="#9CB0A1"
                      value={vgWaterQuantity}
                      onChangeText={setVgWaterQuantity}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Irrigation Method</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Drip, Sprinkler"
                      placeholderTextColor="#9CB0A1"
                      value={vgIrrigationMethod}
                      onChangeText={setVgIrrigationMethod}
                    />
                  </View>
                </View>
              </>
            )}

            {/* ─── VEGETATIVE GROWTH: 2. Organic Fertilizer Application Specific Fields ─── */}
            {isVgFertilizer && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Fertilizer Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Organic Compost, Vermicompost, Neem Cake"
                    placeholderTextColor="#9CB0A1"
                    value={vgFertilizerName}
                    onChangeText={setVgFertilizerName}
                  />
                </View>
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Fertilizer Quantity</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 5kg, 2L"
                      placeholderTextColor="#9CB0A1"
                      value={vgFertilizerQuantity}
                      onChangeText={setVgFertilizerQuantity}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Application Date</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 18 Sep 2026"
                      placeholderTextColor="#9CB0A1"
                      value={vgFertilizerDate}
                      onChangeText={setVgFertilizerDate}
                    />
                  </View>
                </View>
              </>
            )}

            {/* ─── VEGETATIVE GROWTH: 3. Weeding & Soil Care Specific Fields ─── */}
            {isVgWeeding && (
              <>
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Weeding Date</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 18 Sep 2026"
                      placeholderTextColor="#9CB0A1"
                      value={vgWeedingDate}
                      onChangeText={setVgWeedingDate}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Weeding Method</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Hand weeding, Hoeing"
                      placeholderTextColor="#9CB0A1"
                      value={vgWeedingMethod}
                      onChangeText={setVgWeedingMethod}
                    />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Soil Care Activities</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Aeration, Bed earthing, Organic mulching"
                    placeholderTextColor="#9CB0A1"
                    value={vgSoilCareActivities}
                    onChangeText={setVgSoilCareActivities}
                  />
                </View>
              </>
            )}

            {/* ─── VEGETATIVE GROWTH: 4. Pest & Disease Monitoring Specific Fields ─── */}
            {isVgPest && (
              <>
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Observation Date</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 18 Sep 2026"
                      placeholderTextColor="#9CB0A1"
                      value={vgPestDate}
                      onChangeText={setVgPestDate}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Pest / Disease Identified</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Aphids, None detected"
                      placeholderTextColor="#9CB0A1"
                      value={vgPestIdentified}
                      onChangeText={setVgPestIdentified}
                    />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Symptoms or Observations</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Minor leaf curling on lower branches"
                    placeholderTextColor="#9CB0A1"
                    value={vgSymptoms}
                    onChangeText={setVgSymptoms}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Treatment Applied (if any)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Organic Neem oil spray, Bio-pesticide"
                    placeholderTextColor="#9CB0A1"
                    value={vgTreatment}
                    onChangeText={setVgTreatment}
                  />
                </View>
              </>
            )}

            {/* ─── VEGETATIVE GROWTH: 5. Plant Growth Observation Specific Fields ─── */}
            {isVgGrowth && (
              <>
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Observation Date</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 18 Sep 2026"
                      placeholderTextColor="#9CB0A1"
                      value={vgGrowthDate}
                      onChangeText={setVgGrowthDate}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Plant Height</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 45 cm, 1.5 ft"
                      placeholderTextColor="#9CB0A1"
                      value={vgPlantHeight}
                      onChangeText={setVgPlantHeight}
                    />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Leaf Development</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 8-10 healthy leaves, vigorous canopy"
                    placeholderTextColor="#9CB0A1"
                    value={vgLeafDevelopment}
                    onChangeText={setVgLeafDevelopment}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Plant Health Condition</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Optimal vigor, Healthy green"
                    placeholderTextColor="#9CB0A1"
                    value={vgHealthCondition}
                    onChangeText={setVgHealthCondition}
                  />
                </View>
              </>
            )}

            {/* ─── VEGETATIVE GROWTH: 6. Environmental Monitoring Specific Fields ─── */}
            {isVgEnv && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Recording Date</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 18 Sep 2026"
                    placeholderTextColor="#9CB0A1"
                    value={vgEnvDate}
                    onChangeText={setVgEnvDate}
                  />
                </View>
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 6 }]}>
                    <Text style={styles.inputLabel}>Temperature</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 27°C"
                      placeholderTextColor="#9CB0A1"
                      value={vgTemperature}
                      onChangeText={setVgTemperature}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginHorizontal: 3 }]}>
                    <Text style={styles.inputLabel}>Humidity</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 68%"
                      placeholderTextColor="#9CB0A1"
                      value={vgHumidity}
                      onChangeText={setVgHumidity}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 6 }]}>
                    <Text style={styles.inputLabel}>Soil Moisture</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 42%"
                      placeholderTextColor="#9CB0A1"
                      value={vgSoilMoisture}
                      onChangeText={setVgSoilMoisture}
                    />
                  </View>
                </View>
              </>
            )}
          </>
        )}

            {/* Multiline Notes Area (Common to all) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Activity Notes <Text style={{ color: '#D9534F' }}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput, notesError && styles.inputErrorBorder]}
                placeholder="Enter detailed activity notes and observations..."
                placeholderTextColor="#9CB0A1"
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

            {/* Photo Evidence (Common to all) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Photo Evidence (Optional)</Text>
              {photoUri ? (
                <View style={styles.photoPreviewWrapper}>
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={() => setPhotoUri(undefined)}
                  >
                    <Feather name="trash-2" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.attachPhotoBtn}
                  onPress={handlePickPhoto}
                  activeOpacity={0.8}
                >
                  <Feather name="camera" size={18} color="#2D6A4F" style={{ marginRight: 8 }} />
                  <Text style={styles.attachPhotoText}>Attach Photo Evidence</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelBtnText}>
            {isCompleted && !showAddAnother ? 'Close' : 'Cancel'}
          </Text>
        </TouchableOpacity>

        {showAddAnother && (
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSave}
            activeOpacity={0.88}
          >
            <Text style={styles.submitBtnText}>Save Notes</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export const ActivityNotesModal: React.FC<ActivityNotesModalProps> = ({
  visible,
  activity,
  cropName,
  stageName,
  stageKey,
  batchId,
  existingRecords,
  onClose,
  onSave,
}) => {
  if (!activity) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <ActivityNotesForm
              key={`${activity.id}-${existingRecords.length}`}
              activity={activity}
              cropName={cropName}
              stageName={stageName}
              stageKey={stageKey}
              batchId={batchId}
              existingRecords={existingRecords}
              onClose={onClose}
              onSave={onSave}
            />
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2EE',
  },
  headerTitleCol: {
    flex: 1,
    marginRight: 10,
  },
  titleWithBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16331C',
  },
  completedBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E6F38',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#65816D',
    marginTop: 3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0F4F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#496751',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  historySection: {
    marginBottom: 16,
  },
  historyCard: {
    backgroundColor: '#F7FAF7',
    borderWidth: 1,
    borderColor: '#E2ECE3',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2D6A4F',
  },
  historyDate: {
    fontSize: 11.5,
    color: '#768E7C',
  },
  historyInputsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  inputBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inputBadgeText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '600',
  },
  historyDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  detailTagPill: {
    flexDirection: 'row',
    backgroundColor: '#EEF6F0',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  detailTagLabel: {
    fontSize: 11,
    color: '#496751',
    fontWeight: '600',
  },
  detailTagVal: {
    fontSize: 11,
    color: '#1C3521',
  },
  historyNotesText: {
    fontSize: 13.5,
    color: '#1D3823',
    lineHeight: 18,
  },
  historyPhotoThumbnail: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    marginTop: 8,
  },
  addAnotherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF5EE',
    borderWidth: 1,
    borderColor: '#CDE5D4',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  addAnotherBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3C25',
  },
  formSection: {
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2B4A33',
    marginBottom: 6,
  },
  optionPillGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  optionPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F0F4F0',
    borderWidth: 1,
    borderColor: '#D4E2D6',
  },
  optionPillSelected: {
    backgroundColor: '#1E3C25',
    borderColor: '#1E3C25',
  },
  optionPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#34523B',
  },
  optionPillTextSelected: {
    color: '#FFFFFF',
  },
  textInput: {
    backgroundColor: '#F8FAF8',
    borderWidth: 1,
    borderColor: '#D8E2D9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1C3521',
  },
  multilineInput: {
    height: 90,
    textAlignVertical: 'top',
  },
  inputErrorBorder: {
    borderColor: '#D9534F',
  },
  errorText: {
    color: '#D9534F',
    fontSize: 11.5,
    marginTop: 4,
  },
  attachPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#2D6A4F',
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: '#F6FAF7',
  },
  attachPhotoText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#2D6A4F',
  },
  photoPreviewWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: 140,
    borderRadius: 12,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#EEF2EE',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#F0F4F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#496751',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#1E3C25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cropSpecificBox: {
    backgroundColor: '#F3FAF5',
    borderWidth: 1,
    borderColor: '#CCE6D3',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  cropSpecificHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cropSpecificTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C4B27',
  },
  customActivityBox: {
    backgroundColor: '#F5FAF6',
    borderWidth: 1,
    borderColor: '#CCE4D3',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  customActivityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  customActivityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E4C29',
  },
  customActivityDesc: {
    fontSize: 13,
    color: '#4B6B53',
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 18,
  },
});
