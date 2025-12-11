-- 商品テーブルにdisplay_orderとis_visibleカラムを追加するマイグレーション

-- display_orderカラムを追加（既に存在する場合はスキップ）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE public.products ADD COLUMN display_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- is_visibleカラムを追加（既に存在する場合はスキップ）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'is_visible'
  ) THEN
    ALTER TABLE public.products ADD COLUMN is_visible BOOLEAN DEFAULT true;
  END IF;
END $$;

-- 既存の商品にdisplay_orderを設定（created_at順）
UPDATE public.products
SET display_order = sub.row_num - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as row_num
  FROM public.products
) sub
WHERE public.products.id = sub.id
AND (public.products.display_order IS NULL OR public.products.display_order = 0);

-- 既存の商品にis_visibleを設定（デフォルトでtrue）
UPDATE public.products
SET is_visible = true
WHERE is_visible IS NULL;

