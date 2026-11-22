-- Migration 006: Update farming journey stages everywhere
--
-- Maps existing data to the exactly 5 official stages:
-- 1. Planting (planting)
-- 2. Vegetative Growth (vegetative_growth)
-- 3. Flowering (flowering)
-- 4. Crop Maturity (crop_maturity)
-- 5. Harvesting (harvesting)

-- Step 1: Drop existing check constraints
ALTER TABLE IF EXISTS harvests
  DROP CONSTRAINT IF EXISTS harvests_current_stage_check;

ALTER TABLE IF EXISTS cultivation_records
  DROP CONSTRAINT IF EXISTS cultivation_records_stage_check;

-- Step 2: Update existing rows in harvests
UPDATE harvests
SET current_stage = CASE
  WHEN current_stage IN ('seedling', 'Seedling') THEN 'planting'
  WHEN current_stage IN ('vegetative', 'vegetative_growth', 'Vegetative Growth') THEN 'vegetative_growth'
  WHEN current_stage IN ('flowering', 'Flowering') THEN 'flowering'
  WHEN current_stage IN ('fruiting', 'fruit_development', 'Fruit Development') THEN 'crop_maturity'
  WHEN current_stage IN ('harvest', 'harvested', 'Harvest') THEN 'harvesting'
  ELSE current_stage
END
WHERE current_stage IS NOT NULL;

-- Step 3: Update existing rows in cultivation_records
UPDATE cultivation_records
SET stage = CASE
  WHEN stage IN ('seedling', 'Seedling') THEN 'planting'
  WHEN stage IN ('vegetative', 'vegetative_growth', 'Vegetative Growth') THEN 'vegetative_growth'
  WHEN stage IN ('flowering', 'Flowering') THEN 'flowering'
  WHEN stage IN ('fruiting', 'fruit_development', 'Fruit Development') THEN 'crop_maturity'
  WHEN stage IN ('harvest', 'harvested', 'Harvest') THEN 'harvesting'
  ELSE stage
END
WHERE stage IS NOT NULL;

-- Step 4: Update column default for harvests
ALTER TABLE IF EXISTS harvests
  ALTER COLUMN current_stage SET DEFAULT 'planting';

-- Step 5: Re-add check constraints with the canonical 5 stages
ALTER TABLE IF EXISTS harvests
  ADD CONSTRAINT harvests_current_stage_check
  CHECK (current_stage IN (
    'planting',
    'vegetative_growth',
    'flowering',
    'crop_maturity',
    'harvesting'
  ));

ALTER TABLE IF EXISTS cultivation_records
  ADD CONSTRAINT cultivation_records_stage_check
  CHECK (stage IN (
    'planting',
    'vegetative_growth',
    'flowering',
    'crop_maturity',
    'harvesting'
  ));

