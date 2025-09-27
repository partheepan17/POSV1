import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';

const Reports = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6" data-testid="reports-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t('reports')}</h1>
      </div>

      {/* Coming Soon Message */}
      <div className="card p-12 text-center">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Reports & Analytics</h2>
        <p className="text-gray-600 mb-6">
          Comprehensive reporting features are coming soon! You'll be able to view:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
            <DollarSign className="w-6 h-6 text-blue-600 mr-3" />
            <span className="text-blue-900 font-medium">Sales Reports</span>
          </div>
          
          <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-600 mr-3" />
            <span className="text-green-900 font-medium">Performance Analytics</span>
          </div>
          
          <div className="flex items-center justify-center p-4 bg-purple-50 rounded-lg">
            <ShoppingCart className="w-6 h-6 text-purple-600 mr-3" />
            <span className="text-purple-900 font-medium">Product Performance</span>
          </div>
          
          <div className="flex items-center justify-center p-4 bg-yellow-50 rounded-lg">
            <BarChart3 className="w-6 h-6 text-yellow-600 mr-3" />
            <span className="text-yellow-900 font-medium">Inventory Reports</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-500">
          This feature will be available in the next update. Stay tuned!
        </p>
      </div>
    </div>
  );
};

export default Reports;