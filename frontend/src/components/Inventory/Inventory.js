import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { Package, AlertTriangle, TrendingDown } from 'lucide-react';
import axios from 'axios';

const Inventory = () => {
  const { t, i18n } = useTranslation();

  const { data: products = [], isLoading } = useQuery(
    ['products'],
    () => axios.get('/products').then(res => res.data)
  );

  // Filter products by stock status
  const lowStockProducts = products.filter(product => product.stock_quantity <= product.reorder_point);
  const outOfStockProducts = products.filter(product => product.stock_quantity === 0);

  const getProductName = (product) => {
    switch (i18n.language) {
      case 'si': return product.name_si || product.name_en;
      case 'ta': return product.name_ta || product.name_en;
      default: return product.name_en;
    }
  };

  const getStockStatus = (product) => {
    if (product.stock_quantity === 0) return 'Out of Stock';
    if (product.stock_quantity <= product.reorder_point) return 'Low Stock';
    return 'In Stock';
  };

  const getStatusColor = (product) => {
    if (product.stock_quantity === 0) return 'text-red-600 bg-red-100';
    if (product.stock_quantity <= product.reorder_point) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="space-y-6" data-testid="inventory-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t('inventory')}</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Total Products: <span className="font-semibold text-gray-900">{products.length}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-green-500 p-3 rounded-full mr-4">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Stock Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ${products.reduce((sum, p) => sum + (p.stock_quantity * p.cost_price), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-yellow-500 p-3 rounded-full mr-4">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
              <p className="text-2xl font-bold text-gray-900">{lowStockProducts.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-red-500 p-3 rounded-full mr-4">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Out of Stock</p>
              <p className="text-2xl font-bold text-gray-900">{outOfStockProducts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner w-8 h-8"></div>
        </div>
      ) : (
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Product Inventory</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" data-testid="inventory-table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reorder Point
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50" data-testid={`inventory-row-${product.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={getProductName(product)}
                            className="w-10 h-10 rounded-lg object-cover mr-3"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {getProductName(product)}
                          </div>
                          <div className="text-sm text-gray-500">{product.brand}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.sku}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`font-medium ${
                        product.stock_quantity === 0 ? 'text-red-600' :
                        product.stock_quantity <= product.reorder_point ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {product.stock_quantity} {product.unit}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.reorder_point} {product.unit}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${product.cost_price.toFixed(2)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      ${(product.stock_quantity * product.cost_price).toFixed(2)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product)}`}>
                        {getStockStatus(product)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {products.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">Add some products to manage inventory</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;