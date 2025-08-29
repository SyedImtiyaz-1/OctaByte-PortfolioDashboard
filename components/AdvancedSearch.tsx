'use client';

import React from 'react';

interface SearchFilters {
  query: string;
  gainLoss: string;
  stage2: string;
  abhishekCall: string;
  priceRange: string;
}

interface AdvancedSearchProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
  totalResults: number;
}

export default function AdvancedSearch({ filters, onFiltersChange, onClearFilters, totalResults }: AdvancedSearchProps) {
  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white rounded-lg border p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
        <div className="text-sm text-gray-600">
          {totalResults} results found
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Gain/Loss Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Performance</label>
          <select
            value={filters.gainLoss}
            onChange={(e) => handleFilterChange('gainLoss', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">All</option>
            <option value="Gain">Gain</option>
            <option value="Loss">Loss</option>
          </select>
        </div>

        {/* Stage-2 Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stage-2</label>
          <select
            value={filters.stage2}
            onChange={(e) => handleFilterChange('stage2', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">All</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {/* Abhishek's Call Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Abhishek's Call</label>
          <select
            value={filters.abhishekCall}
            onChange={(e) => handleFilterChange('abhishekCall', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All Calls">All Calls</option>
            <option value="Hold">Hold</option>
            <option value="Exit">Exit</option>
          </select>
        </div>

        {/* Price Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
          <select
            value={filters.priceRange}
            onChange={(e) => handleFilterChange('priceRange', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All Prices">All Prices</option>
            <option value="Under ₹100">Under ₹100</option>
            <option value="₹100 - ₹500">₹100 - ₹500</option>
            <option value="₹500 - ₹1000">₹500 - ₹1000</option>
            <option value="₹1000 - ₹5000">₹1000 - ₹5000</option>
            <option value="Above ₹5000">Above ₹5000</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        <div className="flex items-end">
          <button
            onClick={onClearFilters}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}
