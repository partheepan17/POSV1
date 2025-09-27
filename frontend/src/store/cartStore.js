import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import toast from 'react-hot-toast';

const useCartStore = create(
  persist(
    (set, get) => ({
  items: [],
  customer: null,
  paymentMethod: 'cash',
  receivedAmount: 0,
  
  addItem: async (product, quantity = 1, customerType = 'Normal') => {
    try {
      // Calculate price with discounts
      const priceResponse = await axios.post('/calculate-price', {
        product_id: product.id,
        quantity,
        customer_type: customerType
      });
      
      const { base_price, discount_amount, tax_amount, total, discount_info } = priceResponse.data;
      
      const existingItemIndex = get().items.findIndex(item => item.product.id === product.id);
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const items = [...get().items];
        items[existingItemIndex].quantity += quantity;
        
        // Recalculate price for new quantity
        const newPriceResponse = await axios.post('/calculate-price', {
          product_id: product.id,
          quantity: items[existingItemIndex].quantity,
          customer_type: customerType
        });
        
        items[existingItemIndex] = {
          ...items[existingItemIndex],
          unitPrice: newPriceResponse.data.base_price,
          discountAmount: newPriceResponse.data.discount_amount / newPriceResponse.data.quantity,
          taxAmount: newPriceResponse.data.tax_amount / newPriceResponse.data.quantity,
          totalAmount: newPriceResponse.data.total,
          discountInfo: newPriceResponse.data.discount_info
        };
        
        set({ items });
      } else {
        // Add new item
        const newItem = {
          id: Date.now().toString(),
          product,
          quantity,
          unitPrice: base_price,
          discountAmount: discount_amount / quantity,
          taxAmount: tax_amount / quantity,
          totalAmount: total,
          discountInfo: discount_info
        };
        
        set({ items: [...get().items, newItem] });
      }
      
      toast.success(`${product.name_en} added to cart`);
    } catch (error) {
      toast.error('Failed to add item to cart');
      console.error('Error adding item to cart:', error);
    }
  },
  
  updateItemQuantity: async (itemId, quantity, customerType = 'Normal') => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }
    
    try {
      const items = [...get().items];
      const itemIndex = items.findIndex(item => item.id === itemId);
      
      if (itemIndex >= 0) {
        const item = items[itemIndex];
        
        // Recalculate price
        const priceResponse = await axios.post('/calculate-price', {
          product_id: item.product.id,
          quantity,
          customer_type: customerType
        });
        
        const { base_price, discount_amount, tax_amount, total, discount_info } = priceResponse.data;
        
        items[itemIndex] = {
          ...item,
          quantity,
          unitPrice: base_price,
          discountAmount: discount_amount / quantity,
          taxAmount: tax_amount / quantity,
          totalAmount: total,
          discountInfo: discount_info
        };
        
        set({ items });
      }
    } catch (error) {
      toast.error('Failed to update item quantity');
      console.error('Error updating item quantity:', error);
    }
  },
  
  removeItem: (itemId) => {
    set({ items: get().items.filter(item => item.id !== itemId) });
    toast.success('Item removed from cart');
  },
  
  setCustomer: (customer) => {
    set({ customer });
    
    // Recalculate all items with new customer type
    if (customer && get().items.length > 0) {
      get().recalculateCart(customer.type);
    }
  },
  
  recalculateCart: async (customerType = 'Normal') => {
    const items = [...get().items];
    
    for (let i = 0; i < items.length; i++) {
      try {
        const priceResponse = await axios.post('/calculate-price', {
          product_id: items[i].product.id,
          quantity: items[i].quantity,
          customer_type: customerType
        });
        
        const { base_price, discount_amount, tax_amount, total, discount_info } = priceResponse.data;
        
        items[i] = {
          ...items[i],
          unitPrice: base_price,
          discountAmount: discount_amount / items[i].quantity,
          taxAmount: tax_amount / items[i].quantity,
          totalAmount: total,
          discountInfo: discount_info
        };
      } catch (error) {
        console.error('Error recalculating item:', error);
      }
    }
    
    set({ items });
  },
  
  setPaymentMethod: (method) => {
    set({ paymentMethod: method });
  },
  
  setReceivedAmount: (amount) => {
    set({ receivedAmount: amount });
  },
  
  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  },
  
  getDiscountTotal: () => {
    return get().items.reduce((sum, item) => sum + (item.discountAmount * item.quantity), 0);
  },
  
  getTaxTotal: () => {
    return get().items.reduce((sum, item) => sum + (item.taxAmount * item.quantity), 0);
  },
  
  getTotal: () => {
    return get().items.reduce((sum, item) => sum + item.totalAmount, 0);
  },
  
  getChangeAmount: () => {
    const total = get().getTotal();
    const received = get().receivedAmount;
    return Math.max(0, received - total);
  },
  
  clearCart: () => {
    set({ 
      items: [], 
      customer: null, 
      paymentMethod: 'cash', 
      receivedAmount: 0 
    });
  },
  
  completeSale: async () => {
    try {
      const { items, customer, paymentMethod } = get();
      
      if (items.length === 0) {
        toast.error('Cart is empty');
        return { success: false };
      }
      
      const saleData = {
        customer_id: customer?.id || null,
        items: items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          discount_amount: item.discountAmount * item.quantity,
          tax_amount: item.taxAmount * item.quantity,
          total_amount: item.totalAmount
        })),
        subtotal: get().getSubtotal(),
        discount_total: get().getDiscountTotal(),
        tax_total: get().getTaxTotal(),
        total_amount: get().getTotal(),
        payment_method: paymentMethod
      };
      
      const response = await axios.post('/api/sales', saleData);
      
      toast.success('Sale completed successfully!');
      get().clearCart();
      
      return { success: true, saleData: response.data };
    } catch (error) {
      toast.error('Failed to complete sale');
      console.error('Error completing sale:', error);
      return { success: false, error };
    }
  }
}),
{
  name: 'cart-storage',
  partialize: (state) => ({ 
    items: state.items, 
    customer: state.customer, 
    paymentMethod: state.paymentMethod 
  }),
}
));

export default useCartStore;