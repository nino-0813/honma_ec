import React, { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { supabase } from '../lib/supabase';
import { FadeInImage } from '../components/UI';
import { IconArrowLeft } from '../components/Icons';

interface BlogArticle {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  image_url?: string;
  note_url?: string;
  published_at?: string;
  created_at: string;
}

const BlogDetail = () => {
  const [match, params] = useRoute<{ id: string }>('/blog/:id');
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (match && params?.id) {
      fetchArticle(params.id);
    }
  }, [match, params]);

  const fetchArticle = async (articleId: string) => {
    if (!supabase) {
      setError('データの取得に失敗しました');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('blog_articles')
        .select('*')
        .eq('id', articleId)
        .eq('is_published', true)
        .single();

      if (fetchError) throw fetchError;

      setArticle(data);
    } catch (err) {
      console.error('記事の取得に失敗しました:', err);
      setError('記事が見つかりませんでした');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="pt-28 pb-24 min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-500">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="pt-28 pb-24 min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <div className="text-center py-16">
            <p className="text-red-500 mb-4">{error || '記事が見つかりませんでした'}</p>
            <Link href="/blog">
              <a className="text-blue-600 hover:text-blue-800">BLOG一覧に戻る</a>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-24 min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <Link href="/blog">
          <a className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors">
            <IconArrowLeft className="w-4 h-4" />
            <span>BLOG一覧に戻る</span>
          </a>
        </Link>

        <article>
          {article.image_url && (
            <div className="mb-8 aspect-video overflow-hidden rounded-lg bg-gray-100">
              <FadeInImage
                src={article.image_url}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="mb-6">
            {article.published_at && (
              <time className="text-sm text-gray-500">
                {formatDate(article.published_at)}
              </time>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-serif font-medium text-gray-900 mb-8">
            {article.title}
          </h1>

          <div 
            className="prose prose-slate max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br />') }}
          />

          {article.note_url && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">この記事はnoteでも公開されています</p>
              <a
                href={article.note_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                noteで見る →
              </a>
            </div>
          )}
        </article>
      </div>
    </div>
  );
};

export default BlogDetail;

