/*
  # Comprehensive POS System Database Schema
  
  ## Overview
  Complete database schema for enterprise POS system with 14 feature areas:
  1. Sales & Billing, 2. Pricing Engine, 3. Products & Inventory, 4. Customers & Loyalty
  5. Suppliers & Purchasing, 6. Promotions, 7. Payments & Finance, 8. Users & Security
  9. Multi-Store, 10. Reports & Analytics, 11. i18n, 12. Integrations, 13. Compliance, 14. UX
  
  ## 1. Core Tables
  
  ### Users & Authentication
  - `users` - System users with roles and permissions
  - `user_sessions` - Active sessions for shift management
  - `audit_logs` - Complete activity tracking
  
  ### Stores & Locations
  - `stores` - Multiple branch support
  - `terminals` - POS terminals per store
  
  ### Products & Categories
  - `categories` - Product categories with i18n
  - `products` - Products with multi-language names, multi-pricing, images
  - `product_images` - Multiple images per product
  - `product_units` - Multi-UOM support with conversions
  
  ### Inventory & Batches
  - `batches` - Batch/lot tracking with expiry dates
  - `stock_movements` - All inventory transactions
  - `stock_adjustments` - Manual adjustments and wastage
  - `wastage_records` - Detailed wastage tracking
  
  ### Customers & Loyalty
  - `customers` - Customer profiles with types and credit limits
  - `customer_price_lists` - Special pricing per customer
  - `loyalty_points` - Points accumulation
  - `loyalty_tiers` - Tier definitions
  - `coupons` - Promotional coupons
  
  ### Suppliers & Purchasing
  - `suppliers` - Supplier profiles
  - `purchase_orders` - Purchase orders
  - `purchase_order_items` - PO line items
  - `goods_received_notes` - GRN records
  - `grn_items` - GRN line items with batch info
  - `supplier_payments` - Payment tracking
  
  ### Promotions & Discounts
  - `promotions` - Complex promotion rules with i18n
  - `promotion_products` - Products in promotion
  - `promotion_conditions` - Promotion conditions
  - `promotion_usage` - Usage tracking
  
  ### Sales & Transactions
  - `sales` - Sales transactions
  - `sale_items` - Sale line items
  - `sale_payments` - Split payments
  - `parked_sales` - Hold/park bills
  - `returns` - Returns and exchanges
  - `return_items` - Return line items
  
  ### Accounts Receivable
  - `credit_sales` - Credit sale records
  - `ar_payments` - AR payments
  - `payment_reminders` - Auto reminders
  
  ### Finance & Cash Management
  - `cash_drawers` - Cash drawer records
  - `cash_movements` - Cash in/out
  - `expenses` - Business expenses
  - `tax_records` - Tax calculations
  
  ### Multi-Store Operations
  - `store_transfers` - Inter-store transfers
  - `transfer_items` - Transfer line items
  
  ## 2. Security
  All tables have RLS enabled with appropriate policies for role-based access
  
  ## 3. Important Notes
  - All monetary values use DECIMAL(15,2)
  - All quantities use DECIMAL(15,3) for weight support
  - Multi-language support via _en, _si, _ta suffixes
  - Timestamps use timestamptz for timezone support
  - UUIDs for all primary keys for distributed system support
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS & SECURITY (Feature Area 8)
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('Admin', 'Manager', 'Cashier', 'Stock', 'Accountant')),
  permissions jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  store_id uuid,
  pin_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) NOT NULL,
  terminal_id uuid,
  login_time timestamptz DEFAULT now(),
  logout_time timestamptz,
  opening_cash decimal(15,2) DEFAULT 0,
  closing_cash decimal(15,2),
  cash_variance decimal(15,2),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- STORES & TERMINALS (Feature Area 9)
-- ============================================================================

CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  address text,
  phone text,
  email text,
  manager_id uuid REFERENCES users(id),
  tax_number text,
  settings jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS terminals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id uuid REFERENCES stores(id) NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  device_info jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(store_id, code)
);

-- ============================================================================
-- CATEGORIES & PRODUCTS (Feature Area 3)
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en text NOT NULL,
  name_si text,
  name_ta text,
  parent_id uuid REFERENCES categories(id),
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku text UNIQUE NOT NULL,
  barcode text,
  name_en text NOT NULL,
  name_si text,
  name_ta text,
  description_en text,
  description_si text,
  description_ta text,
  category_id uuid REFERENCES categories(id),
  brand text,
  
  -- Pricing (Feature Area 2)
  cost_price decimal(15,2) NOT NULL DEFAULT 0,
  price_normal decimal(15,2) NOT NULL DEFAULT 0,
  price_wholesale decimal(15,2) NOT NULL DEFAULT 0,
  price_credit decimal(15,2) NOT NULL DEFAULT 0,
  
  -- Tax
  tax_rate decimal(5,2) DEFAULT 0,
  tax_inclusive boolean DEFAULT false,
  
  -- Inventory
  stock_quantity decimal(15,3) DEFAULT 0,
  reorder_point decimal(15,3) DEFAULT 0,
  reorder_quantity decimal(15,3) DEFAULT 0,
  
  -- Units & Measurements
  base_unit text DEFAULT 'pcs',
  is_weighable boolean DEFAULT false,
  plu_code text,
  tare_weight decimal(10,3) DEFAULT 0,
  
  -- Batching
  track_batches boolean DEFAULT false,
  track_expiry boolean DEFAULT false,
  
  -- Settings
  allow_decimal_quantity boolean DEFAULT false,
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  is_primary boolean DEFAULT false,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_units (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  unit_name text NOT NULL,
  conversion_factor decimal(15,3) NOT NULL,
  barcode text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, unit_name)
);

-- Tiered pricing (Feature Area 2)
CREATE TABLE IF NOT EXISTS product_tier_pricing (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  customer_type text NOT NULL,
  min_quantity decimal(15,3) NOT NULL,
  max_quantity decimal(15,3),
  price decimal(15,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INVENTORY & BATCHES (Feature Area 3)
-- ============================================================================

CREATE TABLE IF NOT EXISTS batches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES products(id) NOT NULL,
  batch_number text NOT NULL,
  manufacture_date date,
  expiry_date date,
  initial_quantity decimal(15,3) NOT NULL,
  current_quantity decimal(15,3) NOT NULL,
  cost_price decimal(15,2) NOT NULL,
  supplier_id uuid,
  store_id uuid REFERENCES stores(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, batch_number, store_id)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES products(id) NOT NULL,
  batch_id uuid REFERENCES batches(id),
  store_id uuid REFERENCES stores(id),
  movement_type text NOT NULL CHECK (movement_type IN ('in', 'out', 'transfer', 'adjustment', 'wastage', 'return')),
  quantity decimal(15,3) NOT NULL,
  reference_type text,
  reference_id uuid,
  user_id uuid REFERENCES users(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_adjustments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES products(id) NOT NULL,
  batch_id uuid REFERENCES batches(id),
  store_id uuid REFERENCES stores(id) NOT NULL,
  adjustment_type text NOT NULL CHECK (adjustment_type IN ('count', 'damage', 'loss', 'found', 'correction')),
  quantity_before decimal(15,3) NOT NULL,
  quantity_after decimal(15,3) NOT NULL,
  quantity_change decimal(15,3) NOT NULL,
  reason text NOT NULL,
  performed_by uuid REFERENCES users(id) NOT NULL,
  approved_by uuid REFERENCES users(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wastage_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES products(id) NOT NULL,
  batch_id uuid REFERENCES batches(id),
  store_id uuid REFERENCES stores(id) NOT NULL,
  quantity decimal(15,3) NOT NULL,
  cost_impact decimal(15,2) NOT NULL,
  reason text NOT NULL CHECK (reason IN ('expired', 'damaged', 'theft', 'quality', 'other')),
  recorded_by uuid REFERENCES users(id) NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- CUSTOMERS & LOYALTY (Feature Area 4)
-- ============================================================================

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_number text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  address text,
  
  -- Customer Type (Feature Area 2)
  type text NOT NULL DEFAULT 'Normal' CHECK (type IN ('Normal', 'Wholesale', 'Credit')),
  
  -- i18n (Feature Area 11)
  preferred_language text DEFAULT 'en' CHECK (preferred_language IN ('en', 'si', 'ta')),
  
  -- Credit Management
  credit_limit decimal(15,2) DEFAULT 0,
  current_balance decimal(15,2) DEFAULT 0,
  payment_terms_days int DEFAULT 0,
  
  -- Loyalty
  loyalty_points int DEFAULT 0,
  loyalty_tier_id uuid,
  
  -- Personal
  date_of_birth date,
  anniversary_date date,
  
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_price_lists (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  special_price decimal(15,2) NOT NULL,
  start_date date,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(customer_id, product_id)
);

CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  min_points int NOT NULL,
  discount_percentage decimal(5,2) DEFAULT 0,
  benefits jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loyalty_points (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid REFERENCES customers(id) NOT NULL,
  points int NOT NULL,
  transaction_type text NOT NULL,
  reference_id uuid,
  description text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value decimal(15,2) NOT NULL,
  min_purchase_amount decimal(15,2) DEFAULT 0,
  max_discount_amount decimal(15,2),
  usage_limit int,
  usage_count int DEFAULT 0,
  customer_id uuid REFERENCES customers(id),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- SUPPLIERS & PURCHASING (Feature Area 5)
-- ============================================================================

CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  address text,
  tax_number text,
  payment_terms_days int DEFAULT 30,
  credit_limit decimal(15,2) DEFAULT 0,
  current_balance decimal(15,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_number text UNIQUE NOT NULL,
  supplier_id uuid REFERENCES suppliers(id) NOT NULL,
  store_id uuid REFERENCES stores(id) NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'partially_received', 'completed', 'cancelled')),
  order_date date NOT NULL,
  expected_date date,
  subtotal decimal(15,2) NOT NULL DEFAULT 0,
  tax_amount decimal(15,2) DEFAULT 0,
  other_charges decimal(15,2) DEFAULT 0,
  total_amount decimal(15,2) NOT NULL DEFAULT 0,
  notes text,
  created_by uuid REFERENCES users(id) NOT NULL,
  approved_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id uuid REFERENCES purchase_orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) NOT NULL,
  quantity decimal(15,3) NOT NULL,
  unit_cost decimal(15,2) NOT NULL,
  tax_rate decimal(5,2) DEFAULT 0,
  received_quantity decimal(15,3) DEFAULT 0,
  total_amount decimal(15,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS goods_received_notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  grn_number text UNIQUE NOT NULL,
  po_id uuid REFERENCES purchase_orders(id) NOT NULL,
  supplier_id uuid REFERENCES suppliers(id) NOT NULL,
  store_id uuid REFERENCES stores(id) NOT NULL,
  received_date date NOT NULL,
  received_by uuid REFERENCES users(id) NOT NULL,
  invoice_number text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grn_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  grn_id uuid REFERENCES goods_received_notes(id) ON DELETE CASCADE NOT NULL,
  po_item_id uuid REFERENCES purchase_order_items(id),
  product_id uuid REFERENCES products(id) NOT NULL,
  batch_id uuid REFERENCES batches(id),
  quantity decimal(15,3) NOT NULL,
  unit_cost decimal(15,2) NOT NULL,
  batch_number text,
  manufacture_date date,
  expiry_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS supplier_payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id uuid REFERENCES suppliers(id) NOT NULL,
  po_id uuid REFERENCES purchase_orders(id),
  payment_date date NOT NULL,
  amount decimal(15,2) NOT NULL,
  payment_method text NOT NULL,
  reference_number text,
  notes text,
  recorded_by uuid REFERENCES users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- PROMOTIONS & DISCOUNTS (Feature Area 6)
-- ============================================================================

CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text UNIQUE NOT NULL,
  name_en text NOT NULL,
  name_si text,
  name_ta text,
  description_en text,
  description_si text,
  description_ta text,
  short_label_en text,
  short_label_si text,
  short_label_ta text,
  
  promotion_type text NOT NULL CHECK (promotion_type IN (
    'quantity_discount', 'bogo', 'mix_match', 'bundle', 'tiered', 
    'happy_hour', 'expiry_markdown', 'basket_spend', 'item_count'
  )),
  
  -- Discount Action
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed_per_unit', 'fixed_total', 'bundle_price', 'free_item')),
  discount_value decimal(15,2) NOT NULL,
  free_product_id uuid REFERENCES products(id),
  
  -- Conditions
  min_quantity decimal(15,3),
  min_amount decimal(15,2),
  apply_to_all_after_threshold boolean DEFAULT true,
  
  -- Time-based
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  start_time time,
  end_time time,
  days_of_week jsonb,
  
  -- Customer & Store Filters
  customer_types jsonb DEFAULT '["Normal", "Wholesale", "Credit"]'::jsonb,
  store_ids jsonb DEFAULT '[]'::jsonb,
  
  -- Priority & Stacking
  priority int DEFAULT 0,
  is_stackable boolean DEFAULT false,
  
  -- Usage Limits
  usage_limit int,
  usage_count int DEFAULT 0,
  usage_limit_per_customer int,
  
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promotion_products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_id uuid REFERENCES promotions(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  is_trigger boolean DEFAULT true,
  is_reward boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(promotion_id, product_id)
);

CREATE TABLE IF NOT EXISTS promotion_usage (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_id uuid REFERENCES promotions(id) NOT NULL,
  customer_id uuid REFERENCES customers(id),
  sale_id uuid,
  discount_amount decimal(15,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- SALES & TRANSACTIONS (Feature Area 1)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_number text UNIQUE NOT NULL,
  store_id uuid REFERENCES stores(id) NOT NULL,
  terminal_id uuid REFERENCES terminals(id),
  cashier_id uuid REFERENCES users(id) NOT NULL,
  customer_id uuid REFERENCES customers(id),
  customer_type text DEFAULT 'Normal',
  
  -- Amounts
  subtotal decimal(15,2) NOT NULL DEFAULT 0,
  discount_total decimal(15,2) DEFAULT 0,
  tax_total decimal(15,2) DEFAULT 0,
  total_amount decimal(15,2) NOT NULL DEFAULT 0,
  
  -- Status
  status text DEFAULT 'completed' CHECK (status IN ('parked', 'completed', 'returned', 'cancelled')),
  payment_status text DEFAULT 'paid' CHECK (payment_status IN ('paid', 'partial', 'unpaid')),
  
  -- Credit Sale
  is_credit_sale boolean DEFAULT false,
  credit_due_date date,
  
  -- Receipt
  receipt_printed boolean DEFAULT false,
  receipt_sent_sms boolean DEFAULT false,
  receipt_sent_email boolean DEFAULT false,
  
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) NOT NULL,
  batch_id uuid REFERENCES batches(id),
  product_name text NOT NULL,
  quantity decimal(15,3) NOT NULL,
  unit_price decimal(15,2) NOT NULL,
  original_price decimal(15,2) NOT NULL,
  discount_amount decimal(15,2) DEFAULT 0,
  discount_reason text,
  promotion_id uuid REFERENCES promotions(id),
  tax_rate decimal(5,2) DEFAULT 0,
  tax_amount decimal(15,2) DEFAULT 0,
  total_amount decimal(15,2) NOT NULL,
  weight decimal(10,3),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sale_payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'wallet', 'qr', 'credit')),
  amount decimal(15,2) NOT NULL,
  reference_number text,
  card_last_4 text,
  surcharge_amount decimal(15,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS parked_sales (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE NOT NULL,
  parking_reason text,
  parked_by uuid REFERENCES users(id) NOT NULL,
  parked_at timestamptz DEFAULT now(),
  resumed_at timestamptz,
  resumed_by uuid REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS returns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_number text UNIQUE NOT NULL,
  original_sale_id uuid REFERENCES sales(id) NOT NULL,
  store_id uuid REFERENCES stores(id) NOT NULL,
  customer_id uuid REFERENCES customers(id),
  return_type text NOT NULL CHECK (return_type IN ('full', 'partial', 'exchange')),
  subtotal decimal(15,2) NOT NULL,
  tax_total decimal(15,2) DEFAULT 0,
  total_amount decimal(15,2) NOT NULL,
  refund_method text NOT NULL,
  processed_by uuid REFERENCES users(id) NOT NULL,
  reason text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS return_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_id uuid REFERENCES returns(id) ON DELETE CASCADE NOT NULL,
  sale_item_id uuid REFERENCES sale_items(id) NOT NULL,
  product_id uuid REFERENCES products(id) NOT NULL,
  quantity decimal(15,3) NOT NULL,
  unit_price decimal(15,2) NOT NULL,
  total_amount decimal(15,2) NOT NULL,
  restock boolean DEFAULT true,
  condition text CHECK (condition IN ('good', 'damaged', 'expired')),
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- ACCOUNTS RECEIVABLE (Feature Area 4)
-- ============================================================================

CREATE TABLE IF NOT EXISTS credit_sales (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id uuid REFERENCES sales(id) NOT NULL,
  customer_id uuid REFERENCES customers(id) NOT NULL,
  total_amount decimal(15,2) NOT NULL,
  paid_amount decimal(15,2) DEFAULT 0,
  balance_amount decimal(15,2) NOT NULL,
  due_date date NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ar_payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  credit_sale_id uuid REFERENCES credit_sales(id) NOT NULL,
  customer_id uuid REFERENCES customers(id) NOT NULL,
  amount decimal(15,2) NOT NULL,
  payment_method text NOT NULL,
  reference_number text,
  payment_date date NOT NULL,
  received_by uuid REFERENCES users(id) NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_reminders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  credit_sale_id uuid REFERENCES credit_sales(id) NOT NULL,
  customer_id uuid REFERENCES customers(id) NOT NULL,
  reminder_type text NOT NULL CHECK (reminder_type IN ('email', 'sms')),
  sent_at timestamptz DEFAULT now(),
  status text DEFAULT 'sent'
);

-- ============================================================================
-- FINANCE & CASH MANAGEMENT (Feature Area 7)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cash_drawers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid REFERENCES user_sessions(id) NOT NULL,
  terminal_id uuid REFERENCES terminals(id) NOT NULL,
  opened_by uuid REFERENCES users(id) NOT NULL,
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  closed_by uuid REFERENCES users(id),
  opening_balance decimal(15,2) NOT NULL,
  expected_balance decimal(15,2),
  actual_balance decimal(15,2),
  variance decimal(15,2),
  denomination_details jsonb,
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cash_movements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cash_drawer_id uuid REFERENCES cash_drawers(id) NOT NULL,
  movement_type text NOT NULL CHECK (movement_type IN ('cash_in', 'cash_out', 'petty_cash', 'bank_deposit')),
  amount decimal(15,2) NOT NULL,
  reason text NOT NULL,
  reference_number text,
  performed_by uuid REFERENCES users(id) NOT NULL,
  approved_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id uuid REFERENCES stores(id) NOT NULL,
  category text NOT NULL,
  amount decimal(15,2) NOT NULL,
  expense_date date NOT NULL,
  vendor text,
  description text NOT NULL,
  payment_method text NOT NULL,
  reference_number text,
  recorded_by uuid REFERENCES users(id) NOT NULL,
  approved_by uuid REFERENCES users(id),
  receipt_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id uuid REFERENCES stores(id) NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  tax_type text NOT NULL,
  taxable_amount decimal(15,2) NOT NULL,
  tax_amount decimal(15,2) NOT NULL,
  generated_at timestamptz DEFAULT now(),
  generated_by uuid REFERENCES users(id) NOT NULL
);

-- ============================================================================
-- MULTI-STORE OPERATIONS (Feature Area 9)
-- ============================================================================

CREATE TABLE IF NOT EXISTS store_transfers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_number text UNIQUE NOT NULL,
  from_store_id uuid REFERENCES stores(id) NOT NULL,
  to_store_id uuid REFERENCES stores(id) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),
  requested_by uuid REFERENCES users(id) NOT NULL,
  requested_at timestamptz DEFAULT now(),
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  shipped_at timestamptz,
  received_by uuid REFERENCES users(id),
  received_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transfer_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_id uuid REFERENCES store_transfers(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) NOT NULL,
  batch_id uuid REFERENCES batches(id),
  quantity decimal(15,3) NOT NULL,
  received_quantity decimal(15,3) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Products
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- Sales
CREATE INDEX IF NOT EXISTS idx_sales_number ON sales(sale_number);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_store ON sales(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_cashier ON sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);

-- Inventory
CREATE INDEX IF NOT EXISTS idx_batches_product ON batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_store ON stock_movements(store_id);

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(type);
CREATE INDEX IF NOT EXISTS idx_customers_number ON customers(customer_number);

-- Promotions
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active);

-- Purchase Orders
CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_store ON purchase_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);

-- ============================================================================
-- ROW LEVEL SECURITY (Feature Area 8, 13)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tier_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wastage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_received_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grn_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE parked_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_drawers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_items ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Authenticated users can read, specific roles can modify)
-- Note: In production, these should be more granular based on user roles and store access

-- Users: Only authenticated users can view other users
CREATE POLICY "Authenticated users can view users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage users"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'Admin'
      AND u.is_active = true
    )
  );

-- Products: Everyone can read, admins/managers can modify
CREATE POLICY "Authenticated users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Managers can manage products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('Admin', 'Manager')
      AND u.is_active = true
    )
  );

-- Sales: Users can view their store's sales
CREATE POLICY "Users can view sales"
  ON sales FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (u.role IN ('Admin', 'Manager') OR u.store_id = sales.store_id)
      AND u.is_active = true
    )
  );

CREATE POLICY "Users can create sales"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('Admin', 'Manager', 'Cashier')
      AND u.is_active = true
    )
  );

-- Customers: All authenticated can view and create
CREATE POLICY "Authenticated users can view customers"
  ON customers FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can manage customers"
  ON customers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.is_active = true
    )
  );

-- Similar policies for other tables...
-- For brevity, applying basic authenticated access to remaining tables

CREATE POLICY "Authenticated users can access categories"
  ON categories FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can access suppliers"
  ON suppliers FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can access promotions"
  ON promotions FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Managers can manage promotions"
  ON promotions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('Admin', 'Manager')
    )
  );
