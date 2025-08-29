'use client';

import { useState } from 'react';

export default function TestScrapingPage() {
  const [symbol, setSymbol] = useState('HDFCBANK.NS');
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAllMethods = async () => {
    setLoading(true);
    setError(null);
    setResults({});

    try {
      const methods = [
        { name: 'Yahoo Finance API', url: `/api/yahoo-finance?symbol=${encodeURIComponent(symbol)}` },
        { name: 'Web Scraping Fallback', url: `/api/scrape-fallback?symbol=${encodeURIComponent(symbol)}` }
      ];

      const results: any = {};

      for (const method of methods) {
        try {
          const response = await fetch(method.url);
          const data = await response.json();
          
          if (response.ok && !data.error) {
            results[method.name] = {
              success: true,
              data,
              status: response.status
            };
          } else {
            results[method.name] = {
              success: false,
              error: data.error || 'Request failed',
              status: response.status
            };
          }
        } catch (err) {
          results[method.name] = {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
            status: 'Error'
          };
        }
      }

      setResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Test Web Scraping & API Methods</h1>
      
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
        onClick={testAllMethods}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test All Methods'}
      </button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {Object.keys(results).length > 0 && (
        <div className="mt-6 space-y-4">
          <h2 className="text-xl font-semibold">Results:</h2>
          
          {Object.entries(results).map(([methodName, result]: [string, any]) => (
            <div 
              key={methodName}
              className={`p-4 rounded-lg border ${
                result.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <h3 className="font-semibold mb-2">
                {methodName}
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  result.success 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {result.success ? 'SUCCESS' : 'FAILED'}
                </span>
              </h3>
              
              {result.success ? (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Status: {result.status}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Current Price:</strong> ₹{result.data.currentPrice}
                    </div>
                    <div>
                      <strong>Change:</strong> ₹{result.data.change}
                    </div>
                    <div>
                      <strong>Change %:</strong> {result.data.changePercent?.toFixed(2)}%
                    </div>
                    <div>
                      <strong>Source:</strong> {result.data.source}
                    </div>
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-600">View Full Response</summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Status: {result.status}</p>
                  <p className="text-red-600">{result.error}</p>
                </div>
              )}
            </div>
          ))}
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
        
        <h3 className="font-bold mt-4 mb-2">Scraping Sources:</h3>
        <ul className="text-sm space-y-1">
          <li><strong>Yahoo Finance API:</strong> Direct API calls (fastest)</li>
          <li><strong>Advanced Scraping:</strong> Screener.in, TradingView, Yahoo Finance (most reliable)</li>
          <li><strong>Basic Scraping:</strong> MoneyControl, NSE India, BSE India (fallback)</li>
        </ul>
      </div>
    </div>
  );
}
