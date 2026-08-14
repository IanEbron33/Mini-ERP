-- =================================================================
-- MINI-ERP WEB SYSTEM: SUPABASE DATABASE SCHEMA & RLS SETUP
-- Execute this entire script in Supabase SQL Editor
-- =================================================================

-- 1. DROP EXISTING TABLES AND ENUMS (If resetting)
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.stock_logs CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS account_status CASCADE;
DROP TYPE IF EXISTS stock_status CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS stock_movement_type CASCADE;
DROP TYPE IF EXISTS audit_level CASCADE;

-- 2. CREATE ENUM TYPES
CREATE TYPE user_role AS ENUM ('Admin', 'Sales', 'Inventory');
CREATE TYPE account_status AS ENUM ('Active', 'Inactive');
CREATE TYPE stock_status AS ENUM ('In Stock', 'Low Stock', 'Out of Stock');
CREATE TYPE order_status AS ENUM ('Pending', 'Fulfilled', 'Cancelled');
CREATE TYPE stock_movement_type AS ENUM ('Supplier Addition', 'Order Deduction');
CREATE TYPE audit_level AS ENUM ('INFO', 'WARNING', 'SECURITY');

-- 3. PROFILES TABLE (Tied to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'Sales',
  department TEXT NOT NULL DEFAULT 'Sales & Outbound',
  status account_status NOT NULL DEFAULT 'Active',
  initials TEXT NOT NULL DEFAULT 'EM',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PRODUCTS & CATALOG TABLE
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 10,
  retail_price NUMERIC(10, 2) NOT NULL,
  wholesale_price NUMERIC(10, 2) NOT NULL,
  status stock_status NOT NULL DEFAULT 'In Stock',
  image_url TEXT DEFAULT 'product_img.jpg',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ORDERS TABLE
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  item_count INT NOT NULL DEFAULT 1,
  total_amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  status order_status NOT NULL DEFAULT 'Pending',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ORDER ITEMS TABLE
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL
);

-- 7. STOCK LOGS TABLE
CREATE TABLE public.stock_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_code TEXT UNIQUE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  type stock_movement_type NOT NULL,
  quantity_shift INT NOT NULL,
  reference_note TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  balance_after INT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. AUDIT LOGS TABLE
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_code TEXT UNIQUE NOT NULL,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  module TEXT NOT NULL,
  ip_address TEXT DEFAULT '127.0.0.1',
  level audit_level NOT NULL DEFAULT 'INFO',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. AUTOMATIC TRIGGER FOR PROFILE CREATION ON USER SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role public.user_role;
  v_raw_role text;
BEGIN
  v_raw_role := NEW.raw_user_meta_data->>'role';

  IF v_raw_role = 'Admin' THEN
    v_role := 'Admin'::public.user_role;
  ELSIF v_raw_role = 'Inventory' THEN
    v_role := 'Inventory'::public.user_role;
  ELSE
    v_role := 'Sales'::public.user_role;
  END IF;

  INSERT INTO public.profiles (
    id,
    employee_id,
    full_name,
    email,
    role,
    department,
    status,
    initials
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'employee_id', 'EMP-' || SUBSTRING(NEW.id::text FROM 1 FOR 6)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    v_role,
    COALESCE(NEW.raw_user_meta_data->>'department', 'Sales & Outbound'),
    'Active'::public.account_status,
    UPPER(SUBSTRING(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email) FROM 1 FOR 2))
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    department = EXCLUDED.department;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Prevent auth.users creation from being blocked by trigger errors
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read profiles for authenticated" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow read products for authenticated" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow read orders for authenticated" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow read order_items for authenticated" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Allow read stock_logs for authenticated" ON public.stock_logs FOR SELECT USING (true);
CREATE POLICY "Allow read audit_logs for authenticated" ON public.audit_logs FOR SELECT USING (true);

-- Allow insert/update for service role and admin/authorized operations
CREATE POLICY "Allow all access for service role on profiles" ON public.profiles USING (true) WITH CHECK (true);
CREATE POLICY "Allow insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow delete products" ON public.products FOR DELETE USING (true);
CREATE POLICY "Allow insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert order_items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete order_items" ON public.order_items FOR DELETE USING (true);
CREATE POLICY "Allow insert stock_logs" ON public.stock_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete stock_logs" ON public.stock_logs FOR DELETE USING (true);
CREATE POLICY "Allow insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);



