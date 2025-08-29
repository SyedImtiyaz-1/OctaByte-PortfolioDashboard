'use client';

import React, { useState, useEffect } from 'react';
import { RealTimeStockService, HybridStockData } from '@/services/realTimeStockService';
import AdvancedSearch from './AdvancedSearch';

interface RealTimeStockDashboardProps {
  portfolioData: any[];
}

interface SearchFilters {
  query: string;
  sector: string;
  gainLoss: string;
  stage2: string;
  abhishekCall: string;
  priceRange: string;
}

export default function RealTimeStockDashboard({ portfolioData }: RealTimeStockDashboardProps) {
  const [hybridData, setHybridData] = useState<HybridStockData[]>([]);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    sector: 'All Sectors',
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
    const initializeHybridData = () => {
      const individualStocks = portfolioData.filter(stock => 
        stock.No !== null && 
        stock.Particulars && 
        stock.Particulars !== 'Particulars' &&
        !stock.Particulars.includes('Sector') &&
        stock.Particulars !== null
      );

      const hybrid = individualStocks.map(stock => 
        realTimeService.createHybridData(stock)
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
      // Sector filter
      if (searchFilters.sector !== 'All Sectors') {
        filtered = filtered.filter(stock => {
          const stockName = stock.baseData.Particulars?.toLowerCase() || '';
          if (searchFilters.sector === 'Financial Sector') {
            return stockName.includes('bank') || stockName.includes('finance') || stockName.includes('hdfc') || stockName.includes('icici') || stockName.includes('bajaj') || stockName.includes('savi');
          }
          if (searchFilters.sector === 'Tech Sector') {
            return stockName.includes('tech') || stockName.includes('infosys') || stockName.includes('tcs') || stockName.includes('mindtree') || stockName.includes('kpitt') || stockName.includes('affle') || stockName.includes('tanla');
          }
          if (searchFilters.sector === 'Consumer Sector') {
            return stockName.includes('dmart') || stockName.includes('nestle') || stockName.includes('tata consumer') || stockName.includes('pidilite');
          }
          if (searchFilters.sector === 'Power Sector') {
            return stockName.includes('power') || stockName.includes('suzlon') || stockName.includes('green') || stockName.includes('gensol');
          }
          if (searchFilters.sector === 'Green Sector') {
            return stockName.includes('gas') || stockName.includes('pipes') || stockName.includes('astral') || stockName.includes('polyplex') || stockName.includes('harion');
          }
          if (searchFilters.sector === 'Chemical Sector') {
            return stockName.includes('science') || stockName.includes('nitrite') || stockName.includes('organic') || stockName.includes('fine organic') || stockName.includes('gravita') || stockName.includes('grinwell');
          }
          if (searchFilters.sector === 'Insurance') {
            return stockName.includes('life') || stockName.includes('sbi');
          }
          if (searchFilters.sector === 'Exit Stocks') {
            return stockName.includes('irfly') || stockName.includes('happiest') || stockName.includes('essentivitiy') || stockName.includes('easemytrip');
          }
          return true;
        });
      }

      // Gain/Loss filter
      if (searchFilters.gainLoss !== 'All') {
        if (searchFilters.gainLoss === 'Gainers Only') {
          filtered = filtered.filter(stock => stock.calculated.gainLoss > 0);
        } else if (searchFilters.gainLoss === 'Losers Only') {
          filtered = filtered.filter(stock => stock.calculated.gainLoss < 0);
        } else if (searchFilters.gainLoss === 'Break Even') {
          filtered = filtered.filter(stock => stock.calculated.gainLoss === 0);
        }
      }

      // Stage-2 filter
      if (searchFilters.stage2 !== 'All') {
        if (searchFilters.stage2 === 'Stage-2 Yes') {
          filtered = filtered.filter(stock => stock.baseData['Stage-2'] === 'Yes');
        } else if (searchFilters.stage2 === 'Stage-2 No') {
          filtered = filtered.filter(stock => stock.baseData['Stage-2'] !== 'Yes');
        }
      }

      // Abhishek's call filter
      if (searchFilters.abhishekCall !== 'All Calls') {
        filtered = filtered.filter(stock => {
          const abhishekCall = stock.baseData.Abhishek?.toLowerCase() || '';
          if (searchFilters.abhishekCall === 'Hold') {
            return abhishekCall === 'hold' || abhishekCall === '';
          } else if (searchFilters.abhishekCall === 'Exit') {
            return abhishekCall.includes('exit');
          } else if (searchFilters.abhishekCall === 'Must Exit') {
            return abhishekCall.includes('must exit');
          }
          return true;
        });
      }

      // Price range filter
      if (searchFilters.priceRange !== 'All Prices') {
        filtered = filtered.filter(stock => {
          const price = stock.calculated.currentCMP;
          switch (searchFilters.priceRange) {
            case 'Under ₹100':
              return price < 100;
            case '₹100 - ₹500':
              return price >= 100 && price < 500;
            case '₹500 - ₹1000':
              return price >= 500 && price < 1000;
            case '₹1000 - ₹5000':
              return price >= 1000 && price < 5000;
            case 'Above ₹5000':
              return price >= 5000;
            default:
              return true;
          }
        });
      }
    }

    return filtered;
  };

  // Get search match indicator
  const getSearchMatchIndicator = (stock: HybridStockData) => {
    if (!searchFilters.query.trim()) return null;
    
    return (
      <div className="text-xs font-medium text-blue-600 mt-1">
        🔍 Search Match
      </div>
    );
  };

  const filteredStocks = getFilteredStocks();

  const handleFiltersChange = (filters: SearchFilters) => {
    setSearchFilters(filters);
  };

  const handleClearFilters = () => {
    setSearchFilters({
      query: '',
      sector: 'All Sectors',
      gainLoss: 'All',
      stage2: 'All',
      abhishekCall: 'All Calls',
      priceRange: 'All Prices'
    });
  };

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(2)}K`;
    return `₹${value.toFixed(2)}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getGainLossColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGainLossIcon = (value: number) => {
    if (value > 0) return '📈';
    if (value < 0) return '📉';
    return '📊';
  };

  const getAbhishekColor = (value: string | null) => {
    if (!value) return 'bg-gray-100 text-gray-800';
    if (value.includes('Exit') || value.includes('exit')) return 'bg-red-100 text-red-800';
    if (value.includes('Hold')) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  const getLiveDataIndicator = (stock: HybridStockData) => {
    if (!stock.liveData) return 'Live Data';
    
    const change = stock.liveData.change;
    if (change > 0) return '🟢 Live +' + change.toFixed(2);
    if (change < 0) return '🔴 Live ' + change.toFixed(2);
    return '⚪ Live 0.00';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Initializing real-time dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Dashboard Title and Status */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Real-Time Stock Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Live portfolio tracking with {hybridData.length} stocks • Updates every 15 seconds
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>🕐</span>
              <span>Last Update: {lastUpdate.toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isLive 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {isLive ? '🟢 Live Updates' : '🔴 Offline'}
              </span>
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
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 p-4"
              style={{
                borderLeftColor: stock.calculated.gainLoss > 0 ? '#10b981' : 
                                 stock.calculated.gainLoss < 0 ? '#ef4444' : '#6b7280'
              }}
              onClick={() => setSelectedStock(stock)}
            >
              {/* Stock Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {stock.baseData.Particulars}
                  </h3>
                  <p className="text-sm text-gray-600 font-mono">
                    {stock.baseData['NSE/BSE']}
                  </p>
                  {/* Live Data Indicator */}
                  <div className="text-xs font-medium text-blue-600 mt-1">
                    {getLiveDataIndicator(stock)}
                  </div>
                  {/* Search Match Indicator */}
                  {getSearchMatchIndicator(stock)}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAbhishekColor(stock.baseData.Abhishek)}`}>
                  {stock.baseData.Abhishek || 'Hold'}
                </span>
              </div>

              {/* Price and Performance */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Live CMP</span>
                  <span className="text-lg font-bold text-blue-600">
                    ₹{stock.calculated.currentCMP.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Purchase</span>
                  <span className="text-sm text-gray-700">
                    ₹{stock.baseData['Purchase Price']?.toFixed(2) || 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Gain/Loss</span>
                  <div className="flex items-center space-x-1">
                    <span>{getGainLossIcon(stock.calculated.gainLoss)}</span>
                    <span className={`font-semibold ${getGainLossColor(stock.calculated.gainLoss)}`}>
                      {formatCurrency(stock.calculated.gainLoss)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Gain/Loss %</span>
                  <span className={`font-semibold ${getGainLossColor(stock.calculated.gainLossPercent)}`}>
                    {formatPercentage(stock.calculated.gainLossPercent)}
                  </span>
                </div>
              </div>

              {/* Investment Details */}
              <div className="space-y-2 pt-3 border-t mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Quantity</span>
                  <span className="text-sm font-medium">{stock.baseData.Qty}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Investment</span>
                  <span className="text-sm font-medium text-blue-600">
                    {formatCurrency(stock.baseData.Investment || 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Present Value</span>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(stock.calculated.presentValue)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Portfolio %</span>
                  <span className="text-sm font-medium text-purple-600">
                    {formatPercentage(stock.calculated.portfolioPercentage)}
                  </span>
                </div>
              </div>

              {/* Live Data Status */}
              {stock.liveData && (
                <div className="space-y-2 pt-3 border-t mb-4">
                  <div className="text-xs text-gray-500 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <span>🔄</span>
                      <span>Live: {stock.liveData.lastUpdated.toLocaleTimeString()}</span>
                    </div>
                    <div className="mt-1">
                      <span className={`text-xs ${stock.liveData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stock.liveData.change >= 0 ? '+' : ''}{stock.liveData.change.toFixed(2)} 
                        ({stock.liveData.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button 
                className="w-full mt-3 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStock(stock);
                }}
              >
                👁️ View Details
              </button>
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
      </div>

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
                        <div className={`text-lg font-semibold ${getGainLossColor(selectedStock.calculated.gainLoss)}`}>
                          {formatCurrency(selectedStock.calculated.gainLoss)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Gain/Loss %</div>
                        <div className={`text-lg font-semibold ${getGainLossColor(selectedStock.calculated.gainLossPercent)}`}>
                          {formatPercentage(selectedStock.calculated.gainLossPercent)}
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
                        <div className="text-lg font-semibold text-blue-600">{formatCurrency(selectedStock.baseData.Investment || 0)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Live Value</div>
                        <div className="text-lg font-semibold text-green-600">{formatCurrency(selectedStock.calculated.presentValue)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Portfolio %</div>
                        <div className="text-lg font-semibold text-purple-600">{formatPercentage(selectedStock.calculated.portfolioPercentage)}</div>
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
                          <div className={`text-lg font-semibold ${getGainLossColor(selectedStock.liveData.change)}`}>
                            {selectedStock.liveData.change >= 0 ? '+' : ''}{selectedStock.liveData.change.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Change %</div>
                          <div className={`text-lg font-semibold ${getGainLossColor(selectedStock.liveData.changePercent)}`}>
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
                        <div className="text-lg font-semibold">{formatCurrency(selectedStock.baseData['Market Cap'] || 0)}</div>
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAbhishekColor(selectedStock.baseData.Abhishek)}`}>
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
