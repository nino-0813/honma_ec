import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { supabase, getProfile, updateProfile, getOrders, Order, Profile } from '../lib/supabase';
import { IconChevronDown, IconChevronRight } from '../components/Icons';
import { FadeInImage, LoadingButton } from '../components/UI';
import AuthForm from '../components/AuthForm';
import Header from '../components/Header';
import Footer from '../components/Footer';

const MyPage = () => {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [editingProfile, setEditingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // プロフィール編集フォームの状態
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    postal_code: '',
    address: '',
    city: '',
    country: 'JP',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        setLoading(false);
        return; // ログインしていない場合は、ログインフォームを表示
      }

      setUser(session.user);
      await loadUserData(session.user.id);
    } catch (error) {
      console.error('認証チェックエラー:', error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (email: string, userData: any) => {
    setUser(userData);
    if (userData?.id) {
      await loadUserData(userData.id);
    }
  };

  const loadUserData = async (userId: string) => {
    try {
      const [profileData, ordersData] = await Promise.all([
        getProfile(userId),
        getOrders(userId),
      ]);

      if (profileData) {
        setProfile(profileData);
        setFormData({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          postal_code: profileData.postal_code || '',
          address: profileData.address || '',
          city: profileData.city || '',
          country: profileData.country || 'JP',
        });
      }

      setOrders(ordersData);
    } catch (error) {
      console.error('データ読み込みエラー:', error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setSaving(true);
    try {
      const updatedProfile = await updateProfile(user.id, formData);
      if (updatedProfile) {
        setProfile(updatedProfile);
        setEditingProfile(false);
        alert('プロフィールを更新しました');
      } else {
        alert('プロフィールの更新に失敗しました');
      }
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      alert('プロフィールの更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    
    await supabase.auth.signOut();
    setLocation('/');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPaymentStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': '支払い待ち',
      'paid': '支払い済み',
      'failed': '支払い失敗',
      'refunded': '返金済み',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  // ログインしていない場合はログインフォームを表示
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-serif font-medium tracking-widest text-primary">
        <Header onOpenCart={() => {}} onOpenMenu={() => {}} />
        <main className="flex-1 pt-32 pb-24">
          <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <h1 className="text-3xl md:text-4xl font-serif tracking-widest mb-2">マイページ</h1>
              <p className="text-sm text-gray-500">ログインしてマイページをご利用ください</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <AuthForm onAuthSuccess={handleAuthSuccess} />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 bg-white min-h-screen animate-fade-in">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-serif tracking-widest mb-2">マイページ</h1>
          <p className="text-sm text-gray-500">ご注文履歴とアカウント設定</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 text-sm font-medium tracking-wider transition-colors ${
              activeTab === 'orders'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            購入履歴
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 text-sm font-medium tracking-wider transition-colors ${
              activeTab === 'profile'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            アカウント設定
          </button>
        </div>

        {/* Content */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 mb-4">購入履歴がありません</p>
                <div className="flex flex-col items-center gap-4">
                  <Link href="/collections">
                    <a className="text-sm text-black underline hover:no-underline">商品を見る</a>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-3 bg-white text-black border border-gray-200 text-sm tracking-widest hover:bg-gray-50 transition-colors"
                  >
                    ログアウト
                  </button>
                </div>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          注文番号: {order.order_number || order.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          order.payment_status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : order.payment_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {getPaymentStatusText(order.payment_status)}
                        </span>
                        <span className="text-sm font-serif font-medium">
                          ¥{order.total_amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <Link href={`/products/${item.product?.handle || ''}`}>
                            <a className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded overflow-hidden">
                              <FadeInImage
                                src={
                                  item.product?.images && item.product.images.length > 0
                                    ? item.product.images[0]
                                    : (item.product?.image || '')
                                }
                                alt={item.product?.title || ''}
                                className="w-full h-full object-contain"
                              />
                            </a>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link href={`/products/${item.product?.handle || ''}`}>
                              <a className="text-sm font-medium text-gray-900 hover:text-black transition-colors line-clamp-2">
                                {item.product?.title || '商品情報なし'}
                              </a>
                            </Link>
                            <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                              <span>数量: {item.quantity}</span>
                              <span>¥{item.price.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-2xl">
            {!editingProfile ? (
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">お客様情報</h3>
                  <dl className="space-y-3 text-sm">
                    <div className="flex flex-col sm:flex-row">
                      <dt className="font-medium text-gray-700 w-32 flex-shrink-0 mb-1 sm:mb-0">お名前</dt>
                      <dd className="text-gray-900">
                        {profile?.first_name || ''} {profile?.last_name || ''}
                      </dd>
                    </div>
                    <div className="flex flex-col sm:flex-row">
                      <dt className="font-medium text-gray-700 w-32 flex-shrink-0 mb-1 sm:mb-0">メールアドレス</dt>
                      <dd className="text-gray-900">{profile?.email || '-'}</dd>
                    </div>
                    <div className="flex flex-col sm:flex-row">
                      <dt className="font-medium text-gray-700 w-32 flex-shrink-0 mb-1 sm:mb-0">電話番号</dt>
                      <dd className="text-gray-900">{profile?.phone || '-'}</dd>
                    </div>
                    <div className="flex flex-col sm:flex-row">
                      <dt className="font-medium text-gray-700 w-32 flex-shrink-0 mb-1 sm:mb-0">郵便番号</dt>
                      <dd className="text-gray-900">{profile?.postal_code || '-'}</dd>
                    </div>
                    <div className="flex flex-col sm:flex-row">
                      <dt className="font-medium text-gray-700 w-32 flex-shrink-0 mb-1 sm:mb-0">住所</dt>
                      <dd className="text-gray-900">
                        {profile?.address || '-'}
                        {profile?.city && ` ${profile.city}`}
                      </dd>
                    </div>
                  </dl>
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="px-6 py-3 bg-black text-white text-sm tracking-widest hover:bg-gray-800 transition-colors"
                  >
                    編集する
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-3 bg-white text-black border border-gray-200 text-sm tracking-widest hover:bg-gray-50 transition-colors"
                  >
                    ログアウト
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">お客様情報を編集</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">姓</label>
                        <input
                          type="text"
                          value={formData.last_name}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                          className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-black transition-colors bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">名</label>
                        <input
                          type="text"
                          value={formData.first_name}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-black transition-colors bg-white"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">メールアドレス</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-black transition-colors bg-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">電話番号</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-black transition-colors bg-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">郵便番号</label>
                      <input
                        type="text"
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-black transition-colors bg-white"
                        placeholder="例: 123-4567"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">都道府県・市区町村</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-black transition-colors bg-white"
                        placeholder="例: 東京都渋谷区"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">住所</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-black transition-colors bg-white"
                        placeholder="例: 1-2-3 マンション名 101号室"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <LoadingButton
                    type="submit"
                    loading={saving}
                    className="px-6 py-3 bg-black text-white text-sm tracking-widest hover:bg-gray-800 transition-colors"
                  >
                    保存する
                  </LoadingButton>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProfile(false);
                      if (profile) {
                        setFormData({
                          first_name: profile.first_name || '',
                          last_name: profile.last_name || '',
                          email: profile.email || '',
                          phone: profile.phone || '',
                          postal_code: profile.postal_code || '',
                          address: profile.address || '',
                          city: profile.city || '',
                          country: profile.country || 'JP',
                        });
                      }
                    }}
                    className="px-6 py-3 bg-white text-black border border-gray-200 text-sm tracking-widest hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPage;

