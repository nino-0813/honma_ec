-- ==========================================
-- サイズ別送料カラムの追加マイグレーション
-- ==========================================

-- shipping_methodsテーブルにsize_feesカラムを追加
ALTER TABLE public.shipping_methods 
ADD COLUMN IF NOT EXISTS size_fees JSONB DEFAULT '{}'::jsonb;

-- fee_typeのコメントを更新
COMMENT ON COLUMN shipping_methods.fee_type IS '送料タイプ: uniform（全国一律）、area（地域別）、size（サイズ別）';
COMMENT ON COLUMN shipping_methods.size_fees IS 'サイズ別送料（JSON形式、fee_typeがsizeの場合）';

