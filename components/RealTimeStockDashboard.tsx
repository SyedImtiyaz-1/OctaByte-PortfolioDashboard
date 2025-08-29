'use client';

import React, { useState, useEffect } from 'react';
import { RealTimeStockService, HybridStockData } from '@/services/realTimeStockService';
import AdvancedSearch from './AdvancedSearch';

interface RealTimeStockDashboardProps {
  portfolioData: any[];
}

interface SearchFilters {
  query: string;
  gainLoss: string;
  stage2: string;
  abhishekCall: string;
  priceRange: string;
}

export default function RealTimeStockDashboard({ portfolioData }: RealTimeStockDashboardProps) {
  const [hybridData, setHybridData] = useState<HybridStockData[]>([]);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    gainLoss: 'All',
    stage2: 'All',
    abhishekCall: 'All Calls',
    priceRange: 'All Prices'
  });
  const [selectedStock, setSelectedStock] = useState<HybridStockData | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  const realTimeService = RealTimeStockService.getInstance();

  // Initialize hybrid data from Excel base
  useEffect(() => {
    const initializeHybridData = async () => {
      const individualStocks = portfolioData.filter(stock => 
        stock.No !== null && 
        stock.Particulars && 
        stock.Particulars !== 'Particulars' &&
        !stock.Particulars.includes('Sector') &&
        stock.Particulars !== null
      );

      // Create hybrid data with live prices
      const hybrid = await Promise.all(
        individualStocks.map(async (stock) => 
          await realTimeService.createHybridData(stock)
        )
      );

      setHybridData(hybrid);
      setLoading(false);
    };

    initializeHybridData();
  }, [portfolioData]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (hybridData.length === 0) return;

    const unsubscribe = realTimeService.subscribe((updatedData) => {
      setHybridData(updatedData);
      setLastUpdate(new Date());
    });

    // Start real-time updates
    setIsLive(true);
    realTimeService.startRealTimeUpdates(hybridData);

    return () => {
      unsubscribe();
      realTimeService.stopRealTimeUpdates();
      setIsLive(false);
    };
  }, [hybridData]);

  // Apply search and filters
  const getFilteredStocks = () => {
    let filtered = hybridData;

    // Text search - Show only matching stocks
    if (searchFilters.query.trim()) {
      const query = searchFilters.query.toLowerCase().trim();
      
      // Find all stocks that contain the search query (more inclusive search)
      filtered = filtered.filter(stock =>
        stock.baseData.Particulars?.toLowerCase().includes(query) ||
        stock.baseData['NSE/BSE']?.toString().toLowerCase().includes(query)
      );
      
      // If search has results, return only those stocks (ignore other filters when searching)
      if (filtered.length > 0) {
        return filtered;
      }
    }

    // Apply other filters only when not searching
    if (!searchFilters.query.trim()) {
      // Gain/Loss filter
      if (searchFilters.gainLoss !== 'All') {
        if (searchFilters.gainLoss === 'Gain') {
          filtered = filtered.filter(stock => stock.calculated.gainLoss > 0);
        } else if (searchFilters.gainLoss === 'Loss') {
          filtered = filtered.filter(stock => stock.calculated.gainLoss < 0);
        }
      }

      // Stage-2 filter
      if (searchFilters.stage2 !== 'All') {
        filtered = filtered.filter(stock => 
          stock.baseData['Stage-2'] === searchFilters.stage2
        );
      }

      // Abhishek's call filter
      if (searchFilters.abhishekCall !== 'All Calls') {
        filtered = filtered.filter(stock => 
          stock.baseData.Abhishek === searchFilters.abhishekCall
        );
      }

      // Price range filter
      if (searchFilters.priceRange !== 'All Prices') {
        filtered = filtered.filter(stock => {
          const price = stock.calculated.currentCMP;
          switch (searchFilters.priceRange) {
            case 'Under ₹1000':
              return price < 1000;
            case '₹1000 - ₹5000':
              return price >= 1000 && price < 5000;
            case '₹5000 - ₹10000':
              return price >= 5000 && price < 10000;
            case 'Above ₹10000':
              return price >= 10000;
            default:
              return true;
          }
        });
      }
    }

    return filtered;
  };

  const filteredStocks = getFilteredStocks();

  const handleFiltersChange = (newFilters: Partial<SearchFilters>) => {
    setSearchFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setSearchFilters({
      query: '',
      gainLoss: 'All',
      stage2: 'All',
      abhishekCall: 'All Calls',
      priceRange: 'All Prices'
    });
  };

  const handleManualRefresh = async () => {
    setLoading(true);
    try {
      const individualStocks = portfolioData.filter(stock => 
        stock.No !== null && 
        stock.Particulars && 
        stock.Particulars !== 'Particulars' &&
        !stock.Particulars.includes('Sector') &&
        stock.Particulars !== null
      );

      const updatedHybridData = await Promise.all(
        individualStocks.map(async (stock) => 
          await realTimeService.createHybridData(stock)
        )
      );
      setHybridData(updatedHybridData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading live stock data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Real-Time Stock Dashboard</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Total Stocks: {hybridData.length}</span>
              <span>Last Update: {lastUpdate.toLocaleTimeString()}</span>
              <div className="flex items-center gap-2">
                {isLive ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                    LIVE - Auto-updating every 15s
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                    STATIC - No live updates
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search stocks by name or symbol..."
              value={searchFilters.query}
              onChange={(e) => {
                const query = e.target.value;
                setSearchFilters(prev => ({ ...prev, query }));
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {searchFilters.query.trim() && (
            <button
              onClick={() => setSearchFilters(prev => ({ ...prev, query: '' }))}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ✕ Clear Search
            </button>
          )}
          <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-sm">
            {filteredStocks.length} Stocks Found
          </span>
        </div>
      </div>

      {/* Advanced Search */}
      <AdvancedSearch
        filters={searchFilters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        totalResults={filteredStocks.length}
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          Showing {filteredStocks.length} of {hybridData.length} stocks
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select className="text-sm border border-gray-300 rounded px-2 py-1">
            <option>Name A-Z</option>
            <option>Name Z-A</option>
            <option>Gain/Loss High-Low</option>
            <option>Gain/Loss Low-High</option>
            <option>Investment High-Low</option>
            <option>Investment Low-High</option>
          </select>
        </div>
      </div>

      {/* Individual Stock Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredStocks.map((stock) => (
          <div 
            key={stock.baseData.No} 
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-500"
            onClick={() => setSelectedStock(stock)}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg text-gray-800">
                  {stock.baseData.Particulars}
                </h3>
                <p className="text-sm text-gray-600">{stock.baseData['NSE/BSE']}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  {stock.liveData ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                      LIVE
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                      STATIC
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-sm text-gray-600">Purchase Price</p>
                <p className="font-semibold text-gray-800">₹{stock.baseData['Purchase Price']?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current CMP</p>
                <p className={`font-bold text-lg ${
                  stock.liveData ? 'text-green-600' : 'text-gray-600'
                }`}>
                  ₹{stock.calculated.currentCMP?.toLocaleString()}
                  {stock.liveData && (
                    <span className="ml-2 text-xs text-green-600">
                      (Live)
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-sm text-gray-600">Quantity</p>
                <p className="font-semibold text-gray-800">{stock.baseData.Qty}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Present Value</p>
                <p className="font-semibold text-gray-800">₹{stock.calculated.presentValue?.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Gain/Loss</span>
                <div className="text-right">
                  <p className={`font-bold ${
                    stock.calculated.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ₹{Math.abs(stock.calculated.gainLoss)?.toLocaleString()}
                  </p>
                  <p className={`text-sm ${
                    stock.calculated.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stock.calculated.gainLoss >= 0 ? '+' : '-'}{Math.abs(stock.calculated.gainLossPercent)?.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results Message */}
      {filteredStocks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No stocks found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search criteria or filters
          </p>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Stock Detail Modal */}
      {selectedStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedStock.baseData.Particulars} - Live Analysis
                </h2>
                <button 
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                  onClick={() => setSelectedStock(null)}
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Performance */}
                <div className="space-y-4">
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                      <span>📈</span>
                      <span>Live Performance</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Purchase Price</div>
                        <div className="text-lg font-semibold">₹{selectedStock.baseData['Purchase Price']?.toFixed(2) || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Live CMP</div>
                        <div className="text-lg font-semibold text-blue-600">₹{selectedStock.calculated.currentCMP.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Gain/Loss</div>
                        <div className={`text-lg font-semibold ${
                          selectedStock.calculated.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ₹{Math.abs(selectedStock.calculated.gainLoss).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Gain/Loss %</div>
                        <div className={`text-lg font-semibold ${
                          selectedStock.calculated.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {selectedStock.calculated.gainLoss >= 0 ? '+' : '-'}{Math.abs(selectedStock.calculated.gainLossPercent).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                      <span>💰</span>
                      <span>Investment Details</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Quantity</div>
                        <div className="text-lg font-semibold">{selectedStock.baseData.Qty}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Total Investment</div>
                        <div className="text-lg font-semibold text-blue-600">₹{selectedStock.baseData.Investment?.toLocaleString() || 0}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Live Value</div>
                        <div className="text-lg font-semibold text-green-600">₹{selectedStock.calculated.presentValue.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Portfolio %</div>
                        <div className="text-lg font-semibold text-purple-600">{selectedStock.calculated.portfolioPercentage.toFixed(2)}%</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Live Data & Fundamentals */}
                <div className="space-y-4">
                  {/* Live Market Data */}
                  {selectedStock.liveData && (
                    <div className="bg-white rounded-lg border p-4">
                      <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                        <span>🔄</span>
                        <span>Live Market Data</span>
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Current Price</div>
                          <div className="text-lg font-semibold text-blue-600">₹{selectedStock.liveData.currentPrice.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Previous Close</div>
                          <div className="text-lg font-semibold">₹{selectedStock.liveData.previousClose.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Change</div>
                          <div className={`text-lg font-semibold ${
                            selectedStock.liveData.change >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {selectedStock.liveData.change >= 0 ? '+' : ''}{selectedStock.liveData.change.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Change %</div>
                          <div className={`text-lg font-semibold ${
                            selectedStock.liveData.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {selectedStock.liveData.changePercent >= 0 ? '+' : ''}{selectedStock.liveData.changePercent.toFixed(2)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Volume</div>
                          <div className="text-lg font-semibold">{selectedStock.liveData.volume.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Last Updated</div>
                          <div className="text-sm font-medium">{selectedStock.liveData.lastUpdated.toLocaleTimeString()}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Excel Fundamentals */}
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                      <span>📊</span>
                      <span>Excel Fundamentals</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">P/E (TTM)</div>
                        <div className="text-lg font-semibold">{selectedStock.baseData['P/E (TTM)']?.toFixed(2) || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Price to Book</div>
                        <div className="text-lg font-semibold">{selectedStock.baseData['Price to book']?.toFixed(2) || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Market Cap</div>
                        <div className="text-lg font-semibold">₹{selectedStock.baseData['Market Cap']?.toLocaleString() || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Book Value</div>
                        <div className="text-lg font-semibold">₹{selectedStock.baseData['Book Value']?.toFixed(2) || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Decision Indicators */}
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                      <span>🎯</span>
                      <span>Decision Indicators</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Stage-2</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedStock.baseData['Stage-2'] === 'Yes' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedStock.baseData['Stage-2'] || 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Abhishek's Call</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedStock.baseData.Abhishek === 'Exit' ? 'bg-red-100 text-red-800' :
                          selectedStock.baseData.Abhishek === 'Buy' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedStock.baseData.Abhishek || 'Hold'}
                        </span>
                      </div>
                      {selectedStock.baseData['Sale price'] && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Sale Price</span>
                          <span className="text-lg font-semibold text-red-600">
                            ₹{selectedStock.baseData['Sale price'].toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
