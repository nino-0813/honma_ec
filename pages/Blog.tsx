import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { supabase } from '../lib/supabase';
import { FadeInImage } from '../components/UI';

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

const Blog = () => {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
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
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setArticles(data || []);
    } catch (err) {
      console.error('記事の取得に失敗しました:', err);
      setError('記事の取得に失敗しました');
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

  return (
    <div className="pt-28 pb-24 min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-serif tracking-widest text-primary mb-4">BLOG</h1>
          <div className="w-12 h-px bg-primary"></div>
        </div>

        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-500">読み込み中...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {!loading && !error && articles.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500">ブログ記事は準備中です。</p>
          </div>
        )}

        {!loading && !error && articles.length > 0 && (
          <div className="space-y-12">
            {articles.map((article) => (
              <article key={article.id} className="border-b border-gray-100 pb-12 last:border-b-0">
                <Link href={`/blog/${article.id}`}>
                  <a className="block group">
                    {article.image_url && (
                      <div className="mb-6 aspect-video overflow-hidden rounded-lg bg-gray-100">
                        <FadeInImage
                          src={article.image_url}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="mb-4">
                      {article.published_at && (
                        <time className="text-sm text-gray-500">
                          {formatDate(article.published_at)}
                        </time>
                      )}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-serif font-medium text-gray-900 mb-4 group-hover:text-gray-600 transition-colors">
                      {article.title}
                    </h2>
                    {article.excerpt && (
                      <p className="text-gray-600 leading-relaxed mb-4 line-clamp-3">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                      <span>続きを読む</span>
                      <span>→</span>
                    </div>
                  </a>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
