import { useState, useEffect } from 'react';
import { CatalogueProduct } from '../types/supplier.types';
import { mockCatalogueProducts } from '../constants/supplierCatalogueData';
import { catalogueService } from '../services/catalogue.service';
import { authService } from '../services/auth.service';

let catalogueProducts: CatalogueProduct[] = [...mockCatalogueProducts];
const listeners = new Set<(products: CatalogueProduct[]) => void>();
let isInitialized = false;

function notify() {
  listeners.forEach((listener) => listener([...catalogueProducts]));
}

export function getCatalogueProducts(): CatalogueProduct[] {
  return [...catalogueProducts];
}

export async function loadCatalogueProducts(supplierId?: string, force = false): Promise<CatalogueProduct[]> {
  if (isInitialized && !force && catalogueProducts.length > 0) {
    return catalogueProducts;
  }
  isInitialized = true;

  try {
    let targetSupplierId = supplierId;
    if (!targetSupplierId) {
      const session = await authService.getSession();
      targetSupplierId = session?.user?.id;
    }

    const data = await catalogueService.getCatalogueProducts(targetSupplierId);
    if (data && data.length > 0) {
      catalogueProducts = data;
    }
  } catch (err) {
    console.warn('[supplierCatalogueStore] Error loading products:', err);
  }

  notify();
  return catalogueProducts;
}

export function addCatalogueProduct(newProduct: Omit<CatalogueProduct, 'id'> & { id?: string }): CatalogueProduct {
  const created: CatalogueProduct = {
    ...newProduct,
    id: newProduct.id || `cat-${Date.now()}`,
  };
  catalogueProducts = [created, ...catalogueProducts.filter((p) => p.id !== created.id)];
  notify();

  // Async persist to Supabase in background
  authService.getSession().then((session) => {
    const supplierId = newProduct.supplierId || session?.user?.id;
    if (supplierId) {
      catalogueService.createCatalogueProduct({
        supplierId,
        title: newProduct.title,
        category: newProduct.category,
        price: newProduct.price,
        unit: newProduct.soldPer || 'kg',
        stock: newProduct.stock,
        description: newProduct.description,
        suitableFor: newProduct.suitableFor,
        isOrganicCertified: newProduct.isOrganicCertified,
      }).catch((err) => console.warn('Error saving catalogue product to Supabase:', err));
    }
  });

  return created;
}

export function removeCatalogueProduct(id: string) {
  catalogueProducts = catalogueProducts.filter((p) => p.id !== id);
  notify();

  catalogueService.deleteCatalogueProduct(id).catch((err) => {
    console.warn('Error deleting catalogue product from Supabase:', err);
  });
}

export function updateCatalogueProduct(id: string, updates: Partial<CatalogueProduct>) {
  catalogueProducts = catalogueProducts.map((p) =>
    p.id === id ? { ...p, ...updates } : p
  );
  notify();

  authService.getSession().then((session) => {
    const supplierId = session?.user?.id || 'supplier-1';
    catalogueService.updateCatalogueProduct(id, supplierId, updates).catch((err) => {
      console.warn('Error updating catalogue product in Supabase:', err);
    });
  });
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

    if (!isInitialized) {
      loadCatalogueProducts();
    }

    // Subscribe to Realtime Supabase updates
    const unsubscribe = catalogueService.subscribeToCatalogue(() => {
      loadCatalogueProducts(undefined, true);
    });

    return () => {
      listeners.delete(listener);
      unsubscribe();
    };
  }, []);

  return [products, addCatalogueProduct, removeCatalogueProduct];
}
