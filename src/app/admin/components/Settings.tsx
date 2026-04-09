'use client';

import { useState } from 'react';

export default function Settings() {
  const [categories, setCategories] = useState(['medical', 'restaurant', 'salon', 'grocery']);
  const [newCategory, setNewCategory] = useState('');
  const [cityName, setCityName] = useState('Manasa');
  const [theme, setTheme] = useState('dark');

  const addCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory('');
    }
  };

  const removeCategory = (category: string) => {
    setCategories(categories.filter(c => c !== category));
  };

  const handleSave = () => {
    // Save settings (implement API later)
    alert('Settings saved!');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Settings</h2>

      {/* Categories Management */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Shop Categories</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((category) => (
            <span
              key={category}
              className="bg-blue-600 px-3 py-1 rounded-full text-sm flex items-center gap-2"
            >
              {category}
              <button
                onClick={() => removeCategory(category)}
                className="text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Add new category"
            className="bg-gray-700 p-2 rounded flex-1"
            onKeyPress={(e) => e.key === 'Enter' && addCategory()}
          />
          <button
            onClick={addCategory}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          >
            Add
          </button>
        </div>
      </div>

      {/* City Selection */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">City Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Current City</label>
            <input
              type="text"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              className="bg-gray-700 p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="bg-gray-700 p-2 rounded w-full"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">API Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Groq API Key</label>
            <input
              type="password"
              placeholder="Enter Groq API Key"
              className="bg-gray-700 p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">MongoDB Connection String</label>
            <input
              type="password"
              placeholder="Enter MongoDB URI"
              className="bg-gray-700 p-2 rounded w-full"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium"
        >
          Save All Settings
        </button>
      </div>
    </div>
  );
}