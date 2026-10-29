import { useState, useEffect } from 'react';
import { CatalogueProduct } from '../types/supplier.types';
import { mockCatalogueProducts } from '../constants/supplierCatalogueData';

let catalogueProducts: CatalogueProduct[] = [...mockCatalogueProducts];
const listeners = new Set<(products: CatalogueProduct[]) => void>();

function notify() {
  listeners.forEach((listener) => listener([...catalogueProducts]));
}

export function getCatalogueProducts(): CatalogueProduct[] {
  return [...catalogueProducts];
}

export function addCatalogueProduct(newProduct: Omit<CatalogueProduct, 'id'> & { id?: string }): CatalogueProduct {
  const created: CatalogueProduct = {
    ...newProduct,
    id: newProduct.id || `cat-${Date.now()}`,
  };
  catalogueProducts = [created, ...catalogueProducts];
  notify();
  return created;
}

export function removeCatalogueProduct(id: string) {
  catalogueProducts = catalogueProducts.filter((p) => p.id !== id);
  notify();
}

export function updateCatalogueProduct(id: string, updates: Partial<CatalogueProduct>) {
  catalogueProducts = catalogueProducts.map((p) =>
    p.id === id ? { ...p, ...updates } : p
  );
  notify();
}

/**
 * Hook to subscribe to real-time catalogue product changes
 */
export function useSupplierCatalogue(): [
  CatalogueProduct[],
  (newProduct: Omit<CatalogueProduct, 'id'> & { id?: string }) => CatalogueProduct,
  (id: string) => void
] {
  const [products, setProducts] = useState<CatalogueProduct[]>(catalogueProducts);

  useEffect(() => {
    const listener = (newProducts: CatalogueProduct[]) => setProducts(newProducts);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return [products, addCatalogueProduct, removeCatalogueProduct];
}
