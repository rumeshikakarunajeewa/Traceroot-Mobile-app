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
import { StageActivityTemplate } from '../../constants/stages';
import { RecentRecordItem } from '../../types/farmer.types';

interface ActivityNotesModalProps {
  visible: boolean;
  activity: StageActivityTemplate | null;
  cropName: string;
  stageName?: string;
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
  existingRecords: RecentRecordItem[];
  onClose: () => void;
  onSave: (
    notes: string,
    photoUri?: string,
    details?: Record<string, string>,
    inputs?: string[]
  ) => void;
}

function formatDetailLabel(key: string): string {
  switch (key) {
    case 'firstFloweringDate':
      return 'First Flowering Date';
    case 'floweringProgress':
      return 'Flowering Progress';
    case 'approxFlowerCount':
      return 'Flower Count';
    case 'observationDate':
      return 'Observation Date';
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
    case 'quantityUnit':
      return 'Quantity';
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
      return 'Flower Health';
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

  // Common fields
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [showAddAnother, setShowAddAnother] = useState(existingRecords.length === 0);

  // ─── FLOWERING STAGE ACTIVITIES ──────────────────────────────────────────
  // 1. Flowering Observation
  const [firstFloweringDate, setFirstFloweringDate] = useState(todayDate);
  const [floweringProgress, setFloweringProgress] = useState('Early Bloom (10-25%)');
  const [approxFlowerCount, setApproxFlowerCount] = useState('');

  // 2. Pollination Monitoring
  const [pollinationObsDate, setPollinationObsDate] = useState(todayDate);
  const [pollinationMethod, setPollinationMethod] = useState('Natural');
  const [pollinatorObservations, setPollinatorObservations] = useState('');

  // 3. Flowering Watering & Irrigation
  const [flWateringDate, setFlWateringDate] = useState(todayDate);
  const [flIrrigationMethod, setFlIrrigationMethod] = useState('Drip');
  const [flWaterQuantity, setFlWaterQuantity] = useState('');

  // 4. Flowering Organic Fertilizer Application
  const [flFertilizerName, setFlFertilizerName] = useState('');
  const [flFertilizerType, setFlFertilizerType] = useState('Liquid Foliar');
  const [flQuantityUnit, setFlQuantityUnit] = useState('');
  const [flFertilizerDate, setFlFertilizerDate] = useState(todayDate);
  const [flOrganicCertStatus, setFlOrganicCertStatus] = useState('');

  // 5. Flowering Pest & Disease Management
  const [flPestDate, setFlPestDate] = useState(todayDate);
  const [flPestIdentified, setFlPestIdentified] = useState('');
  const [flSymptoms, setFlSymptoms] = useState('');
  const [flTreatment, setFlTreatment] = useState('');

  // 6. Flower Health Monitoring
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

  // Flowering activities
  const isFloweringObs = actId === 'flowering_observation' || actName === 'Flowering Observation';
  const isPollination = actId === 'pollination_monitoring' || actName === 'Pollination Monitoring';
  const isFloweringIrrigation = actId === 'flowering_irrigation';
  const isFloweringFertilizer = actId === 'flowering_fertilizer';
  const isFloweringPest = actId === 'flowering_pest_management';
  const isFlowerHealth = actId === 'flower_health_monitoring' || actName === 'Flower Health Monitoring';

  // Vegetative Growth activities
  const isVgWatering =
    actId === 'act-vg-watering' || (!isFloweringIrrigation && actName === 'Watering & Irrigation' && stageName?.toLowerCase().includes('vegetative'));
  const isVgFertilizer =
    actId === 'act-vg-fertilizer' || (!isFloweringFertilizer && actName === 'Organic Fertilizer Application' && stageName?.toLowerCase().includes('vegetative'));
  const isVgWeeding = actId === 'act-vg-weeding' || actName === 'Weeding & Soil Care';
  const isVgPest =
    actId === 'act-vg-pest' || (!isFloweringPest && actName.toLowerCase().includes('pest') && stageName?.toLowerCase().includes('vegetative'));
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

    // Flowering: 1. Flowering Observation
    if (isFloweringObs) {
      if (firstFloweringDate.trim()) details['firstFloweringDate'] = firstFloweringDate.trim();
      if (floweringProgress.trim()) {
        details['floweringProgress'] = floweringProgress.trim();
        inputs.push(floweringProgress.trim());
      }
      if (approxFlowerCount.trim()) {
        details['approxFlowerCount'] = approxFlowerCount.trim();
        inputs.push(approxFlowerCount.trim());
      }
    }
    // Flowering: 2. Pollination Monitoring
    else if (isPollination) {
      if (pollinationObsDate.trim()) details['observationDate'] = pollinationObsDate.trim();
      if (pollinationMethod.trim()) {
        details['pollinationMethod'] = pollinationMethod.trim();
        inputs.push(pollinationMethod.trim());
      }
      if (pollinatorObservations.trim()) {
        details['pollinatorObservations'] = pollinatorObservations.trim();
      }
    }
    // Flowering: 3. Watering & Irrigation
    else if (isFloweringIrrigation) {
      if (flWateringDate.trim()) details['wateringDate'] = flWateringDate.trim();
      if (flIrrigationMethod.trim()) {
        details['irrigationMethod'] = flIrrigationMethod.trim();
        inputs.push(flIrrigationMethod.trim());
      }
      if (flWaterQuantity.trim()) {
        details['waterQuantity'] = flWaterQuantity.trim();
        inputs.push(flWaterQuantity.trim());
      }
    }
    // Flowering: 4. Organic Fertilizer Application
    else if (isFloweringFertilizer) {
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
    }
    // Flowering: 5. Pest & Disease Management
    else if (isFloweringPest) {
      if (flPestDate.trim()) details['observationDate'] = flPestDate.trim();
      if (flPestIdentified.trim()) {
        details['pestIdentified'] = flPestIdentified.trim();
        inputs.push(flPestIdentified.trim());
      }
      if (flSymptoms.trim()) details['symptoms'] = flSymptoms.trim();
      if (flTreatment.trim()) details['treatment'] = flTreatment.trim();
    }
    // Flowering: 6. Flower Health Monitoring
    else if (isFlowerHealth) {
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
    // Vegetative Growth: 1. Watering & Irrigation
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
    }
    // Vegetative Growth: 2. Organic Fertilizer Application
    else if (isVgFertilizer) {
      if (vgFertilizerName.trim()) details['fertilizerName'] = vgFertilizerName.trim();
      if (vgFertilizerQuantity.trim()) details['fertilizerQuantity'] = vgFertilizerQuantity.trim();
      if (vgFertilizerDate.trim()) details['applicationDate'] = vgFertilizerDate.trim();
      if (vgFertilizerName.trim() && vgFertilizerQuantity.trim()) {
        inputs.push(`${vgFertilizerName.trim()} ${vgFertilizerQuantity.trim()}`);
      } else if (vgFertilizerName.trim()) {
        inputs.push(vgFertilizerName.trim());
      }
    }
    // Vegetative Growth: 3. Weeding & Soil Care
    else if (isVgWeeding) {
      if (vgWeedingDate.trim()) details['weedingDate'] = vgWeedingDate.trim();
      if (vgWeedingMethod.trim()) {
        details['weedingMethod'] = vgWeedingMethod.trim();
        inputs.push(vgWeedingMethod.trim());
      }
      if (vgSoilCareActivities.trim()) {
        details['soilCareActivities'] = vgSoilCareActivities.trim();
      }
    }
    // Vegetative Growth: 4. Pest & Disease Monitoring
    else if (isVgPest) {
      if (vgPestDate.trim()) details['observationDate'] = vgPestDate.trim();
      if (vgPestIdentified.trim()) {
        details['pestIdentified'] = vgPestIdentified.trim();
        inputs.push(vgPestIdentified.trim());
      }
      if (vgSymptoms.trim()) details['symptoms'] = vgSymptoms.trim();
      if (vgTreatment.trim()) details['treatment'] = vgTreatment.trim();
    }
    // Vegetative Growth: 5. Plant Growth Observation
    else if (isVgGrowth) {
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
    }
    // Vegetative Growth: 6. Environmental Monitoring
    else if (isVgEnv) {
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
  const stageDisplayLabel = stageName ? `${stageName} Stage` : 'Stage';

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

            {/* Multiline Notes Area (Common to all) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Activity Notes <Text style={{ color: '#D9534F' }}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput, notesError && styles.inputErrorBorder]}
                placeholder="Enter detailed activity notes and field observations..."
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
});
