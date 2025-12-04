import React from 'react';
import { Link } from 'wouter';
import AdminLayout from './AdminLayout';
import { products } from '../../data/products';
import { IconPlus, IconSearch, IconFilter } from '../../components/Icons';
import { FadeInImage } from '../../components/UI';

const ProductList = () => {
  return (
    <AdminLayout 
      title="商品管理" 
      actions={
        <Link href="/admin/products/new">
          <a className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-all shadow-sm hover:shadow flex items-center gap-2">
            <IconPlus className="w-4 h-4" />
            商品を追加
          </a>
        </Link>
      }
    >
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="flex-1 relative">
             <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <input 
               type="text" 
               placeholder="商品を検索..." 
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product, index) => (
                <tr 
                  key={product.id} 
                  className="group hover:bg-gray-50/80 transition-colors opacity-0 animate-fade-in-up cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded border-gray-300 text-black focus:ring-black" />
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/products/${product.handle}`}>
                      <a className="flex items-center gap-4 group">
                        <div className="w-10 h-10 rounded-md overflow-hidden border border-gray-100 flex-shrink-0">
                          <FadeInImage src={product.image} alt={product.title} className="w-full h-full" />
                        </div>
                        <span className="font-medium text-gray-900 line-clamp-1 max-w-xs group-hover:text-primary transition-colors">{product.title}</span>
                      </a>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.soldOut 
                        ? 'bg-gray-100 text-gray-600' 
                        : 'bg-green-50 text-green-700 border border-green-100'
                    }`}>
                      {!product.soldOut && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                      {product.soldOut ? '在庫なし' : '販売中'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {product.soldOut ? '0' : Math.floor(Math.random() * 50 + 10)}
                  </td>
                   <td className="px-6 py-4 text-gray-500">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <span>¥{product.price.toLocaleString()}</span>
                      <Link href={`/admin/products/${product.handle}`}>
                        <a className="text-primary hover:text-gray-900 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          編集
                        </a>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
          <span>{products.length} 件中 1-{products.length} 件を表示</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>前へ</button>
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50" disabled>次へ</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ProductList;
