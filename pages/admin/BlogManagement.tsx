import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { supabase } from '../../lib/supabase';
import { IconEdit, IconTrash, IconRefreshCw, IconPlus, IconExternalLink } from '../../components/Icons';

interface BlogArticle {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  image_url?: string;
  note_url?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
}

const BlogManagement = () => {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [noteRssUrl, setNoteRssUrl] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_articles')
        .select('*')
        .order('published_at', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('記事の取得に失敗しました:', error);
      setMessage({ type: 'error', text: '記事の取得に失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  const fetchFromNote = async () => {
    if (!noteRssUrl.trim()) {
      setMessage({ type: 'error', text: 'noteのRSS URLを入力してください' });
      return;
    }

    try {
      setFetching(true);
      setMessage(null);

      // APIエンドポイントを呼び出し
      const response = await fetch('/api/fetch-note-articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rssUrl: noteRssUrl }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '記事の取得に失敗しました');
      }

      setMessage({ 
        type: 'success', 
        text: `${result.count || 0}件の記事を取得しました` 
      });
      
      // 記事一覧を再取得
      await fetchArticles();
    } catch (error) {
      console.error('noteからの記事取得に失敗しました:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : '記事の取得に失敗しました' 
      });
    } finally {
      setFetching(false);
    }
  };

  const togglePublish = async (articleId: string, currentStatus: boolean) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('blog_articles')
        .update({ is_published: !currentStatus })
        .eq('id', articleId);

      if (error) throw error;
      await fetchArticles();
      setMessage({ type: 'success', text: '公開状態を更新しました' });
    } catch (error) {
      console.error('公開状態の更新に失敗しました:', error);
      setMessage({ type: 'error', text: '公開状態の更新に失敗しました' });
    }
  };

  const deleteArticle = async (articleId: string) => {
    if (!window.confirm('本当にこの記事を削除しますか？')) return;

    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('blog_articles')
        .delete()
        .eq('id', articleId);

      if (error) throw error;
      await fetchArticles();
      setMessage({ type: 'success', text: '記事を削除しました' });
    } catch (error) {
      console.error('記事の削除に失敗しました:', error);
      setMessage({ type: 'error', text: '記事の削除に失敗しました' });
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">BLOG管理</h1>
        <p className="text-sm text-gray-500">noteから記事を取得して、BLOGページに表示します</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Note RSS URL Input */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">noteから記事を取得</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              noteのRSS URL
            </label>
            <input
              type="text"
              value={noteRssUrl}
              onChange={(e) => setNoteRssUrl(e.target.value)}
              placeholder="https://note.com/[ユーザー名]/rss"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
            />
            <p className="mt-2 text-xs text-gray-500">
              noteのユーザーページのRSS URLを入力してください（例: https://note.com/username/rss）
            </p>
          </div>
          <button
            onClick={fetchFromNote}
            disabled={fetching || !noteRssUrl.trim()}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <IconRefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
            {fetching ? '取得中...' : '記事を取得'}
          </button>
        </div>
      </div>

      {/* Articles List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">記事一覧</h2>
          <span className="text-sm text-gray-500">{articles.length}件</span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-sm text-gray-500">読み込み中...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-500">記事がありません</p>
            <p className="text-xs text-gray-400 mt-2">noteから記事を取得してください</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {articles.map((article) => (
              <div key={article.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  {article.image_url && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <img 
                        src={article.image_url} 
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-1 text-xs rounded ${
                          article.is_published 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {article.is_published ? '公開中' : '非公開'}
                        </span>
                      </div>
                    </div>
                    {article.excerpt && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {article.published_at && (
                        <span>公開日: {new Date(article.published_at).toLocaleDateString('ja-JP')}</span>
                      )}
                      {article.note_url && (
                        <a 
                          href={article.note_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                        >
                          <IconExternalLink className="w-3 h-3" />
                          noteで見る
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => togglePublish(article.id, article.is_published)}
                        className={`px-4 py-2 text-xs rounded-lg transition-colors ${
                          article.is_published
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {article.is_published ? '非公開にする' : '公開する'}
                      </button>
                      <button
                        onClick={() => deleteArticle(article.id)}
                        className="px-4 py-2 text-xs rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors flex items-center gap-1"
                      >
                        <IconTrash className="w-3 h-3" />
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogManagement;

