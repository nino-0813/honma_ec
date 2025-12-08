-- ==========================================
-- IKEVEGE Supabase Database Schema
-- ==========================================

-- 1. 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 列挙型の定義
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- テーブル定義
-- ==========================================

-- 3. profiles テーブル (ユーザー情報)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  postal_code TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'JP',
  is_admin BOOLEAN DEFAULT false, -- 管理者フラグ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. products テーブル (商品情報)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  handle TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  image TEXT, -- メイン画像URL (互換性のため維持)
  images TEXT[] DEFAULT '{}', -- 複数画像URL
  category TEXT NOT NULL,
  subcategory TEXT, -- サブカテゴリー (コシヒカリ等)
  stock INTEGER DEFAULT 0, -- 在庫数
  sku TEXT, -- 商品番号
  is_active BOOLEAN DEFAULT true, -- 公開状態
  sold_out BOOLEAN DEFAULT false, -- 在庫切れフラグ (互換性のため維持、基本はstockで判断)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. orders テーブル (注文情報)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE, -- 自動生成される注文番号 (ORD-YYMMDD-XXXX)
  auth_user_id UUID REFERENCES auth.users(id), -- ログインユーザーの場合
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  shipping_address TEXT,
  shipping_city TEXT,
  shipping_postal_code TEXT,
  shipping_country TEXT DEFAULT 'JP',
  shipping_method TEXT,
  subtotal INTEGER NOT NULL,
  shipping_cost INTEGER NOT NULL,
  total INTEGER NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  payment_intent_id TEXT,
  payment_method TEXT,
  order_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. order_items テーブル (注文明細)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_title TEXT NOT NULL,
  product_price INTEGER NOT NULL,
  product_image TEXT,
  quantity INTEGER NOT NULL,
  line_total INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. inquiries テーブル (お問い合わせ)
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread', -- 'unread', 'read', 'replied'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 関数とトリガー
-- ==========================================

-- updated_at を自動更新する関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーの適用 (存在しない場合のみ作成するロジックが必要だが、CREATE TRIGGER IF NOT EXISTSはPostgresでサポートされていないためDROPして作成)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 新規ユーザー登録時にプロフィールを自動作成する関数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザー作成トリガー
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 注文番号を自動生成する関数
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS trigger AS $$
BEGIN
  -- ORD-YYMMDD-XXXX (ランダム4桁)
  NEW.order_number := 'ORD-' || to_char(now(), 'YYMMDD') || '-' || floor(random() * 9000 + 1000);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 注文番号生成トリガー
DROP TRIGGER IF EXISTS set_order_number ON orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();

-- 管理者権限チェック関数 (RLSで使用)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$;

-- ==========================================
-- RLS (Row Level Security) ポリシー
-- ==========================================

-- RLSの有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Profiles ポリシー
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT USING (public.is_admin());

-- Products ポリシー
DROP POLICY IF EXISTS "Public can view active products" ON products;
CREATE POLICY "Public can view active products" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (public.is_admin());

-- Orders ポリシー
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
CREATE POLICY "Users can read own orders" ON orders FOR SELECT USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create orders" ON orders;
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (true); -- 認証なしでも注文可能にする場合はtrue

DROP POLICY IF EXISTS "Admins can manage orders" ON orders;
CREATE POLICY "Admins can manage orders" ON orders FOR ALL USING (public.is_admin());

-- Order Items ポリシー
DROP POLICY IF EXISTS "Users can read own order items" ON order_items;
CREATE POLICY "Users can read own order items" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND (orders.auth_user_id = auth.uid() OR public.is_admin())
  )
);

DROP POLICY IF EXISTS "Users can create order items" ON order_items;
CREATE POLICY "Users can create order items" ON order_items FOR INSERT WITH CHECK (true);

-- Inquiries ポリシー
DROP POLICY IF EXISTS "Admins can read inquiries" ON inquiries;
CREATE POLICY "Admins can read inquiries" ON inquiries FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Public can create inquiries" ON inquiries;
CREATE POLICY "Public can create inquiries" ON inquiries FOR INSERT WITH CHECK (true);

-- ==========================================
-- reviews テーブル (お客様の声/レビュー)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT, -- 「年間契約のお客様」「3回目の注文」など
  comment TEXT NOT NULL,
  rating DECIMAL(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  date DATE NOT NULL,
  product_name TEXT, -- 購入商品名（例: "約5kg"）
  images TEXT[] DEFAULT '{}', -- 投稿画像URL
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- reviews テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_date ON public.reviews(date DESC);

-- reviews テーブルのRLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 全員が公開されたレビューを閲覧可能
CREATE POLICY "Anyone can view published reviews"
  ON public.reviews
  FOR SELECT
  USING (status = 'published');

-- 管理者のみが全レビューを管理可能
CREATE POLICY "Admins can manage all reviews"
  ON public.reviews
  FOR ALL
  USING (public.is_admin());

-- reviews テーブルの更新日時自動更新トリガー
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();

-- ==========================================
-- email_logs テーブル (メール送信履歴)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipients TEXT[] NOT NULL, -- 送信先メールアドレスの配列
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  sent_by UUID REFERENCES auth.users(id), -- 送信者（管理者）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- email_logs テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_by ON public.email_logs(sent_by);

-- email_logs テーブルのRLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- 管理者のみがメール送信履歴を閲覧・作成可能
CREATE POLICY "Admins can manage email logs"
  ON public.email_logs
  FOR ALL
  USING (public.is_admin());


