import { useState, useEffect } from 'react';
import { mockFields } from '../constants/farmerMockData';
import { FieldItem } from '../types/farmer.types';

// In-memory reactive state holding fields & crop images across all screens
let currentFields: FieldItem[] = [...mockFields];
const listeners = new Set<(fields: FieldItem[]) => void>();

function notify() {
  listeners.forEach((listener) => listener([...currentFields]));
}

export function updateFieldPhoto(fieldId: string, newPhotoUri?: string) {
  // Update in-memory shared state
  currentFields = currentFields.map((field) =>
    field.id === fieldId ? { ...field, imageUrl: newPhotoUri } : field
  );
  // TODO: Upload image to Supabase Storage bucket ('crop-photos')
  // TODO: Update 'fields' table in Supabase: UPDATE fields SET image_url = newPhotoUri WHERE id = fieldId
  notify();
}

export function updateFieldStage(fieldId: string, stageNumber: number) {
  currentFields = currentFields.map((field) =>
    field.id === fieldId ? { ...field, currentStageIndex: stageNumber } : field
  );
  // TODO: Update Supabase cultivation_cycles
  notify();
}

export interface NewRecordPayload {
  recordType: string;
  date: string;
  notes?: string;
  photoUri?: string;
}

export function addRecordToCrop(fieldId: string, payload: NewRecordPayload) {
  currentFields = currentFields.map((field) => {
    if (field.id !== fieldId) return field;

    const currentStageIdx = (field.currentStageIndex ?? 3) - 1;
    const updatedStages = [...field.stages];

    if (updatedStages[currentStageIdx]) {
      const activeStage = updatedStages[currentStageIdx];
      const existingTags = activeStage.tags || [];
      const newTag = payload.recordType;
      const updatedTags = existingTags.includes(newTag) ? existingTags : [...existingTags, newTag];

      updatedStages[currentStageIdx] = {
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

  // TODO: Upload payload.photoUri to Supabase Storage bucket ('crop-evidence')
  // TODO: Insert row into Supabase 'cultivation_records' table (crop_id, type, notes, date, photo_url)
  notify();
}

export function useCropsStore() {
  const [fields, setFields] = useState<FieldItem[]>(currentFields);

  useEffect(() => {
    const handleUpdate = (updated: FieldItem[]) => {
      setFields(updated);
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const getFieldById = (id: string): FieldItem | undefined => {
    return fields.find((f) => f.id === id) || fields[0];
  };

  return {
    fields,
    getFieldById,
    updateFieldPhoto,
    updateFieldStage,
    addRecordToCrop,
  };
}
