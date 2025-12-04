import React, { useState } from 'react';
import { Link } from 'wouter';
import AdminLayout from './AdminLayout';
import { IconSearch, IconFilter, IconMore, IconUsers, IconCheckCircle, IconTrendingUp } from '../../components/Icons';

interface Customer {
  id: string;
  name: string;
  email: string;
  orders: number;
  totalSpent: number;
  lastOrder: string;
  status: 'active' | 'inactive';
}

const mockCustomers: Customer[] = [
  { id: '1', name: '山田 太郎', email: 'yamada@example.com', orders: 5, totalSpent: 45000, lastOrder: '2025-12-01', status: 'active' },
  { id: '2', name: '佐藤 花子', email: 'sato@example.com', orders: 3, totalSpent: 22500, lastOrder: '2025-12-02', status: 'active' },
  { id: '3', name: '鈴木 一郎', email: 'suzuki@example.com', orders: 8, totalSpent: 120000, lastOrder: '2025-12-03', status: 'active' },
  { id: '4', name: '田中 美咲', email: 'tanaka@example.com', orders: 1, totalSpent: 7500, lastOrder: '2025-11-15', status: 'inactive' },
];

const Customers = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = mockCustomers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCustomers = mockCustomers.length;
  const activeCustomers = mockCustomers.filter(c => c.status === 'active').length;
  const totalRevenue = mockCustomers.reduce((sum, c) => sum + c.totalSpent, 0);

  return (
    <AdminLayout 
      title="顧客管理"
      actions={
        <button className="px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors">
          <IconFilter className="w-4 h-4" />
          エクスポート
        </button>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <IconUsers className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">総顧客数</p>
                <p className="text-2xl font-semibold text-gray-900">{totalCustomers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <IconCheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">アクティブ顧客</p>
                <p className="text-2xl font-semibold text-gray-900">{activeCustomers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <IconTrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">総売上</p>
                <p className="text-2xl font-semibold text-gray-900">¥{totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-100 flex gap-4">
            <div className="flex-1 relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="お客様名、メールアドレスで検索..." 
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
                  <th className="px-6 py-3">お客様</th>
                  <th className="px-6 py-3">メールアドレス</th>
                  <th className="px-6 py-3">注文数</th>
                  <th className="px-6 py-3">総購入額</th>
                  <th className="px-6 py-3">最終注文</th>
                  <th className="px-6 py-3">ステータス</th>
                  <th className="px-6 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((customer, index) => (
                  <tr 
                    key={customer.id} 
                    className="group hover:bg-gray-50/80 transition-colors opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4">
                      <Link href={`/admin/customers/${customer.id}`}>
                        <a className="font-medium text-gray-900 hover:text-primary transition-colors">
                          {customer.name}
                        </a>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{customer.email}</td>
                    <td className="px-6 py-4 text-gray-600">{customer.orders}件</td>
                    <td className="px-6 py-4 font-medium">¥{customer.totalSpent.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-500">{customer.lastOrder}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        customer.status === 'active' 
                          ? 'bg-green-50 text-green-700 border border-green-100' 
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        {customer.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                        {customer.status === 'active' ? 'アクティブ' : '非アクティブ'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <IconMore className="w-4 h-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
            <span>{filteredCustomers.length} 件中 1-{filteredCustomers.length} 件を表示</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>前へ</button>
              <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50" disabled>次へ</button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Customers;

