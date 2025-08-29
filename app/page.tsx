'use client';

import { useEffect, useState } from 'react';
import RealTimeStockDashboard from '@/components/RealTimeStockDashboard';
import { PortfolioService, StockData } from '@/services/portfolioService';
import Navbar from '@/components/Navbar';

export default function Home() {
  const [portfolioData, setPortfolioData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [portfolioSummary, setPortfolioSummary] = useState({
    totalStocks: 0,
    totalInvestment: 0,
    totalPresentValue: 0,
    totalGainLoss: 0,
    totalGainLossPercent: 0
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const portfolioService = PortfolioService.getInstance();
        await portfolioService.loadPortfolioData();
        
        const stocks = portfolioService.getIndividualStocks();
        setPortfolioData(stocks);
        
        const summary = portfolioService.getPortfolioSummary();
        setPortfolioSummary(summary);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading portfolio data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <Navbar
        totalStocks={portfolioSummary.totalStocks}
        isLive={true}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Portfolio Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Total Stocks</h3>
              <span>📊</span>
            </div>
            <div className="text-2xl font-bold">{portfolioSummary.totalStocks}</div>
            <p className="text-xs text-gray-500 mt-1">
              Individual stocks in portfolio
            </p>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Total Investment</h3>
              <span>💰</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(portfolioSummary.totalInvestment)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total amount invested
            </p>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Present Value</h3>
              <span>📈</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(portfolioSummary.totalPresentValue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Current portfolio value
            </p>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Total Gain/Loss</h3>
              <span>{getGainLossIcon(portfolioSummary.totalGainLoss)}</span>
            </div>
            <div className={`text-2xl font-bold ${getGainLossColor(portfolioSummary.totalGainLoss)}`}>
              {formatCurrency(portfolioSummary.totalGainLoss)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatPercentage(portfolioSummary.totalGainLossPercent)} return
            </p>
          </div>
        </div>

        {/* Real-Time Stock Dashboard */}
        <RealTimeStockDashboard portfolioData={portfolioData} />
      </div>
    </div>
  );
}
