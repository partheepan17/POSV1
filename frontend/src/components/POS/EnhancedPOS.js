import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search, Scan, Plus, Minus, Trash2, User, CreditCard,
  DollarSign, Receipt, X, ShoppingCart, Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import { productsAPI, customersAPI, salesAPI, promotionsAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';

const EnhancedPOS = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const barcodeInputRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  const [customer, setCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    loadProducts();
    barcodeInputRef.current?.focus();

    const handleKeyPress = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const loadProducts = async () => {
    const result = await productsAPI.getAll();
    if (result.success) {
      setProducts(result.data);
      setFilteredProducts(result.data.slice(0, 20));
    }
  };

  useEffect(() => {
    if (searchQuery.length > 1) {
      const filtered = products.filter(p =>
        p.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name_si?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name_ta?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered.slice(0, 20));
    } else {
      setFilteredProducts(products.slice(0, 20));
    }
  }, [searchQuery, products]);

  useEffect(() => {
    const searchCustomers = async () => {
      if (customerSearch.length > 1) {
        const result = await customersAPI.getAll({ search: customerSearch });
        if (result.success) {
          setCustomerResults(result.data);
        }
      }
    };

    const debounce = setTimeout(searchCustomers, 300);
    return () => clearTimeout(debounce);
  }, [customerSearch]);

  const handleBarcodeInput = async (barcode) => {
    if (!barcode.trim()) return;

    const result = await productsAPI.getByBarcode(barcode);
    if (result.success && result.data) {
      addToCart(result.data);
      if (barcodeInputRef.current) {
        barcodeInputRef.current.value = '';
      }
    } else {
      toast.error('Product not found');
    }
  };

  const getProductPrice = (product) => {
    const customerType = customer?.type || 'Normal';
    switch (customerType) {
      case 'Wholesale':
        return product.price_wholesale;
      case 'Credit':
        return product.price_credit;
      default:
        return product.price_normal;
    }
  };

  const getProductName = (product) => {
    const preferredLang = customer?.preferred_language || i18n.language || 'en';
    switch (preferredLang) {
      case 'si': return product.name_si || product.name_en;
      case 'ta': return product.name_ta || product.name_en;
      default: return product.name_en;
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product_id === product.id);

    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      const price = getProductPrice(product);
      const taxAmount = (price * product.tax_rate) / 100;

      setCart([...cart, {
        product_id: product.id,
        product_name: getProductName(product),
        quantity: 1,
        unit_price: price,
        original_price: price,
        tax_rate: product.tax_rate,
        tax_amount: taxAmount,
        discount_amount: 0,
        total_amount: price + taxAmount,
        product: product
      }]);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const subtotal = item.unit_price * newQuantity;
        const taxAmount = (subtotal * item.tax_rate) / 100;
        return {
          ...item,
          quantity: newQuantity,
          tax_amount: taxAmount,
          total_amount: subtotal + taxAmount - item.discount_amount
        };
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const handleQuantityInput = (productId, value) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      updateQuantity(productId, numValue);
    }
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const discountTotal = cart.reduce((sum, item) => sum + item.discount_amount, 0);
    const taxTotal = cart.reduce((sum, item) => sum + item.tax_amount, 0);
    const total = subtotal + taxTotal - discountTotal;

    return { subtotal, discountTotal, taxTotal, total };
  };

  const { subtotal, discountTotal, taxTotal, total } = calculateTotals();

  const calculateChange = () => {
    const received = parseFloat(receivedAmount) || 0;
    return received - total;
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (paymentMethod === 'cash') {
      const received = parseFloat(receivedAmount) || 0;
      if (received < total) {
        toast.error('Insufficient payment amount');
        return;
      }
    }

    setProcessingPayment(true);

    try {
      const saleData = {
        store_id: user.store_id,
        cashier_id: user.id,
        customer_id: customer?.id,
        customer_type: customer?.type || 'Normal',
        subtotal,
        discount_total: discountTotal,
        tax_total: taxTotal,
        total_amount: total,
        items: cart.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          original_price: item.original_price,
          discount_amount: item.discount_amount,
          tax_rate: item.tax_rate,
          tax_amount: item.tax_amount,
          total_amount: item.total_amount
        })),
        payments: [{
          payment_method: paymentMethod,
          amount: paymentMethod === 'cash' ? parseFloat(receivedAmount) : total,
          surcharge_amount: 0
        }]
      };

      const result = await salesAPI.create(saleData);

      if (result.success) {
        toast.success(`Sale completed! Sale #${result.data.sale_number}`);
        clearCart();
        setShowPaymentModal(false);
        setReceivedAmount('');
      } else {
        toast.error(result.error || 'Sale failed');
      }
    } catch (error) {
      toast.error('Error completing sale');
      console.error(error);
    } finally {
      setProcessingPayment(false);
    }
  };

  const clearCart = () => {
    setCart([]);
    setCustomer(null);
    setCustomerSearch('');
    setPaymentMethod('cash');
    setReceivedAmount('');
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 p-4">
      {/* Left Panel - Products */}
      <div className="flex-1 space-y-4 overflow-auto">
        {/* Barcode Scanner */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-3">
            <Scan className="w-5 h-5 text-blue-600 mr-2" />
            <span className="font-medium text-gray-700">Barcode Scanner</span>
            <span className="ml-auto text-xs text-gray-500">Press F2</span>
          </div>
          <input
            ref={barcodeInputRef}
            type="text"
            placeholder="Scan or enter barcode..."
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleBarcodeInput(e.target.value);
              }
            }}
          />
        </div>

        {/* Product Search */}
        <div className="bg-white rounded-lg shadow p-4">
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
        </div>

        {/* Products Grid */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className="border rounded-lg p-3 hover:shadow-md hover:border-blue-500 cursor-pointer transition-all"
              >
                {product.images?.[0]?.image_url && (
                  <img
                    src={product.images[0].image_url}
                    alt={getProductName(product)}
                    className="w-full h-24 object-cover rounded mb-2"
                  />
                )}
                {!product.images?.[0]?.image_url && (
                  <div className="w-full h-24 bg-gray-100 rounded mb-2 flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                  {getProductName(product)}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-blue-600 font-semibold text-sm">
                    ${getProductPrice(product).toFixed(2)}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    product.stock_quantity > 10
                      ? 'bg-green-100 text-green-700'
                      : product.stock_quantity > 0
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {product.stock_quantity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className="lg:w-96 bg-white rounded-lg shadow flex flex-col">
        {/* Customer Selection */}
        <div className="p-4 border-b">
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 mr-1" />
            Customer
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search customer..."
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setShowCustomerDropdown(true);
              }}
              onFocus={() => setShowCustomerDropdown(true)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {showCustomerDropdown && customerResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {customerResults.map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => {
                      setCustomer(cust);
                      setCustomerSearch('');
                      setShowCustomerDropdown(false);
                    }}
                    className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                  >
                    <div className="font-medium">{cust.name}</div>
                    <div className="text-xs text-gray-500">
                      {cust.type} • {cust.phone}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {customer && (
            <div className="mt-2 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
              <div>
                <div className="font-medium text-blue-900">{customer.name}</div>
                <div className="text-xs text-blue-700">{customer.type}</div>
              </div>
              <button
                onClick={() => setCustomer(null)}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <ShoppingCart className="w-16 h-16 mx-auto mb-3 opacity-50" />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product_id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm flex-1">{item.product_name}</h4>
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleQuantityInput(item.product_id, e.target.value)}
                      className="w-16 text-center border rounded px-2 py-1 text-sm"
                      step="0.001"
                      min="0.001"
                    />
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="font-semibold text-blue-600">
                    ${item.total_amount.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ${item.unit_price.toFixed(2)} each
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals */}
        <div className="border-t p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          {discountTotal > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount:</span>
              <span className="font-medium">-${discountTotal.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax:</span>
            <span className="font-medium">${taxTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total:</span>
            <span className="text-blue-600">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t space-y-2">
          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={cart.length === 0}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Proceed to Payment
          </button>
          <button
            onClick={clearCart}
            disabled={cart.length === 0}
            className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Clear Cart
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Complete Payment</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['cash', 'card', 'bank_transfer', 'wallet'].map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-4 rounded-lg border-2 font-medium capitalize transition-colors ${
                        paymentMethod === method
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {method.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'cash' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount Received
                  </label>
                  <input
                    type="number"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.01"
                  />
                  {receivedAmount && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-600">Change: </span>
                      <span className={`font-semibold ${
                        calculateChange() >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${Math.abs(calculateChange()).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-blue-600">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex gap-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={processingPayment}
                className="flex-1 px-4 py-2 border rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteSale}
                disabled={processingPayment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              >
                {processingPayment ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Receipt className="w-5 h-5 mr-2" />
                    Complete Sale
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPOS;
