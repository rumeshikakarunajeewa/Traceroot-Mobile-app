/**
 * Canonical Crop Farming Journey Stages for TraceRoot
 *
 * Exactly 5 stages in sequential order:
 * 1. Planting
 * 2. Vegetative Growth
 * 3. Flowering
 * 4. Crop Maturity
 * 5. Harvesting
 */

export enum FarmingStageKey {
  PLANTING = 'planting',
  VEGETATIVE_GROWTH = 'vegetative_growth',
  FLOWERING = 'flowering',
  CROP_MATURITY = 'crop_maturity',
  HARVESTING = 'harvesting',
}

export type FarmingStageKeyType =
  | 'planting'
  | 'vegetative_growth'
  | 'flowering'
  | 'crop_maturity'
  | 'harvesting';

export interface FarmingStageDefinition {
  stageNumber: number;
  key: FarmingStageKeyType;
  title: string;
  shortLabel: string;
  subtitle: string;
  stageEmoji: string;
  iconName: string;
  color: string;
  defaultTags: string[];
}

export const FARMING_STAGE_LABELS = [
  'Planting',
  'Vegetative Growth',
  'Flowering',
  'Crop Maturity',
  'Harvesting',
] as const;

export const FARMING_STAGE_SHORT_LABELS = [
  'Planting',
  'Veg. Growth',
  'Flowering',
  'Crop Maturity',
  'Harvest',
] as const;

export const FARMING_STAGES: readonly FarmingStageDefinition[] = [
  {
    stageNumber: 1,
    key: FarmingStageKey.PLANTING,
    title: 'Planting',
    shortLabel: 'Planting',
    subtitle: 'Nursery seedling establishment, sowing and soil prep',
    stageEmoji: '🌱',
    iconName: 'seedling',
    color: '#74C69D',
    defaultTags: ['Planting'],
  },
  {
    stageNumber: 2,
    key: FarmingStageKey.VEGETATIVE_GROWTH,
    title: 'Vegetative Growth',
    shortLabel: 'Veg. Growth',
    subtitle: 'Trellising, canopy growth and nutrient delivery',
    stageEmoji: '🌿',
    iconName: 'water',
    color: '#74C69D',
    defaultTags: ['Fertilizer', 'Watering'],
  },
  {
    stageNumber: 3,
    key: FarmingStageKey.FLOWERING,
    title: 'Flowering',
    shortLabel: 'Flowering',
    subtitle: 'Blossom set, pollination and early bloom care',
    stageEmoji: '🌸',
    iconName: 'flower',
    color: '#E76F51',
    defaultTags: ['Observation', 'Fertilizer'],
  },
  {
    stageNumber: 4,
    key: FarmingStageKey.CROP_MATURITY,
    title: 'Crop Maturity',
    shortLabel: 'Crop Maturity',
    subtitle: 'Fruit sizing, ripening and cluster protection',
    stageEmoji: '🌾',
    iconName: 'fruit',
    color: '#74C69D',
    defaultTags: ['Monitoring', 'Protection'],
  },
  {
    stageNumber: 5,
    key: FarmingStageKey.HARVESTING,
    title: 'Harvesting',
    shortLabel: 'Harvest',
    subtitle: 'Final picking, sorting and batch packaging',
    stageEmoji: '🌾',
    iconName: 'basket',
    color: '#74C69D',
    defaultTags: ['Harvesting'],
  },
] as const;

export const TOTAL_FARMING_STAGES = FARMING_STAGES.length; // 5

export interface StageActivityTemplate {
  id: string;
  name: string;
  matchKeywords: string[];
}

export const STAGE_ACTIVITIES: Record<FarmingStageKeyType, StageActivityTemplate[]> = {
  planting: [
    {
      id: 'act-p-crop-details',
      name: 'Crop Details',
      matchKeywords: ['crop details', 'crop detail', 'variety', 'crop info', 'cultivar'],
    },
    {
      id: 'act-p-land-soil',
      name: 'Land & Soil Preparation',
      matchKeywords: ['land & soil preparation', 'land preparation', 'soil prep', 'tillage', 'bed prep', 'soil'],
    },
    {
      id: 'act-p-seed-source',
      name: 'Seed / Seedling Source',
      matchKeywords: ['seed / seedling source', 'seed source', 'seedling source', 'seedling planting', 'nursery', 'seed lot'],
    },
    {
      id: 'act-p-planting-details',
      name: 'Planting Details',
      matchKeywords: ['planting details', 'planting detail', 'spacing', 'planting depth', 'bed layout', 'density'],
    },
    {
      id: 'act-p-compost-fertilizer',
      name: 'Compost & Fertilizer',
      matchKeywords: ['compost & fertilizer', 'compost', 'fertilizer', 'basal fertilizer', 'organic manure'],
    },
    {
      id: 'act-p-initial-watering',
      name: 'Initial Watering',
      matchKeywords: ['initial watering', 'first watering', 'initial irrigation', 'watering'],
    },
  ],
  vegetative_growth: [
    {
      id: 'act-vg-watering',
      name: 'Watering & Irrigation',
      matchKeywords: ['watering & irrigation', 'watering', 'irrigation', 'water', 'drip'],
    },
    {
      id: 'act-vg-fertilizer',
      name: 'Organic Fertilizer Application',
      matchKeywords: ['organic fertilizer application', 'fertilizer applied', 'fertilizer', 'organic fertilizer', 'compost', 'npk', 'nutrient'],
    },
    {
      id: 'act-vg-weeding',
      name: 'Weeding & Soil Care',
      matchKeywords: ['weeding & soil care', 'weeding & pruning', 'weeding', 'soil care', 'pruning', 'trellis', 'mulch'],
    },
    {
      id: 'act-vg-pest',
      name: 'Pest & Disease Monitoring',
      matchKeywords: ['pest & disease monitoring', 'pest and disease management', 'pest', 'disease', 'monitoring', 'insect', 'spray'],
    },
    {
      id: 'act-vg-growth',
      name: 'Plant Growth Observation',
      matchKeywords: ['plant growth observation', 'growth observation', 'plant growth', 'growth', 'observation', 'canopy', 'height'],
    },
    {
      id: 'act-vg-env',
      name: 'Environmental Monitoring',
      matchKeywords: ['environmental monitoring', 'environment', 'temperature', 'humidity', 'soil moisture', 'climate'],
    },
  ],
  flowering: [
    {
      id: 'flowering_observation',
      name: 'Flowering Observation',
      matchKeywords: ['flowering observation', 'flowering progress', 'flower count', 'bloom', 'blossom'],
    },
    {
      id: 'pollination_monitoring',
      name: 'Pollination Monitoring',
      matchKeywords: ['pollination monitoring', 'pollination', 'pollinator', 'bee', 'buzz'],
    },
    {
      id: 'flowering_irrigation',
      name: 'Watering & Irrigation',
      matchKeywords: ['watering & irrigation', 'flowering irrigation', 'watering', 'irrigation', 'water'],
    },
    {
      id: 'flowering_fertilizer',
      name: 'Organic Fertilizer Application',
      matchKeywords: ['organic fertilizer application', 'fertilizer', 'bloom booster', 'npk', 'organic input'],
    },
    {
      id: 'flowering_pest_management',
      name: 'Pest & Disease Management',
      matchKeywords: ['pest & disease management', 'pest', 'disease', 'blossom blight', 'thrips'],
    },
    {
      id: 'flower_health_monitoring',
      name: 'Flower Health Monitoring',
      matchKeywords: ['flower health monitoring', 'flower health', 'flower damage', 'flower dropping', 'blossom drop'],
    },
  ],
  crop_maturity: [
    {
      id: 'crop_growth_development',
      name: 'Crop Growth & Development',
      matchKeywords: ['crop growth & development', 'crop growth', 'development', 'fruit sizing', 'growth condition'],
    },
    {
      id: 'ripeness_maturity_monitoring',
      name: 'Ripeness & Maturity Monitoring',
      matchKeywords: ['ripeness & maturity monitoring', 'ripeness', 'maturity', 'ripening', 'color change'],
    },
    {
      id: 'maturity_irrigation',
      name: 'Watering & Irrigation',
      matchKeywords: ['watering & irrigation', 'maturity irrigation', 'watering', 'irrigation', 'water'],
    },
    {
      id: 'maturity_fertilizer',
      name: 'Organic Fertilizer Application',
      matchKeywords: ['organic fertilizer application', 'maturity fertilizer', 'potash', 'fertilizer', 'organic fertilizer'],
    },
    {
      id: 'maturity_pest_management',
      name: 'Pest & Disease Management',
      matchKeywords: ['pest & disease management', 'maturity pest', 'pest', 'disease', 'netting', 'protection'],
    },
    {
      id: 'crop_quality_assessment',
      name: 'Crop Quality Assessment',
      matchKeywords: ['crop quality assessment', 'quality assessment', 'crop quality', 'quality grade', 'defects'],
    },
    {
      id: 'harvest_readiness_assessment',
      name: 'Harvest Readiness Assessment',
      matchKeywords: ['harvest readiness assessment', 'harvest readiness', 'expected harvest', 'readiness'],
    },
  ],
  harvesting: [
    {
      id: 'harvest_details',
      name: 'Harvest Details',
      matchKeywords: ['harvest details', 'harvest collection', 'harvest method', 'picking', 'harvesting'],
    },
    {
      id: 'harvest_quantity',
      name: 'Harvest Quantity',
      matchKeywords: ['harvest quantity', 'quantity measurement', 'total quantity', 'kg', 'yield'],
    },
    {
      id: 'quality_grading',
      name: 'Quality Grading',
      matchKeywords: ['quality grading', 'grading', 'quality grade', 'grade a', 'grade b'],
    },
    {
      id: 'sorting_cleaning',
      name: 'Sorting & Cleaning',
      matchKeywords: ['sorting & cleaning', 'sorting and cleaning', 'sorting', 'cleaning', 'wash', 'sort'],
    },
    {
      id: 'harvest_packaging',
      name: 'Packaging',
      matchKeywords: ['packaging', 'harvest packaging', 'packing', 'crates', 'cartons', 'pack'],
    },
    {
      id: 'storage_conditions',
      name: 'Storage Conditions',
      matchKeywords: ['storage conditions', 'storage records', 'cold room', 'warehouse', 'storage'],
    },
    {
      id: 'batch_identification',
      name: 'Batch Identification',
      matchKeywords: ['batch identification', 'harvest batch', 'batch id', 'traceability', 'qr code'],
    },
  ],
};
