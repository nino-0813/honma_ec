import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  const params = useParams<{ id: string }>();
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendedArticles, setRecommendedArticles] = useState<BlogArticle[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (params?.id) {
      fetchArticle(params.id);
    } else {
      setError('記事IDが指定されていません');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id]);

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

  // おすすめ記事を取得
  useEffect(() => {
    const fetchRecommendedArticles = async () => {
      if (!supabase) {
        console.log('Supabaseが利用できません');
        setRecommendedArticles([]);
        return;
      }

      if (!article?.id) {
        console.log('記事IDがありません');
        setRecommendedArticles([]);
        return;
      }

      try {
        console.log('おすすめ記事を取得開始。現在の記事ID:', article.id);
        
        // まず、is_publishedに関係なく全ての記事を取得してみる（デバッグ用）
        const { data: allData, error: allError } = await supabase
          .from('blog_articles')
          .select('id, title, image_url, published_at, excerpt, created_at, is_published')
          .neq('id', article.id)
          .order('published_at', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(20);

        console.log('全記事データ:', allData);
        console.log('全記事エラー:', allError);

        // is_publishedがtrueの記事を取得
        const { data, error: fetchError } = await supabase
          .from('blog_articles')
          .select('id, title, image_url, published_at, excerpt, created_at')
          .neq('id', article.id)
          .order('published_at', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(20);

        console.log('公開済み記事データ:', data);
        console.log('公開済み記事エラー:', fetchError);

        if (fetchError) {
          console.error('おすすめ記事の取得に失敗しました:', fetchError);
          // エラーでも、is_publishedをチェックしないで取得を試みる
          if (allData && allData.length > 0) {
            const filtered = allData.filter(a => a.is_published === true);
            if (filtered.length > 0) {
              const shuffled = [...filtered].sort(() => Math.random() - 0.5);
              const recommended = shuffled.slice(0, 3);
              console.log('フォールバック: おすすめ記事を取得しました:', recommended);
              setRecommendedArticles(recommended.map(a => ({
                id: a.id,
                title: a.title,
                image_url: a.image_url,
                published_at: a.published_at,
                excerpt: a.excerpt,
                created_at: a.created_at
              })));
              return;
            }
          }
          setRecommendedArticles([]);
          return;
        }

        if (data && data.length > 0) {
          // ランダムに並び替えて、必要な数だけ取得
          const shuffled = [...data].sort(() => Math.random() - 0.5);
          const recommended = shuffled.slice(0, 3); // 最大3つ（デスクトップ用）
          console.log('おすすめ記事を取得しました:', recommended);
          setRecommendedArticles(recommended);
        } else {
          console.log('おすすめ記事が見つかりませんでした。データ数:', data?.length || 0);
          // フォールバック: is_publishedをチェックしない
          if (allData && allData.length > 0) {
            const shuffled = [...allData].sort(() => Math.random() - 0.5);
            const recommended = shuffled.slice(0, 3);
            console.log('フォールバック: おすすめ記事を取得しました（is_published無視）:', recommended);
            setRecommendedArticles(recommended.map(a => ({
              id: a.id,
              title: a.title,
              image_url: a.image_url,
              published_at: a.published_at,
              excerpt: a.excerpt,
              created_at: a.created_at
            })));
          } else {
            setRecommendedArticles([]);
          }
        }
      } catch (err) {
        console.error('おすすめ記事の取得に失敗しました:', err);
        setRecommendedArticles([]);
      }
    };

    if (article && article.id) {
      fetchRecommendedArticles();
    } else {
      setRecommendedArticles([]);
    }
  }, [article?.id]);

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

  // online.ikevege.com は廃止のため www.ikevege.com に置換
  const rewriteIkevegeUrl = (url: string) => {
    if (!url) return url;
    return url.replace(/online\.ikevege\.com/gi, 'www.ikevege.com');
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
            <Link to="/blog">
              <a className="text-blue-600 hover:text-blue-800">BLOG一覧に戻る</a>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const renderHtmlFallback = (html: string) => {
    // HTMLタグを正しくレンダリングするために、基本的なスタイルを適用
    return (
      <>
        <style>{`
          .blog-prose {
            font-family: "Helvetica Neue", "Hiragino Sans", "Hiragino Kaku Gothic ProN", Arial, "Noto Sans JP", Meiryo, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          .blog-prose img {
            max-width: 100%;
            height: auto;
            margin: 1rem 0;
            border-radius: 0.75rem;
          }
          @media (min-width: 768px) {
            .blog-prose img {
              margin: 1.5rem 0;
              border-radius: 0.75rem;
            }
          }
          .blog-prose div {
            margin: 0.5rem 0;
          }
          .blog-prose a {
            color: inherit;
            text-decoration: underline;
            font-weight: normal;
            transition: opacity 0.2s;
          }
          .blog-prose a:hover {
            opacity: 0.7;
          }
          .blog-prose br {
            display: block;
            margin: 0.5rem 0;
          }
          .blog-prose b, .blog-prose strong {
            font-weight: 600;
          }
        `}</style>
        <div
          className="blog-prose prose prose-slate text-sm md:text-base max-w-none text-gray-700 leading-loose md:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
        />
      </>
    );
  };

  const looksLikeHtml = (value: string) => /<[^>]+>/.test(value);

  // NOTE: 管理画面で作られるコンテンツ前提。最低限の無害化のみ行う（script/style と on* 属性、javascript: を除去）
  const sanitizeHtml = (rawHtml: string) => {
    if (!rawHtml) return '';
    let html = rawHtml;
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    // remove on* handlers (e.g. onclick="...")
    html = html.replace(/\son\w+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '');
    // prevent javascript: urls
    html = html.replace(/\s(href|src)\s*=\s*("javascript:[^"]*"|'javascript:[^']*')/gi, '');
    return html;
  };

  return (
    <div className="pt-20 md:pt-28 pb-24 min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        {/* blog内リンクの見た目（黒文字＋下線のみ）とnote風フォント */}
        <style>{`
          .blog-prose {
            font-family: "Helvetica Neue", "Hiragino Sans", "Hiragino Kaku Gothic ProN", Arial, "Noto Sans JP", Meiryo, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          .blog-prose a {
            color: inherit;
            text-decoration: underline;
            font-weight: normal;
            text-underline-offset: 3px;
            transition: opacity 0.2s;
          }
          .blog-prose a:hover {
            opacity: 0.7;
          }
        `}</style>
        <Link to="/blog">
          <a className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 md:mb-8 transition-colors">
            <IconArrowLeft className="w-4 h-4" />
            <span>BLOG一覧に戻る</span>
          </a>
        </Link>

        <article>
          {article.image_url && (
            <div className="mb-6 md:mb-8 -mx-6 md:mx-0 h-auto md:h-[60vh] overflow-hidden bg-gray-100 rounded-none md:rounded-lg">
              <FadeInImage
                src={article.image_url}
                alt={article.title}
                className="w-full h-auto md:h-full object-contain md:object-cover object-center"
              />
            </div>
          )}

          <div className="mb-4 md:mb-6">
            {article.published_at && (
              <time className="text-xs md:text-sm text-gray-500 tracking-wide">
                {formatDate(article.published_at)}
              </time>
            )}
          </div>

          <h1 className="text-xl md:text-4xl font-medium text-gray-900 mb-6 md:mb-8 leading-snug md:leading-tight" style={{ fontFamily: '"Helvetica Neue", "Hiragino Sans", "Hiragino Kaku Gothic ProN", Arial, "Noto Sans JP", Meiryo, sans-serif' }}>
            {article.title}
          </h1>

          <div className="blog-prose prose prose-slate text-sm md:text-base max-w-none text-gray-700 leading-loose md:leading-relaxed">
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
                        const textAlign = block.textAlign || 'left';
                        return (
                          <h1 
                            key={index} 
                            id={h.id} 
                            className={`text-2xl md:text-3xl font-bold mt-8 mb-4 scroll-mt-24 ${
                              textAlign === 'center' ? 'text-center' : textAlign === 'right' ? 'text-right' : 'text-left'
                            }`}
                          >
                            {text}
                          </h1>
                        );
                      }
                      case 'heading2': {
                        const text = getText(block);
                        const h = headingItems[headingRenderIndex++] || { id: `heading-${headingRenderIndex}`, text, level: 2 };
                        const textAlign = block.textAlign || 'left';
                        return (
                          <h2 
                            key={index} 
                            id={h.id} 
                            className={`text-xl md:text-2xl font-semibold mt-6 mb-3 scroll-mt-24 ${
                              textAlign === 'center' ? 'text-center' : textAlign === 'right' ? 'text-right' : 'text-left'
                            }`}
                          >
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
                      case 'file': {
                        const url = getFileUrl(block);
                        const name = getFileName(block);
                        const text = getText(block);
                        return (
                          <div key={index} className="my-6 p-4 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between gap-4">
                            <div className="text-sm text-gray-800 break-all">
                              {url ? (
                                <a href={rewriteIkevegeUrl(url)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
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
                          <div key={index} className="my-6 md:my-8">
                            <img
                              src={img}
                              alt=""
                              className="w-full h-auto rounded-lg"
                            />
                            {text && (
                              looksLikeHtml(text) ? (
                                <p
                                  className="text-center text-xs md:text-sm text-gray-500 mt-2"
                                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }}
                                />
                              ) : (
                                <p className="text-center text-xs md:text-sm text-gray-500 mt-2">{text}</p>
                              )
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
                          <blockquote key={index} className="border-l-4 border-gray-300 pl-4 italic my-4 text-sm md:text-base text-gray-600">
                            {text}
                          </blockquote>
                        );
                      }
                      case 'code': {
                        const text = getText(block);
                        return (
                          <div key={index} className="bg-gray-800 text-gray-100 rounded-lg p-4 my-4 font-mono text-xs md:text-sm overflow-x-auto">
                            <pre className="whitespace-pre">{text}</pre>
                          </div>
                        );
                      }
                      case 'divider':
                        return <hr key={index} className="my-8 border-gray-200" />;
                      case 'embed': {
                        // URLを取得（embedData.url、block.content、getEmbedUrlの順で試す）
                        let url = '';
                        if (block.embedData?.url) {
                          url = block.embedData.url;
                        } else if (block.content && (block.content.startsWith('http') || block.content.includes('.'))) {
                          url = block.content;
                        } else {
                          url = getEmbedUrl(block) || '';
                        }
                        
                        if (!url || url.trim() === '') {
                          return (
                            <div key={index} className="my-6 md:my-8 p-4 rounded-lg bg-gray-50 border border-gray-200">
                              <p className="text-sm text-gray-500">埋め込みURLがありません</p>
                            </div>
                          );
                        }

                        // URLを正規化（online.ikevege.com → www.ikevege.com に置換）
                        const normalizedUrl = rewriteIkevegeUrl(url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`);
                        
                        // URLからサイト情報を推測（OGP情報がない場合）
                        const guessSiteInfo = (url: string) => {
                          try {
                            const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
                            const hostname = urlObj.hostname.replace('www.', '');
                            
                            const siteInfo: { [key: string]: { name: string } } = {
                              'note.com': { name: 'note' },
                              'lin.ee': { name: 'LINE' },
                              'instagram.com': { name: 'Instagram' },
                              'twitter.com': { name: 'Twitter' },
                              'x.com': { name: 'X (Twitter)' },
                              'youtube.com': { name: 'YouTube' },
                              'youtu.be': { name: 'YouTube' },
                              'facebook.com': { name: 'Facebook' },
                              'lit.link': { name: 'lit.link' },
                              'www.ikevege.com': { name: 'IKEVEGE Online Store' },
                            };

                            const matchedSite = Object.keys(siteInfo).find(key => hostname.includes(key));
                            if (matchedSite) {
                              return siteInfo[matchedSite].name;
                            }

                            const domainParts = hostname.split('.');
                            return domainParts.length > 1 
                              ? domainParts[domainParts.length - 2].charAt(0).toUpperCase() + domainParts[domainParts.length - 2].slice(1)
                              : hostname;
                          } catch {
                            return '';
                          }
                        };

                        const embedData = block.embedData;
                        const siteName = embedData?.siteName || guessSiteInfo(normalizedUrl);
                        const title = embedData?.title || normalizedUrl;
                        const description = embedData?.description || '';
                        const image = embedData?.image || '';

                        return (
                          <div key={index} className="my-6 md:my-8 border-2 border-gray-200 rounded-lg overflow-hidden hover:border-gray-400 hover:shadow-md transition-all bg-white">
                            <a 
                              href={normalizedUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block no-underline text-inherit"
                            >
                              {image && (
                                <div className="w-full h-40 md:h-64 bg-gray-100 overflow-hidden">
                                  <img 
                                    src={image} 
                                    alt={title || '埋め込み画像'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                              <div className="p-4 md:p-6">
                                {siteName && (
                                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-medium">
                                    {siteName}
                                  </p>
                                )}
                                <h3 className="text-base md:text-xl font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                                  {title}
                                </h3>
                                {description && (
                                  <p className="text-xs md:text-base text-gray-600 line-clamp-3 mb-3">
                                    {description}
                                  </p>
                                )}
                                <p className="text-xs text-blue-600 hover:text-blue-800 break-all mt-3 font-medium">
                                  {normalizedUrl}
                                </p>
                              </div>
                            </a>
                          </div>
                        );
                      }
                      case 'paragraph':
                      default: {
                        const text = getText(block);
                        if (looksLikeHtml(text)) {
                          return (
                            <div
                              key={index}
                              className="blog-prose whitespace-pre-wrap prose prose-slate text-sm md:text-base max-w-none text-gray-700 leading-loose md:leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }}
                            />
                          );
                        }
                        return (
                          <p key={index} className="blog-prose whitespace-pre-wrap text-sm md:text-base leading-loose md:leading-relaxed">
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
                href={rewriteIkevegeUrl(article.note_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                noteで見る →
              </a>
            </div>
          )}
        </article>

        {/* おすすめ記事セクション */}
        {recommendedArticles.length > 0 && (
          <section className="mt-16 md:mt-20 pt-12 border-t border-gray-200">
            <h2 className="text-xl md:text-2xl font-medium text-gray-900 mb-8" style={{ fontFamily: '"Helvetica Neue", "Hiragino Sans", "Hiragino Kaku Gothic ProN", Arial, "Noto Sans JP", Meiryo, sans-serif' }}>
              おすすめの記事
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
              {recommendedArticles.map((recommended, index) => (
                <Link key={recommended.id} href={`/blog/${recommended.id}`}>
                  <a className={`block group hover:opacity-80 transition-opacity ${index === 2 ? 'hidden md:block' : ''}`}>
                    {recommended.image_url && (
                      <div className="mb-4 aspect-video overflow-hidden rounded-lg bg-gray-100">
                        <FadeInImage
                          src={recommended.image_url}
                          alt={recommended.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <h3 className="text-sm md:text-base font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-600 transition-colors" style={{ fontFamily: '"Helvetica Neue", "Hiragino Sans", "Hiragino Kaku Gothic ProN", Arial, "Noto Sans JP", Meiryo, sans-serif' }}>
                      {recommended.title}
                    </h3>
                    {recommended.published_at && (
                      <time className="text-xs text-gray-500">
                        {formatDate(recommended.published_at)}
                      </time>
                    )}
                  </a>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default BlogDetail;

