import React, { useState } from 'react';
import { Link } from 'wouter';
import AdminLayout from './AdminLayout';
import { products } from '../../data/products';
import { IconEdit, IconTrendingUp, IconCheckCircle } from '../../components/Icons';
import { FadeInImage } from '../../components/UI';

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('過去30日間');
  const [channel, setChannel] = useState('すべてのチャネル');
  
  // サンプルデータ（実際のデータに置き換える）
  const sessions = 120;
  const totalSales = 0;
  const orders = 0;
  const conversionRate = 0;
  const liveVisitors = 2;
  const nextPayment = 0;

  // 最新の商品を取得
  const latestProduct = products[0];

  return (
    <AdminLayout>
      {/* Top Filter Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 md:px-8 py-3">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400"
            >
              <option>過去30日間</option>
              <option>過去7日間</option>
              <option>今日</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400"
            >
              <option>すべてのチャネル</option>
              <option>オンラインストア</option>
            </select>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">ライブ訪問者{liveVisitors}人</span>
            </div>
          </div>
          <div className="text-gray-600">
            次回の支払い: ¥{nextPayment.toLocaleString()}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">セッション数</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold">{sessions.toLocaleString()}</p>
                <div className="flex items-center gap-1 text-green-600 text-xs">
                  <IconTrendingUp className="w-3 h-3" />
                  <span>0.8%</span>
                </div>
              </div>
            </div>
            <IconEdit className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">販売合計</p>
              <p className="text-lg font-semibold">¥{totalSales.toLocaleString()}</p>
            </div>
            <span className="text-gray-400">—</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">注文</p>
              <p className="text-lg font-semibold">{orders}</p>
            </div>
            <span className="text-gray-400">—</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">コンバージョン率</p>
              <p className="text-lg font-semibold">{conversionRate}%</p>
            </div>
            <span className="text-gray-400">—</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Store Status */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">ストアは営業中です</span>
          </div>
          <Link href="/">
            <a className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
              表示
            </a>
          </Link>
        </div>

        {/* Product and Store Preview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Preview Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">イケベジ</h3>
              <IconEdit className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
            </div>
            
            {latestProduct && (
              <>
                <div className="relative mb-4 rounded-lg overflow-hidden bg-gray-100">
                  <FadeInImage 
                    src={latestProduct.image} 
                    alt={latestProduct.title}
                    className="w-full aspect-square object-cover"
                  />
                  {latestProduct.title.includes('新米') && (
                    <div className="absolute top-2 left-2 bg-white text-primary border border-primary px-2 py-1 text-[10px] font-bold tracking-widest uppercase">
                      新米
                    </div>
                  )}
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                    {latestProduct.title}
                  </h4>
                  <p className="text-lg font-semibold text-gray-900">¥{latestProduct.price.toLocaleString()}</p>
                </div>
                
                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <IconCheckCircle className="w-4 h-4" />
                    <span>商品を追加済み</span>
                  </div>
                  <Link href="/admin/products/new">
                    <a className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      さらに追加する
                    </a>
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Store Preview Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="mb-4">
              <div className="bg-gray-900 rounded-t-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white text-xs">
                  <span className="font-serif font-bold">IKEVEGE</span>
                </div>
                <div className="flex items-center gap-2 text-white text-xs">
                  <span>HOME</span>
                  <span>ABOUT US</span>
                  <span>CATEGORY</span>
                  <span>AMBASSADOR</span>
                  <span>CONTACT</span>
                </div>
              </div>
              <div className="bg-gray-800 h-32 rounded-b-lg"></div>
            </div>
            
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">余計なものは足さない</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                自然栽培の考えをベースに、品種が秘めた旨みと香りをまっすぐに届けるため、
                島の有機資源で土を磨き上げ、農薬に頼らず育てました。
                佐渡ヶ島の森里海とそこで暮らす様々な命が織りなす循環の一粒をご賞味ください。
              </p>
            </div>
            
            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <IconCheckCircle className="w-4 h-4" />
                <span>テーマをカスタマイズしました</span>
              </div>
              <Link href="/">
                <a className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  編集
                </a>
              </Link>
            </div>
          </div>
        </div>

        {/* Payment and Domain Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Status Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 text-sm text-green-600 mb-4">
              <IconCheckCircle className="w-4 h-4" />
              <span>決済が有効になりました</span>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-6 bg-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">
                shop
              </div>
              <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                VISA
              </div>
              <div className="w-10 h-6 bg-orange-500 rounded flex items-center justify-center text-white text-xs font-bold">
                MC
              </div>
              <button className="px-3 py-1.5 border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-50">
                その他
              </button>
            </div>
            
            <Link href="/admin/settings">
              <a className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                編集する
              </a>
            </Link>
          </div>

          {/* Domain Customization Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">ドメインをカスタマイズ</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">現在のドメイン</p>
              <p className="text-sm font-mono text-gray-900">v2ipkh-0d.myshopify.com</p>
            </div>
            <Link href="/admin/settings">
              <a className="inline-block bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                カスタマイズ
              </a>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
