'use client';

import React from 'react';

interface NavbarProps {
  totalStocks: number;
  isLive: boolean;
}

export default function Navbar({ totalStocks, isLive }: NavbarProps) {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">8Byte Portfolio</h1>
          </div>

          {/* Status and Info */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {totalStocks} Stocks
            </div>
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isLive 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {isLive ? '🟢 Live' : '🔴 Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
