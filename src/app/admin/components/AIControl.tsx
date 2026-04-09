'use client';

import { useState, useEffect } from 'react';

export default function AIControl() {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('friendly');
  const [resultLimit, setResultLimit] = useState(5);
  const [sponsoredPriority, setSponsoredPriority] = useState(true);
  const [mixAdsOrganic, setMixAdsOrganic] = useState(true);

  useEffect(() => {
    // Load current settings (mock for now)
    setPrompt(`You are ManasaGPT, an AI assistant for the city of Manasa. Help users find shops, products, places, and information about the city. Be helpful, accurate, and engaging.`);
  }, []);

  const handleSave = async () => {
    // Save to backend (implement API later)
    alert('AI settings saved!');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">AI Control Panel</h2>

      {/* Prompt Editor */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">System Prompt</h3>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="bg-gray-700 p-3 rounded w-full h-32 resize-none"
          placeholder="Enter the system prompt for the AI..."
        />
      </div>

      {/* AI Settings */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">AI Behavior Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Response Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="bg-gray-700 p-2 rounded w-full"
            >
              <option value="premium">Premium</option>
              <option value="friendly">Friendly</option>
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Result Limit</label>
            <input
              type="number"
              value={resultLimit}
              onChange={(e) => setResultLimit(parseInt(e.target.value))}
              className="bg-gray-700 p-2 rounded w-full"
              min="1"
              max="20"
            />
          </div>
        </div>
      </div>

      {/* Smart Toggles */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Smart Features</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Sponsored Content Priority</h4>
              <p className="text-sm text-gray-400">Show sponsored shops/products higher in results</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={sponsoredPriority}
                onChange={(e) => setSponsoredPriority(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Mix Ads with Organic Results</h4>
              <p className="text-sm text-gray-400">Blend sponsored content naturally with regular results</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={mixAdsOrganic}
                onChange={(e) => setMixAdsOrganic(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium"
        >
          Save AI Settings
        </button>
      </div>
    </div>
  );
}