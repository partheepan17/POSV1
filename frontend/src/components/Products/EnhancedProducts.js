import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Search, Package, DollarSign, Trash2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsAPI, categoriesAPI } from '../../services/api';

const EnhancedProducts = () => {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    sku: '',
    barcode: '',
    name_en: '',
    name_si: '',
    name_ta: '',
    category_id: '',
    brand: '',
    cost_price: '',
    price_normal: '',
    price_wholesale: '',
    price_credit: '',
    tax_rate: '0',
    stock_quantity: '0',
    reorder_point: '10',
    base_unit: 'pcs',
    is_active: true
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const result = await productsAPI.getAll({ category_id: selectedCategory, search: searchQuery });
    if (result.success) {
      setProducts(result.data);
    } else {
      toast.error(result.error || 'Failed to load products');
    }
    setLoading(false);
  };

  const loadCategories = async () => {
    const result = await categoriesAPI.getAll();
    if (result.success) {
      setCategories(result.data);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery.length === 0 || searchQuery.length > 1) {
        loadProducts();
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedCategory]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const productData = {
      ...formData,
      cost_price: parseFloat(formData.cost_price) || 0,
      price_normal: parseFloat(formData.price_normal) || 0,
      price_wholesale: parseFloat(formData.price_wholesale) || 0,
      price_credit: parseFloat(formData.price_credit) || 0,
      tax_rate: parseFloat(formData.tax_rate) || 0,
      stock_quantity: parseFloat(formData.stock_quantity) || 0,
      reorder_point: parseFloat(formData.reorder_point) || 0
    };

    let result;
    if (editingProduct) {
      result = await productsAPI.update(editingProduct.id, productData);
    } else {
      result = await productsAPI.create(productData);
    }

    if (result.success) {
      toast.success(editingProduct ? 'Product updated successfully' : 'Product created successfully');
      setShowAddModal(false);
      setEditingProduct(null);
      resetForm();
      loadProducts();
    } else {
      toast.error(result.error || 'Operation failed');
    }

    setLoading(false);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku || '',
      barcode: product.barcode || '',
      name_en: product.name_en || '',
      name_si: product.name_si || '',
      name_ta: product.name_ta || '',
      category_id: product.category_id || '',
      brand: product.brand || '',
      cost_price: product.cost_price?.toString() || '0',
      price_normal: product.price_normal?.toString() || '0',
      price_wholesale: product.price_wholesale?.toString() || '0',
      price_credit: product.price_credit?.toString() || '0',
      tax_rate: product.tax_rate?.toString() || '0',
      stock_quantity: product.stock_quantity?.toString() || '0',
      reorder_point: product.reorder_point?.toString() || '10',
      base_unit: product.base_unit || 'pcs',
      is_active: product.is_active !== false
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    const result = await productsAPI.delete(id);
    if (result.success) {
      toast.success('Product deleted successfully');
      loadProducts();
    } else {
      toast.error(result.error || 'Failed to delete product');
    }
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      barcode: '',
      name_en: '',
      name_si: '',
      name_ta: '',
      category_id: '',
      brand: '',
      cost_price: '',
      price_normal: '',
      price_wholesale: '',
      price_credit: '',
      tax_rate: '0',
      stock_quantity: '0',
      reorder_point: '10',
      base_unit: 'pcs',
      is_active: true
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <button
          onClick={() => {
            setEditingProduct(null);
            resetForm();
            setShowAddModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name_en}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                {product.images?.[0]?.image_url ? (
                  <img
                    src={product.images[0].image_url}
                    alt={getProductName(product)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-16 h-16 text-gray-300" />
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2">
                  {getProductName(product)}
                </h3>
                <p className="text-sm text-gray-500 mb-3">{getCategoryName(product.category_id)}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Normal:</span>
                    <span className="font-semibold text-blue-600">${product.price_normal.toFixed(2)}</span>
                  </div>
                  {product.price_wholesale !== product.price_normal && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Wholesale:</span>
                      <span className="font-semibold text-green-600">${product.price_wholesale.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Stock:</span>
                    <span className={`font-semibold ${
                      product.stock_quantity > product.reorder_point ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {product.stock_quantity} {product.base_unit}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium text-sm flex items-center justify-center"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Multi-language Names */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Product Names</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">English Name *</label>
                    <input
                      type="text"
                      value={formData.name_en}
                      onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sinhala Name</label>
                    <input
                      type="text"
                      value={formData.name_si}
                      onChange={(e) => setFormData({ ...formData, name_si: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tamil Name</label>
                    <input
                      type="text"
                      value={formData.name_ta}
                      onChange={(e) => setFormData({ ...formData, name_ta: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Category & Brand */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name_en}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Pricing</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Normal Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price_normal}
                      onChange={(e) => setFormData({ ...formData, price_normal: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wholesale Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price_wholesale}
                      onChange={(e) => setFormData({ ...formData, price_wholesale: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Credit Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price_credit}
                      onChange={(e) => setFormData({ ...formData, price_credit: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Stock & Tax */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Point</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.reorder_point}
                    onChange={(e) => setFormData({ ...formData, reorder_point: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    value={formData.base_unit}
                    onChange={(e) => setFormData({ ...formData, base_unit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pcs">Pieces</option>
                    <option value="kg">Kilograms</option>
                    <option value="L">Liters</option>
                    <option value="pack">Pack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Package className="w-5 h-5 mr-2" />
                      {editingProduct ? 'Update Product' : 'Create Product'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedProducts;
