import supabase from '../lib/supabase';

const handleError = (error) => {
  console.error('API Error:', error);
  return {
    success: false,
    error: error.message || 'An error occurred'
  };
};

export const productsAPI = {
  getAll: async (filters = {}) => {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name_en, name_si, name_ta),
          images:product_images(id, image_url, is_primary)
        `)
        .eq('is_active', true);

      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      if (filters.search) {
        query = query.or(`name_en.ilike.%${filters.search}%,name_si.ilike.%${filters.search}%,name_ta.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('name_en');

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return handleError(error);
    }
  },

  getById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name_en, name_si, name_ta),
          images:product_images(id, image_url, is_primary, sort_order),
          units:product_units(id, unit_name, conversion_factor, barcode),
          tier_pricing:product_tier_pricing(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return handleError(error);
    }
  },

  getByBarcode: async (barcode) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name_en, name_si, name_ta),
          images:product_images(id, image_url, is_primary)
        `)
        .eq('barcode', barcode)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return handleError(error);
    }
  },

  create: async (productData) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return handleError(error);
    }
  },

  update: async (id, productData) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return handleError(error);
    }
  },

  delete: async (id) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return handleError(error);
    }
  }
};

export const customersAPI = {
  getAll: async (filters = {}) => {
    try {
      let query = supabase
        .from('customers')
        .select('*')
        .eq('is_active', true);

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%,customer_number.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return handleError(error);
    }
  },

  getById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          price_lists:customer_price_lists(*),
          loyalty:loyalty_points(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return handleError(error);
    }
  },

  create: async (customerData) => {
    try {
      const count = await supabase
        .from('customers')
        .select('customer_number', { count: 'exact', head: true });

      const customerNumber = `CUST${String((count.count || 0) + 1).padStart(6, '0')}`;

      const { data, error } = await supabase
        .from('customers')
        .insert([{ ...customerData, customer_number: customerNumber }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return handleError(error);
    }
  },

  update: async (id, customerData) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return handleError(error);
    }
  }
};

export const categoriesAPI = {
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name_en');

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return handleError(error);
    }
  },

  create: async (categoryData) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return handleError(error);
    }
  }
};

export const salesAPI = {
  create: async (saleData) => {
    try {
      const count = await supabase
        .from('sales')
        .select('sale_number', { count: 'exact', head: true });

      const saleNumber = `POS${String((count.count || 0) + 1).padStart(6, '0')}`;

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([{
          ...saleData,
          sale_number: saleNumber,
          status: 'completed',
          payment_status: 'paid'
        }])
        .select()
        .single();

      if (saleError) throw saleError;

      const saleItemsWithSaleId = saleData.items.map(item => ({
        ...item,
        sale_id: sale.id
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItemsWithSaleId);

      if (itemsError) throw itemsError;

      if (saleData.payments && saleData.payments.length > 0) {
        const paymentsWithSaleId = saleData.payments.map(payment => ({
          ...payment,
          sale_id: sale.id
        }));

        const { error: paymentsError } = await supabase
          .from('sale_payments')
          .insert(paymentsWithSaleId);

        if (paymentsError) throw paymentsError;
      }

      for (const item of saleData.items) {
        await supabase.rpc('update_product_stock', {
          p_product_id: item.product_id,
          p_quantity: -item.quantity
        });
      }

      return { success: true, data: { ...sale, sale_number: saleNumber } };
    } catch (error) {
      return handleError(error);
    }
  },

  getAll: async (filters = {}) => {
    try {
      let query = supabase
        .from('sales')
        .select(`
          *,
          customer:customers(id, name, customer_number),
          cashier:users!sales_cashier_id_fkey(id, full_name),
          store:stores(id, name, code)
        `)
        .order('created_at', { ascending: false });

      if (filters.store_id) {
        query = query.eq('store_id', filters.store_id);
      }

      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date);
      }

      const { data, error } = await query.limit(filters.limit || 100);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return handleError(error);
    }
  },

  getById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          items:sale_items(*),
          payments:sale_payments(*),
          customer:customers(*),
          cashier:users!sales_cashier_id_fkey(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return handleError(error);
    }
  }
};

export const suppliersAPI = {
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return handleError(error);
    }
  },

  create: async (supplierData) => {
    try {
      const count = await supabase
        .from('suppliers')
        .select('code', { count: 'exact', head: true });

      const code = `SUP${String((count.count || 0) + 1).padStart(3, '0')}`;

      const { data, error } = await supabase
        .from('suppliers')
        .insert([{ ...supplierData, code }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return handleError(error);
    }
  }
};

export const promotionsAPI = {
  getActive: async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('promotions')
        .select(`
          *,
          products:promotion_products(
            product:products(*)
          )
        `)
        .eq('is_active', true)
        .lte('start_date', now)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('priority', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return handleError(error);
    }
  },

  calculate: async (items, customerType = 'Normal') => {
    try {
      const { data: promotions } = await promotionsAPI.getActive();

      let appliedDiscounts = [];

      for (const promo of promotions || []) {
        const customerTypes = promo.customer_types || ['Normal', 'Wholesale', 'Credit'];
        if (!customerTypes.includes(customerType)) continue;

        for (const item of items) {
          const promoProducts = promo.products?.map(p => p.product.id) || [];
          if (promoProducts.length === 0 || promoProducts.includes(item.product_id)) {
            if (promo.promotion_type === 'quantity_discount' && item.quantity >= promo.min_quantity) {
              let discountAmount = 0;

              if (promo.discount_type === 'percentage') {
                discountAmount = (item.unit_price * item.quantity * promo.discount_value) / 100;
              } else if (promo.discount_type === 'fixed_per_unit') {
                discountAmount = promo.discount_value * item.quantity;
              }

              appliedDiscounts.push({
                item_product_id: item.product_id,
                promotion_id: promo.id,
                promotion_name: promo.name_en,
                discount_amount: discountAmount
              });
            }
          }
        }
      }

      return { success: true, data: appliedDiscounts };
    } catch (error) {
      return handleError(error);
    }
  }
};

export const dashboardAPI = {
  getSummary: async (storeId, startDate, endDate) => {
    try {
      let query = supabase
        .from('sales')
        .select('total_amount, created_at');

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: sales, error } = await query;

      if (error) throw error;

      const totalSales = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
      const totalTransactions = sales.length;

      const lowStockQuery = supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .lt('stock_quantity', supabase.raw('reorder_point'))
        .eq('is_active', true);

      const { count: lowStockCount } = await lowStockQuery;

      return {
        success: true,
        data: {
          total_sales: totalSales,
          total_transactions: totalTransactions,
          average_transaction: totalTransactions > 0 ? totalSales / totalTransactions : 0,
          low_stock_count: lowStockCount || 0
        }
      };
    } catch (error) {
      return handleError(error);
    }
  }
};

export default {
  products: productsAPI,
  customers: customersAPI,
  categories: categoriesAPI,
  sales: salesAPI,
  suppliers: suppliersAPI,
  promotions: promotionsAPI,
  dashboard: dashboardAPI
};
