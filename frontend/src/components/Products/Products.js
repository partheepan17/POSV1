import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Edit, Search, Package, DollarSign } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Products = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const { data: products = [], isLoading } = useQuery(
    ['products'],
    () => axios.get('/products').then(res => res.data)
  );

  const { data: categories = [] } = useQuery(
    ['categories'],
    () => axios.get('/categories').then(res => res.data)
  );

  const filteredProducts = products.filter(product =>
    product.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.barcode.includes(searchQuery) ||
    product.sku.includes(searchQuery)
  );

  const getProductName = (product) => {
    switch (i18n.language) {
      case 'si': return product.name_si || product.name_en;
      case 'ta': return product.name_ta || product.name_en;
      default: return product.name_en;
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return 'Uncategorized';
    
    switch (i18n.language) {
      case 'si': return category.name_si || category.name_en;
      case 'ta': return category.name_ta || category.name_en;
      default: return category.name_en;
    }
  };

  return (
    <div className="space-y-6" data-testid="products-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t('products')}</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
          data-testid="add-product-button"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('addProduct')}
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('search') + ' products...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
            data-testid="product-search"
          />
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner w-8 h-8"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="card overflow-hidden" data-testid={`product-card-${product.id}`}>
              {product.image_url && (
                <div className="h-48 bg-gray-200">
                  <img
                    src={product.image_url}
                    alt={getProductName(product)}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 flex-1">
                    {getProductName(product)}
                  </h3>
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="text-gray-400 hover:text-gray-600"
                    data-testid={`edit-product-${product.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                
                <p className="text-sm text-gray-500 mb-2">{getCategoryName(product.category_id)}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Package className="w-4 h-4 text-gray-400 mr-2" />
                    <span>SKU: {product.sku}</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <span className="w-16 text-gray-500">Stock:</span>
                    <span className={`font-medium ${product.stock_quantity <= 10 ? 'text-red-600' : 'text-green-600'}`}>
                      {product.stock_quantity} {product.unit}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Normal:</span>
                      <span className="font-semibold">${product.price_normal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Wholesale:</span>
                      <span className="font-semibold">${product.price_wholesale.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Credit:</span>
                      <span className="font-semibold">${product.price_credit.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Barcode: {product.barcode}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {(showAddModal || editingProduct) && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => {
            setShowAddModal(false);
            setEditingProduct(null);
          }}
          onSave={() => {
            queryClient.invalidateQueries(['products']);
            setShowAddModal(false);
            setEditingProduct(null);
          }}
          t={t}
        />
      )}
    </div>
  );
};

// Product Modal Component
const ProductModal = ({ product, categories, onClose, onSave, t }) => {
  const [formData, setFormData] = useState({
    sku: product?.sku || '',
    barcode: product?.barcode || '',
    name_en: product?.name_en || '',
    name_si: product?.name_si || '',
    name_ta: product?.name_ta || '',
    category_id: product?.category_id || '',
    brand: product?.brand || '',
    cost_price: product?.cost_price || 0,
    price_normal: product?.price_normal || 0,
    price_wholesale: product?.price_wholesale || 0,
    price_credit: product?.price_credit || 0,
    tax_rate: product?.tax_rate || 0,
    image_url: product?.image_url || '',
    unit: product?.unit || 'pcs',
    stock_quantity: product?.stock_quantity || 0,
    reorder_point: product?.reorder_point || 10
  });

  const mutation = useMutation(
    (data) => product 
      ? axios.put(`/products/${product.id}`, data)
      : axios.post('/products', data),
    {
      onSuccess: () => {
        toast.success(product ? 'Product updated successfully' : 'Product created successfully');
        onSave();
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Failed to save product');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="product-modal">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-90vh overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {product ? t('editProduct') : t('addProduct')}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU *
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="input w-full"
                required
                data-testid="product-sku"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('barcode')} *
              </label>
              <input
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                className="input w-full"
                required
                data-testid="product-barcode"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name (English) *
              </label>
              <input
                type="text"
                name="name_en"
                value={formData.name_en}
                onChange={handleChange}
                className="input w-full"
                required
                data-testid="product-name-en"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name (Sinhala)
              </label>
              <input
                type="text"
                name="name_si"
                value={formData.name_si}
                onChange={handleChange}
                className="input w-full"
                data-testid="product-name-si"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name (Tamil)
              </label>
              <input
                type="text"
                name="name_ta"
                value={formData.name_ta}
                onChange={handleChange}
                className="input w-full"
                data-testid="product-name-ta"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('category')}
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="input w-full"
                data-testid="product-category"
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name_en}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('brand')}
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="input w-full"
                data-testid="product-brand"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost Price
              </label>
              <input
                type="number"
                name="cost_price"
                value={formData.cost_price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="input w-full"
                data-testid="product-cost-price"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Normal Price *
              </label>
              <input
                type="number"
                name="price_normal"
                value={formData.price_normal}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="input w-full"
                required
                data-testid="product-normal-price"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wholesale Price
              </label>
              <input
                type="number"
                name="price_wholesale"
                value={formData.price_wholesale}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="input w-full"
                data-testid="product-wholesale-price"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Credit Price
              </label>
              <input
                type="number"
                name="price_credit"
                value={formData.price_credit}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="input w-full"
                data-testid="product-credit-price"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                name="tax_rate"
                value={formData.tax_rate}
                onChange={handleChange}
                step="0.01"
                min="0"
                max="100"
                className="input w-full"
                data-testid="product-tax-rate"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="input w-full"
                data-testid="product-unit"
              >
                <option value="pcs">Pieces</option>
                <option value="kg">Kilograms</option>
                <option value="g">Grams</option>
                <option value="L">Liters</option>
                <option value="ml">Milliliters</option>
                <option value="m">Meters</option>
                <option value="cm">Centimeters</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                min="0"
                className="input w-full"
                data-testid="product-stock"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URL
            </label>
            <input
              type="url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              className="input w-full"
              data-testid="product-image-url"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              data-testid="cancel-product"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="btn btn-primary"
              data-testid="save-product"
            >
              {mutation.isLoading ? 'Saving...' : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Products;