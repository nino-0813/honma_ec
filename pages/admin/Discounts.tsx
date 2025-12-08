import React, { useState } from 'react';
import { Link } from 'wouter';
import { IconPlus, IconSearch, IconFilter, IconPercent, IconEdit, IconMore, IconTrendingUp, IconCheckCircle } from '../../components/Icons';

interface Discount {
  id: string;
  code: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  usage: number;
  limit: number | null;
  status: 'active' | 'inactive' | 'expired';
  startDate: string;
  endDate: string | null;
}

const mockDiscounts: Discount[] = [
  { id: '1', code: 'WELCOME10', name: '新規会員10%オフ', type: 'percentage', value: 10, usage: 45, limit: 100, status: 'active', startDate: '2025-01-01', endDate: '2025-12-31' },
  { id: '2', code: 'SUMMER2025', name: '夏の特別セール', type: 'percentage', value: 20, usage: 120, limit: null, status: 'active', startDate: '2025-07-01', endDate: '2025-08-31' },
  { id: '3', code: 'FREESHIP', name: '送料無料', type: 'fixed', value: 500, usage: 89, limit: 200, status: 'active', startDate: '2025-11-01', endDate: null },
  { id: '4', code: 'NEWYEAR', name: '新年セール', type: 'percentage', value: 15, usage: 250, limit: 500, status: 'expired', startDate: '2025-01-01', endDate: '2025-01-31' },
];

const Discounts = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDiscounts = mockDiscounts.filter(discount => 
    discount.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    discount.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: Discount['status']) => {
    switch (status) {
      case 'active': return 'bg-green-50 text-green-700 border-green-100';
      case 'inactive': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'expired': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getStatusLabel = (status: Discount['status']) => {
    switch (status) {
      case 'active': return '有効';
      case 'inactive': return '無効';
      case 'expired': return '期限切れ';
      default: return status;
    }
  };

  const formatDiscountValue = (discount: Discount) => {
    if (discount.type === 'percentage') {
      return `${discount.value}%`;
    }
    return `¥${discount.value.toLocaleString()}`;
  };

  return (
    <>
      <div className="flex justify-end mb-6">
        <Link href="/admin/discounts/new">
          <a className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm flex items-center gap-2">
            <IconPlus className="w-4 h-4" />
            ディスカウントを作成
          </a>
        </Link>
      </div>

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <IconPercent className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">有効なディスカウント</p>
                <p className="text-2xl font-semibold text-gray-900">{mockDiscounts.filter(d => d.status === 'active').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <IconTrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">総使用回数</p>
                <p className="text-2xl font-semibold text-gray-900">{mockDiscounts.reduce((sum, d) => sum + d.usage, 0)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <IconCheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">今月の使用回数</p>
                <p className="text-2xl font-semibold text-gray-900">156</p>
              </div>
            </div>
          </div>
        </div>

        {/* Discounts Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-100 flex gap-4">
            <div className="flex-1 relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="コード、名前で検索..." 
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
                  <th className="px-6 py-3">コード</th>
                  <th className="px-6 py-3">名前</th>
                  <th className="px-6 py-3">割引</th>
                  <th className="px-6 py-3">使用回数</th>
                  <th className="px-6 py-3">期間</th>
                  <th className="px-6 py-3">ステータス</th>
                  <th className="px-6 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDiscounts.map((discount, index) => (
                  <tr 
                    key={discount.id} 
                    className="group hover:bg-gray-50/80 transition-colors opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono font-medium text-gray-900">{discount.code}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/discounts/${discount.id}`}>
                        <a className="font-medium text-gray-900 hover:text-primary transition-colors">
                          {discount.name}
                        </a>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{formatDiscountValue(discount)}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {discount.usage}
                      {discount.limit && ` / ${discount.limit}`}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {discount.startDate}
                      {discount.endDate && ` 〜 ${discount.endDate}`}
                      {!discount.endDate && ' 〜 無期限'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(discount.status)}`}>
                        {getStatusLabel(discount.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/discounts/${discount.id}`}>
                          <a className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <IconEdit className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          </a>
                        </Link>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <IconMore className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
            <span>{filteredDiscounts.length} 件中 1-{filteredDiscounts.length} 件を表示</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>前へ</button>
              <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50" disabled>次へ</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Discounts;

