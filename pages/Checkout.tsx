import React, { useState, useContext, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CartContext } from '../App';
import { FadeInImage } from '../components/UI';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AuthForm from '../components/AuthForm';
import { supabase } from '../lib/supabase';

// Stripe公開可能キー（環境変数から取得）
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51...');

// 決済フォームコンポーネント
const CheckoutForm = ({ formData, onFormDataChange, total, subtotal, shippingCost, onSuccess }: {
  formData: any;
  onFormDataChange: (data: any) => void;
  total: number;
  subtotal: number;
  shippingCost: number;
  onSuccess: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { cartItems, clearCart } = useContext(CartContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentCreated, setPaymentIntentCreated] = useState(false);

  // PaymentIntentを作成
  useEffect(() => {
    const createPaymentIntent = async () => {
      if (paymentIntentCreated || !cartItems.length) return;

      try {
        // TODO: バックエンドAPIエンドポイントを実装
        // 例: const response = await fetch('/api/create-payment-intent', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     amount: total,
        //     currency: 'jpy',
        //     items: cartItems.map(item => ({
        //       productId: item.product.id,
        //       quantity: item.quantity,
        //       price: item.product.price
        //     }))
        //   })
        // });
        // const { clientSecret } = await response.json();
        // setClientSecret(clientSecret);

        // 仮の処理（実際の実装ではバックエンドから取得）
        // 本番環境では必ずバックエンドAPIを使用してください
        console.warn('PaymentIntent作成: バックエンドAPIを実装してください');
        setPaymentIntentCreated(true);
        // 実際の実装では、ここでclientSecretを設定
        // setClientSecret('pi_...');
      } catch (err: any) {
        console.error('PaymentIntent作成エラー:', err);
        setError('決済の初期化に失敗しました');
      }
    };

    createPaymentIntent();
  }, [cartItems, total, paymentIntentCreated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripeが初期化されていません');
      return;
    }

    // バックエンドAPIが実装されていない場合は警告
    if (!clientSecret) {
      setError('決済システムが準備できていません。バックエンドAPIを実装してください。');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Stripeで決済を確認
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || '決済情報の確認に失敗しました');
        setLoading(false);
        return;
      }

      // 決済を実行
      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
          payment_method_data: {
            billing_details: {
              name: `${formData.lastName} ${formData.firstName}`,
              email: formData.email,
              phone: formData.phone,
              address: {
                line1: formData.address,
                city: formData.city,
                postal_code: formData.postalCode,
                country: formData.country,
              },
            },
          },
        },
        redirect: 'if_required',
      });

      if (paymentError) {
        setError(paymentError.message || '決済処理中にエラーが発生しました');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // 決済成功 - 注文情報をSupabaseに保存
        try {
          await saveOrderToSupabase(paymentIntent);
          clearCart();
          onSuccess();
        } catch (saveError: any) {
          // 注文保存に失敗しても決済は成功しているため、警告のみ
          console.error('注文情報の保存に失敗しましたが、決済は完了しています:', saveError);
          // ユーザーには成功として表示し、管理者に通知する必要があります
          clearCart();
          onSuccess();
        }
      }
    } catch (err: any) {
      console.error('決済エラー:', err);
      setError(err.message || '決済処理中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stripe Payment Element */}
      {clientSecret ? (
        <div className="border border-gray-200 p-6 rounded">
          <h3 className="text-sm font-medium mb-4">お支払い方法</h3>
          <PaymentElement />
        </div>
      ) : (
        <div className="border border-gray-200 p-6 rounded bg-gray-50">
          <p className="text-sm text-gray-500">
            決済システムを初期化中...
          </p>
          <p className="text-xs text-gray-400 mt-2">
            ※バックエンドAPIを実装してPaymentIntentを作成してください
          </p>
        </div>
      )}

      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* 決済ボタン */}
      <div className="border-t border-gray-200 pt-6">
        <button
          type="submit"
          disabled={!stripe || !elements || loading || !clientSecret}
          className="w-full py-4 bg-primary text-white text-sm tracking-widest uppercase hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '処理中...' : `¥${total.toLocaleString()} を支払う`}
        </button>
      </div>
    </form>
  );
};

const Checkout = () => {
  const [, setLocation] = useLocation();
  const { cartItems } = useContext(CartContext);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // フォームの状態
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'JP',
    shippingMethod: 'standard' // standard, express
  });

  // 認証状態を確認
  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        setCheckingAuth(false);
        return;
      }

      try {
        // OAuthコールバックの処理（URLフラグメントから認証情報を取得）
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        
        // OAuthコールバックの場合
        if (type === 'recovery' || (accessToken && refreshToken)) {
          try {
            const { data: { session }, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken!,
              refresh_token: refreshToken!,
            });
            
            if (sessionError) {
              console.error('セッション設定エラー:', sessionError);
            } else if (session?.user) {
              setIsAuthenticated(true);
              setAuthUser(session.user);
              if (session.user.email) {
                setFormData(prev => ({ ...prev, email: session.user.email || '' }));
              }
              // URLから認証パラメータを削除してチェックアウトページにリダイレクト
              window.history.replaceState(null, '', window.location.pathname);
              window.location.hash = '/checkout';
            }
          } catch (sessionErr) {
            console.error('セッション設定エラー:', sessionErr);
          }
        } else {
          // 通常のセッション確認
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setIsAuthenticated(true);
            setAuthUser(session.user);
            // ユーザー情報をフォームに反映
            if (session.user.email) {
              setFormData(prev => ({ ...prev, email: session.user.email || '' }));
            }
          }
        }
      } catch (err) {
        console.error('認証確認エラー:', err);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();

    // 認証状態の変更を監視（OAuthリダイレクト後の処理を含む）
    const { data: { subscription } } = supabase?.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setAuthUser(session.user);
        if (session.user.email) {
          setFormData(prev => ({ ...prev, email: session.user.email || '' }));
        }
        
        // OAuth認証成功時（SIGNED_INイベント）に確実にチェックアウトページに留まる
        if (event === 'SIGNED_IN') {
          // 現在のURLがチェックアウトページでない場合のみリダイレクト
          const currentHash = window.location.hash.replace('#', '') || '/';
          if (!currentHash.includes('/checkout')) {
            // ハッシュルーティングを使用しているため、ハッシュでリダイレクト
            window.location.hash = '/checkout';
          }
        }
      } else {
        setIsAuthenticated(false);
        setAuthUser(null);
      }
    }) || { data: { subscription: null } };

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // プロフィール情報を取得してフォームに反映
  useEffect(() => {
    const loadProfile = async () => {
      if (!isAuthenticated || !authUser || !supabase) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profile && !error) {
          setFormData(prev => ({
            ...prev,
            firstName: profile.first_name || prev.firstName,
            lastName: profile.last_name || prev.lastName,
            phone: profile.phone || prev.phone,
            postalCode: profile.postal_code || prev.postalCode,
            address: profile.address || prev.address,
            city: profile.city || prev.city,
            country: profile.country || prev.country,
          }));
        }
      } catch (err) {
        console.error('プロフィール取得エラー:', err);
      }
    };

    loadProfile();
  }, [isAuthenticated, authUser]);

  // 注文情報を保存する関数
  const saveOrderToSupabase = async (paymentIntent: any) => {
    if (!supabase || !authUser) return;

    // 1. プロフィール情報の更新（次回のために保存）
    try {
      await supabase.from('profiles').upsert({
        id: authUser.id,
        email: authUser.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        postal_code: formData.postalCode,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        updated_at: new Date().toISOString(),
      });
    } catch (profileError) {
      console.error('プロフィール更新エラー:', profileError);
    }

    // 2. 注文情報の保存
    try {
      // 注文データの作成
      const orderData = {
        auth_user_id: authUser.id,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        shipping_address: formData.address,
        shipping_city: formData.city,
        shipping_postal_code: formData.postalCode,
        shipping_country: formData.country,
        shipping_method: formData.shippingMethod,
        subtotal: subtotal,
        shipping_cost: shippingCost,
        total: total,
        payment_status: 'paid',
        payment_intent_id: paymentIntent.id,
        payment_method: paymentIntent.payment_method_types?.[0] || 'card',
        order_status: 'pending',
      };

      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) throw orderError;

      if (newOrder) {
        // 注文アイテムの保存
        const orderItems = cartItems.map(item => ({
          order_id: newOrder.id,
          product_id: item.product.id,
          product_title: item.product.title,
          product_price: item.product.price,
          product_image: item.product.image, // 配列の場合は先頭を取得すべきだが、スキーマ次第
          quantity: item.quantity,
          line_total: item.product.price * item.quantity,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }
    } catch (err) {
      console.error('注文保存エラー:', err);
      // エラーハンドリング（ユーザーへの通知など）が必要だが、決済は完了しているためスルー
    }
  };

  // 認証成功時の処理
  const handleAuthSuccess = (email: string, userData: any) => {
    setIsAuthenticated(true);
    setAuthUser(userData);
    setFormData(prev => ({ ...prev, email }));
  };

  // カートが空の場合はホームにリダイレクト
  useEffect(() => {
    if (cartItems.length === 0) {
      setLocation('/');
    }
  }, [cartItems.length, setLocation]);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shippingCost = formData.shippingMethod === 'express' ? 1000 : 500;
  const total = subtotal + shippingCost;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSuccess = () => {
    setLocation('/checkout/success');
  };

  if (cartItems.length === 0) {
    return null; // リダイレクト中
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-serif font-medium tracking-widest text-primary">
      <Header onOpenCart={() => {}} onOpenMenu={() => {}} />
      
      <main className="flex-1 pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link href="/">
              <a className="text-sm text-gray-500 hover:text-black transition-colors">← 買い物を続ける</a>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* 左側: 注文内容 */}
            <div className="lg:col-span-2">
              <h1 className="text-2xl font-serif tracking-wider mb-8">お客様情報</h1>

              {/* 認証セクション */}
              {checkingAuth ? (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p className="text-gray-500">読み込み中...</p>
                </div>
              ) : !isAuthenticated ? (
                <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
                  <AuthForm onAuthSuccess={handleAuthSuccess} initialEmail={formData.email} />
                </div>
              ) : (
                <>
                  {/* 認証済み表示 */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-900">ログイン済み</p>
                        <p className="text-xs text-green-700">{formData.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (supabase) {
                          await supabase.auth.signOut();
                          setIsAuthenticated(false);
                          setAuthUser(null);
                        }
                      }}
                      className="text-xs text-green-700 hover:text-green-900 underline"
                    >
                      ログアウト
                    </button>
                  </div>

                  {/* お客様情報フォーム */}
                  <div className="space-y-6 mb-8">
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
                    onChange={handleInputChange}
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
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                      placeholder="山田"
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
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                      placeholder="太郎"
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
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                    placeholder="090-1234-5678"
                  />
                </div>

                {/* 配送先住所 */}
                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-lg font-medium mb-4">配送先住所</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                        郵便番号 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                        placeholder="123-4567"
                      />
                    </div>

                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                        住所 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                        placeholder="都道府県 市区町村 番地"
                      />
                    </div>

                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                        市区町村 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                        placeholder="東京都渋谷区"
                      />
                    </div>

                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                        国 <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                      >
                        <option value="JP">日本</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 配送方法 */}
                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-lg font-medium mb-4">配送方法</h2>
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border border-gray-200 cursor-pointer hover:border-black transition-colors">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value="standard"
                        checked={formData.shippingMethod === 'standard'}
                        onChange={handleInputChange}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium">標準配送</div>
                        <div className="text-sm text-gray-500">3-7営業日でお届け</div>
                      </div>
                      <div className="font-serif">¥500</div>
                    </label>
                    <label className="flex items-center p-4 border border-gray-200 cursor-pointer hover:border-black transition-colors">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value="express"
                        checked={formData.shippingMethod === 'express'}
                        onChange={handleInputChange}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium">速達配送</div>
                        <div className="text-sm text-gray-500">1-2営業日でお届け</div>
                      </div>
                      <div className="font-serif">¥1,000</div>
                    </label>
                  </div>
                </div>
                  </div>

                  {/* Stripe決済フォーム */}
                  {isAuthenticated && (
                    <div className="border-t border-gray-200 pt-6">
                      <h2 className="text-lg font-medium mb-6">お支払い</h2>
                      <Elements stripe={stripePromise} options={{ locale: 'ja' }}>
                        <CheckoutForm
                          formData={formData}
                          onFormDataChange={setFormData}
                          total={total}
                          subtotal={subtotal}
                          shippingCost={shippingCost}
                          onSuccess={handleSuccess}
                        />
                      </Elements>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 右側: 注文サマリー */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <h2 className="text-lg font-medium mb-6">注文内容</h2>
                
                <div className="border border-gray-200 p-6 space-y-4">
                  {/* カートアイテム */}
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {cartItems.map((item) => (
                      <div key={item.product.id} className="flex gap-3 pb-4 border-b border-gray-100 last:border-b-0">
                        <Link href={`/products/${item.product.handle}`}>
                          <a className="flex-shrink-0 aspect-square w-16 bg-gray-100 rounded overflow-hidden">
                            <FadeInImage 
                              src={item.product.images && item.product.images.length > 0 ? item.product.images[0] : (item.product.image || '')} 
                              alt={item.product.title} 
                              className="w-full h-full object-cover" 
                            />
                          </a>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/products/${item.product.handle}`}>
                            <a>
                              <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2 hover:text-primary transition-colors">
                                {item.product.title}
                              </h3>
                            </a>
                          </Link>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-500">数量: {item.quantity}</span>
                            <span className="text-sm font-serif text-gray-900">
                              ¥{(item.product.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 合計 */}
                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">小計</span>
                      <span className="font-serif">¥{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">送料</span>
                      <span className="font-serif">¥{shippingCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                      <span>合計</span>
                      <span className="font-serif">¥{total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
