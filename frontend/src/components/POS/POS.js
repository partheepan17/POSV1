import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { 
  Search, 
  Scan, 
  Plus, 
  Minus, 
  Trash2, 
  User, 
  CreditCard, 
  DollarSign,
  Receipt,
  X
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

import useCartStore from '../../store/cartStore';

const POS = () => {
  const { t, i18n } = useTranslation();
  const barcodeInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastSaleData, setLastSaleData] = useState(null);

  const {
    items,
    customer,
    paymentMethod,
    receivedAmount,
    addItem,
    updateItemQuantity,
    removeItem,
    setCustomer,
    setPaymentMethod,
    setReceivedAmount,
    getSubtotal,
    getDiscountTotal,
    getTaxTotal,
    getTotal,
    getChangeAmount,
    completeSale,
    clearCart
  } = useCartStore();

  // Fetch products
  const { data: products = [], refetch: refetchProducts } = useQuery(
    ['products'],
    () => axios.get('/products').then(res => res.data),
    { staleTime: 30000 }
  );

  // Search products
  const { data: searchResults = [] } = useQuery(
    ['products-search', searchQuery],
    () => searchQuery.length > 2 ? 
      axios.get(`/products/search/${encodeURIComponent(searchQuery)}`).then(res => res.data) : [],
    { 
      enabled: searchQuery.length > 2,
      staleTime: 10000 
    }
  );

  // Search customers
  const { data: customerResults = [] } = useQuery(
    ['customers-search', customerSearch],
    () => customerSearch.length > 1 ?
      axios.get(`/customers/search/${encodeURIComponent(customerSearch)}`).then(res => res.data) : [],
    {
      enabled: customerSearch.length > 1,
      staleTime: 10000
    }
  );

  // Focus barcode input on component mount and when 'F2' is pressed
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'F2') {
        event.preventDefault();
        barcodeInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    barcodeInputRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  // Handle barcode input
  const handleBarcodeInput = async (barcode) => {
    if (!barcode.trim()) return;

    try {
      const response = await axios.get(`/products/barcode/${encodeURIComponent(barcode)}`);
      const product = response.data;
      await addItem(product, 1, customer?.type || 'Normal');
      
      // Clear barcode input
      if (barcodeInputRef.current) {
        barcodeInputRef.current.value = '';
      }
    } catch (error) {
      toast.error(t('productNotFound'));
      console.error('Error finding product by barcode:', error);
    }
  };

  // Handle barcode enter key
  const handleBarcodeKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleBarcodeInput(e.target.value);
    }
  };

  // Handle product selection
  const handleProductSelect = async (product) => {
    await addItem(product, 1, customer?.type || 'Normal');
    setSearchQuery('');
  };

  // Handle customer selection
  const handleCustomerSelect = (selectedCustomer) => {
    setCustomer(selectedCustomer);
    setCustomerSearch('');
    setShowCustomerDropdown(false);
  };

  // Handle payment completion
  const handleCompletePayment = async () => {
    const result = await completeSale();
    
    if (result.success) {
      setLastSaleData(result.saleData);
      setShowPaymentModal(false);
      setShowReceiptModal(true);
      setReceivedAmount(0);
    }
  };

  // Handle new sale
  const handleNewSale = () => {
    clearCart();
    setShowReceiptModal(false);
    setLastSaleData(null);
    barcodeInputRef.current?.focus();
  };

  // Display products (search results or all products)
  const displayProducts = searchQuery.length > 2 ? searchResults : products.slice(0, 20);

  // Get product name based on language
  const getProductName = (product) => {
    switch (i18n.language) {
      case 'si': return product.name_si || product.name_en;
      case 'ta': return product.name_ta || product.name_en;
      default: return product.name_en;
    }
  };

  return (
    <div className="h-full" data-testid="pos-container">
      <div className="pos-grid">
        {/* Left Panel - Products */}
        <div className="space-y-4">
          {/* Barcode Scanner */}
          <div className="barcode-scanner" data-testid="barcode-scanner">
            <div className="flex items-center justify-center mb-3">
              <Scan className="w-6 h-6 text-gray-600 mr-2" />
              <span className="text-gray-700 font-medium">{t('scanBarcode')}</span>
            </div>
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan or enter barcode..."
              className="barcode-input w-full"
              onKeyPress={handleBarcodeKeyPress}
              data-testid="barcode-input"
            />
            <p className="text-xs text-gray-500 mt-2">Press F2 to focus barcode input</p>
          </div>

          {/* Product Search */}
          <div className="card p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('search') + ' products...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
                data-testid="product-search"
              />
            </div>
          </div>

          {/* Products Grid */}
          <div className="card p-4">
            <div className="pos-product-grid">
              {displayProducts.map((product) => (
                <div
                  key={product.id}
                  className="product-card card p-3 cursor-pointer"
                  onClick={() => handleProductSelect(product)}
                  data-testid={`product-${product.id}`}
                >
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={getProductName(product)}
                      className="product-image mb-2"
                    />
                  )}
                  <h3 className="font-medium text-sm text-gray-900 mb-1">
                    {getProductName(product)}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-primary-600 font-semibold">
                      ${product.price_normal.toFixed(2)}
                    </span>
                    <span className={`stock-badge ${product.stock_quantity > 10 ? 'ok' : ''}`}>
                      {product.stock_quantity} left
                    </span>
                  </div>
                  {product.price_wholesale !== product.price_normal && (
                    <div className="mt-1">
                      <span className="price-badge">W: ${product.price_wholesale.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Cart */}
        <div className="pos-cart card">
          {/* Customer Selection */}
          <div className="p-4 border-b">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline w-4 h-4 mr-1" />
              {t('customer')}
            </label>
            <div className="customer-search">
              <input
                type="text"
                placeholder={t('selectCustomer')}
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                className="input"
                data-testid="customer-search"
              />
              {showCustomerDropdown && customerResults.length > 0 && (
                <div className="customer-dropdown" data-testid="customer-dropdown">
                  {customerResults.map((cust) => (
                    <div
                      key={cust.id}
                      className="customer-option"
                      onClick={() => handleCustomerSelect(cust)}
                      data-testid={`customer-option-${cust.id}`}
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
              <div className="mt-2 p-2 bg-blue-50 rounded-md flex items-center justify-between">
                <div>
                  <div className="font-medium text-blue-900">{customer.name}</div>
                  <div className="text-xs text-blue-700">{customer.type} Customer</div>
                </div>
                <button
                  onClick={() => setCustomer(null)}
                  className="text-blue-600 hover:text-blue-800"
                  data-testid="clear-customer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="cart-items flex-1 p-4">
            <h3 className="font-medium text-gray-900 mb-3">{t('cart')} ({items.length})</h3>
            
            {items.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>Cart is empty</p>
                <p className="text-sm">Scan or select products to add</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="cart-item rounded-lg" data-testid={`cart-item-${item.id}`}>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm text-gray-900 flex-1">
                        {getProductName(item.product)}
                      </h4>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                        data-testid={`remove-item-${item.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateItemQuantity(item.id, item.quantity - 1, customer?.type)}
                          className="btn btn-secondary p-1"
                          data-testid={`decrease-qty-${item.id}`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1, customer?.type)}
                          className="quantity-input"
                          data-testid={`qty-input-${item.id}`}
                        />
                        <button
                          onClick={() => updateItemQuantity(item.id, item.quantity + 1, customer?.type)}
                          className="btn btn-secondary p-1"
                          data-testid={`increase-qty-${item.id}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          ${item.totalAmount.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          ${item.unitPrice.toFixed(2)} each
                        </div>
                        {item.discountAmount > 0 && (
                          <div className="text-xs text-green-600">
                            -${(item.discountAmount * item.quantity).toFixed(2)} discount
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {item.discountInfo && (
                      <div className="mt-2">
                        <span className="discount-badge">{item.discountInfo.name}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary */}
          {items.length > 0 && (
            <div className="p-4 border-t bg-gray-50">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t('subtotal')}</span>
                  <span>${getSubtotal().toFixed(2)}</span>
                </div>
                {getDiscountTotal() > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{t('discount')}</span>
                    <span>-${getDiscountTotal().toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{t('tax')}</span>
                  <span>${getTaxTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>{t('total')}</span>
                  <span>${getTotal().toFixed(2)}</span>
                </div>
              </div>
              
              <button
                onClick={() => setShowPaymentModal(true)}
                className="btn btn-primary w-full mt-4 py-3 text-lg font-semibold"
                data-testid="checkout-button"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                {t('checkout')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          total={getTotal()}
          paymentMethod={paymentMethod}
          receivedAmount={receivedAmount}
          changeAmount={getChangeAmount()}
          onPaymentMethodChange={setPaymentMethod}
          onReceivedAmountChange={setReceivedAmount}
          onComplete={handleCompletePayment}
          onCancel={() => setShowPaymentModal(false)}
          t={t}
        />
      )}

      {/* Receipt Modal */}
      {showReceiptModal && lastSaleData && (
        <ReceiptModal
          saleData={lastSaleData}
          customer={customer}
          items={items}
          onClose={handleNewSale}
          t={t}
          i18n={i18n}
        />
      )}
    </div>
  );
};

// Payment Modal Component
const PaymentModal = ({
  total,
  paymentMethod,
  receivedAmount,
  changeAmount,
  onPaymentMethodChange,
  onReceivedAmountChange,
  onComplete,
  onCancel,
  t
}) => {
  const paymentMethods = [
    { id: 'cash', name: t('cash'), icon: DollarSign },
    { id: 'card', name: t('card'), icon: CreditCard },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="payment-modal">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{t('payment')}</h2>
        
        <div className="mb-4">
          <div className="text-2xl font-bold text-center py-4 bg-gray-100 rounded-lg">
            Total: ${total.toFixed(2)}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('paymentMethod')}
          </label>
          <div className="payment-methods">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => onPaymentMethodChange(method.id)}
                  className={`payment-method-btn ${paymentMethod === method.id ? 'active' : ''}`}
                  data-testid={`payment-method-${method.id}`}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  {method.name}
                </button>
              );
            })}
          </div>
        </div>

        {paymentMethod === 'cash' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('receivedAmount')}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={receivedAmount || ''}
              onChange={(e) => onReceivedAmountChange(parseFloat(e.target.value) || 0)}
              className="input w-full text-right text-lg font-semibold"
              placeholder="0.00"
              data-testid="received-amount-input"
            />
            {receivedAmount > 0 && (
              <div className="mt-2 p-3 bg-green-50 rounded-lg">
                <div className="flex justify-between">
                  <span>{t('changeAmount')}</span>
                  <span className="font-bold text-green-600">
                    ${changeAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="btn btn-secondary flex-1"
            data-testid="cancel-payment"
          >
            {t('cancel')}
          </button>
          <button
            onClick={onComplete}
            disabled={paymentMethod === 'cash' && receivedAmount < total}
            className="btn btn-primary flex-1"
            data-testid="complete-payment"
          >
            {t('completeSale')}
          </button>
        </div>
      </div>
    </div>
  );
};

// Receipt Modal Component
const ReceiptModal = ({ saleData, customer, items, onClose, t, i18n }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="receipt-modal">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{t('receipt')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="receipt-print bg-white p-4 border rounded-lg mb-4">
          <div className="receipt-header">
            <h1 className="font-bold text-lg">POS System</h1>
            <p className="text-sm">Professional Point of Sale</p>
            <div className="text-xs mt-2">
              <div>{t('date')}: {new Date().toLocaleDateString()}</div>
              <div>{t('time')}: {new Date().toLocaleTimeString()}</div>
              <div>Sale #: {saleData.sale_number}</div>
            </div>
          </div>

          {customer && (
            <div className="my-3">
              <div className="font-semibold">{t('customer')}: {customer.name}</div>
              <div className="text-xs">Type: {customer.type}</div>
            </div>
          )}

          <div className="my-3">
            {items.map((item, index) => (
              <div key={index} className="receipt-line text-xs">
                <div className="font-medium mb-1">
                  {i18n.language === 'si' ? (item.product.name_si || item.product.name_en) :
                   i18n.language === 'ta' ? (item.product.name_ta || item.product.name_en) :
                   item.product.name_en}
                </div>
                <div className="receipt-line">
                  <span>{item.quantity} x ${item.unitPrice.toFixed(2)}</span>
                  <span>${item.totalAmount.toFixed(2)}</span>
                </div>
                {item.discountAmount > 0 && (
                  <div className="receipt-line text-green-600">
                    <span>Discount</span>
                    <span>-${(item.discountAmount * item.quantity).toFixed(2)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="receipt-total">
            <div className="receipt-line">
              <span>{t('subtotal')}</span>
              <span>${saleData.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="receipt-line">
              <span>{t('discount')}</span>
              <span>-${saleData.discount_total?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="receipt-line">
              <span>{t('tax')}</span>
              <span>${saleData.tax_total?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="receipt-line font-bold">
              <span>{t('total')}</span>
              <span>${saleData.total_amount?.toFixed(2) || '0.00'}</span>
            </div>
          </div>

          <div className="text-center mt-4 text-xs">
            {i18n.language === 'si' ? 'ඔබගේ ගනුදෙනුවට ස්තූතියි!' :
             i18n.language === 'ta' ? 'உங்கள் வணிகத்திற்கு நன்றி!' :
             'Thank you for your business!'}
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handlePrint}
            className="btn btn-secondary flex-1"
            data-testid="print-receipt"
          >
            <Receipt className="w-4 h-4 mr-2" />
            {t('printReceipt')}
          </button>
          <button
            onClick={onClose}
            className="btn btn-primary flex-1"
            data-testid="new-sale"
          >
            {t('newSale')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default POS;