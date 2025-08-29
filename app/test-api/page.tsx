'use client';

import { useState } from 'react';

export default function TestAPIPage() {
  const [symbol, setSymbol] = useState('HDFCBANK.NS');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/yahoo-finance?symbol=${encodeURIComponent(symbol)}`);
      const data = await response.json();
      
      if (response.ok && !data.error) {
        setResult(data);
      } else {
        setError(data.error || 'API call failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Test Yahoo Finance API</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Symbol:</label>
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="e.g., HDFCBANK.NS, TCS.NS"
        />
      </div>
      
      <button
        onClick={testAPI}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test API'}
      </button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {result && (
        <div className="mt-6 p-4 bg-green-100 border border-green-400 rounded">
          <h3 className="font-bold mb-2">API Response:</h3>
          <pre className="text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">Test Symbols:</h3>
        <ul className="text-sm space-y-1">
          <li>HDFCBANK.NS - HDFC Bank</li>
          <li>TCS.NS - Tata Consultancy Services</li>
          <li>INFY.NS - Infosys</li>
          <li>RELIANCE.NS - Reliance Industries</li>
          <li>BAJFINANCE.NS - Bajaj Finance</li>
        </ul>
      </div>
    </div>
  );
}
