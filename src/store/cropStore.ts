import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockFields, mockRecentRecords } from '../constants/farmerMockData';
import { FieldItem, RecentRecordItem } from '../types/farmer.types';
import { stageIndex, stageLabel } from '../utils/stageHelpers';

// Storage keys for persistent local storage across refreshes and restarts
const STORAGE_KEY_RECORDS = '@traceroot_records_v1';
const STORAGE_KEY_FIELDS = '@traceroot_fields_v1';

// In-memory reactive state holding fields & records across all screens
let currentFields: FieldItem[] = [...mockFields];
let currentRecords: RecentRecordItem[] = [...mockRecentRecords];

type StoreListener = () => void;
const listeners = new Set<StoreListener>();

function notify() {
  listeners.forEach((listener) => listener());
}

async function persistToStorage() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(currentRecords));
    await AsyncStorage.setItem(STORAGE_KEY_FIELDS, JSON.stringify(currentFields));
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
        currentFields = savedF;
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

  const newRecord: RecentRecordItem = {
    id: `rec-act-${Date.now()}`,
    recordCode,
    title: payload.activityName,
    stage: targetStage,
    activityId: payload.activityId,
    date: dateFormatted,
    time: timeFormatted,
    location: targetField?.name || 'Kandy Farm',
    photoEvidenceAttached: !!payload.photoUri,
    photoUrl: payload.photoUri,
    isLocked: true,
    isOriginal: true,
    cropId: payload.cropId,
    batchId: payload.batchId || targetField?.batchId || 'BATCH-2026-09',
    isCompact: false,
    notes: payload.notes.trim(),
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

export function useCropsStore() {
  const [fields, setFields] = useState<FieldItem[]>(currentFields);
  const [records, setRecords] = useState<RecentRecordItem[]>(currentRecords);

  useEffect(() => {
    loadFromStorage();
    const handleUpdate = () => {
      setFields([...currentFields]);
      setRecords([...currentRecords]);
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
    getFieldById,
    getRecordsByStage,
    getRecordsForActivity,
    updateFieldPhoto,
    updateFieldStage,
    addRecordToCrop,
    saveActivityNotes,
    addCorrectionToRecord,
  };
}
