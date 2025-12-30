import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  IconCheckCircle,
  IconChevronDown,
  IconClose,
  IconDownload,
  IconFilter,
  IconMore,
  IconRefreshCw,
  IconSearch,
} from '../../components/Icons';

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_title: string;
  product_price: number;
  product_image: string | null;
  quantity: number;
  line_total: number;
  variant?: string | null;
  selected_options?: any;
}

interface Order {
  id: string;
  order_number?: string | null;
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
  paid_at?: string | null;
  order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

type OrderStatusFilter = Order['order_status'] | 'all';
type PaymentStatusFilter = Order['payment_status'] | 'all';

type ShippingMethodBreakdown = {
  shipping_method_id?: string;
  cost?: number;
  items?: string;
  breakdown?: string | null;
};

const formatYen = (n: number | null | undefined) => `¥${Number(n || 0).toLocaleString()}`;
const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

const safeParseShippingMethod = (value: string | null | undefined): ShippingMethodBreakdown[] | null => {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!(trimmed.startsWith('[') || trimmed.startsWith('{'))) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed as ShippingMethodBreakdown[];
    if (parsed && typeof parsed === 'object') return [parsed as ShippingMethodBreakdown];
    return null;
  } catch {
    return null;
  }
};

const toCsv = (rows: Record<string, any>[]) => {
  const headers = Array.from(
    rows.reduce((set, r) => {
      Object.keys(r).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );
  const escape = (v: any) => {
    const s = v === null || v === undefined ? '' : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
};

const downloadText = (filename: string, text: string) => {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      return true;
    } catch {
      return false;
    }
  }
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatusFilter>('all');
  const [dateFrom, setDateFrom] = useState<string>(''); // yyyy-mm-dd
  const [dateTo, setDateTo] = useState<string>(''); // yyyy-mm-dd
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<Order['order_status']>('processing');
  const [exportOpen, setExportOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

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

      // 1クエリで注文＋注文明細を取得（N+1防止）
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      setOrders((ordersData || []) as unknown as Order[]);
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

      // optimistic update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, order_status: newStatus, updated_at: new Date().toISOString() } : o))
      );
    } catch (err: any) {
      console.error('ステータスの更新に失敗しました:', err);
      alert(`ステータスの更新に失敗しました: ${err.message}`);
    }
  };

  const updateBulkStatus = async () => {
    if (!supabase) return;
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`${ids.length}件のステータスを「${getStatusLabel(bulkStatus)}」に変更します。よろしいですか？`)) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: bulkStatus, updated_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
      setOrders((prev) =>
        prev.map((o) => (selectedIds.has(o.id) ? { ...o, order_status: bulkStatus, updated_at: new Date().toISOString() } : o))
      );
      setSelectedIds(new Set());
    } catch (e: any) {
      console.error('一括更新に失敗:', e);
      alert(`一括更新に失敗しました: ${e.message}`);
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
    if ((order as any).order_number) return (order as any).order_number;
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
    const query = searchQuery.toLowerCase();
    return orders.filter((order) => {
      // search
      if (query) {
        const orderNumber = getOrderNumber(order);
        const customerName = getCustomerName(order);
        const haystack = `${orderNumber} ${customerName} ${order.email} ${order.phone || ''} ${order.shipping_postal_code || ''} ${order.shipping_address || ''}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      // status filter
      if (statusFilter !== 'all' && order.order_status !== statusFilter) return false;
      // payment filter
      if (paymentFilter !== 'all' && order.payment_status !== paymentFilter) return false;
      // date range (created_at)
      if (dateFrom) {
        const from = new Date(`${dateFrom}T00:00:00.000Z`).getTime();
        if (new Date(order.created_at).getTime() < from) return false;
      }
      if (dateTo) {
        const to = new Date(`${dateTo}T23:59:59.999Z`).getTime();
        if (new Date(order.created_at).getTime() > to) return false;
      }
      return true;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter, dateFrom, dateTo]);

  // 統計情報
  const stats = useMemo(() => ({
    pending: orders.filter(o => o.order_status === 'pending').length,
    processing: orders.filter(o => o.order_status === 'processing').length,
    shipped: orders.filter(o => o.order_status === 'shipped').length,
    delivered: orders.filter(o => o.order_status === 'delivered').length,
  }), [orders]);

  const selectedCount = selectedIds.size;
  const allChecked = filteredOrders.length > 0 && filteredOrders.every((o) => selectedIds.has(o.id));

  const toggleSelectAll = () => {
    if (allChecked) {
      const next = new Set(selectedIds);
      filteredOrders.forEach((o) => next.delete(o.id));
      setSelectedIds(next);
      return;
    }
    const next = new Set(selectedIds);
    filteredOrders.forEach((o) => next.add(o.id));
    setSelectedIds(next);
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const exportOrdersCsv = () => {
    const rows = filteredOrders.map((o) => ({
      order_number: getOrderNumber(o),
      created_at: formatDateTime(o.created_at),
      order_status: getStatusLabel(o.order_status),
      payment_status: o.payment_status,
      customer_name: getCustomerName(o),
      email: o.email,
      phone: o.phone || '',
      postal_code: o.shipping_postal_code || '',
      address: o.shipping_address || '',
      item_count: getItemCount(o),
      subtotal: o.subtotal,
      shipping_cost: o.shipping_cost,
      total: o.total,
      payment_intent_id: o.payment_intent_id || '',
    }));
    downloadText(`orders-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
  };

  const exportShippingCsv = () => {
    const rows = filteredOrders.map((o) => ({
      order_number: getOrderNumber(o),
      name: getCustomerName(o),
      phone: o.phone || '',
      postal_code: o.shipping_postal_code || '',
      address: o.shipping_address || '',
      items: (o.order_items || []).map((it) => `${it.product_title}×${it.quantity}`).join(' / '),
      total_items: getItemCount(o),
      shipping_cost: o.shipping_cost,
      memo: '',
    }));
    downloadText(`shipping-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
  };

  const getPaymentBadge = (ps: Order['payment_status']) => {
    switch (ps) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'failed':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'refunded':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

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
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors bg-white"
          >
            <IconRefreshCw className="w-4 h-4" />
            更新
          </button>
          <div className="relative">
            <button
              onClick={() => setExportOpen((v) => !v)}
              className="px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors bg-white"
            >
              <IconDownload className="w-4 h-4" />
              エクスポート
              <IconChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                <button
                  onClick={() => {
                    exportOrdersCsv();
                    setExportOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                >
                  注文一覧CSV（フィルタ適用）
                </button>
                <button
                  onClick={() => {
                    exportShippingCsv();
                    setExportOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                >
                  発送CSV（ラベル用）
                </button>
              </div>
            )}
          </div>
        </div>
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
          <div className="p-5 border-b border-gray-100 space-y-4">
            <div className="flex gap-4">
            <div className="flex-1 relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="注文番号 / 氏名 / メール / 電話 / 住所 で検索" 
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all bg-white"
              />
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="px-4 py-2.5 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors bg-white"
            >
              <IconFilter className="w-4 h-4" />
              フィルター
            </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">注文ステータス</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as OrderStatusFilter)}
                    className="w-full p-2 border border-gray-200 rounded-md bg-white text-sm"
                  >
                    <option value="all">すべて</option>
                    <option value="pending">未処理</option>
                    <option value="processing">処理中</option>
                    <option value="shipped">発送済み</option>
                    <option value="delivered">配送完了</option>
                    <option value="cancelled">キャンセル</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">支払い</label>
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value as PaymentStatusFilter)}
                    className="w-full p-2 border border-gray-200 rounded-md bg-white text-sm"
                  >
                    <option value="all">すべて</option>
                    <option value="paid">支払済</option>
                    <option value="pending">未確定</option>
                    <option value="failed">失敗</option>
                    <option value="refunded">返金</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">開始日</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-md bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">終了日</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-md bg-white text-sm"
                  />
                </div>
              </div>
            )}

            {selectedCount > 0 && (
              <div className="flex flex-col md:flex-row md:items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div className="text-sm text-gray-700">
                  選択中: <span className="font-semibold">{selectedCount}</span>件
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value as Order['order_status'])}
                    className="p-2 border border-gray-200 rounded-md bg-white text-sm"
                  >
                    <option value="pending">未処理</option>
                    <option value="processing">処理中</option>
                    <option value="shipped">発送済み</option>
                    <option value="delivered">配送完了</option>
                    <option value="cancelled">キャンセル</option>
                  </select>
                  <button
                    onClick={updateBulkStatus}
                    className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-800 transition-colors"
                  >
                    一括変更
                  </button>
                </div>
              </div>
            )}
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
                      <th className="px-6 py-4 w-10">
                        <input
                          type="checkbox"
                          checked={allChecked}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </th>
                      <th className="px-6 py-4 text-xs uppercase tracking-wider">注文番号</th>
                      <th className="px-6 py-4 text-xs uppercase tracking-wider">お客様</th>
                      <th className="px-6 py-4 text-xs uppercase tracking-wider">注文日</th>
                      <th className="px-6 py-4 text-xs uppercase tracking-wider">支払い</th>
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
                          <input
                            type="checkbox"
                            checked={selectedIds.has(order.id)}
                            onChange={() => toggleSelectOne(order.id)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setDetailOrder(order)}
                            className="font-medium text-gray-900 hover:text-primary transition-colors"
                          >
                            {getOrderNumber(order)}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{getCustomerName(order)}</td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getPaymentBadge(order.payment_status)}`}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={order.order_status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['order_status'])}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium border bg-white ${getStatusColor(order.order_status)}`}
                          >
                            <option value="pending">未処理</option>
                            <option value="processing">処理中</option>
                            <option value="shipped">発送済み</option>
                            <option value="delivered">配送完了</option>
                            <option value="cancelled">キャンセル</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{getItemCount(order)}点</td>
                        <td className="px-6 py-4 text-right font-medium">¥{order.total.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setDetailOrder(order)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            title="詳細"
                          >
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

      {/* Detail Drawer */}
      {detailOrder && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setDetailOrder(null)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl border-l border-gray-200 overflow-y-auto">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">注文詳細</div>
                <div className="text-lg font-semibold text-gray-900">{getOrderNumber(detailOrder)}</div>
                <div className="text-xs text-gray-500 mt-1">{formatDateTime(detailOrder.created_at)}</div>
              </div>
              <button
                onClick={() => setDetailOrder(null)}
                className="p-2 rounded hover:bg-gray-100"
                aria-label="close"
              >
                <IconClose className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Status */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900">ステータス</div>
                  <select
                    value={detailOrder.order_status}
                    onChange={async (e) => {
                      const next = e.target.value as Order['order_status'];
                      await updateOrderStatus(detailOrder.id, next);
                      setDetailOrder({ ...detailOrder, order_status: next });
                    }}
                    className="p-2 border border-gray-200 rounded-md bg-white text-sm"
                  >
                    <option value="pending">未処理</option>
                    <option value="processing">処理中</option>
                    <option value="shipped">発送済み</option>
                    <option value="delivered">配送完了</option>
                    <option value="cancelled">キャンセル</option>
                  </select>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div className="text-gray-600">支払い</div>
                  <div className="text-gray-900">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded border ${getPaymentBadge(detailOrder.payment_status)}`}>
                      {detailOrder.payment_status}
                    </span>
                    {detailOrder.paid_at ? <span className="ml-2 text-gray-500">({formatDateTime(detailOrder.paid_at)})</span> : null}
                  </div>
                  <div className="text-gray-600">合計</div>
                  <div className="text-gray-900 font-semibold">{formatYen(detailOrder.total)}</div>
                </div>
              </div>

              {/* Customer */}
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-900">お客様</div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-gray-900">{getCustomerName(detailOrder)}</div>
                    <button
                      onClick={async () => {
                        const ok = await copyText(getCustomerName(detailOrder));
                        if (!ok) alert('コピーに失敗しました');
                      }}
                      className="text-xs text-gray-600 hover:text-gray-900"
                    >
                      コピー
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-gray-600">
                    <div>{detailOrder.email}</div>
                    <button
                      onClick={async () => {
                        const ok = await copyText(detailOrder.email);
                        if (!ok) alert('コピーに失敗しました');
                      }}
                      className="text-xs text-gray-600 hover:text-gray-900"
                    >
                      コピー
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-gray-600">
                    <div>{detailOrder.phone || '-'}</div>
                    <button
                      onClick={async () => {
                        const ok = await copyText(detailOrder.phone || '');
                        if (!ok) alert('コピーに失敗しました');
                      }}
                      className="text-xs text-gray-600 hover:text-gray-900"
                    >
                      コピー
                    </button>
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-900">配送先</div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm">
                  <div className="text-gray-600">〒{detailOrder.shipping_postal_code || '-'}</div>
                  <div className="mt-1 text-gray-900 whitespace-pre-wrap">{detailOrder.shipping_address || '-'}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-gray-600">送料合計</div>
                    <div className="text-sm font-semibold">{formatYen(detailOrder.shipping_cost)}</div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      onClick={async () => {
                        const text = `${detailOrder.shipping_postal_code || ''}\n${detailOrder.shipping_address || ''}\n${getCustomerName(detailOrder)}\n${detailOrder.phone || ''}`;
                        const ok = await copyText(text.trim());
                        if (!ok) alert('コピーに失敗しました');
                      }}
                      className="text-xs text-gray-700 hover:text-gray-900 underline"
                    >
                      住所+氏名+電話をまとめてコピー
                    </button>
                  </div>
                </div>

                {/* Shipping breakdown if stored */}
                {safeParseShippingMethod(detailOrder.shipping_method) && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm">
                    <div className="text-xs font-semibold text-gray-700 mb-2">送料の内訳（保存データ）</div>
                    <div className="space-y-2">
                      {safeParseShippingMethod(detailOrder.shipping_method)!.map((b, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-gray-900 font-medium">発送方法ID: {b.shipping_method_id || '-'}</div>
                            {b.items ? <div className="text-xs text-gray-600 mt-0.5">対象: {b.items}</div> : null}
                            {b.breakdown ? <div className="text-xs text-gray-600 mt-0.5">内訳: {b.breakdown}</div> : null}
                          </div>
                          <div className="font-semibold whitespace-nowrap">{formatYen(b.cost)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-900">商品</div>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {(detailOrder.order_items || []).length === 0 ? (
                    <div className="p-4 text-sm text-gray-500">商品情報がありません</div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {(detailOrder.order_items || []).map((it) => (
                        <div key={it.id} className="p-4 flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900">{it.product_title}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              {formatYen(it.product_price)} × {it.quantity} = {formatYen(it.line_total)}
                            </div>
                            {it.variant ? <div className="text-xs text-gray-500 mt-1">種類: {it.variant}</div> : null}
                            {it.selected_options ? (
                              <div className="text-xs text-gray-500 mt-1">
                                オプション: {typeof it.selected_options === 'string' ? it.selected_options : JSON.stringify(it.selected_options)}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Orders;
