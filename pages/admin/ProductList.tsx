import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { supabase } from '../../lib/supabase';
import { IconPlus, IconSearch, IconFilter, IconEdit, IconTrash, IconUpload, IconDownload } from '../../components/Icons';
import { FadeInImage } from '../../components/UI';

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  subcategory?: string;
  handle: string;
  stock: number;
  is_active: boolean;
  created_at: string;
  description?: string;
  sku?: string;
  variants_config?: any;
  status?: string;
}

const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [, setLocation] = useLocation();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setSelectedProducts(selectedProducts.filter(pid => pid !== id));
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

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(pid => pid !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
  };

  const handleExportCSV = () => {
    const productsToExport = selectedProducts.length > 0 
      ? products.filter(p => selectedProducts.includes(p.id))
      : products;

    const csvHeader = ['id', 'title', 'description', 'status', 'category', 'subcategory', 'handle', 'price', 'stock', 'sku'];
    const csvRows = productsToExport.map(product => [
      product.id,
      `"${(product.title || '').replace(/"/g, '""')}"`,
      `"${(product.description || '').replace(/"/g, '""')}"`,
      product.is_active ? 'active' : 'draft',
      product.category || '',
      product.subcategory || '',
      product.handle || '',
      product.price || 0,
      product.stock || 0,
      product.sku || ''
    ]);

    const csvContent = [
      csvHeader.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n').map(row => {
          // 簡易的なCSVパース (ダブルクォート内のカンマを考慮しない簡易版、本来はライブラリ推奨だが今回は簡易実装)
          // ダブルクォートで囲まれた値の処理が必要ならライブラリを使うべきだが、要件がタイトなので自前で簡易処理
          const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
          // より堅牢な分割ロジック
          const result = [];
          let current = '';
          let inQuote = false;
          for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') {
              inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
              result.push(current.replace(/^"|"$/g, '').replace(/""/g, '"'));
              current = '';
              continue;
            }
            current += char;
          }
          result.push(current.replace(/^"|"$/g, '').replace(/""/g, '"'));
          return result;
        });

        const header = rows[0].map(h => h.trim());
        const dataRows = rows.slice(1).filter(r => r.length === header.length);

        const updates = [];
        const errors = [];

        for (const row of dataRows) {
          const productData: any = {};
          header.forEach((key, index) => {
            productData[key] = row[index];
          });

          // SKUチェック
          if (!productData.sku || productData.sku.trim() === '') {
            errors.push(`SKUが設定されていない行があります: ${productData.title || '不明な商品'}`);
            continue;
          }

          // データの整形
          const cleanData = {
            title: productData.title,
            description: productData.description,
            is_active: productData.status === 'active' || productData.status === 'true',
            category: productData.category,
            subcategory: productData.subcategory,
            handle: productData.handle,
            price: parseInt(productData.price) || 0,
            stock: parseInt(productData.stock) || 0,
            sku: productData.sku,
            // idは更新時には使わない（SKUでマッチング）
          };

          updates.push(cleanData);
        }

        if (errors.length > 0) {
          alert(`インポートエラー:\n${errors.join('\n')}`);
          if (!window.confirm('エラーのある行を除いてインポートを続けますか？')) {
             setUploading(false);
             if (fileInputRef.current) fileInputRef.current.value = '';
             return;
          }
        }

        // 一括更新処理
        for (const product of updates) {
          // SKUで既存商品を検索
          const { data: existing } = await supabase
            .from('products')
            .select('id')
            .eq('sku', product.sku)
            .single();

          if (existing) {
            // 更新
            await supabase
              .from('products')
              .update(product)
              .eq('id', existing.id);
          } else {
            // 新規作成
            // handleの重複チェック（簡易）
            if (!product.handle) {
                // handleがない場合はSKUやタイトルから生成
                product.handle = product.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `prod-${Date.now()}`;
            }
            await supabase
              .from('products')
              .insert(product);
          }
        }

        alert('CSVインポートが完了しました');
        fetchProducts();

      } catch (error) {
        console.error('CSV Import Error:', error);
        alert('CSVの読み込み中にエラーが発生しました');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-gray-900">商品管理</h1>
        <div className="flex gap-2">
          <button 
            onClick={handleExportCSV}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
          >
            <IconDownload className="w-4 h-4" />
            CSVエクスポート
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
            disabled={uploading}
          >
            <IconUpload className="w-4 h-4" />
            {uploading ? '読み込み中...' : 'CSVインポート'}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportCSV} 
            accept=".csv" 
            className="hidden" 
          />
          <Link href="/admin/products/new">
            <a className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-all shadow-sm hover:shadow flex items-center gap-2">
              <IconPlus className="w-4 h-4" />
              商品を追加
            </a>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="flex-1 relative">
             <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <input 
               type="text" 
               placeholder="商品を検索 (タイトル、SKU、ハンドル)..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
             />
          </div>
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
                     <input 
                       type="checkbox" 
                       className="rounded border-gray-300 text-black focus:ring-black" 
                       checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                       onChange={toggleSelectAll}
                     />
                  </th>
                  <th className="px-6 py-3">商品</th>
                  <th className="px-6 py-3">SKU</th>
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
                      if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a') || (e.target as HTMLElement).closest('input[type="checkbox"]')) return;
                      setLocation(`/admin/products/${product.handle}`);
                    }}
                  >
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-black focus:ring-black" 
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleSelect(product.id)}
                      />
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
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                      {product.sku || '-'}
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