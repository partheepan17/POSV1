import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Calendar,
  Filter,
  Download,
  Package
} from 'lucide-react';
import axios from 'axios';

const Analytics = () => {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end_date: new Date().toISOString().split('T')[0] // today
  });
  const [selectedStore, setSelectedStore] = useState('');

  const { data: salesAnalytics, isLoading: salesLoading } = useQuery(
    ['sales-analytics', dateRange, selectedStore],
    () => axios.get('/analytics/sales', {
      params: {
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        store_id: selectedStore || undefined
      }
    }).then(res => res.data),
    { staleTime: 60000 }
  );

  const { data: inventoryAnalytics, isLoading: inventoryLoading } = useQuery(
    ['inventory-analytics', selectedStore],
    () => axios.get('/analytics/inventory', {
      params: { store_id: selectedStore || undefined }
    }).then(res => res.data),
    { staleTime: 300000 } // 5 minutes
  );

  const { data: stores = [] } = useQuery(
    ['stores'],
    () => axios.get('/stores').then(res => res.data),
    { staleTime: 600000 } // 10 minutes
  );

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6" data-testid="analytics-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
        <button className="btn btn-secondary" data-testid="export-report">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => handleDateRangeChange('start_date', e.target.value)}
                className="input text-sm"
                data-testid="start-date"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => handleDateRangeChange('end_date', e.target.value)}
                className="input text-sm"
                data-testid="end-date"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Store</label>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="input text-sm"
                data-testid="store-filter"
              >
                <option value="">All Stores</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6" data-testid="total-sales-card">
          <div className="flex items-center">
            <div className="bg-green-500 p-3 rounded-full mr-4">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">
                {salesLoading ? '...' : formatCurrency(salesAnalytics?.total_sales)}
              </p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12.5% vs last period
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6" data-testid="transactions-card">
          <div className="flex items-center">
            <div className="bg-blue-500 p-3 rounded-full mr-4">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">
                {salesLoading ? '...' : (salesAnalytics?.total_transactions || 0).toLocaleString()}
              </p>
              <p className="text-xs text-blue-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +8.3% vs last period
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6" data-testid="average-transaction-card">
          <div className="flex items-center">
            <div className="bg-purple-500 p-3 rounded-full mr-4">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Transaction</p>
              <p className="text-2xl font-bold text-gray-900">
                {salesLoading ? '...' : formatCurrency(salesAnalytics?.average_transaction)}
              </p>
              <p className="text-xs text-purple-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +3.7% vs last period
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6" data-testid="profit-margin-card">
          <div className="flex items-center">
            <div className="bg-orange-500 p-3 rounded-full mr-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Profit Margin</p>
              <p className="text-2xl font-bold text-gray-900">
                {salesLoading ? '...' : formatPercentage(salesAnalytics?.profit_margin)}
              </p>
              <p className="text-xs text-orange-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +1.2% vs last period
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Sales Trend</h3>
          </div>
          <div className="p-6">
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Sales trend chart</p>
                <p className="text-sm text-gray-400">Will be implemented with Chart.js</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hourly Sales Distribution */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Hourly Sales Distribution</h3>
          </div>
          <div className="p-6">
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Hourly distribution chart</p>
                <p className="text-sm text-gray-400">Will be implemented with Chart.js</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products and Inventory Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Top Performing Products</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4" data-testid="top-products-list">
              {salesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="loading-spinner w-6 h-6"></div>
                </div>
              ) : (
                salesAnalytics?.top_products?.slice(0, 5).map((product, index) => (
                  <div key={product._id} className="flex items-center justify-between" data-testid={`top-product-${index}`}>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-semibold text-primary-800">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Product {product._id}</p>
                        <p className="text-sm text-gray-500">{product.quantity_sold} units sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                )) || []
              )}
              
              {!salesLoading && (!salesAnalytics?.top_products || salesAnalytics.top_products.length === 0) && (
                <div className="text-center py-8">
                  <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No sales data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inventory Analytics */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Inventory Overview</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4" data-testid="inventory-overview">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Total Inventory Value</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {inventoryLoading ? '...' : formatCurrency(inventoryAnalytics?.total_value)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Low Stock Items</span>
                </div>
                <span className="font-semibold text-yellow-600">
                  {inventoryLoading ? '...' : inventoryAnalytics?.low_stock_count || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Out of Stock</span>
                </div>
                <span className="font-semibold text-red-600">
                  {inventoryLoading ? '...' : inventoryAnalytics?.out_of_stock_count || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Near Expiry</span>
                </div>
                <span className="font-semibold text-orange-600">
                  {inventoryLoading ? '...' : inventoryAnalytics?.near_expiry_count || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Turnover Ratio</span>
                </div>
                <span className="font-semibold text-blue-600">
                  {inventoryLoading ? '...' : `${inventoryAnalytics?.turnover_ratio || 0}x`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Period Summary */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Period Summary</h3>
          <p className="text-sm text-gray-500">
            {salesAnalytics?.period || `${dateRange.start_date} to ${dateRange.end_date}`}
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {salesLoading ? '...' : formatCurrency(salesAnalytics?.total_sales)}
              </p>
              <p className="text-sm text-gray-500">Total Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {salesLoading ? '...' : (salesAnalytics?.total_transactions || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Total Transactions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {salesLoading ? '...' : formatPercentage(salesAnalytics?.profit_margin)}
              </p>
              <p className="text-sm text-gray-500">Average Profit Margin</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;