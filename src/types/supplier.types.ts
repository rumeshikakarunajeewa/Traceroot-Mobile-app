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

export type CatalogueCategory = 'All' | 'Seeds' | 'Fertilizers' | 'Pesticides';

export interface CatalogueProduct {
  id: string;
  title: string;
  category: 'Seeds' | 'Fertilizers' | 'Pesticides';
  packageSize: string;
  price: number;
  currency: string;
  stock: number;
  maxStock: number;
  isLowStock?: boolean;
  imageUrl: any;
}

