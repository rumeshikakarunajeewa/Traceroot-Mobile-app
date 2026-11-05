import {
  FARMING_STAGES,
  FARMING_STAGE_LABELS,
  FarmingStageKey,
  FarmingStageDefinition,
} from '../constants/stages';

/**
 * Returns 1-based stage index (1..5) from a stage key or label.
 */
export function stageIndex(stageKeyOrLabel: string): number {
  const normalized = stageKeyOrLabel.toLowerCase().trim();
  const found = FARMING_STAGES.find(
    (s) =>
      s.key === normalized ||
      s.title.toLowerCase() === normalized ||
      (normalized === 'seedling' && s.key === FarmingStageKey.PLANTING) ||
      ((normalized === 'fruiting' || normalized === 'fruit development') &&
        s.key === FarmingStageKey.CROP_MATURITY) ||
      ((normalized === 'harvest' || normalized === 'harvested') &&
        s.key === FarmingStageKey.HARVESTING)
  );
  return found ? found.stageNumber : 1;
}

/**
 * Returns stage color by key or label.
 */
export function stageColor(stageKeyOrLabel: string): string {
  const idx = stageIndex(stageKeyOrLabel);
  return FARMING_STAGES[idx - 1]?.color ?? '#74C69D';
}

/**
 * Returns stage icon name by key or label.
 */
export function stageIcon(stageKeyOrLabel: string): string {
  const idx = stageIndex(stageKeyOrLabel);
  return FARMING_STAGES[idx - 1]?.iconName ?? 'leaf';
}

/**
 * Returns stage emoji by key or label.
 */
export function stageEmoji(stageKeyOrLabel: string): string {
  const idx = stageIndex(stageKeyOrLabel);
  return FARMING_STAGES[idx - 1]?.stageEmoji ?? '🌱';
}

/**
 * Returns the canonical display label (e.g. "Vegetative Growth", "Crop Maturity").
 */
export function stageLabel(stageNumberOrKey: number | string): string {
  if (typeof stageNumberOrKey === 'number') {
    const idx = Math.min(Math.max(1, stageNumberOrKey), FARMING_STAGE_LABELS.length);
    return FARMING_STAGE_LABELS[idx - 1];
  }
  const idx = stageIndex(stageNumberOrKey);
  return FARMING_STAGE_LABELS[idx - 1];
}

/**
 * Returns the full stage definition by 1-based stage number (1..5).
 */
export function getStageByNumber(stageNumber: number): FarmingStageDefinition {
  const clamped = Math.min(Math.max(1, stageNumber), FARMING_STAGES.length);
  return FARMING_STAGES[clamped - 1];
}
