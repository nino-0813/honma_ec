-- ==========================================
-- 発送方法管理機能のマイグレーション
-- ==========================================

-- 1. shipping_methods テーブル (発送方法)
CREATE TABLE IF NOT EXISTS public.shipping_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- 発送方法名（例：米用ダンボールM）
  box_size INTEGER, -- ダンボールサイズ（60 / 80 / 100 / 120）
  max_weight_kg NUMERIC(5, 2), -- 最大重量（kg）
  max_items_per_box INTEGER, -- 1箱に入る最大商品数（発送量）
  fee_type TEXT NOT NULL DEFAULT 'uniform', -- 'uniform'（全国一律）または 'area'（地域別）
  area_fees JSONB DEFAULT '{}'::jsonb, -- 地域別送料（JSON形式）
  uniform_fee INTEGER, -- 全国一律送料（fee_typeが'uniform'の場合）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. product_shipping_methods 中間テーブル (商品と発送方法の紐づけ)
CREATE TABLE IF NOT EXISTS public.product_shipping_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  shipping_method_id UUID NOT NULL REFERENCES public.shipping_methods(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, shipping_method_id) -- 同じ商品に同じ発送方法を重複登録できないように
);

-- 3. インデックスの作成
CREATE INDEX IF NOT EXISTS idx_product_shipping_methods_product_id ON public.product_shipping_methods(product_id);
CREATE INDEX IF NOT EXISTS idx_product_shipping_methods_shipping_method_id ON public.product_shipping_methods(shipping_method_id);

-- 4. updated_at を自動更新するトリガー
DROP TRIGGER IF EXISTS update_shipping_methods_updated_at ON shipping_methods;
CREATE TRIGGER update_shipping_methods_updated_at 
  BEFORE UPDATE ON shipping_methods 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- 5. コメントの追加（テーブル説明）
COMMENT ON TABLE shipping_methods IS '発送方法（ダンボール・配送単位）のマスタテーブル';
COMMENT ON TABLE product_shipping_methods IS '商品と発送方法の紐づけテーブル（多対多）';

-- 6. 初期データの投入（オプション：必要に応じて）
-- INSERT INTO public.shipping_methods (name, box_size, max_weight_kg, max_items_per_box, fee_type, area_fees)
-- VALUES 
--   ('米用ダンボールM', 80, 10.0, 5, 'area', '{"hokkaido": 1200, "tohoku": 1000, "kanto": 800, "chubu": 900, "kansai": 1000, "chugoku": 1100, "shikoku": 1200, "kyushu": 1300, "okinawa": 2000}'::jsonb),
--   ('米用ダンボールL', 100, 15.0, 8, 'area', '{"hokkaido": 1500, "tohoku": 1300, "kanto": 1000, "chubu": 1100, "kansai": 1200, "chugoku": 1300, "shikoku": 1400, "kyushu": 1500, "okinawa": 2200}'::jsonb);

