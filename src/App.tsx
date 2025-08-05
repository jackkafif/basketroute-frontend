'use client';

import React, { useState, useEffect } from 'react';   // React Hooks for state & effects :contentReference[oaicite:0]{index=0}

// Ensure you have a `.env` file at your project root with, e.g.:
// VITE_API_BASE_URL=http://localhost:5000
// Only variables prefixed VITE_ are exposed to import.meta.env :contentReference[oaicite:2]{index=2}
const API_BASE = import.meta.env.VITE_API_BASE_URL;

interface Store {
  id: number;
  name: string;
  lat: number;
  lon: number;
}

interface PlanStep {
  store_name: string;
  item_name: string;
}

interface PlanResponse {
  plan: PlanStep[];
  total_cost: number;
  status: string;
}

export default function App() {
  const [stores, setStores] = useState<Store[]>([]);
  const [itemsInput, setItemsInput] = useState('');
  const [plan, setPlan] = useState<PlanStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string| null>(null);

  // Fetch the list of available stores on component mount :contentReference[oaicite:3]{index=3}
  useEffect(() => {
      fetch(`${API_BASE}/stores`)
        .then(res => res.json())
        .then(setStores)
  }, []);

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);
    const items = itemsInput.split(',')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      const response = await fetch(`${API_BASE}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      const res = await response.json();

      if (res.data.status === 'success') {
        setPlan(res.data.plan);
      } else {
        setError(`Optimization failed: ${res.data.status}`);
      }
    } catch (err) {
      console.error(err);
      setError('Error optimizing route');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">BasketRoute</h1>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Items (comma separated):</label>
        <input
          type="text"
          value={itemsInput}
          onChange={e => setItemsInput(e.currentTarget.value)}
          className="w-full border rounded p-2"
          placeholder="e.g. milk, eggs, bread"
        />
      </div>

      <button
        onClick={handleOptimize}
        disabled={loading}
        className={`px-4 py-2 rounded text-white ${
          loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? 'Optimizing…' : 'Optimize Route'}
      </button>

      {error && <p className="mt-4 text-red-600">{error}</p>}

      {plan.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-2">Optimized Plan</h2>
          <ol className="list-decimal list-inside space-y-1">
            {plan.map((step, i) => (
              <li key={i}>
                <span className="font-medium">{step.store_name}</span>: {step.item_name}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
