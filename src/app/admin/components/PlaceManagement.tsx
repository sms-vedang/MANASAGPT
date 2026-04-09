'use client';

import { useState, useEffect } from 'react';

interface Place {
  _id: string;
  name: string;
  type: 'temple' | 'landmark' | 'government_office' | 'tourist_spot';
  description: string;
  timing?: string;
  location: string;
}

export default function PlaceManagement() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'temple' as Place['type'],
    description: '',
    timing: '',
    location: '',
  });

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      const response = await fetch('/api/places');
      const data = await response.json();
      setPlaces(data);
    } catch (error) {
      console.error('Failed to fetch places:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingPlace ? `/api/places/${editingPlace._id}` : '/api/places';
      const method = editingPlace ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchPlaces();
        setShowForm(false);
        setEditingPlace(null);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save place:', error);
    }
  };

  const handleEdit = (place: Place) => {
    setEditingPlace(place);
    setFormData({
      name: place.name,
      type: place.type,
      description: place.description,
      timing: place.timing || '',
      location: place.location,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this place?')) return;

    try {
      const response = await fetch(`/api/places/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchPlaces();
      }
    } catch (error) {
      console.error('Failed to delete place:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'temple',
      description: '',
      timing: '',
      location: '',
    });
  };

  if (loading) return <div className="text-center py-8">Loading places...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Places Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
        >
          Add Place
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">
            {editingPlace ? 'Edit Place' : 'Add New Place'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Place Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-gray-700 p-2 rounded"
                required
              />
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Place['type'] })}
                className="bg-gray-700 p-2 rounded"
                required
              >
                <option value="temple">Temple</option>
                <option value="landmark">Landmark</option>
                <option value="government_office">Government Office</option>
                <option value="tourist_spot">Tourist Spot</option>
              </select>
              <input
                type="text"
                placeholder="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="bg-gray-700 p-2 rounded"
                required
              />
              <input
                type="text"
                placeholder="Timing (optional)"
                value={formData.timing}
                onChange={(e) => setFormData({ ...formData, timing: e.target.value })}
                className="bg-gray-700 p-2 rounded"
              />
            </div>
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-gray-700 p-2 rounded w-full h-24"
              required
            />
            <div className="flex space-x-2">
              <button type="submit" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
                {editingPlace ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingPlace(null);
                  resetForm();
                }}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 shadow-md rounded">
          <thead>
            <tr className="bg-gray-700">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Location</th>
              <th className="px-4 py-2">Timing</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {places.map((place) => (
              <tr key={place._id} className="border-b border-gray-700">
                <td className="px-4 py-2">{place.name}</td>
                <td className="px-4 py-2 capitalize">{place.type.replace('_', ' ')}</td>
                <td className="px-4 py-2 max-w-xs truncate">{place.description}</td>
                <td className="px-4 py-2">{place.location}</td>
                <td className="px-4 py-2">{place.timing || 'N/A'}</td>
                <td className="px-4 py-2 space-x-2">
                  <button
                    onClick={() => handleEdit(place)}
                    className="text-blue-400 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(place._id)}
                    className="text-red-400 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}