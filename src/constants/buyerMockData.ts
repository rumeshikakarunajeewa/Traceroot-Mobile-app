import { BuyerProfile, BuyerStats, QuickActionItem, ProduceListing, ActiveContractItem } from '../types/buyer.types';

export const mockBuyerProfile: BuyerProfile = {
  id: 'buyer-001',
  fullName: 'Saman Perera',
  initials: 'SP',
  isVerified: true,
};

export const mockBuyerStats: BuyerStats = {
  activeOrders: 2,
  contractsCount: 1,
  verifiedFarmsCount: 48,
};

export const mockQuickActions: QuickActionItem[] = [
  { id: '1', title: 'Market', iconName: 'storefront-outline', isActive: true, route: '/(buyer)/explore' },
  { id: '2', title: 'Contracts', iconName: 'file-document-outline', isActive: false, route: '/(buyer)/contracts' },
  { id: '3', title: 'Scan QR', iconName: 'qrcode-scan', isActive: false, route: 'scan-qr' },
  { id: '4', title: 'Orders', iconName: 'basket-outline', isActive: false, route: '/(buyer)/orders' },
];

export const mockProduceListings: ProduceListing[] = [
  {
    id: 'list-1',
    cropName: 'Tomato',
    cropEmoji: '🍅',
    farmingType: 'greenhouse',
    quantityKg: 150,
    farmerName: 'Priya Kumari',
    location: 'Kandy',
    recordsCount: 10,
    completedStages: 3,
    totalStages: 5,
    pricePerKg: 180,
    currency: 'LKR',
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'list-2',
    cropName: 'Cabbage',
    cropEmoji: '🥬',
    farmingType: 'open-field',
    quantityKg: 200,
    farmerName: 'Roshan Silva',
    location: 'Nuwara Eliya',
    recordsCount: 7,
    completedStages: 4,
    totalStages: 5,
    pricePerKg: 90,
    currency: 'LKR',
    imageUrl: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=600&q=80',
  },
];

export const mockActiveContract: ActiveContractItem = {
  id: 'contract-001',
  code: 'CF-001',
  cropName: 'Cabbage',
  quantityKg: 500,
  farmerName: 'Roshan Silva',
  dueDate: 'Due Dec 2026',
  progressPercentage: 60,
  status: 'In Progress',
  coverImageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1000&q=80',
};

export const BUYER_HERO_IMAGE = 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1200&q=80';
