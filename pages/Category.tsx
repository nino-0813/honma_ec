
import React, { useEffect, useState } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import { useProducts } from '../hooks/useProducts';
import { IconChevronDown } from '../components/Icons';
import { FadeInImage } from '../components/UI';
import { Product } from '../types';

const Category = () => {
  const [location] = useLocation();
  const [matchAll] = useRoute("/collections");
  const [matchRiceSubcategory, paramsRiceSubcategory] = useRoute<{ subcategory?: string }>("/collections/rice/:subcategory");
  const [matchCategory, paramsCategory] = useRoute<{ category?: string }>("/collections/:category");
  
  const getFilterNameFromParam = (param: string) => {
    if (param === 'rice') return 'お米';
    if (param === 'crescent') return 'Crescentmoon';
    if (param === 'other') return 'その他';
    return 'ALL';
  };

  // URLパラメータを日本語のサブカテゴリー名にマッピング
  const getSubcategoryNameFromParam = (param: string): string => {
    const mapping: { [key: string]: string } = {
      'koshihikari': 'コシヒカリ',
      'kamenoo': '亀の尾',
      'nikomaru': 'にこまる',
      'yearly': '年間契約'
    };
    return mapping[param] || param;
  };

  // 現在のカテゴリーを判定
  let currentCategory = 'ALL';
  let currentSubcategory: string | null = null;

  if (matchRiceSubcategory && paramsRiceSubcategory?.subcategory) {
    // お米のサブカテゴリーページ（例: /collections/rice/koshihikari）
    currentCategory = 'お米';
    currentSubcategory = paramsRiceSubcategory.subcategory;
  } else if (matchCategory && paramsCategory?.category) {
    // 通常のカテゴリーページ（例: /collections/rice）
    currentCategory = getFilterNameFromParam(paramsCategory.category);
  } else if (matchAll) {
    // オールアイテムページ
    currentCategory = 'ALL';
  }

  const { products: supabaseProducts, loading, error } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [sortOrder, setSortOrder] = useState('manual');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (loading) return;

    let result = [...supabaseProducts];
    
    // Filter by category
    if (currentCategory !== 'ALL') {
      if (currentCategory === 'お米') {
        // お米カテゴリーの場合：お米と年間契約の両方の商品を表示
        result = supabaseProducts.filter(p => {
          return p.category === 'お米' || p.category === '年間契約';
        });
      } else {
        result = supabaseProducts.filter(p => {
          return p.category === currentCategory || p.title.includes(currentCategory);
        });
      }
    }
    
    // Filter by subcategory (for rice subcategories)
    if (currentSubcategory && currentCategory === 'お米') {
      const subcategoryName = getSubcategoryNameFromParam(currentSubcategory);
      result = result.filter(p => {
        // サブカテゴリーフィールドが設定されている場合はそれを使用
        if (p.subcategory) {
          return p.subcategory === subcategoryName;
        } else {
          // 既存データのためのフォールバック（タイトルで判定）
          if (currentSubcategory === 'koshihikari') {
            return p.title.includes('コシヒカリ');
          } else if (currentSubcategory === 'kamenoo') {
            return p.title.includes('亀の尾');
          } else if (currentSubcategory === 'nikomaru') {
            return p.title.includes('にこまる');
          } else if (currentSubcategory === 'yearly') {
            return p.title.includes('年間契約') || p.category === '年間契約';
          }
        }
        return false;
      });
    }

    // 表示順でソート（display_orderが小さい順、nullは最後）
    result.sort((a, b) => {
      const orderA = a.display_order ?? 999999;
      const orderB = b.display_order ?? 999999;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      // display_orderが同じ場合は価格順
      if (sortOrder === 'price-asc') {
        return a.price - b.price;
      } else if (sortOrder === 'price-desc') {
        return b.price - a.price;
      }
      return 0;
    });

    // 表示/非表示フィルタ（is_visibleがfalseの場合は除外）
    result = result.filter(p => p.is_visible !== false);

    setFilteredProducts(result);
  }, [currentCategory, currentSubcategory, sortOrder, supabaseProducts, loading]);

  const SidebarItem = ({ label, path, isActive }: { label: string, path: string, isActive: boolean }) => (
    <li>
      <Link href={path}>
        <a className={`block py-2 text-sm tracking-widest transition-colors duration-300 relative pl-4 border-l-2 ${isActive ? 'border-black text-black font-medium' : 'border-transparent text-gray-500 hover:text-black'}`}>
          {label}
        </a>
      </Link>
    </li>
  );

  // ページタイトルの決定
  const getPageTitle = () => {
    if (currentCategory === 'お米') {
      if (currentSubcategory === 'koshihikari') return 'コシヒカリ';
      if (currentSubcategory === 'kamenoo') return '亀の尾';
      if (currentSubcategory === 'nikomaru') return 'にこまる';
      if (currentSubcategory === 'yearly') return '年間契約';
      return 'お米';
    }
    if (currentCategory === 'ALL') return 'ALL ITEM';
    return currentCategory;
  };

  // Product Grid View
  return (
    <div className="pt-28 pb-32 min-h-screen bg-white">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        
        {/* Page Header */}
        <div className="text-center mb-16 md:mb-24 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-serif tracking-[0.1em] text-primary mb-4">{getPageTitle()}</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
          
          {/* Sidebar (Desktop) */}
          <aside className="w-full md:w-64 flex-shrink-0 animate-fade-in">
            <div className="sticky top-32">
              <h3 className="text-sm font-bold tracking-widest mb-6 uppercase border-b border-gray-200 pb-2 hidden md:block">
                {currentCategory === 'お米' ? 'お米' : 'Category'}
              </h3>
              
              {/* お米カテゴリーの場合：サブカテゴリーを表示 */}
              {currentCategory === 'お米' ? (
                <ul className="hidden md:flex flex-col space-y-1">
                  <SidebarItem 
                    label="コシヒカリ" 
                    path="/collections/rice/koshihikari" 
                    isActive={currentSubcategory === 'koshihikari'} 
                  />
                  <SidebarItem 
                    label="亀の尾" 
                    path="/collections/rice/kamenoo" 
                    isActive={currentSubcategory === 'kamenoo'} 
                  />
                  <SidebarItem 
                    label="にこまる" 
                    path="/collections/rice/nikomaru" 
                    isActive={currentSubcategory === 'nikomaru'} 
                  />
                  <SidebarItem 
                    label="年間契約" 
                    path="/collections/rice/yearly" 
                    isActive={currentSubcategory === 'yearly'} 
                  />
                </ul>
              ) : (
                <ul className="hidden md:flex flex-col space-y-1">
                  <SidebarItem label="ALL" path="/collections" isActive={currentCategory === 'ALL'} />
                  <SidebarItem label="お米" path="/collections/rice" isActive={currentCategory === 'お米'} />
                  <SidebarItem label="Crescentmoon" path="/collections/crescent" isActive={currentCategory === 'Crescentmoon'} />
                  <SidebarItem label="その他" path="/collections/other" isActive={currentCategory === 'その他'} />
                </ul>
              )}

              {/* Mobile Horizontal Scroll Menu */}
              <div className="md:hidden overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide">
                {currentCategory === 'お米' ? (
                  <div className="flex gap-4 min-w-max">
                    <Link href="/collections/rice/koshihikari">
                      <a className={`px-4 py-2 rounded-full text-xs tracking-widest border transition-colors ${currentSubcategory === 'koshihikari' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200'}`}>コシヒカリ</a>
                    </Link>
                    <Link href="/collections/rice/kamenoo">
                      <a className={`px-4 py-2 rounded-full text-xs tracking-widest border transition-colors ${currentSubcategory === 'kamenoo' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200'}`}>亀の尾</a>
                    </Link>
                    <Link href="/collections/rice/nikomaru">
                      <a className={`px-4 py-2 rounded-full text-xs tracking-widest border transition-colors ${currentSubcategory === 'nikomaru' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200'}`}>にこまる</a>
                    </Link>
                    <Link href="/collections/rice/yearly">
                      <a className={`px-4 py-2 rounded-full text-xs tracking-widest border transition-colors ${currentSubcategory === 'yearly' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200'}`}>年間契約</a>
                    </Link>
                  </div>
                ) : (
                  <div className="flex gap-4 min-w-max">
                    <Link href="/collections">
                      <a className={`px-4 py-2 rounded-full text-xs tracking-widest border transition-colors ${currentCategory === 'ALL' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200'}`}>ALL</a>
                    </Link>
                    <Link href="/collections/rice">
                      <a className={`px-4 py-2 rounded-full text-xs tracking-widest border transition-colors ${currentCategory === 'お米' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200'}`}>お米</a>
                    </Link>
                    <Link href="/collections/crescent">
                      <a className={`px-4 py-2 rounded-full text-xs tracking-widest border transition-colors ${currentCategory === 'Crescentmoon' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200'}`}>Crescentmoon</a>
                    </Link>
                    <Link href="/collections/other">
                      <a className={`px-4 py-2 rounded-full text-xs tracking-widest border transition-colors ${currentCategory === 'その他' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200'}`}>その他</a>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort Bar */}
            <div className="flex justify-end mb-8 animate-fade-in">
               <div className="relative group inline-block text-left">
                  <button className="inline-flex justify-center items-center w-full text-xs font-medium text-gray-700 hover:text-gray-900 tracking-widest">
                    オススメ
                    <IconChevronDown className="ml-2 h-3 w-3 transition-transform group-hover:rotate-180" />
                  </button>
                  <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-sm shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 transform -translate-y-2 group-hover:translate-y-0">
                    <div className="py-1">
                      <button onClick={() => setSortOrder('manual')} className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">オススメ</button>
                      <button onClick={() => setSortOrder('price-asc')} className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">価格が安い順</button>
                      <button onClick={() => setSortOrder('price-desc')} className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">価格が高い順</button>
                    </div>
                  </div>
               </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-32">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-500">商品を読み込み中...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {!loading && error && (
              <div className="flex items-center justify-center py-32">
                <div className="text-center">
                  <p className="text-red-500 mb-2">エラーが発生しました</p>
                  <p className="text-sm text-gray-500 mb-4">{error.message}</p>
                  <p className="text-xs text-gray-400">Supabaseの設定を確認してください</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredProducts.length === 0 && (
              <div className="flex items-center justify-center py-32">
                <div className="text-center">
                  <p className="text-gray-500 mb-2">商品が見つかりませんでした</p>
                  <p className="text-xs text-gray-400">管理者ページから商品を追加してください</p>
                </div>
              </div>
            )}

            {/* Product Grid */}
            {!loading && !error && filteredProducts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-16">
                {filteredProducts.map((product, index) => (
                <Link key={product.id} href={`/products/${product.handle}`}>
                  <a 
                    className="group block opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    {/* Image Container */}
                    <div className="relative aspect-square bg-white border border-gray-100 overflow-hidden mb-5 flex items-center justify-center">
                      {/* Badges */}
                      <div className="absolute top-2 left-2 z-20 flex flex-col gap-2">
                        {product.soldOut && (
                          <span className="bg-primary text-white px-3 py-1 text-[10px] font-bold tracking-widest uppercase shadow-sm">
                            Sold Out
                          </span>
                        )}
                      </div>
                      
                      {/* Images with advanced FadeIn component */}
                      <div className="absolute inset-0 z-10 transition-opacity duration-700 ease-in-out group-hover:opacity-0 flex items-center justify-center p-2">
                         <FadeInImage src={product.images && product.images.length > 0 ? product.images[0] : (product.image || '')} alt={product.title} className="w-full h-full object-contain" />
                      </div>
                      
                      {/* Secondary Image (Hover) */}
                      <div className="absolute inset-0 z-0 transform scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out flex items-center justify-center p-2">
                         <FadeInImage src={product.images && product.images.length > 1 ? product.images[1] : (product.images && product.images.length > 0 ? product.images[0] : (product.image || ''))} alt={product.title} className="w-full h-full object-contain" />
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 text-center">
                      <h2 className="text-sm font-medium text-primary leading-relaxed group-hover:text-gray-600 transition-colors line-clamp-2 min-h-[2.8em]">
                        {product.title}
                      </h2>
                      <p className="text-sm text-gray-900 font-serif tracking-wide">
                        ¥{product.price.toLocaleString()} {product.title.includes('〜') ? '〜' : ''}
                      </p>
                    </div>
                  </a>
                </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Category;
