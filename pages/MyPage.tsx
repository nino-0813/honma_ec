import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { supabase, getProfile, updateProfile, getOrders, Order, Profile } from '../lib/supabase';
import { IconChevronDown, IconChevronRight } from '../components/Icons';
import { FadeInImage, LoadingButton } from '../components/UI';
import AuthForm from '../components/AuthForm';
import Header from '../components/Header';
import { CartDrawer, MenuDrawer } from '../components/Drawers';
import { CartContext } from '../App';

const MyPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');

  // URLクエリパラメータからタブを設定
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'orders') setActiveTab('orders');
    if (tab === 'profile') setActiveTab('profile');
  }, [searchParams]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [isSignUpSuccess, setIsSignUpSuccess] = useState(false);
  const { cartItems, removeFromCart, updateQuantity } = useContext(CartContext);
  
  // プロフィール編集フォームの状態（チェックアウトページと同じ形式）
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    postalCode: '',
    prefecture: '',
    city: '',
    address: '',
    building: '',
    country: 'JP',
  });

  // 郵便番号検索の状態
  const [postalCodeSearching, setPostalCodeSearching] = useState(false);
  const [postalCodeError, setPostalCodeError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // 新規登録成功フラグの確認（checkAuthより先に確認）
    const signUpSuccessFlag = localStorage.getItem('signUpSuccess');
    if (signUpSuccessFlag === 'true') {
      setIsSignUpSuccess(true);
      setLoading(false); // 新規登録成功時はcheckAuthをスキップ
      // フラグは削除しない（AuthForm側で管理）
      return;
    }
    
    checkAuth();
    
    // 新規登録成功メッセージの確認
    const welcomeFlag = localStorage.getItem('showWelcomeMessage');
    if (welcomeFlag === 'true') {
      setShowWelcomeMessage(true);
      // フラグを削除（一度だけ表示）
      localStorage.removeItem('showWelcomeMessage');
    }
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
    // 新規登録成功時は遷移しない（AuthForm側でメッセージを表示）
    // ログイン時のみマイページの内容を表示する
  };

  const loadUserData = async (userId: string) => {
    try {
      const [profileData, ordersData] = await Promise.all([
        getProfile(userId),
        getOrders(userId),
      ]);

      if (profileData) {
        setProfile(profileData);
        // 都道府県と建物名を取得（prefectureカラムが存在する場合はそれを使用）
        let prefecture = (profileData as any).prefecture || '';
        let building = (profileData as any).building || '';
        let city = profileData.city || '';
        let address = profileData.address || '';
        
        // prefectureカラムがない場合、addressから都道府県を抽出（既存データの互換性のため）
        if (!prefecture && address) {
          const prefectureMatch = address.match(/(北海道|青森県|岩手県|宮城県|秋田県|山形県|福島県|茨城県|栃木県|群馬県|埼玉県|千葉県|東京都|神奈川県|新潟県|富山県|石川県|福井県|山梨県|長野県|岐阜県|静岡県|愛知県|三重県|滋賀県|京都府|大阪府|兵庫県|奈良県|和歌山県|鳥取県|島根県|岡山県|広島県|山口県|徳島県|香川県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県)/);
          if (prefectureMatch) {
            prefecture = prefectureMatch[1];
            // addressから都道府県を削除
            address = address.replace(prefecture, '').trim();
          }
        }
        
        // addressから市区町村を削除（cityカラムに既に値がある場合）
        if (city && address) {
          // addressの先頭にcityが含まれている場合は削除
          if (address.startsWith(city)) {
            address = address.replace(city, '').trim();
          }
        }
        
        // addressから都道府県を再度削除（念のため）
        if (prefecture && address) {
          address = address.replace(new RegExp(prefecture, 'g'), '').trim();
        }
        
        setFormData({
          firstName: profileData.first_name || '',
          lastName: profileData.last_name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          postalCode: profileData.postal_code || '',
          prefecture: prefecture,
          city: city,
          address: address,
          building: building,
          country: profileData.country || 'JP',
        });
      }

      setOrders(ordersData);
    } catch (error) {
      console.error('データ読み込みエラー:', error);
    }
  };

  // 郵便番号から住所を検索
  const handlePostalCodeSearch = async () => {
    if (!formData.postalCode) {
      setPostalCodeError('郵便番号を入力してください');
      return;
    }

    // 既に都道府県と市区町村が入力されている場合は、郵便番号検索をスキップ
    if (formData.prefecture && formData.city) {
      setPostalCodeError(null);
      return;
    }

    setPostalCodeSearching(true);
    setPostalCodeError(null);

    try {
      const cleaned = formData.postalCode.replace(/[^0-9]/g, '');
      if (cleaned.length !== 7) {
        setPostalCodeError('郵便番号は7桁で入力してください');
        setPostalCodeSearching(false);
        return;
      }

      // 郵便番号API（郵便番号検索API）を使用
      const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleaned}`);
      const data = await response.json();

      if (data.status === 200 && data.results && data.results.length > 0) {
        const result = data.results[0];
        const prefecture = result.address1 || '';
        const city = result.address2 || '';
        const address = result.address3 || '';

        setFormData(prev => ({
          ...prev,
          prefecture: prefecture,
          city: city,
          address: address,
        }));
      } else {
        setPostalCodeError('住所が見つかりませんでした');
      }
    } catch (err) {
      console.error('郵便番号検索エラー:', err);
      setPostalCodeError('住所の検索に失敗しました');
    } finally {
      setPostalCodeSearching(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setSaving(true);
    try {
      // チェックアウトページと同じ形式でプロフィールを更新
      // addressには町名・番地のみを保存（都道府県と市区町村は別カラムに保存）
      const profileUpdateData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        postal_code: formData.postalCode,
        prefecture: formData.prefecture,
        city: formData.city,
        address: formData.address, // 町名・番地のみ
        building: formData.building,
        country: formData.country,
      };
      
      const updatedProfile = await updateProfile(user.id, profileUpdateData);
      if (updatedProfile) {
        // プロフィール情報を再取得して確実に最新の情報を反映
        const freshProfile = await getProfile(user.id);
        if (freshProfile) {
          setProfile(freshProfile);
          // フォームデータを更新されたプロフィール情報で再設定（保存した値が維持されるように）
          // 都道府県と建物名を取得
          let prefecture = (freshProfile as any).prefecture || '';
          let building = (freshProfile as any).building || '';
          let city = freshProfile.city || '';
          let address = freshProfile.address || '';
          
          // addressから都道府県と市区町村を削除（既存データの互換性のため）
          if (prefecture && address) {
            address = address.replace(new RegExp(prefecture, 'g'), '').trim();
          }
          if (city && address) {
            if (address.startsWith(city)) {
              address = address.replace(city, '').trim();
            }
          }
          
          setFormData({
            firstName: freshProfile.first_name || '',
            lastName: freshProfile.last_name || '',
            email: freshProfile.email || '',
            phone: freshProfile.phone || '',
            postalCode: freshProfile.postal_code || '',
            prefecture: prefecture,
            city: city,
            address: address,
            building: building,
            country: freshProfile.country || 'JP',
          });
        } else {
          // 再取得に失敗した場合は、更新されたプロフィール情報を使用
          setProfile(updatedProfile);
        }
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
    navigate('/');
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

  // 新規登録成功時は、ログイン状態でもマイページの内容を表示しない
  // ログインしていない場合、または新規登録成功時はログインフォームを表示
  if (!user || isSignUpSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-serif font-medium tracking-widest text-primary overflow-x-hidden w-full">
        <Header onOpenCart={() => setIsCartOpen(true)} onOpenMenu={() => setIsMenuOpen(true)} />
        <main className="flex-1 pt-24 md:pt-32 pb-24 w-full overflow-x-hidden">
          <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="mb-8 text-center">
              <h1 className="text-xl md:text-2xl font-serif tracking-[0.15em] font-normal mb-2">
                <span className="md:hidden">MY PAGE</span>
                <span className="hidden md:inline">マイページ</span>
              </h1>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <AuthForm onAuthSuccess={handleAuthSuccess} />
            </div>
          </div>
        </main>
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cartItems={cartItems} onRemove={removeFromCart} onUpdateQuantity={updateQuantity} />
        <MenuDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-serif font-medium tracking-widest text-primary overflow-x-hidden w-full">
      <Header onOpenCart={() => setIsCartOpen(true)} onOpenMenu={() => setIsMenuOpen(true)} />
      <main className="flex-1 pt-24 md:pt-32 pb-24 w-full overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-xl md:text-2xl font-serif tracking-[0.15em] font-normal mb-2">
            <span className="md:hidden">MY PAGE</span>
            <span className="hidden md:inline">マイページ</span>
          </h1>
          <p className="text-sm text-gray-500">ご注文履歴とアカウント設定</p>
        </div>

        {/* 新規登録成功メッセージ */}
        {showWelcomeMessage && (
          <div className="mb-8 bg-green-50 border border-green-200 text-gray-900 px-6 py-4 rounded-lg">
            <p className="text-sm md:text-base font-medium">
              会員登録ありがとうございます。
            </p>
            <p className="text-sm md:text-base mt-1">
              引き続きお買い物をお楽しみください。
            </p>
          </div>
        )}

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
                  <Link to="/collections">
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
                        <Link to={`/mypage/orders/${order.id}`}>
                          <a className="text-sm font-medium text-gray-900 hover:text-primary transition-colors">
                            注文番号: {order.order_number || order.id.slice(0, 8)}
                          </a>
                        </Link>
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
                          ¥{order.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <Link to={`/products/${item.product?.handle || ''}`}>
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
                            <Link to={`/products/${item.product?.handle || ''}`}>
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
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Link to={`/mypage/orders/${order.id}`}>
                        <a className="text-sm text-primary hover:underline inline-flex items-center gap-2">
                          詳細を表示する
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </a>
                      </Link>
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
                <div className="mb-8">
                  <h2 className="text-lg font-medium mb-4">購入者情報</h2>
                  <div className="space-y-4">
                    {/* メールアドレス */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        メールアドレス
                      </label>
                      <p className="text-sm text-gray-900">{profile?.email || '-'}</p>
                    </div>

                    {/* お名前 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          姓
                        </label>
                        <p className="text-sm text-gray-900">{profile?.last_name || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          名
                        </label>
                        <p className="text-sm text-gray-900">{profile?.first_name || '-'}</p>
                      </div>
                    </div>

                    {/* 電話番号 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        電話番号
                      </label>
                      <p className="text-sm text-gray-900">{profile?.phone || '-'}</p>
                    </div>

                    {/* 郵便番号 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        郵便番号
                      </label>
                      <p className="text-sm text-gray-900">{profile?.postal_code || '-'}</p>
                    </div>

                    {/* 都道府県 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        都道府県
                      </label>
                      <p className="text-sm text-gray-900">{(profile as any)?.prefecture || '-'}</p>
                    </div>

                    {/* 市区町村 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        市区町村
                      </label>
                      <p className="text-sm text-gray-900">{profile?.city || '-'}</p>
                    </div>

                    {/* 町名・番地 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        町名・番地
                      </label>
                      <p className="text-sm text-gray-900">{profile?.address || '-'}</p>
                    </div>

                    {/* 建物名・部屋番号 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        建物名・部屋番号
                      </label>
                      <p className="text-sm text-gray-900">{(profile as any)?.building || '-'}</p>
                    </div>
                  </div>
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
                <div className="mb-8">
                  <h2 className="text-lg font-medium mb-4">購入者情報</h2>
                  <div className="space-y-4">
                    {/* メールアドレス */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        メールアドレス <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                        placeholder="example@email.com"
                      />
                    </div>

                    {/* お名前 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                          姓 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          required
                          className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                          placeholder="例) 鈴木"
                        />
                      </div>
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                          名 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          required
                          className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                          placeholder="例) 太郎"
                        />
                      </div>
                    </div>

                    {/* 電話番号 */}
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        電話番号 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                        placeholder="例) 09012345678"
                      />
                    </div>

                    {/* 郵便番号 */}
                    <div>
                      <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                        郵便番号 <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="postalCode"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handlePostalCodeSearch();
                            }
                          }}
                          required
                          className="flex-1 px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                          placeholder="例) 1066237"
                        />
                        <button
                          type="button"
                          onClick={handlePostalCodeSearch}
                          disabled={postalCodeSearching || !formData.postalCode}
                          className="px-6 py-3 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {postalCodeSearching ? '検索中...' : '検索'}
                        </button>
                      </div>
                      {postalCodeError && (
                        <p className="mt-2 text-sm text-red-600">{postalCodeError}</p>
                      )}
                    </div>

                    {/* 都道府県 */}
                    <div>
                      <label htmlFor="prefecture" className="block text-sm font-medium text-gray-700 mb-2">
                        都道府県
                      </label>
                      <select
                        id="prefecture"
                        name="prefecture"
                        value={formData.prefecture}
                        onChange={(e) => setFormData({ ...formData, prefecture: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                      >
                        <option value="">都道府県を選択してください</option>
                        <option value="北海道">北海道</option>
                        <option value="青森県">青森県</option>
                        <option value="岩手県">岩手県</option>
                        <option value="宮城県">宮城県</option>
                        <option value="秋田県">秋田県</option>
                        <option value="山形県">山形県</option>
                        <option value="福島県">福島県</option>
                        <option value="茨城県">茨城県</option>
                        <option value="栃木県">栃木県</option>
                        <option value="群馬県">群馬県</option>
                        <option value="埼玉県">埼玉県</option>
                        <option value="千葉県">千葉県</option>
                        <option value="東京都">東京都</option>
                        <option value="神奈川県">神奈川県</option>
                        <option value="新潟県">新潟県</option>
                        <option value="富山県">富山県</option>
                        <option value="石川県">石川県</option>
                        <option value="福井県">福井県</option>
                        <option value="山梨県">山梨県</option>
                        <option value="長野県">長野県</option>
                        <option value="岐阜県">岐阜県</option>
                        <option value="静岡県">静岡県</option>
                        <option value="愛知県">愛知県</option>
                        <option value="三重県">三重県</option>
                        <option value="滋賀県">滋賀県</option>
                        <option value="京都府">京都府</option>
                        <option value="大阪府">大阪府</option>
                        <option value="兵庫県">兵庫県</option>
                        <option value="奈良県">奈良県</option>
                        <option value="和歌山県">和歌山県</option>
                        <option value="鳥取県">鳥取県</option>
                        <option value="島根県">島根県</option>
                        <option value="岡山県">岡山県</option>
                        <option value="広島県">広島県</option>
                        <option value="山口県">山口県</option>
                        <option value="徳島県">徳島県</option>
                        <option value="香川県">香川県</option>
                        <option value="愛媛県">愛媛県</option>
                        <option value="高知県">高知県</option>
                        <option value="福岡県">福岡県</option>
                        <option value="佐賀県">佐賀県</option>
                        <option value="長崎県">長崎県</option>
                        <option value="熊本県">熊本県</option>
                        <option value="大分県">大分県</option>
                        <option value="宮崎県">宮崎県</option>
                        <option value="鹿児島県">鹿児島県</option>
                        <option value="沖縄県">沖縄県</option>
                      </select>
                    </div>

                    {/* 市区町村 */}
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                        市区町村
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                        placeholder="例) 港区六本木"
                      />
                    </div>

                    {/* 町名・番地 */}
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                        町名・番地
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                        placeholder="例) 3丁目2-1"
                      />
                    </div>

                    {/* 建物名・部屋番号 */}
                    <div>
                      <label htmlFor="building" className="block text-sm font-medium text-gray-700 mb-2">
                        建物名・部屋番号
                      </label>
                      <input
                        type="text"
                        id="building"
                        name="building"
                        value={formData.building}
                        onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                        placeholder="例) 六本木グランドハイツ307号室"
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
                        // 都道府県と建物名を取得（prefectureカラムが存在する場合はそれを使用）
                        let prefecture = (profile as any).prefecture || '';
                        let building = (profile as any).building || '';
                        let city = profile.city || '';
                        let address = profile.address || '';
                        
                        // prefectureカラムがない場合、addressから都道府県を抽出（既存データの互換性のため）
                        if (!prefecture && address) {
                          const prefectureMatch = address.match(/(北海道|青森県|岩手県|宮城県|秋田県|山形県|福島県|茨城県|栃木県|群馬県|埼玉県|千葉県|東京都|神奈川県|新潟県|富山県|石川県|福井県|山梨県|長野県|岐阜県|静岡県|愛知県|三重県|滋賀県|京都府|大阪府|兵庫県|奈良県|和歌山県|鳥取県|島根県|岡山県|広島県|山口県|徳島県|香川県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県)/);
                          if (prefectureMatch) {
                            prefecture = prefectureMatch[1];
                            // addressから都道府県を削除
                            address = address.replace(prefecture, '').trim();
                          }
                        }
                        
                        // addressから市区町村を削除（cityカラムに既に値がある場合）
                        if (city && address) {
                          // addressの先頭にcityが含まれている場合は削除
                          if (address.startsWith(city)) {
                            address = address.replace(city, '').trim();
                          }
                        }
                        
                        // addressから都道府県を再度削除（念のため）
                        if (prefecture && address) {
                          address = address.replace(new RegExp(prefecture, 'g'), '').trim();
                        }
                        
                        setFormData({
                          firstName: profile.first_name || '',
                          lastName: profile.last_name || '',
                          email: profile.email || '',
                          phone: profile.phone || '',
                          postalCode: profile.postal_code || '',
                          prefecture: prefecture,
                          city: city,
                          address: address,
                          building: building,
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
      </main>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cartItems={cartItems} onRemove={removeFromCart} onUpdateQuantity={updateQuantity} />
      <MenuDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
};

export default MyPage;

