import React, { useState } from 'react';
import { Link } from 'wouter';
import AdminLayout from './AdminLayout';
import { IconSearch, IconFilter, IconMore, IconCheckCircle } from '../../components/Icons';

interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: number;
}

const mockOrders: Order[] = [
  { id: '1', orderNumber: '#1001', customer: '山田 太郎', date: '2025-12-01', status: 'pending', total: 3900, items: 1 },
  { id: '2', orderNumber: '#1002', customer: '佐藤 花子', date: '2025-12-02', status: 'processing', total: 15000, items: 2 },
  { id: '3', orderNumber: '#1003', customer: '鈴木 一郎', date: '2025-12-03', status: 'shipped', total: 7500, items: 1 },
  { id: '4', orderNumber: '#1004', customer: '田中 美咲', date: '2025-12-04', status: 'delivered', total: 45000, items: 1 },
];

const Orders = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'processing': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'shipped': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'delivered': return 'bg-green-50 text-green-700 border-green-100';
      case 'cancelled': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending': return '未処理';
      case 'processing': return '処理中';
      case 'shipped': return '発送済み';
      case 'delivered': return '配送完了';
      case 'cancelled': return 'キャンセル';
      default: return status;
    }
  };

  const filteredOrders = mockOrders.filter(order => 
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout 
      title="注文管理"
      actions={
        <button className="px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors">
          <IconFilter className="w-4 h-4" />
          エクスポート
        </button>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">未処理</p>
            <p className="text-2xl font-semibold text-yellow-600">{mockOrders.filter(o => o.status === 'pending').length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">処理中</p>
            <p className="text-2xl font-semibold text-blue-600">{mockOrders.filter(o => o.status === 'processing').length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">発送済み</p>
            <p className="text-2xl font-semibold text-purple-600">{mockOrders.filter(o => o.status === 'shipped').length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">配送完了</p>
            <p className="text-2xl font-semibold text-green-600">{mockOrders.filter(o => o.status === 'delivered').length}</p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-100 flex gap-4">
            <div className="flex-1 relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="注文番号、お客様名で検索..." 
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
                  <th className="px-6 py-3">注文番号</th>
                  <th className="px-6 py-3">お客様</th>
                  <th className="px-6 py-3">注文日</th>
                  <th className="px-6 py-3">ステータス</th>
                  <th className="px-6 py-3">商品数</th>
                  <th className="px-6 py-3 text-right">合計</th>
                  <th className="px-6 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order, index) => (
                  <tr 
                    key={order.id} 
                    className="group hover:bg-gray-50/80 transition-colors opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4">
                      <Link href={`/admin/orders/${order.id}`}>
                        <a className="font-medium text-gray-900 hover:text-primary transition-colors">
                          {order.orderNumber}
                        </a>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{order.customer}</td>
                    <td className="px-6 py-4 text-gray-500">{order.date}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {order.status === 'delivered' && <IconCheckCircle className="w-3 h-3" />}
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{order.items}点</td>
                    <td className="px-6 py-4 text-right font-medium">¥{order.total.toLocaleString()}</td>
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
            <span>{filteredOrders.length} 件中 1-{filteredOrders.length} 件を表示</span>
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

export default Orders;

