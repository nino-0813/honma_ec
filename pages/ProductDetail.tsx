import React, { useState, useEffect, useContext } from 'react';
import { useRoute, Link } from 'wouter';
import { useProducts } from '../hooks/useProducts';
import { Product } from '../types';
import { IconChevronDown } from '../components/Icons';
import { FadeInImage, LoadingButton } from '../components/UI';
import { CartContext } from '../App';
import { supabase, convertDatabaseProductToProduct, DatabaseProduct } from '../lib/supabase';

const ProductDetail = () => {
  const [match, params] = useRoute<{ handle?: string }>("/products/:handle");
  const { products: allProducts } = useProducts();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [activeAccordion, setActiveAccordion] = useState<string | null>('desc');
  const [isMainImageLoaded, setIsMainImageLoaded] = useState(false);
  const { addToCart, openCart } = useContext(CartContext);
  
  // お問い合わせフォームの状態
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [inquiryStatus, setInquiryStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [inquiryErrorMessage, setInquiryErrorMessage] = useState('');

  useEffect(() => {
    const loadProduct = async () => {
      if (!match || !params?.handle) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      window.scrollTo(0, 0);

      try {
        if (!supabase) {
          throw new Error('Supabaseが設定されていません');
        }

        const handleValue = params.handle;
        if (!handleValue) {
          setProduct(null);
          setLoading(false);
          return;
        }

        // まずstatus='active'で検索
        let { data, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .eq('handle', handleValue)
          .eq('status', 'active')
          .single();

        // status='active'で見つからない場合、statusに関係なく検索（開発用）
        if (fetchError && fetchError.code === 'PGRST116') {
          const { data: anyStatusData, error: anyStatusError } = await supabase
            .from('products')
            .select('*')
            .eq('handle', handleValue)
            .single();

          if (anyStatusError) {
            console.error('商品が見つかりません（全ステータス検索）:', anyStatusError);
            setProduct(null);
            setError(`商品が見つかりませんでした（handle: ${handleValue}）`);
          } else if (anyStatusData) {
            console.warn('商品が見つかりましたが、statusがactiveではありません:', anyStatusData.status);
            const dbProduct = convertDatabaseProductToProduct(anyStatusData as DatabaseProduct);
            setProduct(dbProduct);
            setError(null);
          }
        } else if (fetchError) {
          console.error('商品の読み込みエラー:', fetchError);
          throw fetchError;
        } else if (data) {
          const dbProduct = convertDatabaseProductToProduct(data as DatabaseProduct);
          setProduct(dbProduct);
          // バリエーションがある場合、初期値として最初のものを選択
          // Note: using type assertion to bypass potential linter issues with cached types
          const p = dbProduct as any;
          if (p.hasVariants && p.variants && p.variants.length > 0) {
            setSelectedVariant(p.variants[0]);
          }
          setError(null);
        } else {
          setProduct(null);
          setError('商品が見つかりませんでした');
        }
      } catch (err: any) {
        console.error('商品の読み込みに失敗しました:', err);
        const errorMessage = err?.message || err?.error_description || '商品の読み込みに失敗しました';
        setError(errorMessage);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [match, params?.handle]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!loading && error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-2">エラーが発生しました</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Link href="/collections">
            <a className="text-primary hover:underline">商品一覧に戻る</a>
          </Link>
        </div>
      </div>
    );
  }

  if (!loading && !product) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">商品が見つかりませんでした</p>
          <Link href="/collections">
            <a className="text-primary hover:underline">商品一覧に戻る</a>
          </Link>
        </div>
      </div>
    );
  }

  const toggleAccordion = (id: string) => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inquiryName || !inquiryEmail || !inquiryMessage) {
      setInquiryStatus('error');
      setInquiryErrorMessage('お名前、メールアドレス、内容は必須項目です。');
      return;
    }

    setSubmittingInquiry(true);
    setInquiryStatus('idle');
    setInquiryErrorMessage('');

    try {
      if (!supabase) {
        throw new Error('Supabaseが利用できません。');
      }

      const { error } = await supabase
        .from('inquiries')
        .insert([
          {
            name: inquiryName,
            email: inquiryEmail,
            phone: inquiryPhone || null,
            message: inquiryMessage,
            status: 'new',
            created_at: new Date().toISOString(),
          }
        ]);

      if (error) {
        throw error;
      }

      setInquiryStatus('success');
      setInquiryName('');
      setInquiryEmail('');
      setInquiryPhone('');
      setInquiryMessage('');
    } catch (error: any) {
      console.error('お問い合わせの送信に失敗しました:', error);
      setInquiryStatus('error');
      setInquiryErrorMessage(error?.message || 'お問い合わせの送信に失敗しました。もう一度お試しください。');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  return (
    <div className="pt-32 pb-24 bg-white min-h-screen animate-fade-in">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="text-[10px] text-gray-400 mb-8 md:mb-12 tracking-widest uppercase">
          <Link href="/"><a className="hover:text-black transition-colors">Home</a></Link>
          <span className="mx-2">/</span>
          <Link href="/collections"><a className="hover:text-black transition-colors">Collections</a></Link>
          <span className="mx-2">/</span>
          <span className="text-black">{product.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left: Image Gallery (Thumbnails + Main Image) */}
          <div className="lg:col-span-7 flex flex-col-reverse lg:flex-row gap-4 lg:gap-6 items-start">
            
            {/* Thumbnails */}
            {product.images && product.images.length > 0 && (
              <div className="w-full lg:w-24 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto scrollbar-hide lg:max-h-[80vh] lg:sticky lg:top-32">
                {product.images.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setSelectedImage(idx)}
                    className={`relative aspect-square w-20 lg:w-full flex-shrink-0 overflow-hidden border transition-all duration-300 ${
                      selectedImage === idx ? 'border-black opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <FadeInImage src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div className="flex-1 w-full relative">
               <img 
                 src={product.images && product.images.length > 0 ? product.images[selectedImage] : (product.image || '')} 
                 alt={product.title} 
                 className={`w-full h-auto object-contain block transition-opacity duration-500 ${isMainImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                 onLoad={() => setIsMainImageLoaded(true)}
               />
               {product.soldOut && (
                  <span className="absolute top-4 left-4 bg-primary text-white px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase z-10">
                    Sold Out
                  </span>
               )}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32">
              <h1 className="text-xl md:text-2xl font-medium text-primary leading-relaxed tracking-wide mb-4">
                {product.title}
              </h1>
              
              <div className="mb-8 border-b border-gray-100 pb-8">
                <span className="text-xl md:text-2xl font-serif text-primary block mb-1">
                  ¥{product.price.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500 block">税込</span>
              </div>

              {/* Options */}
              {(product as any).hasVariants && (product as any).variants && (product as any).variants.length > 0 && (
                <div className="mb-8">
                   <label className="block text-sm text-gray-600 mb-2">種類</label>
                   <div className="flex gap-2">
                     {(product as any).variants.map((v: string) => (
                       <button 
                         key={v}
                         onClick={() => setSelectedVariant(v)}
                         className={`px-4 py-2 border text-sm transition-colors ${
                           selectedVariant === v
                             ? 'border-black bg-black text-white'
                             : 'border-gray-200 text-gray-500 hover:border-gray-400 bg-white hover:text-black'
                         }`}
                       >
                         {v}
                       </button>
                     ))}
                   </div>
                </div>
              )}

              {/* Stock */}
              <div className="flex items-center gap-2 mb-8">
                <span className={`w-2 h-2 rounded-full ${!product.soldOut ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-sm text-gray-600">
                  {!product.soldOut ? '在庫あり' : '在庫なし'}
                </span>
              </div>

              {/* Actions */}
              <div className="space-y-4 mb-12">
                 {!product.soldOut && (
                   <div className="flex items-center justify-between border border-gray-200 p-1 max-w-[140px] mb-6">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setQuantity(Math.max(1, quantity - 1));
                        }}
                        className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black transition-colors"
                      >−</button>
                      <span className="text-sm font-serif w-8 text-center">{quantity}</span>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setQuantity(quantity + 1);
                        }}
                        className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black transition-colors"
                      >+</button>
                   </div>
                 )}

                 {product.soldOut ? (
                   <button 
                     disabled
                     className="w-full py-4 text-sm tracking-widest uppercase bg-gray-200 text-gray-400 cursor-not-allowed"
                   >
                     Sold Out
                   </button>
                 ) : (
                    <LoadingButton 
                    onClick={() => {
                      if (product) {
                        addToCart(product, quantity, selectedVariant || undefined);
                        openCart();
                      }
                    }}
                    className="w-full py-4 text-sm tracking-widest bg-white text-black border border-black hover:bg-gray-50 transition-colors group relative"
                  >
                     <div className="flex items-center justify-center w-full">
                       <span>カートに追加する</span>
                       <span className="absolute right-4 text-lg transition-transform duration-300 group-hover:translate-x-1">→</span>
                     </div>
                   </LoadingButton>
                 )}
                 
                 <div className="text-center pt-2">
                   <a href="#" className="text-xs text-gray-500 underline hover:text-black decoration-gray-400">
                     別のお支払い方法
                   </a>
                 </div>
              </div>

              {/* Accordions */}
              <div className="border-t border-gray-200 mt-8">
                <div className="py-4 border-b border-gray-200">
                  <div className="flex justify-end items-center cursor-pointer py-2" onClick={() => toggleAccordion('desc')}>
                    <IconChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeAccordion === 'desc' ? 'rotate-180' : ''}`} />
                  </div>
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${activeAccordion === 'desc' ? 'max-h-[5000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                    <div className="text-sm leading-loose text-gray-600 font-light space-y-4 pb-4">
                      <h3 className="font-medium text-gray-900">【{product.title}】</h3>
                      {product.description && product.description.trim() ? (
                        <div className="whitespace-pre-wrap">
                          {product.description}
                        </div>
                      ) : (
                        <p className="text-gray-400">商品説明がありません。</p>
                      )}
                      <p className="text-xs text-gray-500 mt-4">
                        ※イケベジのパンフレットを1部同封しておりますが、プレゼント用等でパンフレットを複数ご希望の方は、「備考」欄に必要部数を記載いただければと思います。（最大5部）
                      </p>
                    </div>
                  </div>
                </div>

                {/* 送料について */}
                <div className="py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center cursor-pointer py-2" onClick={() => toggleAccordion('shipping')}>
                    <span className="text-sm font-medium tracking-wider">送料についてはこちらから</span>
                    <IconChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeAccordion === 'shipping' ? 'rotate-180' : ''}`} />
                  </div>
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${activeAccordion === 'shipping' ? 'max-h-[200px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                    <div className="pb-4">
                      <Link href="/legal">
                        <a className="text-sm text-gray-600 hover:text-black underline transition-colors">
                          特定商取引法に基づく表記
                        </a>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* お問い合わせ */}
                <div className="py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center cursor-pointer py-2" onClick={() => toggleAccordion('inquiry')}>
                    <span className="text-sm font-medium tracking-wider">お問い合わせはこちらから</span>
                    <IconChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeAccordion === 'inquiry' ? 'rotate-180' : ''}`} />
                  </div>
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${activeAccordion === 'inquiry' ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                    <form onSubmit={handleInquirySubmit} className="space-y-4 pb-4">
                      {inquiryStatus === 'success' && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-center">
                          <p className="text-xs text-green-700">お問い合わせを受け付けました。ありがとうございます。</p>
                        </div>
                      )}

                      {inquiryStatus === 'error' && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-center">
                          <p className="text-xs text-red-700">{inquiryErrorMessage}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label htmlFor="inquiry-name" className="text-xs font-medium text-gray-700">お名前</label>
                          <input 
                            type="text" 
                            id="inquiry-name" 
                            value={inquiryName}
                            onChange={(e) => setInquiryName(e.target.value)}
                            className="border border-gray-200 p-2 text-sm focus:border-black outline-none transition-colors bg-white" 
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label htmlFor="inquiry-email" className="text-xs font-medium text-gray-700">メールアドレス</label>
                          <input 
                            type="email" 
                            id="inquiry-email" 
                            value={inquiryEmail}
                            onChange={(e) => setInquiryEmail(e.target.value)}
                            className="border border-gray-200 p-2 text-sm focus:border-black outline-none transition-colors bg-white" 
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <label htmlFor="inquiry-phone" className="text-xs font-medium text-gray-700">お電話番号</label>
                        <input 
                          type="tel" 
                          id="inquiry-phone" 
                          value={inquiryPhone}
                          onChange={(e) => setInquiryPhone(e.target.value)}
                          className="border border-gray-200 p-2 text-sm focus:border-black outline-none transition-colors bg-white w-full" 
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label htmlFor="inquiry-message" className="text-xs font-medium text-gray-700">内容</label>
                        <textarea 
                          id="inquiry-message" 
                          rows={4} 
                          value={inquiryMessage}
                          onChange={(e) => setInquiryMessage(e.target.value)}
                          className="border border-gray-200 p-2 text-sm focus:border-black outline-none transition-colors bg-white w-full resize-y" 
                          required
                        />
                      </div>

                      <div className="pt-2">
                        <button 
                          type="submit" 
                          disabled={submittingInquiry}
                          className="bg-black text-white px-6 py-2 text-xs tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submittingInquiry ? '送信中...' : '送信'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      
        {/* Related Products */}
        {allProducts.length > 0 && (
          <div className="mt-32 border-t border-gray-100 pt-16">
            <h3 className="text-center text-lg font-serif tracking-[0.2em] mb-12">RECOMMEND</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {allProducts.filter(p => p.id !== product.id).slice(0, 4).map(rel => (
                 <Link key={rel.id} href={`/products/${rel.handle}`}>
                    <a className="group block">
                      <div className="aspect-square bg-[#f4f4f4] overflow-hidden mb-3 relative">
                        <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                          <FadeInImage src={rel.image} alt={rel.title} className="w-full h-full" />
                        </div>
                      </div>
                      <h4 className="text-xs text-gray-600 line-clamp-1 group-hover:text-black">{rel.title}</h4>
                      <p className="text-xs font-serif mt-1">¥{rel.price.toLocaleString()}</p>
                    </a>
                 </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;