import {
  SupplierProfile,
  SupplierStats,
  SupplierQuickActionItem,
  FarmerRequestItem,
  TopProductItem,
  WaitingAlertInfo,
} from '../types/supplier.types';

export const mockSupplierProfile: SupplierProfile = {
  id: 'supp-001',
  name: 'AgriSupply Co.',
  category: 'Agricultural Raw Materials',
  role: 'Certified Agricultural Supplier',
  unreadNotificationsCount: 1,
};

export const mockSupplierStats: SupplierStats = {
  productsCount: 24,
  pendingOrdersCount: 7,
  activeFarmersCount: 12,
};

export const mockSupplierQuickActions: SupplierQuickActionItem[] = [
  {
    id: 'catalogue',
    title: 'Catalogue',
    iconName: 'book-open-outline',
    isPrimary: true,
    route: '/(supplier)/catalogue',
  },
  {
    id: 'add_product',
    title: 'Add Product',
    iconName: 'plus',
    isPrimary: false,
    route: '/(supplier)/catalogue/new',
  },
  {
    id: 'requests',
    title: 'Requests',
    iconName: 'basket-outline',
    isPrimary: false,
    route: '/(supplier)/orders',
  },
  {
    id: 'buy_back',
    title: 'Buy-back',
    iconName: 'sprout-outline',
    isPrimary: false,
    route: '/(supplier)/buyback',
  },
];

export const mockWaitingAlert: WaitingAlertInfo = {
  waitingCount: 2,
  title: '2 farmers are waiting',
  subtitle: 'Fulfil requests to keep their crops on track',
};

export const mockFarmerRequests: FarmerRequestItem[] = [
  {
    id: 'req-001',
    title: 'NPK Fertilizer 10 kg',
    farmerName: 'Priya Kumari',
    date: '17 Sep',
    status: 'Pending',
    imageUrl: require('../../assets/images/supplier_fertilizer.jpg'),
    quantity: '10 kg',
  },
  {
    id: 'req-002',
    title: 'Hybrid Tomato Seeds 100g',
    farmerName: 'Roshan Silva',
    date: '17 Sep',
    status: 'Pending',
    imageUrl: require('../../assets/images/supplier_tomato_seeds.jpg'),
    quantity: '100g',
  },
  {
    id: 'req-003',
    title: 'Neem Oil Spray 250 mL',
    farmerName: 'Amali Fernando',
    date: '16 Sep',
    status: 'Fulfilled',
    imageUrl: {
      uri: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=400&q=80',
    },
    quantity: '250 mL',
  },
];

export const mockTopProducts: TopProductItem[] = [
  {
    id: 'prod-001',
    title: 'NPK Fertilizer',
    category: 'Fertilizers',
    price: 1200,
    currency: 'LKR',
    stock: 120,
    maxStock: 150,
    imageUrl: require('../../assets/images/supplier_fertilizer.jpg'),
  },
  {
    id: 'prod-002',
    title: 'Hybrid Seeds',
    category: 'Seeds',
    price: 850,
    currency: 'LKR',
    stock: 50,
    maxStock: 120,
    imageUrl: {
      uri: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80',
    },
  },
  {
    id: 'prod-003',
    title: 'Neem Spray',
    category: 'Protection',
    price: 1450,
    currency: 'LKR',
    stock: 85,
    maxStock: 100,
    imageUrl: {
      uri: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80',
    },
  },
];
