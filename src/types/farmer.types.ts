import { FarmingStageKeyType } from '../constants/stages';

export interface JourneyStage {
  id: string;
  stageNumber: number;
  key?: FarmingStageKeyType;
  title: string;
  subtitle: string;
  date: string;
  status: 'done' | 'in_progress' | 'upcoming';
  iconName: string;
  notes?: string;
  inputsUsed?: string[];
  tags?: string[];
  recordCount?: number;
  stageEmoji?: string;
}

export interface FieldItem {
  id: string;
  name: string;
  cropName: string;
  cropEmoji: string;
  areaAcres: number;
  stageName: string;
  daysToHarvest: number;
  imageUrl?: string;
  growthPercentage: number;
  statusBadge: 'Healthy' | 'Harvest soon' | 'Attention' | 'Growing';
  category: 'Carrots' | 'Vegetable' | 'Fruit' | 'Grains' | 'Other';
  plotName: string;
  stages: JourneyStage[];
  environmentType?: 'Greenhouse' | 'Open field' | 'Tunnel' | string;
  startDate?: string;
  currentStageIndex?: number;
  totalStages?: number;
  recordCount?: number;
  evidenceCount?: number;
  isImmutable?: boolean;
  nextStageName?: string;
  nextStageEst?: string;
  daysCount?: number;
  batchId?: string;
}

export interface FarmerProfile {
  id: string;
  fullName: string;
  location: string;
  farmerType: string;
  avatarUrl?: string;
}

export interface WeatherMetrics {
  location: string;
  farmerType: string;
  temperatureC: number;
  weatherCondition: string;
  highTempC: number;
  lowTempC: number;
  humidityPercent: number;
  precipitationPercent: number;
  windSpeedKmh: number;
}

export interface FarmerSummaryStats {
  activeCrops: number;
  recordsMonthCount: number;
  monthName: string;
  readyToHarvestCount: number;
}

export interface QuickFeatureCard {
  id: string;
  title: string;
  subtext: string;
  iconName: string;
  themeColor: string;
  badgeDotColor?: string;
  bgTint: string;
  route?: string;
}

export interface RecentRecordItem {
  id: string;
  recordCode: string;
  title: string;
  stage: string;
  date: string;
  time?: string;
  location?: string;
  inputs?: string[];
  photoEvidenceAttached?: boolean;
  photoUrl?: string;
  isLocked?: boolean;
  isOriginal?: boolean;
  isCorrection?: boolean;
  correctsRecordCode?: string;
  correctionReason?: string;
  correctedAt?: string;
  cropId?: string;
  batchId?: string;
  activityId?: string;
  isCompact?: boolean;
  notes?: string;
  details?: Record<string, any>;
  createdAt?: string;
}

export interface UpcomingItem {
  id: string;
  title: string;
  subtitle: string;
  iconType: 'stage' | 'message';
  iconColor: string;
  iconBg: string;
  dotColor?: string;
  route?: string;
  cropId?: string;
}
