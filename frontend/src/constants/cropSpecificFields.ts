import { FarmingStageKeyType } from './stages';

export interface CropFieldOption {
  label: string;
  value: string;
}

export interface CropSpecificFieldDefinition {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'percentage';
  unit?: string;
  placeholder?: string;
  options?: CropFieldOption[];
  required?: boolean;
  defaultValue?: string;
}

export interface CropActivityConfig {
  cropNormalized: string;
  stageKey: FarmingStageKeyType;
  activityIdOrKeyword: string;
  fields: CropSpecificFieldDefinition[];
}

/**
 * Registry of crop-specific field configurations for TraceRoot.
 * Exactly implements the 5 crop examples requested in the specification:
 * 1. Tomato – Crop Maturity -> Ripeness & Maturity Monitoring
 * 2. Rice – Crop Maturity -> Ripeness & Maturity Monitoring
 * 3. Carrot – Crop Maturity -> Crop Growth & Development
 * 4. Lettuce – Vegetative Growth -> Plant Growth Observation
 * 5. Banana – Harvesting -> Harvest Quantity
 */
export const CROP_SPECIFIC_CONFIGS: CropActivityConfig[] = [
  // Example 1: Tomato
  // Stage: Crop Maturity | Activity: Ripeness & Maturity Monitoring
  {
    cropNormalized: 'tomato',
    stageKey: 'crop_maturity',
    activityIdOrKeyword: 'ripeness_maturity_monitoring',
    fields: [
      {
        id: 'observationDate',
        label: 'Observation Date',
        type: 'date',
        placeholder: 'e.g., 28 Sep 2026',
        required: true,
      },
      {
        id: 'fruitColor',
        label: 'Fruit Color',
        type: 'select',
        options: [
          { label: 'Deep Red (Full Ripe)', value: 'Deep Red' },
          { label: 'Light Red', value: 'Light Red' },
          { label: 'Pink / Orange', value: 'Pink / Orange' },
          { label: 'Turning / Yellow', value: 'Turning' },
          { label: 'Mature Green', value: 'Green' },
        ],
        required: true,
      },
      {
        id: 'fruitSize',
        label: 'Fruit Size',
        type: 'select',
        options: [
          { label: 'Small (< 60mm)', value: 'Small (< 60mm)' },
          { label: 'Medium (60-70mm)', value: 'Medium (60-70mm)' },
          { label: 'Large (70-80mm)', value: 'Large (70-80mm)' },
          { label: 'Extra Large (> 80mm)', value: 'Extra Large (> 80mm)' },
        ],
        required: true,
      },
      {
        id: 'ripenessLevel',
        label: 'Ripeness Level',
        type: 'select',
        options: [
          { label: 'Green / Mature Green', value: 'Mature Green' },
          { label: 'Breaker (First pink blush)', value: 'Breaker' },
          { label: 'Turning (10-30% pink)', value: 'Turning' },
          { label: 'Pink (30-60% pink/red)', value: 'Pink' },
          { label: 'Light Red (60-90% red)', value: 'Light Red' },
          { label: 'Red / Full Ripe (> 90% red)', value: 'Red' },
        ],
        required: true,
      },
      {
        id: 'maturityPercentage',
        label: 'Estimated Maturity Percentage',
        type: 'percentage',
        unit: '%',
        placeholder: 'e.g. 85',
        required: true,
      },
    ],
  },

  // Example 2: Rice
  // Stage: Crop Maturity | Activity: Ripeness & Maturity Monitoring
  {
    cropNormalized: 'rice',
    stageKey: 'crop_maturity',
    activityIdOrKeyword: 'ripeness_maturity_monitoring',
    fields: [
      {
        id: 'observationDate',
        label: 'Observation Date',
        type: 'date',
        placeholder: 'e.g., 10 Oct 2026',
        required: true,
      },
      {
        id: 'grainMaturity',
        label: 'Grain Maturity',
        type: 'select',
        options: [
          { label: 'Milky Stage', value: 'Milky Stage' },
          { label: 'Dough Stage', value: 'Dough Stage' },
          { label: 'Hard Dough', value: 'Hard Dough' },
          { label: 'Fully Ripe (>85% straw colored)', value: 'Fully Ripe' },
          { label: 'Overripe', value: 'Overripe' },
        ],
        required: true,
      },
      {
        id: 'grainMoisture',
        label: 'Grain Moisture Percentage',
        type: 'percentage',
        unit: '%',
        placeholder: 'e.g., 20',
        required: true,
      },
      {
        id: 'panicleCondition',
        label: 'Panicle Condition',
        type: 'select',
        options: [
          { label: 'Golden Yellow (>85% grain filled)', value: 'Golden Yellow' },
          { label: 'Yellow-Green', value: 'Yellow-Green' },
          { label: 'Erect (Early filling)', value: 'Erect' },
          { label: 'Bending & Heavy (Optimal)', value: 'Bending & Heavy' },
        ],
        required: true,
      },
      {
        id: 'expectedHarvestDate',
        label: 'Expected Harvest Date',
        type: 'date',
        placeholder: 'e.g., 18 Oct 2026',
        required: true,
      },
    ],
  },

  // Example 3: Carrot
  // Stage: Crop Maturity | Activity: Crop Growth & Development
  {
    cropNormalized: 'carrot',
    stageKey: 'crop_maturity',
    activityIdOrKeyword: 'crop_growth_development',
    fields: [
      {
        id: 'observationDate',
        label: 'Observation Date',
        type: 'date',
        placeholder: 'e.g., 20 Sep 2026',
        required: true,
      },
      {
        id: 'rootDiameter',
        label: 'Root Diameter',
        type: 'number',
        unit: 'cm',
        placeholder: 'e.g., 3.2',
        required: true,
      },
      {
        id: 'rootLength',
        label: 'Root Length',
        type: 'number',
        unit: 'cm',
        placeholder: 'e.g., 16.5',
        required: true,
      },
      {
        id: 'rootCondition',
        label: 'Root Development Condition',
        type: 'select',
        options: [
          { label: 'Uniform & Well-formed', value: 'Uniform & Well-formed' },
          { label: 'Slight Tapering', value: 'Slight Tapering' },
          { label: 'Good Crown Development', value: 'Good Crown Development' },
          { label: 'Irregular / Forked', value: 'Irregular / Forked' },
        ],
        required: true,
      },
    ],
  },

  // Example 4: Lettuce
  // Stage: Vegetative Growth | Activity: Plant Growth Observation
  {
    cropNormalized: 'lettuce',
    stageKey: 'vegetative_growth',
    activityIdOrKeyword: 'act-vg-growth',
    fields: [
      {
        id: 'observationDate',
        label: 'Observation Date',
        type: 'date',
        placeholder: 'e.g., 12 Sep 2026',
        required: true,
      },
      {
        id: 'leafSize',
        label: 'Leaf Size',
        type: 'select',
        options: [
          { label: 'Small (< 10cm)', value: 'Small (< 10cm)' },
          { label: 'Medium (10–18cm)', value: 'Medium (10–18cm)' },
          { label: 'Large (> 18cm)', value: 'Large (> 18cm)' },
        ],
        required: true,
      },
      {
        id: 'leafCount',
        label: 'Leaf Count',
        type: 'number',
        unit: 'leaves',
        placeholder: 'e.g., 14',
        required: true,
      },
      {
        id: 'leafColor',
        label: 'Leaf Color',
        type: 'select',
        options: [
          { label: 'Vibrant Crisp Green', value: 'Vibrant Crisp Green' },
          { label: 'Light Green', value: 'Light Green' },
          { label: 'Dark Green', value: 'Dark Green' },
          { label: 'Yellowish Green (Requires Attention)', value: 'Yellowish Green' },
        ],
        required: true,
      },
      {
        id: 'plantHealth',
        label: 'Plant Health',
        type: 'select',
        options: [
          { label: 'Excellent / Vigorous', value: 'Excellent / Vigorous' },
          { label: 'Good', value: 'Good' },
          { label: 'Moderate', value: 'Moderate' },
          { label: 'Mild Chlorosis', value: 'Mild Chlorosis' },
        ],
        required: true,
      },
    ],
  },

  // Example 5: Banana
  // Stage: Harvesting | Activity: Harvest Quantity
  {
    cropNormalized: 'banana',
    stageKey: 'harvesting',
    activityIdOrKeyword: 'harvest_quantity',
    fields: [
      {
        id: 'harvestDate',
        label: 'Harvest Date',
        type: 'date',
        placeholder: 'e.g., 25 Oct 2026',
        required: true,
      },
      {
        id: 'numBunches',
        label: 'Number of Bunches',
        type: 'number',
        unit: 'bunches',
        placeholder: 'e.g., 40',
        required: true,
      },
      {
        id: 'bunchWeight',
        label: 'Bunch Weight',
        type: 'number',
        unit: 'kg/bunch',
        placeholder: 'e.g., 22.5',
        required: true,
      },
      {
        id: 'fruitMaturity',
        label: 'Fruit Maturity',
        type: 'select',
        options: [
          { label: '3/4 Full (Green - Export ready)', value: '3/4 Full (Green)' },
          { label: 'Full Round (Mature Green)', value: 'Full Round (Mature Green)' },
          { label: 'Turning Yellow', value: 'Turning Yellow' },
          { label: 'Ripe (Local market)', value: 'Ripe' },
        ],
        required: true,
      },
      {
        id: 'totalQuantity',
        label: 'Total Harvested Quantity',
        type: 'number',
        unit: 'kg',
        placeholder: 'e.g., 900',
        required: true,
      },
    ],
  },
];

/**
 * Finds matching crop-specific fields for a crop name, stage key, and activity.
 * Returns null if no custom crop configuration is registered, enabling fallback to general fields.
 */
export function getCropSpecificFields(
  cropName: string,
  stageKey: FarmingStageKeyType,
  activityId: string,
  activityName?: string
): CropSpecificFieldDefinition[] | null {
  const normCrop = (cropName || '').toLowerCase().trim();
  const normActId = (activityId || '').toLowerCase().trim();
  const normActName = (activityName || '').toLowerCase().trim();

  const match = CROP_SPECIFIC_CONFIGS.find((config) => {
    const cropMatches = normCrop.includes(config.cropNormalized);
    const stageMatches = config.stageKey === stageKey;
    const actMatches =
      normActId === config.activityIdOrKeyword.toLowerCase() ||
      normActName.includes(config.activityIdOrKeyword.toLowerCase().replace(/_/g, ' '));

    return cropMatches && stageMatches && actMatches;
  });

  return match ? match.fields : null;
}

