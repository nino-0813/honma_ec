import React, { useState, useEffect } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import { supabase } from '../../lib/supabase';
import { IconArrowLeft, IconUpload, IconLoader2, IconTrash, IconX } from '../../components/Icons';
import { LoadingButton } from '../../components/UI';

const CATEGORIES = [
  { id: 'お米', name: 'お米', subcategories: ['コシヒカリ', '亀の尾', 'にこまる', '年間契約'] },
  { id: 'その他', name: 'その他', subcategories: [] }
];

const ProductEditor = () => {
  const [match, params] = useRoute<{ handle?: string }>("/admin/products/:handle?");
  const routeHandle = params?.handle;
  const isNew = !routeHandle || routeHandle === 'new';
  const [, setLocation] = useLocation();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!isNew);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('お米');
  const [subcategory, setSubcategory] = useState('コシヒカリ');
  const [description, setDescription] = useState('');
  const [handle, setHandle] = useState('');
  const [stock, setStock] = useState('0');
  const [sku, setSku] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  // Variants
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<string[]>(['玄米', '白米', '分づき']);
  const [newVariant, setNewVariant] = useState('');

  // Images
  const [images, setImages] = useState<string[]>([]);

  // Fetch existing product
  useEffect(() => {
    if (!isNew && routeHandle) {
      fetchProduct(routeHandle);
    }
  }, [routeHandle, isNew]);

  // Handle category change to reset subcategory
  useEffect(() => {
    const selectedCategory = CATEGORIES.find(c => c.id === category);
    if (selectedCategory && selectedCategory.subcategories.length > 0) {
      if (!selectedCategory.subcategories.includes(subcategory)) {
        setSubcategory(selectedCategory.subcategories[0]);
      }
    } else {
      setSubcategory('');
    }
  }, [category]);

  const fetchProduct = async (handleStr: string) => {
    try {
      setInitialLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('handle', handleStr)
        .single();

      if (error) throw error;

      if (data) {
        setTitle(data.title);
        setPrice(data.price.toString());
        setCategory(data.category);
        setSubcategory(data.subcategory || '');
        setDescription(data.description || '');
        setHandle(data.handle);
        setStock(data.stock?.toString() || '0');
        setSku(data.sku || '');
        setIsActive(data.is_active);
        setHasVariants(data.has_variants || false);
        setVariants(data.variants || ['玄米', '白米', '分づき']);
        
        // 画像データの復元
        // data.images があればそれを優先、なければ data.image を配列に入れて使用
        if (data.images && Array.isArray(data.images) && data.images.length > 0) {
          setImages(data.images);
        } else if (data.image) {
          setImages([data.image]);
        }
      }
    } catch (error) {
      console.error('商品取得エラー:', error);
      alert('商品の取得に失敗しました');
      setLocation('/admin/products');
    } finally {
      setInitialLoading(false);
    }
  };

  const uploadImageToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('画像アップロードエラー:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map((file) => uploadImageToStorage(file as File));
      const newImageUrls = await Promise.all(uploadPromises);
      
      setImages(prev => [...prev, ...newImageUrls]);
    } catch (error) {
      alert('画像のアップロードに失敗しました。');
    } finally {
      setUploading(false);
      // Inputをリセットして同じファイルを再度選べるようにする
      e.target.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // 画像をメイン（先頭）にする
  const setAsMainImage = (index: number) => {
    if (index === 0) return;
    setImages(prev => {
      const newImages = [...prev];
      const [movedImage] = newImages.splice(index, 1);
      newImages.unshift(movedImage);
      return newImages;
    });
  };

  const addVariant = () => {
    if (newVariant && !variants.includes(newVariant)) {
      setVariants([...variants, newVariant]);
      setNewVariant('');
    }
  };

  const removeVariant = (variantToRemove: string) => {
    setVariants(variants.filter(v => v !== variantToRemove));
  };

  const handleSubmit = async () => {
    if (!title || !price || !handle) {
      alert('必須項目を入力してください（商品名、価格、ハンドル）');
      return;
    }

    try {
      setLoading(true);
      
      const productData = {
        title,
        price: Number(price),
        category,
        subcategory: subcategory || null,
        description,
        handle,
        stock: Number(stock),
        sku: sku || null,
        is_active: isActive,
        has_variants: hasVariants,
        variants: variants,
        image: images.length > 0 ? images[0] : null, // 互換性のためメイン画像をimageにも保存
        images: images, // 全画像を配列で保存
        updated_at: new Date().toISOString(),
      };

      let error;
      if (isNew) {
        const { error: insertError } = await supabase
          .from('products')
          .insert([productData]);
        error = insertError;
      } else {
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('handle', routeHandle);
        error = updateError;
      }

      if (error) throw error;

      alert('商品を保存しました');
      setLocation('/admin/products');

    } catch (error: any) {
      console.error('保存エラー:', error);
      alert(`保存に失敗しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <IconLoader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const selectedCategoryObj = CATEGORIES.find(c => c.id === category);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <a className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
              <IconArrowLeft className="w-5 h-5" />
            </a>
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">
            {isNew ? '新規商品追加' : '商品編集'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/products">
            <a className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-4 py-2">キャンセル</a>
          </Link>
          <LoadingButton 
            onClick={handleSubmit} 
            loading={loading || uploading}
            className="bg-black text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-all shadow-sm hover:shadow"
          >
            {loading ? '保存中...' : '保存する'}
          </LoadingButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Basic Info */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-slide-up">
             <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">商品名 <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                    placeholder="例: 自然栽培 コシヒカリ 5kg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">商品説明</label>
                  <textarea 
                    rows={8}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-y text-sm"
                    placeholder="商品の特徴や魅力を入力してください..."
                  />
                </div>
             </div>
          </div>

          {/* Variants */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-slide-up" style={{ animationDelay: '150ms' }}>
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-base font-medium text-gray-900">種類（バリエーション）</h3>
               <label className="relative inline-flex items-center cursor-pointer">
                 <input 
                   type="checkbox" 
                   checked={hasVariants} 
                   onChange={(e) => setHasVariants(e.target.checked)} 
                   className="sr-only peer" 
                 />
                 <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                 <span className="ml-3 text-sm font-medium text-gray-700">表示する</span>
               </label>
             </div>
             
             {hasVariants && (
               <div className="space-y-4 animate-fade-in">
                 <div className="flex flex-wrap gap-2 mb-2">
                   {variants.map(variant => (
                     <span key={variant} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
                       {variant}
                       <button onClick={() => removeVariant(variant)} className="ml-2 text-gray-500 hover:text-red-500">
                         <IconX className="w-3 h-3" />
                       </button>
                     </span>
                   ))}
                 </div>
                 <div className="flex gap-2">
                   <input 
                     type="text" 
                     value={newVariant}
                     onChange={(e) => setNewVariant(e.target.value)}
                     onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariant())}
                     className="flex-1 p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-sm"
                     placeholder="例: 玄米"
                   />
                   <button 
                     onClick={(e) => { e.preventDefault(); addVariant(); }}
                     className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors"
                   >
                     追加
                   </button>
                 </div>
                 <p className="text-xs text-gray-500">
                   商品詳細ページで選択肢として表示されます。「玄米」「白米」「分づき」など。
                 </p>
               </div>
             )}
          </div>

          {/* Media */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-slide-up" style={{ animationDelay: '100ms' }}>
             <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center justify-between">
               <span>商品画像</span>
               <span className="text-xs text-gray-500 font-normal">ドラッグ＆ドロップで追加可能</span>
             </h3>
             
             {/* Image Grid */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
               {images.map((imgUrl, index) => (
                 <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                   <img src={imgUrl} alt={`商品画像 ${index + 1}`} className="w-full h-full object-contain" />
                   
                   {/* Overlay Actions */}
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                     <button 
                       onClick={() => removeImage(index)}
                       className="p-1.5 bg-white rounded-full text-red-500 hover:bg-red-50 transition-colors"
                       title="削除"
                     >
                       <IconTrash className="w-4 h-4" />
                     </button>
                     {index !== 0 && (
                       <button
                         onClick={() => setAsMainImage(index)}
                         className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                       >
                         メインにする
                       </button>
                     )}
                   </div>
                   
                   {/* Main Image Badge */}
                   {index === 0 && (
                     <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
                       MAIN
                     </div>
                   )}
                 </div>
               ))}
               
               {/* Upload Button */}
               <label className={`border-2 border-dashed border-gray-300 rounded-lg aspect-square hover:bg-gray-50 transition-colors cursor-pointer group flex flex-col items-center justify-center ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                 <input
                   type="file"
                   accept="image/*"
                   multiple // 複数選択可能
                   onChange={handleImageUpload}
                   className="hidden"
                   disabled={uploading}
                 />
                 {uploading ? (
                   <IconLoader2 className="w-6 h-6 text-gray-400 animate-spin" />
                 ) : (
                   <>
                     <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-white group-hover:shadow-sm transition-all">
                       <IconUpload className="w-5 h-5 text-gray-400 group-hover:text-black" />
                     </div>
                     <span className="text-xs text-gray-500 group-hover:text-gray-900">追加</span>
                   </>
                 )}
               </label>
             </div>
             
             <p className="text-xs text-gray-400">
               推奨サイズ: 1200x1200px (正方形)。最初の画像がメイン画像として使用されます。
             </p>
          </div>

          {/* Pricing & Inventory */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-slide-up" style={{ animationDelay: '200ms' }}>
             <h3 className="text-base font-medium text-gray-900 mb-4">価格と在庫</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">価格 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                    <input 
                      type="number" 
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full pl-7 p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">在庫数</label>
                  <input 
                    type="number" 
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                    placeholder="0"
                  />
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU (商品番号)</label>
                  <input 
                    type="text" 
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                    placeholder=""
                  />
               </div>
             </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="lg:col-span-1 space-y-6">
          {/* Status */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-slide-up" style={{ animationDelay: '300ms' }}>
             <h3 className="text-base font-medium text-gray-900 mb-4">公開状態</h3>
             <select 
               value={isActive ? 'active' : 'draft'}
               onChange={(e) => setIsActive(e.target.value === 'active')}
               className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-sm"
             >
               <option value="active">販売中</option>
               <option value="draft">非公開 (下書き)</option>
             </select>
             <p className="text-xs text-gray-500 mt-3 leading-relaxed">
               「販売中」に設定すると、オンラインストアですぐに購入可能になります。
             </p>
          </div>

          {/* Organization */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-slide-up" style={{ animationDelay: '400ms' }}>
             <h3 className="text-base font-medium text-gray-900 mb-4">商品分類</h3>
             <div className="space-y-4">
               <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">カテゴリー</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-sm"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
               </div>
               
               {selectedCategoryObj && selectedCategoryObj.subcategories.length > 0 && (
                 <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">サブカテゴリー</label>
                    <select 
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-sm"
                    >
                      {selectedCategoryObj.subcategories.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                 </div>
               )}

               <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ハンドル (URL末尾) <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-sm"
                    placeholder="例: koshihikari-5kg"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">URLの一部として使用されます (半角英数字)</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductEditor;
