import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { supabase } from '../../lib/supabase';
import { IconSearch, IconFilter, IconMore, IconCheckCircle } from '../../components/Icons';

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_title: string;
  product_price: number;
  product_image: string | null;
  quantity: number;
  line_total: number;
}

interface Order {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  shipping_method: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_intent_id: string | null;
  payment_method: string | null;
  order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    if (!supabase) {
      setError('Supabaseが設定されていません。');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 注文データを取得
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) {
        throw ordersError;
      }

      // 注文商品データを取得
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*');

      if (itemsError) {
        throw itemsError;
      }

      // 注文に商品を紐付け
      const ordersWithItems = (ordersData || []).map(order => ({
        ...order,
        order_items: (itemsData || []).filter(item => item.order_id === order.id),
      }));

      setOrders(ordersWithItems as Order[]);
    } catch (err: any) {
      console.error('注文データの取得に失敗しました:', err);
      setError(err.message || '注文データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['order_status']) => {
    if (!supabase) {
      alert('Supabaseが利用できません。');
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      // データを再取得
      fetchOrders();
    } catch (err: any) {
      console.error('ステータスの更新に失敗しました:', err);
      alert(`ステータスの更新に失敗しました: ${err.message}`);
    }
  };

  const getStatusColor = (status: Order['order_status']) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'processing': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'shipped': return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'delivered': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'cancelled': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: Order['order_status']) => {
    switch (status) {
      case 'pending': return '未処理';
      case 'processing': return '処理中';
      case 'shipped': return '発送済み';
      case 'delivered': return '配送完了';
      case 'cancelled': return 'キャンセル';
      default: return status;
    }
  };

  // 注文番号を生成（IDの最初の4文字を使用、またはDBのorder_numberを使用）
  const getOrderNumber = (order: Order) => {
    // @ts-ignore
    if (order.order_number) return order.order_number;
    return `#${order.id.substring(0, 8).replace(/-/g, '').toUpperCase().substring(0, 4)}`;
  };

  // 顧客名を生成
  const getCustomerName = (order: Order) => {
    return `${order.last_name} ${order.first_name}`;
  };

  // 商品数を計算
  const getItemCount = (order: Order) => {
    return order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  };

  // フィルタリング
  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orders;

    const query = searchQuery.toLowerCase();
    return orders.filter(order => {
      const orderNumber = getOrderNumber(order);
      const customerName = getCustomerName(order);
      return (
        orderNumber.toLowerCase().includes(query) ||
        customerName.toLowerCase().includes(query) ||
        order.email.toLowerCase().includes(query)
      );
    });
  }, [orders, searchQuery]);

  // 統計情報
  const stats = useMemo(() => ({
    pending: orders.filter(o => o.order_status === 'pending').length,
    processing: orders.filter(o => o.order_status === 'processing').length,
    shipped: orders.filter(o => o.order_status === 'shipped').length,
    delivered: orders.filter(o => o.order_status === 'delivered').length,
  }), [orders]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-500">注文データを読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12">
        <div className="text-center">
          <p className="text-red-500 mb-2">エラーが発生しました</p>
          <p className="text-sm text-gray-500">{error}</p>
          <button
            onClick={fetchOrders}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-gray-800 transition-colors"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-gray-900">注文管理</h1>
        <button className="px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors">
          <IconFilter className="w-4 h-4" />
          エクスポート
        </button>
      </div>

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500 mb-2 font-medium">未処理</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500 mb-2 font-medium">処理中</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.processing}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500 mb-2 font-medium">発送済み</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.shipped}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500 mb-2 font-medium">配送完了</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.delivered}</p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="p-5 border-b border-gray-100 flex gap-4">
            <div className="flex-1 relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="注文番号、お客様名で検索..." 
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all bg-white"
              />
            </div>
            <button className="px-4 py-2.5 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
              <IconFilter className="w-4 h-4" />
              フィルター
            </button>
          </div>

          {/* Table */}
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              {searchQuery ? '検索条件に一致する注文はありません。' : '注文はまだありません。'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-xs uppercase tracking-wider">注文番号</th>
                      <th className="px-6 py-4 text-xs uppercase tracking-wider">お客様</th>
                      <th className="px-6 py-4 text-xs uppercase tracking-wider">注文日</th>
                      <th className="px-6 py-4 text-xs uppercase tracking-wider">ステータス</th>
                      <th className="px-6 py-4 text-xs uppercase tracking-wider">商品数</th>
                      <th className="px-6 py-4 text-right text-xs uppercase tracking-wider">合計</th>
                      <th className="px-6 py-4 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.map((order, index) => (
                      <tr 
                        key={order.id} 
                        className="group hover:bg-gray-50/80 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <Link href={`/admin/orders/${order.id}`}>
                            <a className="font-medium text-gray-900 hover:text-primary transition-colors">
                              {getOrderNumber(order)}
                            </a>
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{getCustomerName(order)}</td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusColor(order.order_status)}`}>
                            {order.order_status === 'delivered' && <IconCheckCircle className="w-3 h-3" />}
                            {getStatusLabel(order.order_status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{getItemCount(order)}点</td>
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
              <div className="p-5 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                <span className="font-medium">{filteredOrders.length} 件中 1-{filteredOrders.length} 件を表示</span>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium" disabled>前へ</button>
                  <button className="px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium" disabled>次へ</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Orders;
