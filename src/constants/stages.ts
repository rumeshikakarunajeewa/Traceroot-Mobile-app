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
    stageEmoji: '🍅',
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
      id: 'act-m-1',
      name: 'Crop development observations',
      matchKeywords: ['crop dev', 'fruit', 'matur', 'sizing', 'observation', 'color'],
    },
    {
      id: 'act-m-2',
      name: 'Watering recorded',
      matchKeywords: ['water', 'irrigation', 'moisture'],
    },
    {
      id: 'act-m-3',
      name: 'Fertilizer application',
      matchKeywords: ['fertiliz', 'potash', 'nutrient', 'feed'],
    },
    {
      id: 'act-m-4',
      name: 'Maturity assessment',
      matchKeywords: ['brix', 'ripen', 'firmness', 'color', 'assess', 'maturity'],
    },
    {
      id: 'act-m-5',
      name: 'Pest and disease management',
      matchKeywords: ['pest', 'spray', 'netting', 'protection', 'disease'],
    },
  ],
  harvesting: [
    {
      id: 'act-h-1',
      name: 'Harvest collection',
      matchKeywords: ['harvest', 'picking', 'collection', 'yield'],
    },
    {
      id: 'act-h-2',
      name: 'Quantity measurement',
      matchKeywords: ['weight', 'quantity', 'kg', 'yield measurement'],
    },
    {
      id: 'act-h-3',
      name: 'Quality grading',
      matchKeywords: ['grading', 'quality', 'grade a', 'inspection'],
    },
    {
      id: 'act-h-4',
      name: 'Sorting and packaging',
      matchKeywords: ['sort', 'pack', 'crate', 'box', 'packaging'],
    },
    {
      id: 'act-h-5',
      name: 'Storage records',
      matchKeywords: ['stor', 'cold', 'warehouse', 'temperature'],
    },
  ],
};
