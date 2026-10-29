export interface SupplierProfile {
  id: string;
  name: string;
  category: string;
  role: string;
  avatarUrl?: string;
  unreadNotificationsCount?: number;
}

export interface SupplierStats {
  productsCount: number;
  pendingOrdersCount: number;
  activeFarmersCount: number;
}

export interface SupplierQuickActionItem {
  id: string;
  title: string;
  iconName: string;
  route?: string;
  isPrimary?: boolean;
}

export type RequestStatus = 'Pending' | 'Fulfilled' | 'Cancelled';

export type SupplierMessageType = 'Request' | 'Note';
export type SupplierMessageStatus = 'New' | 'Replied' | 'Pending';

export interface SupplierChatMessage {
  id: string;
  sender: 'user' | 'other';
  text: string;
  timestamp: string;
}

export interface SupplierMessageThread {
  id: string;
  senderName: string;
  senderRole?: string;
  avatarUrl: any;
  type: SupplierMessageType;
  statusTag: SupplierMessageStatus;
  timestamp: string;
  lastMessage: string;
  isUnread?: boolean;
  messages: SupplierChatMessage[];
}

export type SupplierOrderStatus = 'New' | 'Packing' | 'Completed' | 'Declined';

export interface SupplierOrderItem {
  title: string;
  quantity: string;
  price: number;
  imageUrl: any;
}

export interface SupplierOrderRequest {
  id: string; // e.g. 'REQ-2041'
  farmerName: string;
  farmerAvatar: any;
  district: string;
  timeAgo: string;
  status: SupplierOrderStatus;
  items: SupplierOrderItem[];
  totalAmount: number;
  deliveryMethod: string;
  stepperStage: 'Received' | 'Packing' | 'Delivered';
}

export interface FarmerRequestItem {
  id: string;
  title: string;
  farmerName: string;
  date: string;
  status: RequestStatus;
  imageUrl: any; // Image source (require or uri object)
  quantity?: string;
}

export interface TopProductItem {
  id: string;
  title: string;
  category: string;
  price: number;
  currency: string;
  stock: number;
  maxStock: number;
  imageUrl: any; // Image source
}

export interface WaitingAlertInfo {
  waitingCount: number;
  title: string;
  subtitle: string;
}

export type CatalogueCategory = 'All' | 'Seeds' | 'Fertilizers' | 'Pesticides' | 'Compost';

export interface CatalogueProduct {
  id: string;
  title: string;
  category: 'Seeds' | 'Fertilizers' | 'Pesticides' | 'Compost';
  packageSize: string;
  price: number;
  currency: string;
  stock: number;
  maxStock: number;
  isLowStock?: boolean;
  imageUrl: any;
  soldPer?: string;
  description?: string;
  suitableFor?: string[];
  isOrganicCertified?: boolean;
}

