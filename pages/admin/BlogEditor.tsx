import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { supabase } from '../../lib/supabase';
import { IconArrowLeft, IconLoader2, IconPlus, IconX, IconImage, IconList, IconHash, IconQuote, IconCode, IconMinus, IconPaperclip, IconTable, IconMic, IconSparkles, IconDollarSign, IconLink } from '../../components/Icons';
import { LoadingButton } from '../../components/UI';

type BlockType = 'paragraph' | 'heading1' | 'heading2' | 'image' | 'bulletList' | 'numberedList' | 'quote' | 'code' | 'divider';

interface Block {
  id: string;
  type: BlockType;
  content: string;
  imageUrl?: string;
  listItems?: string[];
}

interface BlogArticle {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  image_url?: string;
  note_url?: string;
  published_at?: string;
  is_published: boolean;
}

const BlogEditor = () => {
  const [match, params] = useRoute<{ id?: string }>('/admin/blog/:id?');
  const [, setLocation] = useLocation();
  const isNew = !params?.id || params.id === 'new';
  const articleId = params?.id;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!isNew);
  const [article, setArticle] = useState<BlogArticle | null>(null);

  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [excerpt, setExcerpt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [noteUrl, setNoteUrl] = useState('');
  const [publishedAt, setPublishedAt] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!isNew && articleId) {
      fetchArticle();
    } else {
      setInitialLoading(false);
      // 新規作成時は初期ブロックを追加
      if (blocks.length === 0) {
        setBlocks([{ id: generateId(), type: 'paragraph', content: '' }]);
      }
    }
  }, [isNew, articleId]);

  const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const fetchArticle = async () => {
    if (!supabase || !articleId) return;

    try {
      setInitialLoading(true);
      const { data, error } = await supabase
        .from('blog_articles')
        .select('*')
        .eq('id', articleId)
        .single();

      if (error) throw error;

      if (data) {
        setArticle(data);
        setTitle(data.title || '');
        setExcerpt(data.excerpt || '');
        setImageUrl(data.image_url || '');
        setNoteUrl(data.note_url || '');
        setPublishedAt(data.published_at ? new Date(data.published_at).toISOString().split('T')[0] : '');
        setIsPublished(data.is_published || false);
        
        // コンテンツをブロックに変換
        if (data.content) {
          try {
            const parsedBlocks = JSON.parse(data.content);
            if (Array.isArray(parsedBlocks)) {
              setBlocks(parsedBlocks);
            } else {
              // 旧形式のテキストを段落ブロックに変換
              setBlocks([{ id: generateId(), type: 'paragraph', content: data.content }]);
            }
          } catch {
            // JSONでない場合は段落ブロックに変換
            setBlocks([{ id: generateId(), type: 'paragraph', content: data.content }]);
          }
        } else {
          setBlocks([{ id: generateId(), type: 'paragraph', content: '' }]);
        }
      }
    } catch (error) {
      console.error('記事の取得に失敗しました:', error);
      alert('記事の取得に失敗しました');
    } finally {
      setInitialLoading(false);
    }
  };

  const addBlock = (afterBlockId: string, type: BlockType) => {
    const newBlock: Block = {
      id: generateId(),
      type,
      content: '',
      ...(type === 'bulletList' || type === 'numberedList' ? { listItems: [''] } : {}),
    };

    const index = blocks.findIndex(b => b.id === afterBlockId);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
    setShowBlockMenu(null);
  };

  const deleteBlock = (blockId: string) => {
    if (blocks.length === 1) {
      alert('最低1つのブロックが必要です');
      return;
    }
    setBlocks(blocks.filter(b => b.id !== blockId));
  };

  const updateBlock = (blockId: string, updates: Partial<Block>) => {
    setBlocks(blocks.map(b => b.id === blockId ? { ...b, ...updates } : b));
  };

  const addListItem = (blockId: string) => {
    setBlocks(blocks.map(b => 
      b.id === blockId 
        ? { ...b, listItems: [...(b.listItems || []), ''] }
        : b
    ));
  };

  const updateListItem = (blockId: string, itemIndex: number, value: string) => {
    setBlocks(blocks.map(b => 
      b.id === blockId 
        ? { 
            ...b, 
            listItems: (b.listItems || []).map((item, idx) => idx === itemIndex ? value : item)
          }
        : b
    ));
  };

  const deleteListItem = (blockId: string, itemIndex: number) => {
    setBlocks(blocks.map(b => 
      b.id === blockId 
        ? { 
            ...b, 
            listItems: (b.listItems || []).filter((_, idx) => idx !== itemIndex)
          }
        : b
    ));
  };

  const blocksToContent = (): string => {
    // ブロックをJSON形式で保存
    return JSON.stringify(blocks);
  };

  const blocksToPlainText = (): string => {
    // プレーンテキストとしても保存（互換性のため）
    return blocks.map(block => {
      switch (block.type) {
        case 'heading1':
          return `# ${block.content}`;
        case 'heading2':
          return `## ${block.content}`;
        case 'image':
          return block.imageUrl || '';
        case 'bulletList':
          return block.listItems?.map(item => `- ${item}`).join('\n') || '';
        case 'numberedList':
          return block.listItems?.map((item, idx) => `${idx + 1}. ${item}`).join('\n') || '';
        case 'quote':
          return `> ${block.content}`;
        default:
          return block.content;
      }
    }).join('\n\n');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('タイトルを入力してください');
      return;
    }

    if (blocks.length === 0 || blocks.every(b => !b.content.trim() && !b.imageUrl)) {
      alert('本文を入力してください');
      return;
    }

    if (!supabase) {
      alert('Supabaseが設定されていません');
      return;
    }

    try {
      setLoading(true);

      const contentJson = blocksToContent();
      const contentPlain = blocksToPlainText();

      const articleData: any = {
        title: title.trim(),
        content: contentJson, // JSON形式で保存
        excerpt: excerpt.trim() || null,
        image_url: imageUrl.trim() || blocks.find(b => b.type === 'image' && b.imageUrl)?.imageUrl || null,
        note_url: noteUrl.trim() || null,
        published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
        is_published: isPublished,
        updated_at: new Date().toISOString(),
      };

      if (isNew) {
        const { error } = await supabase
          .from('blog_articles')
          .insert(articleData);

        if (error) throw error;
        alert('記事を作成しました');
      } else {
        const { error } = await supabase
          .from('blog_articles')
          .update(articleData)
          .eq('id', articleId);

        if (error) throw error;
        alert('記事を更新しました');
      }

      setLocation('/admin/blog');
    } catch (error) {
      console.error('記事の保存に失敗しました:', error);
      alert('記事の保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // Supabase Storage に画像をアップロードして公開URLを返す
  const uploadImageFile = async (file: File) => {
    if (!supabase) throw new Error('Supabaseが未設定です');
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `blog/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file, { upsert: true });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const hiddenFileInput = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, blockId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const imageUrl = await uploadImageFile(file);
      updateBlock(blockId, { imageUrl });
    } catch (err: any) {
      console.error('画像アップロードに失敗しました:', err);
      alert('画像のアップロードに失敗しました。時間をおいて再度お試しください。');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const BlockMenu = ({ blockId, onClose }: { blockId: string; onClose: () => void }) => (
    <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-100 z-50 w-64 overflow-hidden animate-fade-in-up">
      <div className="p-2 grid grid-cols-1 gap-0.5 max-h-[400px] overflow-y-auto">
        <p className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">挿入</p>
        
        <button
          onClick={() => alert('AIアシスタント機能は準備中です')}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconSparkles className="w-4 h-4" />
          <span>AIアシスタント</span>
        </button>

        <button
          onClick={() => { addBlock(blockId, 'image'); onClose(); }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconImage className="w-4 h-4" />
          <span>画像</span>
        </button>

        <button
          onClick={() => alert('音声機能は準備中です')}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconMic className="w-4 h-4" />
          <span>音声</span>
        </button>

        <button
          onClick={() => alert('埋め込み機能は準備中です')}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconLink className="w-4 h-4" />
          <span>埋め込み</span>
        </button>

        <button
          onClick={() => alert('ファイル機能は準備中です')}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconPaperclip className="w-4 h-4" />
          <span>ファイル</span>
        </button>

        <button
          onClick={() => alert('目次機能は準備中です')}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconTable className="w-4 h-4" />
          <span>目次</span>
        </button>

        <button
          onClick={() => { addBlock(blockId, 'heading1'); onClose(); }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconHash className="w-4 h-4" />
          <span>大見出し</span>
        </button>

        <button
          onClick={() => { addBlock(blockId, 'heading2'); onClose(); }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconHash className="w-4 h-4" />
          <span>小見出し</span>
        </button>

        <button
          onClick={() => { addBlock(blockId, 'bulletList'); onClose(); }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconList className="w-4 h-4" />
          <span>箇条書きリスト</span>
        </button>

        <button
          onClick={() => { addBlock(blockId, 'numberedList'); onClose(); }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconList className="w-4 h-4" />
          <span>番号付きリスト</span>
        </button>

        <button
          onClick={() => { addBlock(blockId, 'quote'); onClose(); }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconQuote className="w-4 h-4" />
          <span>引用</span>
        </button>

        <button
          onClick={() => { addBlock(blockId, 'code'); onClose(); }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconCode className="w-4 h-4" />
          <span>コード</span>
        </button>

        <button
          onClick={() => { addBlock(blockId, 'divider'); onClose(); }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconMinus className="w-4 h-4" />
          <span>区切り線</span>
        </button>

        <button
          onClick={() => alert('有料エリア指定は準備中です')}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconDollarSign className="w-4 h-4" />
          <span>有料エリア指定</span>
        </button>
      </div>
    </div>
  );

  const renderBlock = (block: Block) => {
    switch (block.type) {
      case 'heading1':
        return (
          <input
            type="text"
            value={block.content}
            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
            placeholder="大見出し"
            className="w-full text-3xl font-bold border-none outline-none bg-transparent"
          />
        );
      case 'heading2':
        return (
          <input
            type="text"
            value={block.content}
            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
            placeholder="小見出し"
            className="w-full text-2xl font-semibold border-none outline-none bg-transparent"
          />
        );
      case 'image':
        return (
          <div className="space-y-2">
            <input 
              type="file" 
              className="hidden" 
              ref={hiddenFileInput} 
              accept="image/*"
              onChange={(e) => {
                const targetId = hiddenFileInput.current?.getAttribute('data-block-id');
                if (targetId) handleImageUpload(e, targetId);
              }}
            />
            {!block.imageUrl ? (
              <div 
                className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer group"
                onClick={() => {
                  if (hiddenFileInput.current) {
                    hiddenFileInput.current.setAttribute('data-block-id', block.id);
                    hiddenFileInput.current.click();
                  }
                }}
              >
                <IconImage className="w-8 h-8 text-gray-300 mx-auto mb-2 group-hover:text-gray-400" />
                <p className="text-gray-400 text-sm group-hover:text-gray-600">
                  クリックして画像をアップロード
                </p>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const url = prompt('画像URLを入力してください');
                    if (url) updateBlock(block.id, { imageUrl: url });
                  }}
                  className="mt-2 text-xs text-gray-300 hover:text-blue-500 underline"
                >
                  またはURLを入力
                </button>
              </div>
            ) : (
              <div className="relative group">
                 <img
                  src={block.imageUrl}
                  alt=""
                  className="max-w-full h-auto rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => updateBlock(block.id, { imageUrl: '' })}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>
            )}
            <input
               type="text"
               value={block.content} // キャプション
               onChange={(e) => updateBlock(block.id, { content: e.target.value })}
               placeholder="キャプションを入力（任意）"
               className="w-full text-center text-sm text-gray-500 border-none outline-none bg-transparent mt-2"
             />
          </div>
        );
      case 'bulletList':
      case 'numberedList':
        return (
          <div className="space-y-2">
            {(block.listItems || ['']).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-gray-400 w-6">
                  {block.type === 'bulletList' ? '•' : `${idx + 1}.`}
                </span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateListItem(block.id, idx, e.target.value)}
                  placeholder="リスト項目"
                  className="flex-1 border-none outline-none bg-transparent"
                />
                {(block.listItems?.length || 0) > 1 && (
                  <button
                    onClick={() => deleteListItem(block.id, idx)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <IconX className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addListItem(block.id)}
              className="text-sm text-gray-500 hover:text-gray-700 ml-8"
            >
              + 項目を追加
            </button>
          </div>
        );
      case 'quote':
        return (
          <div className="border-l-4 border-gray-300 pl-4 italic">
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="引用文"
              rows={3}
              className="w-full border-none outline-none bg-transparent resize-none"
            />
          </div>
        );
      case 'code':
        return (
          <div className="bg-gray-800 text-gray-100 rounded-lg p-4 font-mono text-sm">
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="コードを入力"
              rows={3}
              className="w-full bg-transparent border-none outline-none resize-none placeholder-gray-500"
            />
          </div>
        );
      case 'divider':
        return (
          <div className="py-4">
            <hr className="border-t border-gray-200" />
          </div>
        );
      default:
        return (
          <textarea
            value={block.content}
            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
            placeholder="テキストを入力...（改行はそのまま反映されます）"
            rows={Math.max(5, block.content.split('\n').length + 2)}
            className="w-full border-none outline-none bg-transparent resize-none min-h-[120px] leading-relaxed"
            style={{ minHeight: `${Math.max(120, (block.content.split('\n').length + 2) * 24)}px` }}
          />
        );
    }
  };

  if (initialLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-sm text-gray-500">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => setLocation('/admin/blog')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <IconArrowLeft className="w-4 h-4" />
            <span>BLOG管理に戻る</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isNew ? '新規記事作成' : '記事編集'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 text-2xl font-bold border-none outline-none bg-transparent"
              placeholder="記事のタイトル"
              required
            />
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-8 min-h-[600px]">
            <div className="space-y-6">
              {blocks.map((block, index) => (
                <div key={block.id} className="group relative">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowBlockMenu(showBlockMenu === block.id ? null : block.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                      >
                        <IconPlus className="w-4 h-4" />
                      </button>
                      {showBlockMenu === block.id && (
                        <div className="relative">
                          <BlockMenu 
                            blockId={block.id} 
                            onClose={() => setShowBlockMenu(null)}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      {renderBlock(block)}
                    </div>
                    <div className="flex-shrink-0 pt-2">
                      <button
                        type="button"
                        onClick={() => deleteBlock(block.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                      >
                        <IconX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                抜粋（記事一覧に表示される短い説明）
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                placeholder="記事の概要を入力してください（200文字程度）"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メイン画像URL（記事一覧のサムネイル）
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                note URL（オプション）
              </label>
              <input
                type="url"
                value={noteUrl}
                onChange={(e) => setNoteUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                placeholder="https://note.com/username/article"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                公開日
              </label>
              <input
                type="date"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-sm font-medium text-gray-700">公開する</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-6">
            <LoadingButton
              type="submit"
              loading={loading}
              className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {isNew ? '記事を作成' : '記事を更新'}
            </LoadingButton>
            <button
              type="button"
              onClick={() => setLocation('/admin/blog')}
              className="px-8 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlogEditor;
