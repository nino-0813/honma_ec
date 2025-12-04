import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import { IconBarChart, IconTrendingUp, IconEye, IconShoppingCart, IconUsers, IconPercent } from '../../components/Icons';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('過去30日間');

  const metrics = {
    sessions: 1250,
    sessionsChange: 12.5,
    visitors: 890,
    visitorsChange: 8.3,
    orders: 45,
    ordersChange: 15.2,
    conversionRate: 3.6,
    conversionRateChange: 0.8,
    revenue: 1250000,
    revenueChange: 18.7,
    averageOrderValue: 27778,
    averageOrderValueChange: 5.4,
  };

  const topProducts = [
    { name: '自然栽培【在来コシヒカリ】10kg', sales: 125000, orders: 8 },
    { name: '自然栽培【在来コシヒカリ】5kg', sales: 97500, orders: 13 },
    { name: '自然栽培【在来コシヒカリ】2合×5個セット', sales: 78000, orders: 20 },
  ];

  const MetricCard = ({ icon: Icon, label, value, change, iconColor = 'bg-blue-100', iconTextColor = 'text-blue-600' }: { 
    icon: any, 
    label: string, 
    value: string | number, 
    change?: number,
    iconColor?: string,
    iconTextColor?: string
  }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${iconColor} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconTextColor}`} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <IconTrendingUp className={`w-3 h-3 ${change < 0 ? 'rotate-180' : ''}`} />
            <span>{change >= 0 ? '+' : ''}{change}%</span>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );

  return (
    <AdminLayout title="ストア分析">
      <div className="space-y-6">
        {/* Time Range Selector */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">期間:</label>
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
          >
            <option>過去7日間</option>
            <option>過去30日間</option>
            <option>過去90日間</option>
            <option>過去1年間</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard 
            icon={IconEye} 
            label="セッション数" 
            value={metrics.sessions} 
            change={metrics.sessionsChange}
            iconColor="bg-blue-100"
            iconTextColor="text-blue-600"
          />
          <MetricCard 
            icon={IconUsers} 
            label="訪問者数" 
            value={metrics.visitors} 
            change={metrics.visitorsChange}
            iconColor="bg-purple-100"
            iconTextColor="text-purple-600"
          />
          <MetricCard 
            icon={IconShoppingCart} 
            label="注文数" 
            value={metrics.orders} 
            change={metrics.ordersChange}
            iconColor="bg-green-100"
            iconTextColor="text-green-600"
          />
          <MetricCard 
            icon={IconPercent} 
            label="コンバージョン率" 
            value={`${metrics.conversionRate}%`} 
            change={metrics.conversionRateChange}
            iconColor="bg-yellow-100"
            iconTextColor="text-yellow-600"
          />
          <MetricCard 
            icon={IconTrendingUp} 
            label="総売上" 
            value={`¥${metrics.revenue.toLocaleString()}`} 
            change={metrics.revenueChange}
            iconColor="bg-green-100"
            iconTextColor="text-green-600"
          />
          <MetricCard 
            icon={IconBarChart} 
            label="平均注文額" 
            value={`¥${metrics.averageOrderValue.toLocaleString()}`} 
            change={metrics.averageOrderValueChange}
            iconColor="bg-orange-100"
            iconTextColor="text-orange-600"
          />
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">人気商品トップ3</h3>
          </div>
          <div className="p-4 space-y-4">
            {topProducts.map((product, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{product.orders}件の注文</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">¥{product.sales.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">売上</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <IconBarChart className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-sm">グラフ表示エリア</p>
              <p className="text-xs mt-1">チャートライブラリを統合して表示</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Analytics;

