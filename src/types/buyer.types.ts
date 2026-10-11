export type FarmingType = 'greenhouse' | 'open-field';

export interface BuyerProfile {
  id: string;
  fullName: string;
  initials: string;
  isVerified: boolean;
  avatarUrl?: string;
}

export interface BuyerStats {
  activeOrders: number;
  contractsCount: number;
  verifiedFarmsCount: number;
}

export interface QuickActionItem {
  id: string;
  title: string;
  iconName: string;
  isActive?: boolean;
  route: string;
}

export interface ProduceListing {
  id: string;
  cropName: string;
  cropEmoji?: string;
  farmingType: FarmingType;
  quantityKg: number;
  farmerName: string;
  farmerAvatarUrl?: string;
  location: string;
  recordsCount: number;
  completedStages: number;
  totalStages: number;
  pricePerKg: number;
  currency: string;
  imageUrl: string;
}

export interface ActiveContractItem {
  id: string;
  code: string; // e.g. "CF-001"
  cropName: string;
  quantityKg: number;
  farmerName: string;
  dueDate: string; // e.g. "Due Dec 2026"
  progressPercentage: number; // e.g. 60
  status: 'In Progress' | 'Completed' | 'Pending';
  coverImageUrl: string;
}
