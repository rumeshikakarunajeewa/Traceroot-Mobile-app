import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStages } from '../constants/farmerMockData';
import {
  FieldItem,
  RecentRecordItem,
  CustomStageActivity,
  ActivityApplicabilityRecord,
  StageApplicabilityRecord,
  JourneyStage,
} from '../types/farmer.types';
import { FarmingStageKey, FarmingStageKeyType } from '../constants/stages';
import { stageIndex, stageLabel } from '../utils/stageHelpers';
import { supabase } from '../lib/supabase';
import { uploadHarvestImage, uploadCultivationPhoto } from '../services/storage.service';
import { refreshFarmerProfile } from './farmerProfileStore';
import { generateRecordIntegrityHash } from '../utils/crypto';

// Storage keys for persistent local storage across refreshes and restarts
const STORAGE_KEY_RECORDS = '@traceroot_records_v1';
const STORAGE_KEY_FIELDS = '@traceroot_fields_v1';
const STORAGE_KEY_CUSTOM_ACTIVITIES = '@traceroot_custom_activities_v1';
const STORAGE_KEY_ACTIVITY_APPLICABILITY = '@traceroot_activity_applicabilities_v1';
const STORAGE_KEY_STAGE_APPLICABILITY = '@traceroot_stage_applicabilities_v1';

// In-memory reactive state holding fields & records across all screens
let currentFields: FieldItem[] = [];
let currentRecords: RecentRecordItem[] = [];
let currentCustomActivities: CustomStageActivity[] = [];
let currentActivityApplicabilities: ActivityApplicabilityRecord[] = [];
let currentStageApplicabilities: StageApplicabilityRecord[] = [];
let isSyncingHarvests = false;
let isSyncingRecords = false;
let isSyncingMetadata = false;

type StoreListener = () => void;
const listeners = new Set<StoreListener>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function stageToDbKey(stageNameOrNumber: string | number): FarmingStageKeyType {
  const idx = typeof stageNameOrNumber === 'number' ? stageNameOrNumber : stageIndex(stageNameOrNumber);
  const keys: FarmingStageKeyType[] = [
    'planting',
    'vegetative_growth',
    'flowering',
    'crop_maturity',
    'harvesting',
  ];
  return keys[Math.max(0, Math.min(4, idx - 1))];
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
      if (Array.isArray(saved)) {
        // Exclude legacy mock records
        currentRecords = saved.filter(
          (r: RecentRecordItem) =>
            r &&
            !r.id.startsWith('rec-10') &&
            r.cropId !== 'field-tomato' &&
            r.cropId !== 'field-carrot'
        );
        changed = true;
      }
    }
    if (savedFieldsStr) {
      const savedF = JSON.parse(savedFieldsStr);
      if (Array.isArray(savedF)) {
        // Exclude legacy mock fields and keep real crops cached offline
        currentFields = savedF.filter(
          (f: FieldItem) =>
            f &&
            !f.id.startsWith('field-tomato') &&
            !f.id.startsWith('field-carrot') &&
            !f.id.startsWith('field-beans') &&
            !f.id.startsWith('field-potato') &&
            !f.id.startsWith('field-capsicum') &&
            !f.id.startsWith('field-strawberries') &&
            !f.id.startsWith('field-cabbage')
        );
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
    // Attempt to pull user's cloud harvests, records, and stage metadata
    syncFarmerHarvests();
    syncFarmerRecords();
    syncStageAndActivityMetadata();
  } catch (e) {
    console.warn('Failed to load TraceRoot records from AsyncStorage', e);
  }
}

// Initial load attempt
loadFromStorage();

export interface CreateCropPayload {
  cropName: string;
  cropVariety?: string;
  farmingType: 'Greenhouse' | 'Open field';
  cultivationStartDate: string;
  farmFieldName: string;
  expectedHarvestDate?: string;
  areaAcres?: number;
  imageUrl?: string;
}

export function getCropEmoji(cropName: string): string {
  const lower = cropName.toLowerCase().trim();
  if (lower.includes('tomato')) return '🍅';
  if (lower.includes('cucumber')) return '🥒';
  if (lower.includes('chilli') || lower.includes('chili') || lower.includes('pepper')) return '🌶️';
  if (lower.includes('bell pepper') || lower.includes('capsicum')) return '🫑';
  if (lower.includes('carrot')) return '🥕';
  if (lower.includes('corn') || lower.includes('maize')) return '🌽';
  if (lower.includes('potato')) return '🥔';
  if (lower.includes('onion')) return '🧅';
  if (lower.includes('garlic')) return '🧄';
  if (lower.includes('cabbage') || lower.includes('lettuce') || lower.includes('spinach')) return '🥬';
  if (lower.includes('strawberry')) return '🍓';
  if (lower.includes('eggplant') || lower.includes('brinjal') || lower.includes('aubergine')) return '🍆';
  if (lower.includes('pumpkin')) return '🎃';
  if (lower.includes('bean') || lower.includes('pea')) return '🫘';
  if (lower.includes('mushroom')) return '🍄';
  if (lower.includes('broccoli')) return '🥦';
  if (lower.includes('beet')) return '🧅';
  return '🌱';
}

export function generateUniqueBatchId(cropName: string): string {
  const lettersOnly = cropName.replace(/[^a-zA-Z]/g, '');
  const prefix = (lettersOnly.slice(0, 3) || 'CRP').toUpperCase();
  const year = new Date().getFullYear();

  // Find all existing batches for this prefix
  const matchingBatches = currentFields
    .map((f) => f.batchId || '')
    .filter((b) => b.startsWith(`BATCH-${prefix}-${year}`));

  let maxSeq = 0;
  for (const b of matchingBatches) {
    const parts = b.split('-');
    const seqPart = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(seqPart) && seqPart > maxSeq) {
      maxSeq = seqPart;
    }
  }

  let nextSeq = maxSeq + 1;
  let candidate = `BATCH-${prefix}-${year}-${String(nextSeq).padStart(3, '0')}`;
  while (currentFields.some((f) => f.batchId === candidate)) {
    nextSeq += 1;
    candidate = `BATCH-${prefix}-${year}-${String(nextSeq).padStart(3, '0')}`;
  }

  return candidate;
}

export function calculateDaysToHarvest(expectedHarvestDate?: string | null): number {
  if (!expectedHarvestDate) return 45;
  const target = new Date(expectedHarvestDate).getTime();
  if (isNaN(target)) return 45;
  const diff = Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export function parseDateToIso(dateStr?: string | null): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}

export async function createNewCrop(payload: CreateCropPayload): Promise<FieldItem> {
  const { data: { session } } = await supabase.auth.getSession();
  const farmerId = session?.user?.id;
  if (!farmerId) {
    console.warn('[CropStore] User must be logged in to create a crop');
    throw new Error('Authentication required: please log in to register a crop.');
  }

  const emoji = getCropEmoji(payload.cropName);
  const farmingTypeDb = payload.farmingType === 'Greenhouse' ? 'greenhouse' : 'open_field';
  const plantedDate = parseDateToIso(payload.cultivationStartDate);
  const harvestDate = payload.expectedHarvestDate ? parseDateToIso(payload.expectedHarvestDate) : null;
  const plotDesc = payload.farmFieldName.trim() + (payload.cropVariety ? ` · Variety: ${payload.cropVariety.trim()}` : '');

  // 1. Upload cover image to Supabase Storage if local image URI
  let coverImageUrl: string | null = null;
  if (
    payload.imageUrl &&
    (payload.imageUrl.startsWith('file:') ||
     payload.imageUrl.startsWith('content:') ||
     payload.imageUrl.startsWith('ph:') ||
     payload.imageUrl.startsWith('blob:'))
  ) {
    try {
      const uploadRes = await uploadHarvestImage(farmerId, 'cover', payload.imageUrl);
      if (uploadRes.url) {
        coverImageUrl = uploadRes.url;
      }
    } catch (uploadErr) {
      console.warn('[CropStore] Image upload skipped or failed:', uploadErr);
    }
  } else if (payload.imageUrl) {
    coverImageUrl = payload.imageUrl;
  }

  // 2. Insert record into Supabase harvests table
  const { data: newHarvest, error } = await supabase
    .from('harvests')
    .insert({
      farmer_id: farmerId,
      crop_name: payload.cropName.trim(),
      crop_emoji: emoji,
      farming_type: farmingTypeDb,
      planted_date: plantedDate,
      expected_harvest_date: harvestDate,
      status: 'active',
      current_stage: 'planting',
      description: plotDesc,
      cover_image_url: coverImageUrl,
      is_listed: false,
    })
    .select()
    .single();

  if (error || !newHarvest) {
    console.error('[CropStore] Error creating harvest in Supabase:', error?.message);
    throw new Error(error?.message || 'Failed to save crop in database');
  }

  // 3. Build local FieldItem with the real database UUID and stages
  const id = newHarvest.id;
  const batchId = generateUniqueBatchId(payload.cropName);
  const daysToHarvest = calculateDaysToHarvest(harvestDate);
  const stages = createStages(1);

  const newField: FieldItem = {
    id,
    name: payload.farmFieldName.trim(),
    cropName: payload.cropName.trim(),
    cropEmoji: emoji,
    areaAcres: payload.areaAcres || 1.0,
    stageName: 'Planting',
    plotName: `${payload.farmingType} · Planting stage`,
    daysToHarvest,
    growthPercentage: 0,
    statusBadge: 'Growing',
    category: 'Vegetable',
    environmentType: payload.farmingType,
    startDate: plantedDate,
    daysCount: 1,
    currentStageIndex: 1,
    totalStages: 5,
    recordCount: 0,
    evidenceCount: 0,
    isImmutable: true,
    batchId,
    nextStageName: 'Vegetative Growth',
    nextStageEst: 'est. in 2 weeks',
    imageUrl: coverImageUrl || undefined,
    stages,
  };

  // 4. Update memory, save to local storage, and notify subscribers
  currentFields = [newField, ...currentFields.filter((f) => f.id !== id)];
  await persistToStorage();
  notify();

  // 5. Update farmer profile crop counter
  refreshFarmerProfile().catch(() => {});

  return newField;
}

export async function syncFarmerHarvests(): Promise<FieldItem[]> {
  if (isSyncingHarvests) return currentFields;
  isSyncingHarvests = true;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const farmerId = session?.user?.id;
    if (!farmerId) {
      return currentFields;
    }

    const { data, error } = await supabase
      .from('harvests')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[CropStore] Error fetching harvests from Supabase:', error.message);
      return currentFields;
    }

    if (Array.isArray(data)) {
      const mappedFields: FieldItem[] = data.map((h) => {
        const stageIdx = stageIndex(h.current_stage || 'planting');
        const daysToHarvest = calculateDaysToHarvest(h.expected_harvest_date);
        const emoji = h.crop_emoji || getCropEmoji(h.crop_name);
        const envType = h.farming_type === 'greenhouse' ? 'Greenhouse' : 'Open field';

        const plotDesc = h.description || `${h.crop_name} Field`;
        const fieldName = plotDesc.includes('·') ? plotDesc.split('·')[0].trim() : plotDesc;

        const cropRecs = currentRecords.filter((r) => r.cropId === h.id);
        const cropStageApps = currentStageApplicabilities.filter((sa) => sa.cropId === h.id);

        const stages = createStages(stageIdx).map((stg) => {
          const stgRecs = cropRecs.filter(
            (r) => r.stage.toLowerCase() === stg.title.toLowerCase()
          );
          const app = cropStageApps.find(
            (sa) => sa.stageNumber === stg.stageNumber || sa.stageKey === stg.key
          );
          return {
            ...stg,
            recordCount: stgRecs.length,
            isNotApplicable: app ? app.isNotApplicable : false,
            notApplicableReason: app ? app.reason : undefined,
          };
        });

        return {
          id: h.id,
          name: fieldName,
          cropName: h.crop_name,
          cropEmoji: emoji,
          areaAcres: 1.0,
          stageName: stageLabel(stageIdx),
          plotName: `${envType} · ${stageLabel(stageIdx)}`,
          daysToHarvest,
          growthPercentage: Math.min(100, (stageIdx - 1) * 25),
          statusBadge: h.status === 'harvested' ? 'Harvest soon' : 'Growing',
          category: 'Vegetable',
          environmentType: envType,
          startDate: h.planted_date,
          currentStageIndex: stageIdx,
          totalStages: 5,
          recordCount: cropRecs.length,
          evidenceCount: cropRecs.filter((r) => r.photoEvidenceAttached).length,
          isImmutable: true,
          batchId: generateUniqueBatchId(h.crop_name),
          stages,
          imageUrl: h.cover_image_url || undefined,
        };
      });

      currentFields = mappedFields;
      await persistToStorage();
      notify();
    }
  } catch (err) {
    console.warn('[CropStore] Exception in syncFarmerHarvests:', err);
  } finally {
    isSyncingHarvests = false;
  }

  return currentFields;
}

export async function syncFarmerRecords(harvestId?: string): Promise<RecentRecordItem[]> {
  if (isSyncingRecords) return currentRecords;
  isSyncingRecords = true;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const farmerId = session?.user?.id;
    if (!farmerId) return currentRecords;

    let query = supabase
      .from('cultivation_records')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('recorded_at', { ascending: false });

    if (harvestId) {
      query = query.eq('harvest_id', harvestId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[CropStore] Error syncing cultivation records:', error.message);
      return currentRecords;
    }

    if (Array.isArray(data)) {
      const mappedRecords: RecentRecordItem[] = data.map((row) => {
        const recordedDate = new Date(row.recorded_at || Date.now());
        const dateFormatted = new Intl.DateTimeFormat('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }).format(recordedDate);

        const timeFormatted = new Intl.DateTimeFormat('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }).format(recordedDate);

        return {
          id: row.id,
          recordCode: row.trace_id,
          title: row.activity_type || 'Cultivation Activity',
          stage: stageLabel(row.stage || 'planting'),
          date: dateFormatted,
          time: timeFormatted,
          location: row.location_name || 'Field Plot',
          inputs: Array.isArray(row.inputs_used) ? row.inputs_used : undefined,
          photoEvidenceAttached: !!row.photo_url,
          photoUrl: row.photo_url || undefined,
          isLocked: true,
          isOriginal: !row.is_correction,
          isCorrection: !!row.is_correction,
          correctsRecordCode: row.corrects_id,
          cropId: row.harvest_id,
          notes: row.notes || undefined,
          details: row.conditions || undefined,
          createdAt: row.recorded_at,
        };
      });

      currentRecords = mappedRecords;

      // Update crop counts
      currentFields = currentFields.map((f) => {
        const cropRecs = currentRecords.filter((r) => r.cropId === f.id);
        const stages = f.stages.map((stg) => {
          const stgRecs = cropRecs.filter(
            (r) => r.stage.toLowerCase() === stg.title.toLowerCase()
          );
          return {
            ...stg,
            recordCount: stgRecs.length,
          };
        });

        return {
          ...f,
          recordCount: cropRecs.length,
          evidenceCount: cropRecs.filter((r) => r.photoEvidenceAttached).length,
          stages,
        };
      });

      await persistToStorage();
      notify();
    }
  } catch (err) {
    console.warn('[CropStore] Exception in syncFarmerRecords:', err);
  } finally {
    isSyncingRecords = false;
  }

  return currentRecords;
}

export async function syncStageAndActivityMetadata(): Promise<void> {
  if (isSyncingMetadata) return;
  isSyncingMetadata = true;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const farmerId = session?.user?.id;
    if (!farmerId) return;

    // 1. Fetch custom_stage_activities
    const { data: customData, error: custErr } = await supabase
      .from('custom_stage_activities')
      .select('*')
      .eq('farmer_id', farmerId);

    if (!custErr && Array.isArray(customData)) {
      currentCustomActivities = customData.map((c) => ({
        id: c.id,
        cropId: c.harvest_id || '',
        stageKey: c.stage as FarmingStageKeyType,
        name: c.activity_name,
        description: c.category || undefined,
        createdAt: c.created_at,
        isCustom: true,
      }));
    }

    // 2. Fetch activity_applicability
    const { data: actAppData, error: actErr } = await supabase
      .from('activity_applicability')
      .select('*')
      .eq('farmer_id', farmerId);

    if (!actErr && Array.isArray(actAppData)) {
      currentActivityApplicabilities = actAppData.map((a) => ({
        id: a.id,
        cropId: a.harvest_id,
        stageKey: 'planting' as FarmingStageKeyType,
        activityId: a.activity_id,
        isNotApplicable: !a.is_applicable,
        reason: a.reason || '',
        updatedAt: a.updated_at,
      }));
    }

    // 3. Fetch stage_applicability
    const { data: stgAppData, error: stgErr } = await supabase
      .from('stage_applicability')
      .select('*')
      .eq('farmer_id', farmerId);

    if (!stgErr && Array.isArray(stgAppData)) {
      currentStageApplicabilities = stgAppData.map((s) => ({
        id: s.id,
        cropId: s.harvest_id,
        stageKey: s.stage as FarmingStageKeyType,
        stageNumber: stageIndex(s.stage),
        isNotApplicable: !s.is_applicable,
        reason: s.reason || '',
        updatedAt: s.updated_at,
      }));

      // Update currentFields stages applicability
      currentFields = currentFields.map((f) => {
        const cropStageApps = currentStageApplicabilities.filter((sa) => sa.cropId === f.id);
        const stages = f.stages.map((stg) => {
          const app = cropStageApps.find(
            (sa) => sa.stageNumber === stg.stageNumber || sa.stageKey === stg.key
          );
          if (app) {
            return {
              ...stg,
              isNotApplicable: app.isNotApplicable,
              notApplicableReason: app.reason,
            };
          }
          return stg;
        });
        return { ...f, stages };
      });
    }

    await persistToStorage();
    notify();
  } catch (err) {
    console.warn('[CropStore] Exception in syncStageAndActivityMetadata:', err);
  } finally {
    isSyncingMetadata = false;
  }
}

export function updateFieldPhoto(fieldId: string, newPhotoUri?: string) {
  currentFields = currentFields.map((field) =>
    field.id === fieldId ? { ...field, imageUrl: newPhotoUri } : field
  );
  persistToStorage();
  notify();

  if (newPhotoUri) {
    (async () => {
      try {
        const { error } = await supabase
          .from('harvests')
          .update({ cover_image_url: newPhotoUri })
          .eq('id', fieldId);
        if (error) console.warn('[CropStore] Error updating crop photo in Supabase:', error.message);
      } catch (err) {
        console.warn('[CropStore] Exception updating crop photo:', err);
      }
    })();
  }
}

export function updateFieldStage(fieldId: string, stageNumber: number) {
  const STAGE_KEYS = ['planting', 'vegetative_growth', 'flowering', 'crop_maturity', 'harvesting'];
  const stageKey = STAGE_KEYS[Math.max(0, Math.min(4, stageNumber - 1))];

  currentFields = currentFields.map((field) =>
    field.id === fieldId
      ? {
          ...field,
          currentStageIndex: stageNumber,
          stageName: stageLabel(stageNumber),
          stages: createStages(stageNumber),
          growthPercentage: Math.min(100, (stageNumber - 1) * 25),
        }
      : field
  );
  persistToStorage();
  notify();

  (async () => {
    try {
      const { error } = await supabase
        .from('harvests')
        .update({ current_stage: stageKey })
        .eq('id', fieldId);
      if (error) console.warn('[CropStore] Error updating crop stage in Supabase:', error.message);
    } catch (err) {
      console.warn('[CropStore] Exception updating crop stage:', err);
    }
  })();
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
  latitude?: number | null;
  longitude?: number | null;
  isCorrection?: boolean;
  correctsId?: string;
}

function recomputeFieldCounts() {
  currentFields = currentFields.map((f) => {
    const cropRecs = currentRecords.filter((r) => r.cropId === f.id);
    const cropStageApps = currentStageApplicabilities.filter((sa) => sa.cropId === f.id);
    const stages = f.stages.map((stg) => {
      const stgRecs = cropRecs.filter(
        (r) => r.stage.toLowerCase() === stg.title.toLowerCase()
      );
      const app = cropStageApps.find(
        (sa) => sa.stageNumber === stg.stageNumber || sa.stageKey === stg.key
      );
      return {
        ...stg,
        recordCount: stgRecs.length,
        isNotApplicable: app ? app.isNotApplicable : stg.isNotApplicable,
        notApplicableReason: app ? app.reason : stg.notApplicableReason,
      };
    });

    return {
      ...f,
      recordCount: cropRecs.length,
      evidenceCount: cropRecs.filter((r) => r.photoEvidenceAttached).length,
      stages,
    };
  });
}

export async function saveActivityNotes(payload: SaveActivityNotesPayload): Promise<RecentRecordItem> {
  const targetField = currentFields.find((f) => f.id === payload.cropId);
  const targetStage = payload.stage || 'Planting';
  const stageKey: FarmingStageKeyType = stageToDbKey(targetStage);

  const now = new Date();
  const recordedAtIso = now.toISOString();
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

  const { data: { session } } = await supabase.auth.getSession();
  const farmerId = session?.user?.id;

  // 1. Upload photo to cultivation-photos private bucket if local photo provided
  let uploadedPhotoUrl: string | undefined = undefined;
  if (
    payload.photoUri &&
    farmerId &&
    (payload.photoUri.startsWith('file:') ||
     payload.photoUri.startsWith('content:') ||
     payload.photoUri.startsWith('ph:') ||
     payload.photoUri.startsWith('blob:'))
  ) {
    try {
      const uploadRes = await uploadCultivationPhoto(farmerId, payload.cropId, payload.photoUri);
      if (uploadRes.url) {
        uploadedPhotoUrl = uploadRes.url;
      }
    } catch (photoErr) {
      console.warn('[CropStore] Error uploading cultivation photo:', photoErr);
      uploadedPhotoUrl = payload.photoUri;
    }
  } else if (payload.photoUri) {
    uploadedPhotoUrl = payload.photoUri;
  }

  // 2. Compute canonical SHA-256 integrity hash
  const integrityHash = generateRecordIntegrityHash({
    harvestId: payload.cropId,
    farmerId: farmerId || 'offline-farmer',
    stage: stageKey,
    activityType: payload.activityName,
    timestamp: recordedAtIso,
    inputs: payload.inputs,
    conditions: payload.details,
    notes: payload.notes,
    latitude: payload.latitude,
    longitude: payload.longitude,
    photoUrl: uploadedPhotoUrl,
    isCorrection: payload.isCorrection,
    correctsId: payload.correctsId,
  });

  // 3. Insert record into Supabase cultivation_records table
  let insertedRecord: any = null;
  if (farmerId) {
    try {
      const { data, error } = await supabase
        .from('cultivation_records')
        .insert({
          harvest_id: payload.cropId,
          farmer_id: farmerId,
          stage: stageKey,
          activity_type: payload.activityName,
          notes: payload.notes,
          inputs_used: payload.inputs && payload.inputs.length > 0 ? payload.inputs : null,
          conditions: payload.details || null,
          photo_url: uploadedPhotoUrl || null,
          photo_taken_at: recordedAtIso,
          is_live_capture: true,
          location_name: payload.details?.location || targetField?.name || 'Field Plot',
          latitude: payload.latitude !== undefined ? payload.latitude : null,
          longitude: payload.longitude !== undefined ? payload.longitude : null,
          sync_status: 'synced',
          recorded_at: recordedAtIso,
          is_correction: !!payload.isCorrection,
          corrects_id: payload.correctsId || null,
          integrity_hash: integrityHash,
        })
        .select()
        .single();

      if (error) {
        console.warn('[CropStore] Error inserting cultivation record to Supabase:', error.message);
      } else {
        insertedRecord = data;
      }
    } catch (insertErr) {
      console.warn('[CropStore] Exception saving cultivation record to Supabase:', insertErr);
    }
  }

  const recordCode =
    insertedRecord?.trace_id ||
    `TR-${String(50 + currentRecords.length + 1).padStart(4, '0')}`;

  const newRecord: RecentRecordItem = {
    id: insertedRecord?.id || `rec-${Date.now()}`,
    recordCode,
    title: payload.activityName,
    stage: stageLabel(stageKey),
    date: dateFormatted,
    time: timeFormatted,
    location: payload.details?.location || targetField?.name || 'Field Plot',
    inputs: payload.inputs && payload.inputs.length > 0 ? payload.inputs : undefined,
    photoEvidenceAttached: !!(uploadedPhotoUrl || payload.photoUri),
    photoUrl: uploadedPhotoUrl || payload.photoUri,
    isLocked: true,
    isOriginal: !payload.isCorrection,
    isCorrection: !!payload.isCorrection,
    correctsRecordCode: payload.correctsId,
    cropId: payload.cropId,
    batchId: payload.batchId || targetField?.batchId || 'BATCH-2026-09',
    activityId: payload.activityId,
    notes: payload.notes.trim(),
    details: payload.details,
    createdAt: recordedAtIso,
  };

  currentRecords = [newRecord, ...currentRecords.filter((r) => r.id !== newRecord.id)];
  recomputeFieldCounts();
  await persistToStorage();
  notify();

  return newRecord;
}

export async function addRecordToCrop(fieldId: string, payload: NewRecordPayload): Promise<RecentRecordItem> {
  const targetField = currentFields.find((f) => f.id === fieldId);
  return await saveActivityNotes({
    cropId: fieldId,
    batchId: targetField?.batchId,
    stage: payload.stage,
    activityId: payload.recordType.toLowerCase().replace(/\s+/g, '-'),
    activityName: payload.recordType,
    notes: payload.notes || `Logged ${payload.recordType}`,
    photoUri: payload.photoUri,
    inputs: payload.inputs,
    details: payload.details || (payload.location ? { location: payload.location } : undefined),
  });
}

export async function addCorrectionToRecord(
  originalRecordCode: string,
  payload: CorrectionPayload
): Promise<RecentRecordItem | null> {
  const original = currentRecords.find(
    (r) => r.recordCode === originalRecordCode || r.id === originalRecordCode
  );
  if (!original) return null;

  return await saveActivityNotes({
    cropId: original.cropId || '',
    batchId: original.batchId,
    stage: original.stage,
    activityId: original.activityId || 'correction',
    activityName: `Correction: ${original.title}`,
    notes: `${payload.reason}${payload.correctedNotes ? ' · ' + payload.correctedNotes : ''}`,
    photoUri: payload.photoUri || original.photoUrl,
    inputs: payload.correctedInputs || original.inputs,
    isCorrection: true,
    correctsId: original.id,
  });
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

  const activityId = `cust-act-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const nowIso = new Date().toISOString();

  const newActivity: CustomStageActivity = {
    id: activityId,
    cropId: payload.cropId,
    batchId: payload.batchId,
    stageKey: payload.stageKey,
    name: trimmedName,
    description: payload.description?.trim(),
    date: payload.date,
    notes: payload.notes?.trim(),
    createdAt: nowIso,
    isCustom: true,
  };

  currentCustomActivities = [...currentCustomActivities, newActivity];
  persistToStorage();
  notify();

  // Asynchronously persist to Supabase
  (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const farmerId = session?.user?.id;
      if (farmerId) {
        const { error } = await supabase.from('custom_stage_activities').insert({
          id: activityId,
          farmer_id: farmerId,
          harvest_id: payload.cropId || null,
          stage: payload.stageKey,
          activity_name: trimmedName,
          category: payload.description?.trim() || 'Custom Task',
          icon_name: 'sprout',
        });
        if (error) {
          console.warn('[CropStore] Error saving custom activity to Supabase:', error.message);
        }
      }
    } catch (e) {
      console.warn('[CropStore] Exception saving custom activity:', e);
    }
  })();

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

  // Asynchronously upsert to Supabase
  (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const farmerId = session?.user?.id;
      if (farmerId && payload.cropId) {
        const { error } = await supabase
          .from('activity_applicability')
          .upsert(
            {
              farmer_id: farmerId,
              harvest_id: payload.cropId,
              activity_id: payload.activityId,
              is_applicable: !payload.isNotApplicable,
              reason: payload.reason.trim() || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'harvest_id,activity_id' }
          );
        if (error) {
          console.warn('[CropStore] Error upserting activity applicability to Supabase:', error.message);
        }
      }
    } catch (e) {
      console.warn('[CropStore] Exception saving activity applicability:', e);
    }
  })();

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

  // Asynchronously upsert to Supabase
  (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const farmerId = session?.user?.id;
      if (farmerId && payload.cropId) {
        const { error } = await supabase
          .from('stage_applicability')
          .upsert(
            {
              farmer_id: farmerId,
              harvest_id: payload.cropId,
              stage: payload.stageKey,
              is_applicable: !payload.isNotApplicable,
              reason: payload.reason.trim() || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'harvest_id,stage' }
          );
        if (error) {
          console.warn('[CropStore] Error upserting stage applicability to Supabase:', error.message);
        }
      }
    } catch (e) {
      console.warn('[CropStore] Exception saving stage applicability:', e);
    }
  })();

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
    syncFarmerHarvests();
    syncFarmerRecords();
    syncStageAndActivityMetadata();
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
    createNewCrop,
    addCrop: createNewCrop,
    syncFarmerHarvests,
    syncCrops: syncFarmerHarvests,
    syncFarmerRecords,
    syncRecords: syncFarmerRecords,
    syncStageAndActivityMetadata,
  };
}
