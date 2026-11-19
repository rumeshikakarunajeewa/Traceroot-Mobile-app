// src/constants/buyerMockData.ts
// Static configuration and image assets for the Buyer module

import { QuickActionItem } from '../types/buyer.types';

export const BUYER_PROFILE_HERO_BG =
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80';

export const BUYER_HERO_IMAGE =
  'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1200&q=80';

export const mockQuickActions: QuickActionItem[] = [
  { id: '1', title: 'Market', iconName: 'storefront-outline', isActive: true, route: '/(buyer)/explore' },
  { id: '2', title: 'Contracts', iconName: 'file-document-outline', isActive: false, route: '/(buyer)/contracts' },
  { id: '3', title: 'Scan QR', iconName: 'qrcode-scan', isActive: false, route: 'scan-qr' },
  { id: '4', title: 'Orders', iconName: 'basket-outline', isActive: false, route: '/(buyer)/orders' },
];
