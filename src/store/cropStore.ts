import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockFields, mockRecentRecords } from '../constants/farmerMockData';
import {
  FieldItem,
  RecentRecordItem,
  CustomStageActivity,
  ActivityApplicabilityRecord,
  StageApplicabilityRecord,
} from '../types/farmer.types';
import { FarmingStageKeyType } from '../constants/stages';
import { stageIndex, stageLabel } from '../utils/stageHelpers';

// Storage keys for persistent local storage across refreshes and restarts
const STORAGE_KEY_RECORDS = '@traceroot_records_v1';
const STORAGE_KEY_FIELDS = '@traceroot_fields_v1';
const STORAGE_KEY_CUSTOM_ACTIVITIES = '@traceroot_custom_activities_v1';
const STORAGE_KEY_ACTIVITY_APPLICABILITY = '@traceroot_activity_applicabilities_v1';
const STORAGE_KEY_STAGE_APPLICABILITY = '@traceroot_stage_applicabilities_v1';

// In-memory reactive state holding fields & records across all screens
let currentFields: FieldItem[] = [...mockFields];
let currentRecords: RecentRecordItem[] = [...mockRecentRecords];
let currentCustomActivities: CustomStageActivity[] = [];
let currentActivityApplicabilities: ActivityApplicabilityRecord[] = [];
let currentStageApplicabilities: StageApplicabilityRecord[] = [];

type StoreListener = () => void;
const listeners = new Set<StoreListener>();

function notify() {
  listeners.forEach((listener) => listener());
}

async function persistToStorage() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(currentRecords));
    await AsyncStorage.setItem(STORAGE_KEY_FIELDS, JSON.stringify(currentFields));
    await AsyncStorage.setItem(STORAGE_KEY_CUSTOM_ACTIVITIES, JSON.stringify(currentCustomActivities));
    await AsyncStorage.setItem(STORAGE_KEY_ACTIVITY_APPLICABILITY, JSON.stringify(currentActivityApplicabilities));
    await AsyncStorage.setItem(STORAGE_KEY_STAGE_APPLICABILITY, JSON.stringify(currentStageApplicabilities));
  } catch (e) {
    console.warn('Failed to persist TraceRoot records to AsyncStorage', e);
  }
}

let isLoadedFromStorage = false;
async function loadFromStorage() {
  if (isLoadedFromStorage) return;
  isLoadedFromStorage = true;
  try {
    const savedRecordsStr = await AsyncStorage.getItem(STORAGE_KEY_RECORDS);
    const savedFieldsStr = await AsyncStorage.getItem(STORAGE_KEY_FIELDS);
    const savedCustomActivitiesStr = await AsyncStorage.getItem(STORAGE_KEY_CUSTOM_ACTIVITIES);
    const savedActivityApplicabilityStr = await AsyncStorage.getItem(STORAGE_KEY_ACTIVITY_APPLICABILITY);
    const savedStageApplicabilityStr = await AsyncStorage.getItem(STORAGE_KEY_STAGE_APPLICABILITY);
    let changed = false;

    if (savedRecordsStr) {
      const saved = JSON.parse(savedRecordsStr);
      if (Array.isArray(saved) && saved.length > 0) {
        currentRecords = saved;
        changed = true;
      }
    }
    if (savedFieldsStr) {
      const savedF = JSON.parse(savedFieldsStr);
      if (Array.isArray(savedF) && savedF.length > 0) {
        // Merge with mockFields to ensure any newly registered mock crops exist
        const existingIds = new Set(savedF.map((f: FieldItem) => f.id));
        const missingFields = mockFields.filter((f) => !existingIds.has(f.id));
        currentFields = [...savedF, ...missingFields];
        changed = true;
      }
    }
    if (savedCustomActivitiesStr) {
      const savedCA = JSON.parse(savedCustomActivitiesStr);
      if (Array.isArray(savedCA)) {
        currentCustomActivities = savedCA;
        changed = true;
      }
    }
    if (savedActivityApplicabilityStr) {
      const savedAA = JSON.parse(savedActivityApplicabilityStr);
      if (Array.isArray(savedAA)) {
        currentActivityApplicabilities = savedAA;
        changed = true;
      }
    }
    if (savedStageApplicabilityStr) {
      const savedSA = JSON.parse(savedStageApplicabilityStr);
      if (Array.isArray(savedSA)) {
        currentStageApplicabilities = savedSA;
        changed = true;
      }
    }
    if (changed) {
      notify();
    }
  } catch (e) {
    console.warn('Failed to load TraceRoot records from AsyncStorage', e);
  }
}

// Initial load attempt
loadFromStorage();

export function updateFieldPhoto(fieldId: string, newPhotoUri?: string) {
  currentFields = currentFields.map((field) =>
    field.id === fieldId ? { ...field, imageUrl: newPhotoUri } : field
  );
  persistToStorage();
  notify();
}

export function updateFieldStage(fieldId: string, stageNumber: number) {
  currentFields = currentFields.map((field) =>
    field.id === fieldId ? { ...field, currentStageIndex: stageNumber } : field
  );
  persistToStorage();
  notify();
}

export interface NewRecordPayload {
  recordType: string;
  date: string;
  time?: string;
  notes?: string;
  photoUri?: string;
  stage?: string;
  inputs?: string[];
  location?: string;
  details?: Record<string, any>;
}

export interface CorrectionPayload {
  reason: string;
  correctedNotes?: string;
  correctedInputs?: string[];
  photoUri?: string;
}

export interface SaveActivityNotesPayload {
  cropId: string;
  batchId?: string;
  stage?: string;
  activityId: string;
  activityName: string;
  notes: string;
  photoUri?: string;
  details?: Record<string, any>;
  inputs?: string[];
}

export function addRecordToCrop(fieldId: string, payload: NewRecordPayload) {
  const targetField = currentFields.find((f) => f.id === fieldId);
  const targetStageIdx = payload.stage
    ? stageIndex(payload.stage) - 1
    : (targetField?.currentStageIndex ?? 3) - 1;

  const targetStageName = payload.stage || stageLabel(targetStageIdx + 1);

  // Generate sequential record trace code
  const recordCountTotal = currentRecords.length + 1;
  const recordCode = `TR-${String(50 + recordCountTotal).padStart(4, '0')}`;

  const newRecord: RecentRecordItem = {
    id: `rec-${Date.now()}`,
    recordCode,
    title: payload.recordType || 'Cultivation Activity',
    stage: targetStageName,
    date: payload.date,
    time: payload.time || new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date()),
    location: payload.location || targetField?.name || 'Kandy Farm',
    inputs: payload.inputs && payload.inputs.length > 0 ? payload.inputs : undefined,
    photoEvidenceAttached: !!payload.photoUri,
    photoUrl: payload.photoUri,
    isLocked: true,
    isOriginal: true,
    cropId: fieldId,
    batchId: targetField?.batchId || 'BATCH-2026-09',
    isCompact: false,
    notes: payload.notes,
    details: payload.details,
    createdAt: new Date().toISOString(),
  };

  currentRecords = [newRecord, ...currentRecords];

  currentFields = currentFields.map((field) => {
    if (field.id !== fieldId) return field;

    const updatedStages = [...field.stages];

    if (updatedStages[targetStageIdx]) {
      const activeStage = updatedStages[targetStageIdx];
      const existingTags = activeStage.tags || [];
      const newTag = payload.recordType;
      const updatedTags = existingTags.includes(newTag) ? existingTags : [...existingTags, newTag];

      updatedStages[targetStageIdx] = {
        ...activeStage,
        recordCount: (activeStage.recordCount || 0) + 1,
        tags: updatedTags,
        notes: payload.notes || activeStage.notes,
      };
    }

    return {
      ...field,
      stages: updatedStages,
      recordCount: (field.recordCount || 0) + 1,
      evidenceCount: payload.photoUri ? (field.evidenceCount || 0) + 1 : field.evidenceCount,
    };
  });

  persistToStorage();
  notify();
  return newRecord;
}

export function saveActivityNotes(payload: SaveActivityNotesPayload): RecentRecordItem {
  const targetField = currentFields.find((f) => f.id === payload.cropId);
  const targetStage = payload.stage || 'Planting';
  const targetStageIdx = stageIndex(targetStage) - 1;

  const now = new Date();
  const dateFormatted = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(now);
  const timeFormatted = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(now);

  const recordCode = `TR-${String(50 + currentRecords.length + 1).padStart(4, '0')}`;

  const recordDate =
    payload.details?.date ||
    payload.details?.harvestDate ||
    payload.details?.measurementDate ||
    payload.details?.sortingDate ||
    payload.details?.packagingDate ||
    payload.details?.storageStartDate ||
    payload.details?.firstFloweringDate ||
    payload.details?.wateringDate ||
    payload.details?.applicationDate ||
    payload.details?.weedingDate ||
    payload.details?.observationDate ||
    payload.details?.assessmentDate ||
    payload.details?.recordingDate ||
    dateFormatted;

  const newRecord: RecentRecordItem = {
    id: `rec-act-${Date.now()}`,
    recordCode,
    title: payload.activityName,
    stage: targetStage,
    activityId: payload.activityId,
    date: recordDate,
    time: timeFormatted,
    location: targetField?.name || 'Kandy Farm',
    inputs: payload.inputs && payload.inputs.length > 0 ? payload.inputs : undefined,
    photoEvidenceAttached: !!payload.photoUri,
    photoUrl: payload.photoUri,
    isLocked: true,
    isOriginal: true,
    cropId: payload.cropId,
    batchId: payload.batchId || targetField?.batchId || 'BATCH-2026-09',
    isCompact: false,
    notes: payload.notes.trim(),
    details: payload.details,
    createdAt: now.toISOString(),
  };

  currentRecords = [newRecord, ...currentRecords];

  currentFields = currentFields.map((field) => {
    if (field.id !== payload.cropId) return field;

    const updatedStages = [...field.stages];
    if (updatedStages[targetStageIdx]) {
      const activeStage = updatedStages[targetStageIdx];
      const existingTags = activeStage.tags || [];
      const updatedTags = existingTags.includes(payload.activityName)
        ? existingTags
        : [...existingTags, payload.activityName];

      updatedStages[targetStageIdx] = {
        ...activeStage,
        recordCount: (activeStage.recordCount || 0) + 1,
        tags: updatedTags,
        notes: payload.notes.trim(),
      };
    }

    return {
      ...field,
      stages: updatedStages,
      recordCount: (field.recordCount || 0) + 1,
      evidenceCount: payload.photoUri ? (field.evidenceCount || 0) + 1 : field.evidenceCount,
    };
  });

  persistToStorage();
  notify();
  return newRecord;
}

export function addCorrectionToRecord(originalRecordCode: string, payload: CorrectionPayload) {
  const original = currentRecords.find((r) => r.recordCode === originalRecordCode);
  if (!original) return null;

  const correctionCode = `TR-${String(50 + currentRecords.length + 1).padStart(4, '0')}`;
  const now = new Date();
  const dateFormatted = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(now);
  const timeFormatted = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(now);

  const correctionRecord: RecentRecordItem = {
    id: `rec-corr-${Date.now()}`,
    recordCode: correctionCode,
    title: `Correction: ${original.title}`,
    stage: original.stage,
    date: dateFormatted,
    time: timeFormatted,
    location: original.location,
    inputs: payload.correctedInputs || original.inputs,
    photoEvidenceAttached: !!payload.photoUri || original.photoEvidenceAttached,
    photoUrl: payload.photoUri || original.photoUrl,
    isLocked: true,
    isOriginal: false,
    isCorrection: true,
    correctsRecordCode: originalRecordCode,
    correctionReason: payload.reason,
    correctedAt: now.toISOString(),
    cropId: original.cropId,
    batchId: original.batchId,
    activityId: original.activityId,
    isCompact: false,
    notes: payload.correctedNotes || original.notes,
    createdAt: now.toISOString(),
  };

  currentRecords = [correctionRecord, ...currentRecords];
  persistToStorage();
  notify();
  return correctionRecord;
}

export function getRecordsForStage(cropId?: string, stageNameOrKey?: string | number): RecentRecordItem[] {
  return currentRecords.filter((record) => {
    const matchesCrop = !cropId || record.cropId === cropId;
    if (!matchesCrop) return false;

    if (!stageNameOrKey) return true;

    const requestedIdx = stageIndex(String(stageNameOrKey));
    const recordIdx = stageIndex(record.stage);
    return recordIdx === requestedIdx;
  });
}

export function getActivityRecords(cropId?: string, activityId?: string, batchId?: string): RecentRecordItem[] {
  return currentRecords.filter((record) => {
    if (cropId && record.cropId !== cropId) return false;
    if (batchId && record.batchId && record.batchId !== batchId) return false;
    return record.activityId === activityId;
  });
}

export interface AddCustomActivityPayload {
  cropId: string;
  batchId?: string;
  stageKey: FarmingStageKeyType;
  name: string;
  description?: string;
  date?: string;
  notes?: string;
}

export function addCustomActivity(payload: AddCustomActivityPayload): {
  success: boolean;
  activity?: CustomStageActivity;
  error?: string;
} {
  const trimmedName = payload.name.trim();
  if (!trimmedName) {
    return { success: false, error: 'Activity name is required.' };
  }

  // Prevent duplicate activity names within the same stage for this crop batch
  const existingInStage = currentCustomActivities.filter(
    (a) => a.cropId === payload.cropId && a.stageKey === payload.stageKey
  );
  const isDuplicate = existingInStage.some(
    (a) => a.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (isDuplicate) {
    return {
      success: false,
      error: `An activity named "${trimmedName}" already exists for this stage.`,
    };
  }

  const newActivity: CustomStageActivity = {
    id: `cust-act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    cropId: payload.cropId,
    batchId: payload.batchId,
    stageKey: payload.stageKey,
    name: trimmedName,
    description: payload.description?.trim(),
    date: payload.date,
    notes: payload.notes?.trim(),
    createdAt: new Date().toISOString(),
    isCustom: true,
  };

  currentCustomActivities = [...currentCustomActivities, newActivity];
  persistToStorage();
  notify();
  return { success: true, activity: newActivity };
}

export function getCustomActivitiesForCropStage(
  cropId: string,
  stageKey: FarmingStageKeyType
): CustomStageActivity[] {
  return currentCustomActivities.filter(
    (a) => a.cropId === cropId && a.stageKey === stageKey
  );
}

export interface SetActivityApplicabilityPayload {
  cropId: string;
  batchId?: string;
  stageKey: FarmingStageKeyType;
  activityId: string;
  isNotApplicable: boolean;
  reason: string;
  additionalNotes?: string;
}

export function setActivityApplicability(
  payload: SetActivityApplicabilityPayload
): ActivityApplicabilityRecord {
  const existingIdx = currentActivityApplicabilities.findIndex(
    (a) =>
      a.cropId === payload.cropId &&
      a.stageKey === payload.stageKey &&
      a.activityId === payload.activityId
  );

  const updatedRecord: ActivityApplicabilityRecord = {
    id:
      existingIdx >= 0
        ? currentActivityApplicabilities[existingIdx].id
        : `act-app-${Date.now()}`,
    cropId: payload.cropId,
    batchId: payload.batchId,
    stageKey: payload.stageKey,
    activityId: payload.activityId,
    isNotApplicable: payload.isNotApplicable,
    reason: payload.reason.trim(),
    additionalNotes: payload.additionalNotes?.trim(),
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    currentActivityApplicabilities = [
      ...currentActivityApplicabilities.slice(0, existingIdx),
      updatedRecord,
      ...currentActivityApplicabilities.slice(existingIdx + 1),
    ];
  } else {
    currentActivityApplicabilities = [...currentActivityApplicabilities, updatedRecord];
  }

  persistToStorage();
  notify();
  return updatedRecord;
}

export function getActivityApplicability(
  cropId: string,
  stageKey: FarmingStageKeyType,
  activityId: string
): ActivityApplicabilityRecord | undefined {
  return currentActivityApplicabilities.find(
    (a) =>
      a.cropId === cropId &&
      a.stageKey === stageKey &&
      a.activityId === activityId
  );
}

export interface SetStageApplicabilityPayload {
  cropId: string;
  batchId?: string;
  stageKey: FarmingStageKeyType;
  stageNumber: number;
  isNotApplicable: boolean;
  reason: string;
}

export function setStageApplicability(
  payload: SetStageApplicabilityPayload
): StageApplicabilityRecord {
  const existingIdx = currentStageApplicabilities.findIndex(
    (s) =>
      s.cropId === payload.cropId &&
      s.stageKey === payload.stageKey
  );

  const updatedRecord: StageApplicabilityRecord = {
    id:
      existingIdx >= 0
        ? currentStageApplicabilities[existingIdx].id
        : `stg-app-${Date.now()}`,
    cropId: payload.cropId,
    batchId: payload.batchId,
    stageKey: payload.stageKey,
    stageNumber: payload.stageNumber,
    isNotApplicable: payload.isNotApplicable,
    reason: payload.reason.trim(),
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    currentStageApplicabilities = [
      ...currentStageApplicabilities.slice(0, existingIdx),
      updatedRecord,
      ...currentStageApplicabilities.slice(existingIdx + 1),
    ];
  } else {
    currentStageApplicabilities = [...currentStageApplicabilities, updatedRecord];
  }

  // Also synchronize stage applicability on currentFields
  currentFields = currentFields.map((f) => {
    if (f.id !== payload.cropId) return f;
    const stages = [...f.stages];
    const targetIdx = payload.stageNumber - 1;
    if (stages[targetIdx]) {
      stages[targetIdx] = {
        ...stages[targetIdx],
        isNotApplicable: payload.isNotApplicable,
        notApplicableReason: payload.reason.trim(),
      };
    }
    return { ...f, stages };
  });

  persistToStorage();
  notify();
  return updatedRecord;
}

export function getStageApplicability(
  cropId: string,
  stageKeyOrNumber: FarmingStageKeyType | number
): StageApplicabilityRecord | undefined {
  return currentStageApplicabilities.find((s) => {
    if (s.cropId !== cropId) return false;
    if (typeof stageKeyOrNumber === 'number') {
      return s.stageNumber === stageKeyOrNumber;
    }
    return s.stageKey === stageKeyOrNumber;
  });
}

export function useCropsStore() {
  const [fields, setFields] = useState<FieldItem[]>(currentFields);
  const [records, setRecords] = useState<RecentRecordItem[]>(currentRecords);
  const [customActivities, setCustomActivities] = useState<CustomStageActivity[]>(currentCustomActivities);
  const [activityApplicabilities, setActivityApplicabilities] = useState<ActivityApplicabilityRecord[]>(currentActivityApplicabilities);
  const [stageApplicabilities, setStageApplicabilities] = useState<StageApplicabilityRecord[]>(currentStageApplicabilities);

  useEffect(() => {
    loadFromStorage();
    const handleUpdate = () => {
      setFields([...currentFields]);
      setRecords([...currentRecords]);
      setCustomActivities([...currentCustomActivities]);
      setActivityApplicabilities([...currentActivityApplicabilities]);
      setStageApplicabilities([...currentStageApplicabilities]);
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const getFieldById = (id: string): FieldItem | undefined => {
    return fields.find((f) => f.id === id) || fields[0];
  };

  const getRecordsByStage = (cropId?: string, stageNameOrKey?: string | number) => {
    return getRecordsForStage(cropId, stageNameOrKey);
  };

  const getRecordsForActivity = (cropId?: string, activityId?: string, batchId?: string) => {
    return getActivityRecords(cropId, activityId, batchId);
  };

  return {
    fields,
    records,
    customActivities,
    activityApplicabilities,
    stageApplicabilities,
    getFieldById,
    getRecordsByStage,
    getRecordsForActivity,
    updateFieldPhoto,
    updateFieldStage,
    addRecordToCrop,
    saveActivityNotes,
    addCorrectionToRecord,
    addCustomActivity,
    getCustomActivitiesForCropStage,
    setActivityApplicability,
    getActivityApplicability,
    setStageApplicability,
    getStageApplicability,
  };
}
