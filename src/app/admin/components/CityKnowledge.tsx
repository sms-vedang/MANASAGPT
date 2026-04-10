'use client';

import { useState, useEffect } from 'react';

interface City {
  _id?: string;
  name: string;
  description: string;
  district: string;
  state: string;
  country: string;
  pincodes: string[];
  population: number;
  area: string;
  wards: {
    total: number;
    list: string[];
  };
  nagarPalika: {
    name: string;
    address: string;
  };
  mla: {
    name: string;
    party: string;
    contact?: string;
  };
  mp: {
    name: string;
    party: string;
    contact?: string;
  };
  policeStations: string[];
  areas: {
    name: string;
    subAreas?: string[];
    streets?: string[];
    tags: string[];
  }[];
  villages: {
    name: string;
    population: number;
    distanceFromCity: string;
    category: 'rural' | 'urban';
  }[];
  institutions: {
    schools: string[];
    colleges: string[];
    hospitals: string[];
    govtOffices: string[];
  };
  culture: {
    festivals: string[];
    famousThings: string[];
    history: string;
  };
  connectivity: {
    busStand: string;
    railwayStation: string;
    highways: string[];
  };
}

export default function CityKnowledge() {
  const [city, setCity] = useState<City | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<City>({
    name: '',
    description: '',
    district: '',
    state: '',
    country: '',
    pincodes: [],
    population: 0,
    area: '',
    wards: { total: 0, list: [] },
    nagarPalika: { name: '', address: '' },
    mla: { name: '', party: '' },
    mp: { name: '', party: '' },
    policeStations: [],
    areas: [],
    villages: [],
    institutions: { schools: [], colleges: [], hospitals: [], govtOffices: [] },
    culture: { festivals: [], famousThings: [], history: '' },
    connectivity: { busStand: '', railwayStation: '', highways: [] },
  });

  useEffect(() => {
    fetchCity();
  }, []);

  const fetchCity = async () => {
    try {
      const response = await fetch('/api/city');
      if (response.ok) {
        const data = await response.json();
        setCity(data);
        setFormData(data);
      }
    } catch (error) {
      console.error('Failed to fetch city:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/city', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setCity(data);
        setEditing(false);
      }
    } catch (error) {
      console.error('Failed to save city:', error);
    }
  };

  const updateNestedField = (path: string, value: string | number) => {
    setFormData(prev => {
      const keys = path.split('.');
      const updated: City = structuredClone(prev);
      let current: Record<string, unknown> = updated as unknown as Record<string, unknown>;

      for (let i = 0; i < keys.length - 1; i++) {
        const next = current[keys[i]];
        if (!next || typeof next !== 'object') {
          current[keys[i]] = {};
        }
        current = current[keys[i]] as Record<string, unknown>;
      }

      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  if (loading) return <div className="text-center py-8">Loading city data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">City Knowledge System</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
          >
            {city ? 'Edit City Data' : 'Add City Data'}
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Basic City Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="City Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-gray-700 p-2 rounded"
                required
              />
              <input
                type="text"
                placeholder="District"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="bg-gray-700 p-2 rounded"
                required
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-2">City Description</label>
                <textarea
                  placeholder="Enter a general description of the city..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-700 p-2 rounded min-h-[100px]"
                />
              </div>
              <input
                type="text"
                placeholder="State"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="bg-gray-700 p-2 rounded"
                required
              />
              <input
                type="text"
                placeholder="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="bg-gray-700 p-2 rounded"
                required
              />
              <input
                type="number"
                placeholder="Population"
                value={formData.population}
                onChange={(e) => setFormData({ ...formData, population: parseInt(e.target.value) })}
                className="bg-gray-700 p-2 rounded"
                required
              />
              <input
                type="text"
                placeholder="Area"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="bg-gray-700 p-2 rounded"
                required
              />
            </div>
          </div>

          {/* Administrative Data */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Administrative Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Total Wards"
                value={formData.wards.total}
                onChange={(e) => updateNestedField('wards.total', parseInt(e.target.value))}
                className="bg-gray-700 p-2 rounded"
              />
              <input
                type="text"
                placeholder="Nagar Palika Name"
                value={formData.nagarPalika.name}
                onChange={(e) => updateNestedField('nagarPalika.name', e.target.value)}
                className="bg-gray-700 p-2 rounded"
              />
              <input
                type="text"
                placeholder="MLA Name"
                value={formData.mla.name}
                onChange={(e) => updateNestedField('mla.name', e.target.value)}
                className="bg-gray-700 p-2 rounded"
              />
              <input
                type="text"
                placeholder="MLA Party"
                value={formData.mla.party}
                onChange={(e) => updateNestedField('mla.party', e.target.value)}
                className="bg-gray-700 p-2 rounded"
              />
            </div>
          </div>

          {/* Save/Cancel */}
          <div className="flex space-x-2">
            <button type="submit" className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-semibold">
              Save City Data
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                if (city) setFormData(city);
              }}
              className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : city ? (
        <div className="space-y-6">
          {/* Display City Data */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Basic Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <p className="text-sm text-gray-400 mb-1">Description</p>
                <p className="text-lg leading-relaxed">{city.description || 'No description added.'}</p>
              </div>
              <div><strong className="text-gray-400">Name:</strong><p className="text-lg">{city.name}</p></div>
              <div><strong className="text-gray-400">District:</strong><p className="text-lg">{city.district}</p></div>
              <div><strong className="text-gray-400">State:</strong><p className="text-lg">{city.state}</p></div>
              <div><strong className="text-gray-400">Population:</strong><p className="text-lg">{city.population.toLocaleString()}</p></div>
              <div><strong className="text-gray-400">Area:</strong><p className="text-lg">{city.area}</p></div>
              <div><strong className="text-gray-400">Wards:</strong><p className="text-lg">{city.wards.total}</p></div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Government</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><strong className="text-gray-400">MLA:</strong><p className="text-lg">{city.mla.name} ({city.mla.party})</p></div>
              <div><strong className="text-gray-400">MP:</strong><p className="text-lg">{city.mp.name} ({city.mp.party})</p></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-3xl">
          <div className="text-5xl mb-4">🏗️</div>
          <p className="text-gray-400 text-lg">No city data found.</p>
          <p className="text-gray-500 mt-2">Click &quot;Add City Data&quot; to initialize the knowledge system for Manasa.</p>
        </div>
      )}
    </div>
  );
}
