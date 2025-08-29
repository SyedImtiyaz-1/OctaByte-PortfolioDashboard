'use client';

import React from 'react';
import { HybridStockData } from '@/services/realTimeStockService';

// Inline formatting functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

const getGainLossColor = (gainLoss: number): string => {
  if (gainLoss > 0) return 'text-green-600';
  if (gainLoss < 0) return 'text-red-600';
  return 'text-gray-600';
};

interface StockDetailModalProps {
  stock: HybridStockData | null;
  isOpen: boolean;
  onClose: () => void;
}

const StockDetailModal: React.FC<StockDetailModalProps> = ({ stock, isOpen, onClose }) => {
  if (!stock || !isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-3xl text-green-600 font-bold">₹</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{stock.baseData.Particulars}</h2>
                <p className="text-lg text-gray-600 font-mono">{stock.baseData['NSE/BSE']}</p>
              </div>
              <div className="text-3xl text-green-600 font-bold">₹</div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current Market Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
              <h3 className="text-sm font-medium text-blue-600 mb-2">Current Market Price</h3>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(stock.calculated.currentCMP)}</p>
              <p className="text-sm text-blue-600 mt-1">Live from Yahoo Finance</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
              <h3 className="text-sm font-medium text-green-600 mb-2">Present Value</h3>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(stock.calculated.presentValue)}</p>
              <p className="text-sm text-green-600 mt-1">CMP × {stock.baseData.Qty} shares</p>
            </div>
            
            <div className={`rounded-lg p-4 border-l-4 ${
              stock.calculated.gainLoss >= 0 ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
            }`}>
              <h3 className={`text-sm font-medium mb-2 ${
                stock.calculated.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>Gain/Loss</h3>
              <p className={`text-2xl font-bold ${
                stock.calculated.gainLoss >= 0 ? 'text-green-900' : 'text-red-900'
              }`}>{formatCurrency(stock.calculated.gainLoss)}</p>
              <p className={`text-sm mt-1 ${
                stock.calculated.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>{formatPercentage(stock.calculated.gainLossPercent)}</p>
            </div>
          </div>

          {/* Portfolio Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Purchase Price:</span>
                  <span className="font-medium">{formatCurrency(stock.baseData['Purchase Price'] || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{(stock.baseData.Qty || 0).toLocaleString()} shares</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Investment:</span>
                  <span className="font-medium">{formatCurrency(stock.baseData.Investment || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Portfolio Weight:</span>
                  <span className="font-medium">{formatPercentage(stock.calculated.portfolioPercentage)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Data</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Market Cap:</span>
                  <span className="font-medium">{formatCurrency(stock.baseData['Market Cap'] || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">P/E Ratio:</span>
                  <span className={`font-medium ${(stock.baseData['P/E (TTM)'] || 0) > 50 ? 'text-red-600' : ''}`}>
                    {(stock.baseData['P/E (TTM)'] || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Latest Earnings:</span>
                  <span className="font-medium">₹{(stock.baseData['Latest Earnings'] || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Book Value:</span>
                  <span className="font-medium">₹{(stock.baseData['Book Value'] || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Debt/Equity:</span>
                  <span className="font-medium">{(stock.baseData['Debt to Equity'] || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Core Fundamentals */}
          <div className="bg-blue-50 rounded-lg p-4 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Core Fundamentals</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-blue-700">Revenue (TTM):</span>
                  <span className="font-medium">{formatCurrency(stock.baseData['Core Fundamentals'] || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">EBITDA (TTM):</span>
                  <span className="font-medium">{formatCurrency(stock.baseData['EBITDA\n(TTM)'] || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">EBITDA (%):</span>
                  <span className="font-medium">{formatPercentage(stock.baseData['EBITDA (%)'] || 0)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-blue-700">PAT:</span>
                  <span className={`font-medium ${(stock.baseData.PAT || 0) < 0 ? 'text-red-600' : ''}`}>
                    {formatCurrency(stock.baseData.PAT || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">PAT (%):</span>
                  <span className="font-medium">{formatPercentage(stock.baseData['PAT (%)'] || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">CFO (March):</span>
                  <span className={`font-medium ${(stock.baseData['CFO (March 24)'] || 0) < 0 ? 'text-red-600' : ''}`}>
                    {formatCurrency(stock.baseData['CFO (March 24)'] || 0)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-blue-700">CFO (3Y):</span>
                  <span className="font-medium">{formatCurrency(stock.baseData['CFO \n(5 years)'] || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Free Cash Flow:</span>
                  <span className={`font-medium ${(stock.baseData['Free Cash Flow\n(5 years)'] || 0) < 0 ? 'text-red-600' : ''}`}>
                    {formatCurrency(stock.baseData['Free Cash Flow\n(5 years)'] || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Price/Book:</span>
                  <span className={`font-medium ${(stock.baseData['Price to book'] || 0) > 10 ? 'text-red-600' : ''}`}>
                    {(stock.baseData['Price to book'] || 0).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Growth Metrics */}
          <div className="bg-green-50 rounded-lg p-4 mb-8">
            <h3 className="text-lg font-semibold text-green-900 mb-4">Growth (3 Years)</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-green-600 mb-1">Revenue Growth</p>
                <p className="text-xl font-bold text-green-900">{formatPercentage(stock.baseData['Growth (3 years'] || 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-green-600 mb-1">EBITDA Growth</p>
                <p className="text-xl font-bold text-green-900">{formatPercentage(stock.baseData.EBITDA || 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-green-600 mb-1">Profit Growth</p>
                <p className="text-xl font-bold text-green-900">{formatPercentage(stock.baseData.Profit || 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-green-600 mb-1">Market Cap Growth</p>
                <p className="text-xl font-bold text-green-900">{formatPercentage(stock.baseData['Market\nCap'] || 0)}</p>
              </div>
            </div>
          </div>

          {/* Valuation & Decision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">Valuation Ratios</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-purple-700">Price/Sales:</span>
                  <span className={`font-medium ${(stock.baseData['Price to Sales'] || 0) > 5 ? 'text-red-600' : ''}`}>
                    {(stock.baseData['Price to Sales'] || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">CFO/EBITDA:</span>
                  <span className={`font-medium ${(stock.baseData['CFO to EBITDA'] || 0) < 0 ? 'text-red-600' : ''}`}>
                    {formatPercentage(stock.baseData['CFO to EBITDA'] || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">CFO/PAT:</span>
                  <span className={`font-medium ${(stock.baseData['CFO to PAT'] || 0) < 0 ? 'text-red-600' : ''}`}>
                    {formatPercentage(stock.baseData['CFO to PAT'] || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-orange-900 mb-4">Investment Decision</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-orange-700">Stage-2:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    stock.baseData['Stage-2'] === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {stock.baseData['Stage-2'] || 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-700">Sale Price:</span>
                  <span className="font-medium">
                    {(stock.baseData['Sale price'] || 0) > 0 ? formatCurrency(stock.baseData['Sale price'] || 0) : 'Not Set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-700">Recommendation:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    (stock.baseData.Abhishek || '').includes('Exit') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {stock.baseData.Abhishek || 'Hold'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Data updates every 15 seconds • Last updated: {new Date().toLocaleString()}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetailModal;

