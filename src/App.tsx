'use client';

import React, { useState, useEffect } from 'react';

const API_BASE = "http://127.0.0.1:5000";

// 'use client';

// import React, { useState, useEffect } from 'react';

// const API_BASE = "https://api.basketroute.jackkafif.com";

interface Product {
  id: number;
  name: string;
  category?: string;
  unit?: string;
}

interface PlanItem {
  item: string;
  quantity: number;
}

interface PlanStore {
  store: string;
  items: PlanItem[];
}

interface PlanResponse {
  plan: PlanStore[];
  cost: number;
  status: string;
  distance: number;
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [plan, setPlan] = useState<PlanStore[]>([]);
  const [totalCost, setTotalCost] = useState<number | null>(null);
  const [totalDistance, setTotalDistance] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch products on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/products`)
      .then(res => res.json())
      .then(setProducts)
      .catch(() => setError('Failed to load products'));
  }, []);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setAddress('');
        setError(null);
      },
      () => setError('Unable to retrieve your location')
    );
  };

  const handleOptimize = async () => {
    setError(null);

    // Build items with quantities > 0
    const items = Object.entries(quantities)
      .map(([id, qty]) => ({ product_id: Number(id), quantity: qty }))
      .filter(item => item.quantity > 0);

    if (items.length === 0) {
      setError('Please select at least one product and quantity');
      return;
    }
    if (!location && !address.trim()) {
      setError('Please enter your address or use your current location');
      return;
    }

    setLoading(true);
    try {
      const payload: any = { items };
      if (location) payload.location = location;
      else payload.address = address.trim();

      const response = await fetch(`${API_BASE}/api/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // throw if status>=400 so we can catch
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const res: PlanResponse = await response.json();

      setPlan(res.plan);
      setTotalCost(res.cost);
      setTotalDistance(res.distance);
      setStatus(res.status);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error optimizing route');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">BasketRoute</h1>

      {/* Location Input */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Your Location</h2>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={address}
            onChange={e => {
              setAddress(e.currentTarget.value);
              setLocation(null);
            }}
            placeholder="Enter your address"
            className="flex-1 border rounded p-2"
            disabled={!!location}
          />
          <button
            onClick={handleUseLocation}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Use My Location
          </button>
        </div>
        {location && (
          <p className="text-gray-600">
            🎯 Using coords: {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
          </p>
        )}
      </div>

      {/* Products Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Select Products & Quantities</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {products.map(product => (
            <div
              key={product.id}
              className="border rounded-lg p-4 flex flex-col justify-between bg-white shadow-sm"
            >
              <h3 className="font-medium mb-2">{product.name}</h3>
              <div className="mt-auto">
                <label className="block text-sm mb-1">Qty:</label>
                <input
                  type="number"
                  min={0}
                  value={quantities[product.id] ?? 0}
                  onChange={e =>
                    setQuantities({
                      ...quantities,
                      [product.id]: Math.max(0, Number(e.currentTarget.value)),
                    })
                  }
                  className="w-full border rounded p-1 text-center"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Optimize Button */}
      <div>
        <button
          onClick={handleOptimize}
          disabled={loading}
          className={`w-full py-3 rounded text-white ${
            loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Optimizing…' : 'Optimize Route'}
        </button>
        {error && <p className="mt-4 text-red-600">{error}</p>}
      </div>

      {/* Plan Output */}
      {plan.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Optimized Plan</h2>
          <p className="text-lg">
            Status: <span className="font-medium">{status}</span> | Cost:{' '}
            <span className="font-medium">${totalCost?.toFixed(2)}</span> | Distance:{' '}
            <span className="font-medium">{totalDistance?.toFixed(0)} m</span>
          </p>
          {plan.map((storeBlock, idx) => (
            <div key={idx} className="border rounded p-4 bg-white shadow-sm">
              <h3 className="font-semibold mb-2">{storeBlock.store}</h3>
              <ul className="list-disc list-inside space-y-1">
                {storeBlock.items.map((it, i) => (
                  <li key={i}>
                    {it.item} × {it.quantity}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
