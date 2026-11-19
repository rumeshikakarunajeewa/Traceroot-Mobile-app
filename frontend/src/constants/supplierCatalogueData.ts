import { CatalogueCategory, CatalogueProduct } from '../types/supplier.types';

export const CATALOGUE_CATEGORIES: CatalogueCategory[] = [
  'All',
  'Seeds',
  'Fertilizers',
  'Pesticides',
  'Compost',
];

export const mockCatalogueProducts: CatalogueProduct[] = [
  {
    id: 'cat-001',
    title: 'Hybrid Tomato Seeds',
    category: 'Seeds',
    packageSize: '100g pack',
    price: 850,
    currency: 'LKR',
    stock: 50,
    maxStock: 100,
    imageUrl: require('../../assets/images/supplier_tomato_seeds.jpg'),
  },
  {
    id: 'cat-002',
    title: 'NPK Fertilizer\n(20-20-20)',
    category: 'Fertilizers',
    packageSize: '10 kg bag',
    price: 1200,
    currency: 'LKR',
    stock: 120,
    maxStock: 150,
    imageUrl: require('../../assets/images/supplier_fertilizer.jpg'),
  },
  {
    id: 'cat-003',
    title: 'Organic Compost',
    category: 'Fertilizers',
    packageSize: '5 kg bag',
    price: 350,
    currency: 'LKR',
    stock: 80,
    maxStock: 150,
    imageUrl: {
      uri: 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&w=600&q=80',
    },
  },
  {
    id: 'cat-004',
    title: 'Copper Fungicide',
    category: 'Pesticides',
    packageSize: '500 mL',
    price: 450,
    currency: 'LKR',
    stock: 30,
    maxStock: 100,
    isLowStock: true,
    imageUrl: {
      uri: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=600&q=80',
    },
  },
  {
    id: 'cat-005',
    title: 'Rice Seeds (Bg 352)',
    category: 'Seeds',
    packageSize: '1 kg pack',
    price: 290,
    currency: 'LKR',
    stock: 200,
    maxStock: 200,
    imageUrl: {
      uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
    },
  },
  {
    id: 'cat-006',
    title: 'Neem Oil Spray',
    category: 'Pesticides',
    packageSize: '250 mL',
    price: 380,
    currency: 'LKR',
    stock: 45,
    maxStock: 100,
    imageUrl: {
      uri: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=600&q=80',
    },
  },
];
