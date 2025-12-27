-- ==========================================
-- 全国一律送料カラムの追加マイグレーション
-- ==========================================

-- shipping_methodsテーブルにuniform_feeカラムを追加
ALTER TABLE public.shipping_methods
ADD COLUMN IF NOT EXISTS uniform_fee INTEGER;

COMMENT ON COLUMN shipping_methods.uniform_fee IS '全国一律送料（fee_typeがuniformの場合）';
