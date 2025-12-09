-- productsテーブルに高度なバリエーション設定を保存するJSONカラムを追加
-- 既存のデータには影響を与えません
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS variants_config JSONB DEFAULT '[]'::jsonb;

-- 検索を高速化するためのインデックス（必要に応じて）
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);

