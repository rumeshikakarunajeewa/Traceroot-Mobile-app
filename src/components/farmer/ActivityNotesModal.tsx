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
    case 'wateringDate':
      return 'Watering Date';
    case 'waterQuantity':
      return 'Water Quantity';
    case 'irrigationMethod':
      return 'Irrigation Method';
    case 'fertilizerName':
      return 'Fertilizer Name';
    case 'fertilizerQuantity':
      return 'Quantity';
    case 'applicationDate':
      return 'Application Date';
    case 'weedingDate':
      return 'Weeding Date';
    case 'weedingMethod':
      return 'Method';
    case 'soilCareActivities':
      return 'Soil Care';
    case 'observationDate':
      return 'Date';
    case 'pestIdentified':
      return 'Pest/Disease';
    case 'symptoms':
      return 'Symptoms';
    case 'treatment':
      return 'Treatment';
    case 'plantHeight':
      return 'Height';
    case 'leafDevelopment':
      return 'Leaves';
    case 'healthCondition':
      return 'Health';
    case 'recordingDate':
      return 'Recording Date';
    case 'temperature':
      return 'Temp';
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

  // 1. Watering & Irrigation fields
  const [wateringDate, setWateringDate] = useState(todayDate);
  const [waterQuantity, setWaterQuantity] = useState('');
  const [irrigationMethod, setIrrigationMethod] = useState('');

  // 2. Organic Fertilizer Application fields
  const [fertilizerName, setFertilizerName] = useState('');
  const [fertilizerQuantity, setFertilizerQuantity] = useState('');
  const [fertilizerDate, setFertilizerDate] = useState(todayDate);

  // 3. Weeding & Soil Care fields
  const [weedingDate, setWeedingDate] = useState(todayDate);
  const [weedingMethod, setWeedingMethod] = useState('');
  const [soilCareActivities, setSoilCareActivities] = useState('');

  // 4. Pest & Disease Monitoring fields
  const [pestObservationDate, setPestObservationDate] = useState(todayDate);
  const [pestIdentified, setPestIdentified] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [treatment, setTreatment] = useState('');

  // 5. Plant Growth Observation fields
  const [growthObservationDate, setGrowthObservationDate] = useState(todayDate);
  const [plantHeight, setPlantHeight] = useState('');
  const [leafDevelopment, setLeafDevelopment] = useState('');
  const [healthCondition, setHealthCondition] = useState('');

  // 6. Environmental Monitoring fields
  const [envRecordingDate, setEnvRecordingDate] = useState(todayDate);
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');
  const [soilMoisture, setSoilMoisture] = useState('');

  // Detect which activity-specific fields to display
  const actNameLower = activity.name.toLowerCase();
  const actIdLower = activity.id.toLowerCase();
  const isWatering = actIdLower.includes('watering') || actNameLower.includes('watering');
  const isFertilizer = actIdLower.includes('fertilizer') || actNameLower.includes('fertilizer');
  const isWeeding = actIdLower.includes('weeding') || actNameLower.includes('weeding');
  const isPest = actIdLower.includes('pest') || actNameLower.includes('pest');
  const isGrowth = actIdLower.includes('growth') || actNameLower.includes('growth');
  const isEnv = actIdLower.includes('env') || actNameLower.includes('environmental');

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

    if (isWatering) {
      if (wateringDate.trim()) details['wateringDate'] = wateringDate.trim();
      if (waterQuantity.trim()) {
        details['waterQuantity'] = waterQuantity.trim();
        inputs.push(waterQuantity.trim());
      }
      if (irrigationMethod.trim()) {
        details['irrigationMethod'] = irrigationMethod.trim();
        inputs.push(irrigationMethod.trim());
      }
    } else if (isFertilizer) {
      if (fertilizerName.trim()) details['fertilizerName'] = fertilizerName.trim();
      if (fertilizerQuantity.trim()) details['fertilizerQuantity'] = fertilizerQuantity.trim();
      if (fertilizerDate.trim()) details['applicationDate'] = fertilizerDate.trim();
      if (fertilizerName.trim() && fertilizerQuantity.trim()) {
        inputs.push(`${fertilizerName.trim()} ${fertilizerQuantity.trim()}`);
      } else if (fertilizerName.trim()) {
        inputs.push(fertilizerName.trim());
      }
    } else if (isWeeding) {
      if (weedingDate.trim()) details['weedingDate'] = weedingDate.trim();
      if (weedingMethod.trim()) {
        details['weedingMethod'] = weedingMethod.trim();
        inputs.push(weedingMethod.trim());
      }
      if (soilCareActivities.trim()) {
        details['soilCareActivities'] = soilCareActivities.trim();
      }
    } else if (isPest) {
      if (pestObservationDate.trim()) details['observationDate'] = pestObservationDate.trim();
      if (pestIdentified.trim()) {
        details['pestIdentified'] = pestIdentified.trim();
        inputs.push(pestIdentified.trim());
      }
      if (symptoms.trim()) details['symptoms'] = symptoms.trim();
      if (treatment.trim()) details['treatment'] = treatment.trim();
    } else if (isGrowth) {
      if (growthObservationDate.trim()) details['observationDate'] = growthObservationDate.trim();
      if (plantHeight.trim()) {
        details['plantHeight'] = plantHeight.trim();
        inputs.push(`Height: ${plantHeight.trim()}`);
      }
      if (leafDevelopment.trim()) details['leafDevelopment'] = leafDevelopment.trim();
      if (healthCondition.trim()) {
        details['healthCondition'] = healthCondition.trim();
        inputs.push(healthCondition.trim());
      }
    } else if (isEnv) {
      if (envRecordingDate.trim()) details['recordingDate'] = envRecordingDate.trim();
      if (temperature.trim()) {
        details['temperature'] = temperature.trim();
        inputs.push(temperature.trim());
      }
      if (humidity.trim()) {
        details['humidity'] = humidity.trim();
        inputs.push(humidity.trim());
      }
      if (soilMoisture.trim()) {
        details['soilMoisture'] = soilMoisture.trim();
        inputs.push(`Moisture: ${soilMoisture.trim()}`);
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

            {/* 1. Watering & Irrigation Specific Fields */}
            {isWatering && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Watering Date</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 18 Sep 2026"
                    placeholderTextColor="#9CB0A1"
                    value={wateringDate}
                    onChangeText={setWateringDate}
                  />
                </View>
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Water Quantity</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 15L or 20mm"
                      placeholderTextColor="#9CB0A1"
                      value={waterQuantity}
                      onChangeText={setWaterQuantity}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Irrigation Method</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Drip, Sprinkler"
                      placeholderTextColor="#9CB0A1"
                      value={irrigationMethod}
                      onChangeText={setIrrigationMethod}
                    />
                  </View>
                </View>
              </>
            )}

            {/* 2. Organic Fertilizer Application Specific Fields */}
            {isFertilizer && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Fertilizer Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Organic Compost, Vermicompost, Neem Cake"
                    placeholderTextColor="#9CB0A1"
                    value={fertilizerName}
                    onChangeText={setFertilizerName}
                  />
                </View>
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Fertilizer Quantity</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 5kg, 2L"
                      placeholderTextColor="#9CB0A1"
                      value={fertilizerQuantity}
                      onChangeText={setFertilizerQuantity}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Application Date</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 18 Sep 2026"
                      placeholderTextColor="#9CB0A1"
                      value={fertilizerDate}
                      onChangeText={setFertilizerDate}
                    />
                  </View>
                </View>
              </>
            )}

            {/* 3. Weeding & Soil Care Specific Fields */}
            {isWeeding && (
              <>
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Weeding Date</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 18 Sep 2026"
                      placeholderTextColor="#9CB0A1"
                      value={weedingDate}
                      onChangeText={setWeedingDate}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Weeding Method</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Hand weeding, Hoeing"
                      placeholderTextColor="#9CB0A1"
                      value={weedingMethod}
                      onChangeText={setWeedingMethod}
                    />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Soil Care Activities</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Aeration, Bed earthing, Organic mulching"
                    placeholderTextColor="#9CB0A1"
                    value={soilCareActivities}
                    onChangeText={setSoilCareActivities}
                  />
                </View>
              </>
            )}

            {/* 4. Pest & Disease Monitoring Specific Fields */}
            {isPest && (
              <>
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Observation Date</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 18 Sep 2026"
                      placeholderTextColor="#9CB0A1"
                      value={pestObservationDate}
                      onChangeText={setPestObservationDate}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Pest / Disease Identified</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Aphids, None detected"
                      placeholderTextColor="#9CB0A1"
                      value={pestIdentified}
                      onChangeText={setPestIdentified}
                    />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Symptoms or Observations</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Minor leaf curling on lower branches"
                    placeholderTextColor="#9CB0A1"
                    value={symptoms}
                    onChangeText={setSymptoms}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Treatment Applied (if any)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Organic Neem oil spray, Bio-pesticide"
                    placeholderTextColor="#9CB0A1"
                    value={treatment}
                    onChangeText={setTreatment}
                  />
                </View>
              </>
            )}

            {/* 5. Plant Growth Observation Specific Fields */}
            {isGrowth && (
              <>
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Observation Date</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 18 Sep 2026"
                      placeholderTextColor="#9CB0A1"
                      value={growthObservationDate}
                      onChangeText={setGrowthObservationDate}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Plant Height</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 45 cm, 1.5 ft"
                      placeholderTextColor="#9CB0A1"
                      value={plantHeight}
                      onChangeText={setPlantHeight}
                    />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Leaf Development</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 8-10 healthy leaves, vigorous canopy"
                    placeholderTextColor="#9CB0A1"
                    value={leafDevelopment}
                    onChangeText={setLeafDevelopment}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Plant Health Condition</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Optimal vigor, Healthy green"
                    placeholderTextColor="#9CB0A1"
                    value={healthCondition}
                    onChangeText={setHealthCondition}
                  />
                </View>
              </>
            )}

            {/* 6. Environmental Monitoring Specific Fields */}
            {isEnv && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Recording Date</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 18 Sep 2026"
                    placeholderTextColor="#9CB0A1"
                    value={envRecordingDate}
                    onChangeText={setEnvRecordingDate}
                  />
                </View>
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 6 }]}>
                    <Text style={styles.inputLabel}>Temperature</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 27°C"
                      placeholderTextColor="#9CB0A1"
                      value={temperature}
                      onChangeText={setTemperature}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginHorizontal: 3 }]}>
                    <Text style={styles.inputLabel}>Humidity</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 68%"
                      placeholderTextColor="#9CB0A1"
                      value={humidity}
                      onChangeText={setHumidity}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 6 }]}>
                    <Text style={styles.inputLabel}>Soil Moisture</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 42%"
                      placeholderTextColor="#9CB0A1"
                      value={soilMoisture}
                      onChangeText={setSoilMoisture}
                    />
                  </View>
                </View>
              </>
            )}

            {/* Multiline Notes Area */}
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

            {/* Photo Evidence */}
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
