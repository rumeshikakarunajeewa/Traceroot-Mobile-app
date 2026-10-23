export type FarmingType = 'greenhouse' | 'open-field';

export interface BuyerProfile {
  id: string;
  fullName: string;
  initials: string;
  isVerified: boolean;
  avatarUrl?: string;
  roleTitle?: string;
  company?: string;
  district?: string;
  province?: string;
  country?: string;
  coordinates?: string;
  bio?: string;
  ordersCount?: number;
  contractsCount?: number;
  kgSourced?: string;
  trustScore?: number;
  trustScoreLabel?: string;
  trustScoreDetail?: string;
  phone?: string;
  email?: string;
  businessType?: string;
  registrationId?: string;
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
  category?: 'Vegetables' | 'Fruits' | 'Spices' | 'Grains' | 'Tubers';
  farmerId?: string;
  isOrganic?: boolean;
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

export type OrderStatus =
  | 'Growing'
  | 'Pending'
  | 'Delivered'
  | 'Cancelled'
  | 'processing'
  | 'confirmed'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface OrderTrackingMilestone {
  stage: string;
  title: string;
  description: string;
  timestamp?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface BuyerOrder {
  id: string;
  orderNumber: string; // e.g. "ORD-0012"
  createdAt: string;   // e.g. "18 Oct 2026, 09:30 AM"
  status: OrderStatus;
  cropName: string;
  cropEmoji?: string;
  farmingType: FarmingType;
  quantityKg: number;
  pricePerKg: number;
  totalPrice: number;
  currency: string;
  imageUrl: string;
  farmerId: string;
  farmerName: string;
  location: string;
  recordsCount: number;
  stagesCount?: number;
  progressPercentage: number;
  batchId: string;
  estimatedDelivery: string;
  deliveryAddress: string;
  courierName?: string;
  courierPhone?: string;
  notes?: string;
  trackingSteps: OrderTrackingMilestone[];
}

export type MessageCategory = 'Request' | 'Note';
export type MessageStatus = 'New' | 'Replied' | 'Pending';

export interface BuyerMessageThread {
  id: string;
  senderId: string;
  senderName: string;
  avatarUrl: string;
  category: MessageCategory;
  status: MessageStatus;
  timestamp: string;
  messageSnippet: string;
  isOnline?: boolean;
  isUnread?: boolean;
}


