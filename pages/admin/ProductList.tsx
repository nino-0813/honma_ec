import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { supabase } from '../../lib/supabase';
import { IconPlus, IconSearch, IconFilter, IconEdit, IconTrash } from '../../components/Icons';
import { FadeInImage } from '../../components/UI';

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  subcategory?: string; // 追加
  handle: string;
  stock: number; // soldOutの代わりにstockを使用
  is_active: boolean; // ステータス用
  created_at: string;
}

const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [, setLocation] = useLocation();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('商品データの取得に失敗しました:', error);
      alert('商品データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('本当にこの商品を削除しますか？\n※この操作は取り消せません。')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setProducts(products.filter(p => p.id !== id));
      alert('商品を削除しました');
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  const filteredProducts = products.filter(product => 
    product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-gray-900">商品管理</h1>
        <Link href="/admin/products/new">
          <a className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-all shadow-sm hover:shadow flex items-center gap-2">
            <IconPlus className="w-4 h-4" />
            商品を追加
          </a>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="flex-1 relative">
             <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <input 
               type="text" 
               placeholder="商品を検索..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
             />
          </div>
          <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <IconFilter className="w-4 h-4" />
            フィルター
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-500">読み込み中...</div>
          ) : filteredProducts.length === 0 ? (
             <div className="p-12 text-center text-gray-500">商品が見つかりませんでした</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 w-16">
                     <input type="checkbox" className="rounded border-gray-300 text-black focus:ring-black" />
                  </th>
                  <th className="px-6 py-3">商品</th>
                  <th className="px-6 py-3">ステータス</th>
                  <th className="px-6 py-3">在庫</th>
                  <th className="px-6 py-3">カテゴリー</th>
                  <th className="px-6 py-3 text-right">価格</th>
                  <th className="px-6 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr 
                    key={product.id} 
                    className="group hover:bg-gray-50/80 transition-colors cursor-pointer"
                    onClick={(e) => {
                      // アクションボタンクリック時は遷移しない
                      if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
                      setLocation(`/admin/products/${product.handle}`);
                    }}
                  >
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-gray-300 text-black focus:ring-black" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-md overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-100">
                          {product.image ? (
                            <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Img</div>
                          )}
                        </div>
                        <span className="font-medium text-gray-900 line-clamp-1 max-w-xs">{product.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        !product.is_active
                          ? 'bg-gray-100 text-gray-600' 
                          : 'bg-green-50 text-green-700 border border-green-100'
                      }`}>
                        {product.is_active && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                        {product.is_active ? '販売中' : '非公開'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {product.stock}
                    </td>
                     <td className="px-6 py-4 text-gray-500">
                      {product.category}
                      {product.subcategory && <span className="text-xs text-gray-400 ml-1">({product.subcategory})</span>}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      ¥{product.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                           onClick={() => setLocation(`/admin/products/${product.handle}`)}
                           className="p-1 text-gray-400 hover:text-gray-600"
                           title="編集"
                         >
                           <IconEdit className="w-4 h-4" />
                         </button>
                         <button 
                           onClick={() => handleDelete(product.id)}
                           className="p-1 text-gray-400 hover:text-red-600"
                           title="削除"
                         >
                           <IconTrash className="w-4 h-4" />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
          <span>{filteredProducts.length} 件を表示</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>前へ</button>
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50" disabled>次へ</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductList;
