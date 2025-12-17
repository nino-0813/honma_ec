import React, { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { supabase } from '../lib/supabase';
import { FadeInImage } from '../components/UI';
import { IconArrowLeft, IconTable } from '../components/Icons';

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
    } else if (!match) {
      setError('記事IDが指定されていません');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match, params?.id]);

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

      if (fetchError) {
        // 公開状態に関係なく取得を試みる（デバッグ用）
        const { data: anyData, error: anyError } = await supabase
          .from('blog_articles')
          .select('*')
          .eq('id', articleId)
          .single();
        
        if (anyError) {
          throw anyError;
        }
        
        if (anyData) {
          setError('この記事は非公開です');
          setArticle(null);
        } else {
          throw fetchError;
        }
      } else {
        setArticle(data);
      }
    } catch (err) {
      console.error('記事の取得に失敗しました:', err);
      setError(`記事が見つかりませんでした: ${err instanceof Error ? err.message : String(err)}`);
      setArticle(null);
    } finally {
      setLoading(false);
    }
  };

  const slugify = (text: string, idx: number) => {
    const base = (text || '').toString().trim().replace(/\s+/g, '-');
    const safe = base || `heading-${idx}`;
    return safe
      .toLowerCase()
      .replace(/[^a-z0-9\-ぁ-んァ-ン一-龯ー]/g, '')
      || `heading-${idx}`;
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

  const renderHtmlFallback = (html: string) => (
    <div
      className="prose prose-slate max-w-none text-gray-700 leading-relaxed space-y-6"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );

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
            <div className="mb-8 aspect-video max-h-[360px] md:max-h-[500px] overflow-hidden rounded-lg bg-gray-100">
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

          <div className="prose prose-slate max-w-none text-gray-700 leading-relaxed space-y-6">
            {(() => {
              if (!article.content) {
                return <p className="text-gray-500">コンテンツがありません</p>;
              }
              // まず JSON として解釈を試みる。失敗したら HTML とみなして描画。
              try {
                const blocks = JSON.parse(article.content);
                if (Array.isArray(blocks) && blocks.length > 0) {
                  const getText = (b: any) =>
                    b?.content || b?.text || b?.data?.text || '';
                  const getListItems = (b: any) =>
                    b?.listItems || b?.data?.items || [];
                  const getImageUrl = (b: any) =>
                    b?.imageUrl || b?.data?.url || b?.data?.file?.url;
                  const getEmbedUrl = (b: any) =>
                    b?.embedUrl || b?.data?.url;
                  const getFileUrl = (b: any) =>
                    b?.fileUrl || b?.data?.url;
                  const getFileName = (b: any) =>
                    b?.fileName || b?.data?.name;

                  // 見出しID用リストを事前に生成
                  const headingItems: { id: string; text: string; level: 1 | 2 }[] = [];
                  let headingCounter = 0;
                  blocks.forEach((b: any) => {
                    if (b?.type === 'heading1' || b?.type === 'heading2') {
                      const text = getText(b) || '(無題)';
                      const id = slugify(text, headingCounter);
                      headingItems.push({ id, text, level: b.type === 'heading1' ? 1 : 2 });
                      headingCounter++;
                    }
                  });
                  let headingRenderIndex = 0;

                  return blocks.map((block: any, index: number) => {
                    const type = block?.type;
                    if (!type) return null;

                    switch (type) {
                      case 'heading1': {
                        const text = getText(block);
                        const h = headingItems[headingRenderIndex++] || { id: `heading-${headingRenderIndex}`, text, level: 1 };
                        return (
                          <h1 key={index} id={h.id} className="text-3xl font-bold mt-8 mb-4 scroll-mt-24">
                            {text}
                          </h1>
                        );
                      }
                      case 'heading2': {
                        const text = getText(block);
                        const h = headingItems[headingRenderIndex++] || { id: `heading-${headingRenderIndex}`, text, level: 2 };
                        return (
                          <h2 key={index} id={h.id} className="text-2xl font-semibold mt-6 mb-3 scroll-mt-24">
                            {text}
                          </h2>
                        );
                      }
                      case 'toc': {
                        if (headingItems.length === 0) {
                          return (
                            <div key={index} className="my-6 p-4 rounded-lg bg-gray-50 border border-gray-100 text-sm text-gray-500">
                              目次に表示する見出しがありません。
                            </div>
                          );
                        }
                        return (
                          <div key={index} className="my-6 p-4 rounded-lg bg-gray-50 border border-gray-100">
                            <div className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                              <IconTable className="w-4 h-4" />
                              目次
                            </div>
                            <ul className="space-y-2 text-sm text-gray-700">
                              {headingItems.map((h, idx) => (
                                <li key={idx} className={h.level === 2 ? 'pl-4 text-gray-600' : ''}>
                                  <a href={`#${h.id}`} className="hover:underline">
                                    {h.text}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      }
                      case 'embed': {
                        const url = getEmbedUrl(block);
                        const text = getText(block);
                        return (
                          <div key={index} className="my-6 p-4 rounded-lg bg-gray-50 border border-gray-100">
                            {url ? (
                              <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                {url}
                              </a>
                            ) : (
                              <span className="text-sm text-gray-500">埋め込みURLがありません</span>
                            )}
                            {text && (
                              <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{text}</p>
                            )}
                          </div>
                        );
                      }
                      case 'file': {
                        const url = getFileUrl(block);
                        const name = getFileName(block);
                        const text = getText(block);
                        return (
                          <div key={index} className="my-6 p-4 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between gap-4">
                            <div className="text-sm text-gray-800 break-all">
                              {url ? (
                                <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  {name || 'ファイルを開く'}
                                </a>
                              ) : (
                                <span className="text-gray-500">ファイルがありません</span>
                              )}
                              {text && (
                                <div className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{text}</div>
                              )}
                            </div>
                          </div>
                        );
                      }
                      case 'image': {
                        const img = getImageUrl(block);
                        const text = getText(block);
                        return img ? (
                          <div key={index} className="my-6">
                            <img
                              src={img}
                              alt=""
                              className="w-full h-auto rounded-lg"
                            />
                            {text && (
                              <p className="text-center text-sm text-gray-500 mt-2">{text}</p>
                            )}
                          </div>
                        ) : null;
                      }
                      case 'bulletList': {
                        const items = getListItems(block);
                        return (
                          <ul key={index} className="list-disc list-inside space-y-2 my-4">
                            {items.map((item: string, idx: number) => (
                              <li key={idx}>{item || ''}</li>
                            ))}
                          </ul>
                        );
                      }
                      case 'numberedList': {
                        const items = getListItems(block);
                        return (
                          <ol key={index} className="list-decimal list-inside space-y-2 my-4">
                            {items.map((item: string, idx: number) => (
                              <li key={idx}>{item || ''}</li>
                            ))}
                          </ol>
                        );
                      }
                      case 'quote': {
                        const text = getText(block);
                        return (
                          <blockquote key={index} className="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-600">
                            {text}
                          </blockquote>
                        );
                      }
                      case 'code': {
                        const text = getText(block);
                        return (
                          <div key={index} className="bg-gray-800 text-gray-100 rounded-lg p-4 my-4 font-mono text-sm overflow-x-auto">
                            <pre className="whitespace-pre">{text}</pre>
                          </div>
                        );
                      }
                      case 'divider':
                        return <hr key={index} className="my-8 border-gray-200" />;
                      case 'paragraph':
                      default: {
                        const text = getText(block);
                        return (
                          <p key={index} className="whitespace-pre-wrap">
                            {text}
                          </p>
                        );
                      }
                    }
                  });
                } else {
                  // JSON 配列でない場合は HTML とみなして表示
                  return renderHtmlFallback(article.content);
                }
              } catch (err) {
                console.error('コンテンツのパースエラー:', err);
                // JSONでない場合は旧形式として表示
                return renderHtmlFallback(article.content);
              }
            })()}
          </div>

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

