import { FarmingStageKeyType } from '../constants/stages';

export interface CultivationRecord {
  id: string;
  trace_id: string;
  harvest_id: string;
  farmer_id: string;
  stage: FarmingStageKeyType;
  activity_type: string;
  notes?: string;
  inputs_used?: Record<string, any>;
  conditions?: Record<string, any>;
  photo_url?: string;
  photo_taken_at?: string;
  is_live_capture?: boolean;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  sync_status: 'synced' | 'pending';
  recorded_at: string;
  is_correction?: boolean;
  corrects_id?: string;
  integrity_hash: string;
}

