const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';

export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  distance: number;
  latitude: number;
  longitude: number;
  items: { [itemId: string]: { price: number; available: boolean } };
}

export interface OptimizeRouteRequest {
  items: GroceryItem[];
  location: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  maxStores: number;
}

export interface OptimizeRouteResponse {
  stores: Store[];
  totalCost: number;
  totalDistance: number;
  savings: number;
  route: {
    coordinates: Array<[number, number]>;
    duration: number;
  };
}

export const apiService = {
  // Get nearby stores
  async getNearbyStores(location: { latitude: number; longitude: number }, radius: number): Promise<Store[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/stores/nearby`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location, radius }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching nearby stores:', error);
      throw error;
    }
  },

  // Optimize shopping route
  async optimizeRoute(request: OptimizeRouteRequest): Promise<OptimizeRouteResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/route/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error optimizing route:', error);
      throw error;
    }
  },

  // Get item prices across stores
  async getItemPrices(itemNames: string[], location: { latitude: number; longitude: number }, radius: number) {
    try {
      const response = await fetch(`${API_BASE_URL}/items/prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: itemNames, location, radius }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching item prices:', error);
      throw error;
    }
  },

  // Search for items/products
  async searchItems(query: string): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/items/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error searching items:', error);
      throw error;
    }
  }
};