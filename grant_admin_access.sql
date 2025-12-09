-- ==========================================
-- 管理者権限を付与するSQL
-- ==========================================
-- このSQLをSupabaseのSQL Editorで実行してください

-- 1. 既存のユーザーをprofilesテーブルに同期（まだ存在しない場合）
INSERT INTO public.profiles (id, email)
SELECT id, email
FROM auth.users
WHERE email IN ('mxsxgg55@gmail.com', 'naco.inc.sado@gmail.com')
ON CONFLICT (id) DO NOTHING;

-- 2. 管理者権限を付与
UPDATE public.profiles
SET is_admin = true
WHERE email IN ('mxsxgg55@gmail.com', 'naco.inc.sado@gmail.com');

-- 3. 確認: 管理者権限が正しく設定されたか確認
SELECT 
    id,
    email,
    is_admin,
    created_at,
    updated_at
FROM public.profiles
WHERE email IN ('mxsxgg55@gmail.com', 'naco.inc.sado@gmail.com');

-- 期待される結果:
-- - 2行が表示される
-- - 両方のユーザーの is_admin が true になっている

