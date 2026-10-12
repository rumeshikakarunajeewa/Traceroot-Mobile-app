export interface JourneyStage {
  id: string;
  stageNumber: number;
  title: string;
  subtitle: string;
  date: string;
  status: 'done' | 'in_progress' | 'upcoming';
  iconName: string;
  notes?: string;
  inputsUsed?: string[];
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
