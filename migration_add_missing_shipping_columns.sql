-- ==========================================
-- 発送方法テーブルの不足カラムをまとめて追加
-- ==========================================

-- size_fees (サイズ別送料)
ALTER TABLE public.shipping_methods
ADD COLUMN IF NOT EXISTS size_fees JSONB DEFAULT '{}'::jsonb;

-- uniform_fee (全国一律送料)
ALTER TABLE public.shipping_methods
ADD COLUMN IF NOT EXISTS uniform_fee INTEGER;

COMMENT ON COLUMN shipping_methods.fee_type IS '送料タイプ: uniform（全国一律）、area（地域別）、size（サイズ別）';
COMMENT ON COLUMN shipping_methods.size_fees IS 'サイズ別送料（JSON形式、fee_typeがsizeの場合）';
COMMENT ON COLUMN shipping_methods.uniform_fee IS '全国一律送料（fee_typeがuniformの場合）';

-- PostgREST のスキーマキャッシュ更新（効かない環境もあるので、その場合はSupabaseのAPI設定でReload）
SELECT pg_notify('pgrst', 'reload schema');
