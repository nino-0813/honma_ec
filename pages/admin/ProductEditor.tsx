import React, { useState } from 'react';
import { useRoute, Link } from 'wouter';
import AdminLayout from './AdminLayout';
import { IconArrowLeft, IconUpload } from '../../components/Icons';
import { LoadingButton } from '../../components/UI';
import { products } from '../../data/products';

const ProductEditor = () => {
  const [match, params] = useRoute<{ handle?: string }>("/admin/products/:handle?");
  const handleParam = match && params && params.handle ? String(params.handle) : undefined;
  const existingProduct = handleParam 
    ? products.find(p => p.handle === handleParam)
    : null;

  const [title, setTitle] = useState(existingProduct?.title || '');
  const [price, setPrice] = useState(existingProduct?.price.toString() || '');
  const [category, setCategory] = useState(existingProduct?.category || 'お米');
  const [description, setDescription] = useState(existingProduct?.description || '');
  const [handle, setHandle] = useState(existingProduct?.handle || '');
  const [soldOut, setSoldOut] = useState(existingProduct?.soldOut || false);
  const [status, setStatus] = useState<'active' | 'draft' | 'archived'>(existingProduct?.soldOut ? 'archived' : 'active');
  const [image, setImage] = useState(existingProduct?.image || '');
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    // TODO: 商品データの保存処理を実装
    const productData = { 
      title, 
      price: Number(price), 
      category, 
      description, 
      handle, 
      soldOut, 
      status, 
      image 
    };
    console.log('商品データ:', productData);
    alert('商品を保存しました');
  };

  return (
    <AdminLayout
      title={existingProduct ? '商品編集' : '新規商品追加'}
      actions={
        <div className="flex items-center gap-3">
          <Link href="/admin/products">
            <a className="text-sm text-gray-500 hover:text-gray-900 transition-colors">キャンセル</a>
          </Link>
          <LoadingButton 
            onClick={handleSubmit} 
            className="bg-black text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-all shadow-sm hover:shadow"
          >
            保存する
          </LoadingButton>
        </div>
      }
    >
      <div className="mb-6">
        <Link href="/admin/products">
          <a className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-black transition-colors">
            <IconArrowLeft className="w-3 h-3" />
            商品一覧に戻る
          </a>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Basic Info */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-slide-up">
             <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">商品名</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                    placeholder="例: 自然栽培 コシヒカリ 5kg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">商品説明</label>
                  <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
                    <div className="bg-gray-50 border-b border-gray-200 p-2 flex gap-2 text-xs text-gray-600">
                      <button className="hover:bg-gray-200 p-1 rounded">B</button>
                      <button className="hover:bg-gray-200 p-1 rounded italic">I</button>
                      <button className="hover:bg-gray-200 p-1 rounded underline">U</button>
                    </div>
                    <textarea 
                      rows={8}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-3 focus:outline-none resize-y text-sm"
                      placeholder="商品の特徴や魅力を入力してください..."
                    />
                  </div>
                </div>
             </div>
          </div>

          {/* Media */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-slide-up" style={{ animationDelay: '100ms' }}>
             <h3 className="text-base font-medium text-gray-900 mb-4">メディア</h3>
             {image && (
               <div className="mb-4">
                 <img src={image} alt="商品画像" className="h-32 w-32 object-cover rounded-lg border border-gray-200" />
               </div>
             )}
             <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:bg-gray-50 transition-colors cursor-pointer group block">
               <input
                 type="file"
                 accept="image/*"
                 onChange={handleImageUpload}
                 className="hidden"
               />
               <div className="flex flex-col items-center justify-center text-center">
                 <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-white group-hover:shadow-sm transition-all">
                   <IconUpload className="w-6 h-6 text-gray-400 group-hover:text-black" />
                 </div>
                 <p className="text-sm font-medium text-gray-900">クリックしてアップロード</p>
                 <p className="text-xs text-gray-500 mt-1">またはドラッグ＆ドロップ</p>
                 <p className="text-xs text-gray-400 mt-2">推奨サイズ: 1200x1200px (正方形)</p>
               </div>
             </label>
          </div>

          {/* Pricing */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-slide-up" style={{ animationDelay: '200ms' }}>
             <h3 className="text-base font-medium text-gray-900 mb-4">価格設定</h3>
             <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">価格</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                    <input 
                      type="number" 
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full pl-7 p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">割引前価格</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                    <input 
                      type="number" 
                      className="w-full pl-7 p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>
             </div>
             <div className="mt-4 flex items-center gap-2">
               <input type="checkbox" id="tax" className="rounded border-gray-300 text-black focus:ring-black" />
               <label htmlFor="tax" className="text-sm text-gray-600">商品価格に税が含まれています</label>
             </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="lg:col-span-1 space-y-6">
          {/* Status */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-slide-up" style={{ animationDelay: '300ms' }}>
             <h3 className="text-base font-medium text-gray-900 mb-4">商品ステータス</h3>
             <select 
               value={status}
               onChange={(e) => {
                 const newStatus = e.target.value as 'active' | 'draft' | 'archived';
                 setStatus(newStatus);
                 setSoldOut(newStatus === 'archived');
               }}
               className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-sm"
             >
               <option value="active">販売中</option>
               <option value="draft">下書き</option>
               <option value="archived">アーカイブ</option>
             </select>
             <p className="text-xs text-gray-500 mt-3 leading-relaxed">
               「販売中」に設定すると、オンラインストアですぐに購入可能になります。
             </p>
             <div className="mt-4 flex items-center gap-2">
               <input 
                 type="checkbox" 
                 id="soldOut"
                 checked={soldOut}
                 onChange={(e) => {
                   setSoldOut(e.target.checked);
                   if (e.target.checked) setStatus('archived');
                 }}
                 className="rounded border-gray-300 text-black focus:ring-black" 
               />
               <label htmlFor="soldOut" className="text-sm text-gray-600">在庫切れ</label>
             </div>
          </div>

          {/* Organization */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-slide-up" style={{ animationDelay: '400ms' }}>
             <h3 className="text-base font-medium text-gray-900 mb-4">商品整理</h3>
             <div className="space-y-4">
               <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">カテゴリー</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-sm"
                  >
                    <option value="お米">お米</option>
                    <option value="年間契約">年間契約</option>
                    <option value="Crescentmoon">Crescentmoon</option>
                    <option value="その他">その他</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ハンドル（URL用）</label>
                  <input 
                    type="text" 
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-sm"
                    placeholder="例: rice-koshihikari-5kg"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">商品のURLに使用されます</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ProductEditor;
