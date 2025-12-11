-- BLOG記事テーブルを作成
CREATE TABLE IF NOT EXISTS public.blog_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  note_url TEXT UNIQUE,
  published_at TIMESTAMP WITH TIME ZONE,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_blog_articles_published_at ON public.blog_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_articles_is_published ON public.blog_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_articles_note_url ON public.blog_articles(note_url);

-- RLS (Row Level Security) ポリシーを設定
ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが公開記事を閲覧可能
CREATE POLICY "Anyone can view published articles"
  ON public.blog_articles
  FOR SELECT
  USING (is_published = true);

-- 管理者のみが全記事を閲覧可能
CREATE POLICY "Admins can view all articles"
  ON public.blog_articles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- 管理者のみが記事を挿入可能
CREATE POLICY "Admins can insert articles"
  ON public.blog_articles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- 管理者のみが記事を更新可能
CREATE POLICY "Admins can update articles"
  ON public.blog_articles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- 管理者のみが記事を削除可能
CREATE POLICY "Admins can delete articles"
  ON public.blog_articles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

