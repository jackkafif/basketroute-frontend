const API_BASE_URL = 'http://localhost:10000/api';

export interface Store {
  id?: number;
  name: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface Product {
  id?: number;
  name: string;
  category?: string;
}

export interface GroceryItem {
  name: string;
  quantity: number;
}

export interface OptimizedRoute {
  Plan: Record<string, string[]>;
  Cost: number;
}

export interface StoreInventory {
  [storeName: string]: Array<{
    product: string;
    price: number;
    inventory: number;
  }>;
}

export async function fetchStores(): Promise<Store[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/all_stores`);
    if (!response.ok) throw new Error('Failed to fetch stores');
    return await response.json();
  } catch (error) {
    console.warn('API call failed, using mock data:', error);
    return [
      { name: 'Walmart', address: '123 Main St' },
      { name: 'Target', address: '456 Oak Ave' },
      { name: 'Kroger', address: '789 Pine Rd' },
    ];
  }
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return await response.json();
  } catch (error) {
    console.warn('API call failed, using mock data:', error);
    return [
      { name: 'Milk', category: 'Dairy' },
      { name: 'Bread', category: 'Bakery' },
      { name: 'Eggs', category: 'Dairy' },
      { name: 'Apples', category: 'Produce' },
      { name: 'Chicken', category: 'Meat' },
    ];
  }
}

export async function fetchProductsByCategory(): Promise<Record<string, Product[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/products_by_category`);
    if (!response.ok) throw new Error('Failed to fetch products by category');
    return await response.json();
  } catch (error) {
    console.warn('API call failed, using mock data:', error);
    return {
      'Dairy': [{ name: 'Milk' }, { name: 'Eggs' }],
      'Bakery': [{ name: 'Bread' }],
      'Produce': [{ name: 'Apples' }],
      'Meat': [{ name: 'Chicken' }],
    };
  }
}

export async function fetchStoreInventories(): Promise<StoreInventory> {
  try {
    const response = await fetch(`${API_BASE_URL}/store_inventories`);
    if (!response.ok) throw new Error('Failed to fetch store inventories');
    return await response.json();
  } catch (error) {
    console.warn('API call failed, using mock data:', error);
    return {
      'Walmart': [
        { product: 'Milk', price: 3.99, inventory: 20 },
        { product: 'Bread', price: 2.49, inventory: 15 },
      ],
      'Target': [
        { product: 'Eggs', price: 4.29, inventory: 12 },
        { product: 'Apples', price: 1.99, inventory: 25 },
      ],
    };
  }
}

export async function optimizeShoppingRoute(
  items: string[],
  stores: string[]
): Promise<OptimizedRoute> {
  try {
    const response = await fetch(`${API_BASE_URL}/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items,
        stores
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to optimize route');
    }
    
    return await response.json();
  } catch (error) {
    console.warn('API call failed, using mock optimization:', error);
    
    // Mock optimization result
    return {
      Plan: {
        [stores[0] || 'Walmart']: items.slice(0, Math.ceil(items.length / 2)),
        [stores[1] || 'Target']: items.slice(Math.ceil(items.length / 2))
      },
      Cost: Math.random() * 50 + 25
    };
  }
}