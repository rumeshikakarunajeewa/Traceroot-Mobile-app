import { FarmingStageKeyType } from '../constants/stages';

export type HarvestFarmingType = 'greenhouse' | 'open_field';
export type HarvestStatus = 'active' | 'harvested' | 'sold' | 'contracted';

export interface Harvest {
  id: string;
  farmer_id: string;
  crop_name: string;
  crop_emoji?: string;
  farming_type: HarvestFarmingType;
  planted_date: string;
  expected_harvest_date?: string;
  status: HarvestStatus;
  current_stage: FarmingStageKeyType;
  description?: string;
  cover_image_url?: string;
  is_listed?: boolean;
  created_at?: string;
}

