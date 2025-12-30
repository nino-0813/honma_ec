import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'wouter';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CartContext } from '../App';
import { FadeInImage } from '../components/UI';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AuthForm from '../components/AuthForm';
import { supabase, checkStockAvailability } from '../lib/supabase';
import { ShippingMethod, AreaFees } from '../types';

// Stripe公開可能キー（環境変数から取得）
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51...');

// 郵便番号から都道府県を判定（先頭3桁で判定）
const getPrefectureFromPostalCode = (postalCode: string): string | null => {
  const cleaned = postalCode.replace(/[^0-9]/g, '');
  if (cleaned.length < 3) return null;
  const prefix = parseInt(cleaned.substring(0, 3), 10);
  
  // 郵便番号の先頭3桁で都道府県を判定
  if (prefix >= 1 && prefix <= 7) return '北海道';
  if (prefix >= 10 && prefix <= 16) return '青森県';
  if (prefix >= 17 && prefix <= 22) return '秋田県';
  if (prefix >= 23 && prefix <= 29) return '岩手県';
  if (prefix >= 30 && prefix <= 38) return '宮城県';
  if (prefix >= 39 && prefix <= 49) return '山形県';
  if (prefix >= 50 && prefix <= 59) return '福島県';
  if (prefix >= 100 && prefix <= 208) return '東京都';
  if (prefix >= 209 && prefix <= 214) return '神奈川県';
  if (prefix >= 215 && prefix <= 219) return '山梨県';
  if (prefix >= 270 && prefix <= 278) return '千葉県';
  if (prefix >= 300 && prefix <= 329) return '茨城県';
  if (prefix >= 320 && prefix <= 329) return '栃木県';
  if (prefix >= 360 && prefix <= 369) return '群馬県';
  if (prefix >= 370 && prefix <= 399) return '埼玉県';
  if (prefix >= 400 && prefix <= 409) return '新潟県';
  if (prefix >= 380 && prefix <= 399) return '長野県';
  if (prefix >= 920 && prefix <= 929) return '富山県';
  if (prefix >= 920 && prefix <= 929) return '石川県';
  if (prefix >= 910 && prefix <= 919) return '福井県';
  if (prefix >= 410 && prefix <= 429) return '静岡県';
  if (prefix >= 450 && prefix <= 469) return '愛知県';
  if (prefix >= 500 && prefix <= 509) return '岐阜県';
  if (prefix >= 510 && prefix <= 519) return '三重県';
  if (prefix >= 520 && prefix <= 529) return '滋賀県';
  if (prefix >= 600 && prefix <= 609) return '京都府';
  if (prefix >= 530 && prefix <= 599) return '大阪府';
  if (prefix >= 630 && prefix <= 639) return '奈良県';
  if (prefix >= 640 && prefix <= 649) return '和歌山県';
  if (prefix >= 650 && prefix <= 669) return '兵庫県';
  if (prefix >= 680 && prefix <= 689) return '鳥取県';
  if (prefix >= 690 && prefix <= 699) return '島根県';
  if (prefix >= 700 && prefix <= 709) return '岡山県';
  if (prefix >= 730 && prefix <= 739) return '広島県';
  if (prefix >= 740 && prefix <= 749) return '山口県';
  if (prefix >= 760 && prefix <= 769) return '香川県';
  if (prefix >= 770 && prefix <= 779) return '徳島県';
  if (prefix >= 790 && prefix <= 799) return '愛媛県';
  if (prefix >= 780 && prefix <= 789) return '高知県';
  if (prefix >= 800 && prefix <= 819) return '福岡県';
  if (prefix >= 840 && prefix <= 849) return '佐賀県';
  if (prefix >= 850 && prefix <= 859) return '長崎県';
  if (prefix >= 860 && prefix <= 869) return '熊本県';
  if (prefix >= 870 && prefix <= 879) return '大分県';
  if (prefix >= 880 && prefix <= 889) return '宮崎県';
  if (prefix >= 890 && prefix <= 899) return '鹿児島県';
  if (prefix >= 900 && prefix <= 909) return '沖縄県';
  
  return null;
};

// 都道府県から地域（AreaFeesのキー）を判定
const getAreaFromPrefecture = (prefecture: string): keyof AreaFees | null => {
  if (!prefecture) return null;
  
  if (prefecture === '北海道') return 'hokkaido';
  if (['青森県', '秋田県', '岩手県'].includes(prefecture)) return 'north_tohoku';
  if (['宮城県', '山形県', '福島県'].includes(prefecture)) return 'south_tohoku';
  if (['東京都', '神奈川県', '山梨県', '千葉県', '茨城県', '栃木県', '群馬県', '埼玉県'].includes(prefecture)) return 'kanto';
  if (['新潟県', '長野県'].includes(prefecture)) return 'shinetsu';
  if (['富山県', '石川県', '福井県'].includes(prefecture)) return 'hokuriku';
  if (['静岡県', '愛知県', '三重県', '岐阜県'].includes(prefecture)) return 'chubu';
  if (['大阪府', '京都府', '滋賀県', '奈良県', '和歌山県', '兵庫県'].includes(prefecture)) return 'kansai';
  if (['岡山県', '広島県', '山口県', '鳥取県', '島根県'].includes(prefecture)) return 'chugoku';
  if (['香川県', '徳島県', '愛媛県', '高知県'].includes(prefecture)) return 'shikoku';
  if (['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県'].includes(prefecture)) return 'kyushu';
  if (prefecture === '沖縄県') return 'okinawa';
  
  return null;
};

// 決済フォームコンポーネント
const CheckoutForm = ({ formData, total, clientSecret, onSuccess }: {
  formData: any;
  total: number;
  clientSecret: string;
  onSuccess: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { cartItems, clearCart, restoreCart } = useContext(CartContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripeが初期化されていません');
      return;
    }

    // 在庫チェック（最終確認）
    for (const item of cartItems) {
      // バリエーション選択がある場合は、バリエーション在庫（sharedStock/option stock）でチェックする
      const selectedOptions = item.selectedOptions;
      if (selectedOptions && Object.keys(selectedOptions).length > 0) {
        // カート内の商品データが古い可能性があるため、直前に最新のvariants_configを取得
        let latestProduct = item.product as any;
        try {
          const { data, error } = await supabase
            .from('products')
            .select('id, stock, has_variants, variants_config')
            .eq('id', item.product.id)
            .single();

          if (!error && data) {
            const hasVariantsFromConfig = Array.isArray(data.variants_config) && data.variants_config.length > 0;
            latestProduct = {
              ...item.product,
              stock: data.stock ?? item.product.stock,
              hasVariants: Boolean(data.has_variants || hasVariantsFromConfig),
              variants_config: data.variants_config ?? item.product.variants_config,
            };
          }
        } catch (e) {
          // 取得失敗時はカート内データで続行
          console.warn('在庫チェック用の最新商品データ取得に失敗:', e);
        }

        const stockCheck = checkStockAvailability(
          latestProduct,
          selectedOptions,
          item.quantity,
          0
        );
        if (!stockCheck.available) {
          setError(stockCheck.message || `「${item.product.title}」の在庫が不足しています。`);
          return;
        }
      } else {
        // バリエーション情報がない場合は基本在庫でチェック
        const stock = item.product.stock ?? null;
        if (stock !== null && item.quantity > stock) {
          setError(`「${item.product.title}」の在庫が不足しています。在庫数: ${stock}個`);
          return;
        }
      }
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
                line1: `${formData.prefecture}${formData.city}${formData.address}${formData.building ? ' ' + formData.building : ''}`,
                city: formData.city,
                postal_code: formData.postalCode,
                country: 'JP',
              },
            },
          },
        },
        redirect: 'if_required',
      });

      if (paymentError) {
        setError(paymentError.message || '決済処理中にエラーが発生しました');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // 注文は決済前にドラフト作成済み。決済成功後はWebhookがpaid確定&在庫確定減算を行う。
        clearCart();
        onSuccess();
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
      <div className="border border-gray-200 p-6 rounded">
        <h3 className="text-sm font-medium mb-4">お支払い方法</h3>
        <PaymentElement />
      </div>

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
          disabled={!stripe || !elements || loading}
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
  const { cartItems, restoreCart } = useContext(CartContext);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // フォームの状態
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    postalCode: '',
    prefecture: '',
    city: '',
    address: '',
    building: '',
    shippingMethod: 'standard' // standard, express
  });

  // 発送方法と送料計算の状態
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [productShippingMethodIds, setProductShippingMethodIds] = useState<Record<string, string[]>>({});
  const [calculatedShippingCost, setCalculatedShippingCost] = useState<number>(0);
  const [shippingCalculationError, setShippingCalculationError] = useState<string | null>(null);
  
  // 郵便番号検索の状態
  const [postalCodeSearching, setPostalCodeSearching] = useState(false);
  const [postalCodeError, setPostalCodeError] = useState<string | null>(null);

  // 決済（PaymentIntent）
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [paymentIntentAmount, setPaymentIntentAmount] = useState<number | null>(null);
  const [paymentInitError, setPaymentInitError] = useState<string | null>(null);

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
          // OAuthリダイレクト直後フラグを設定
          setIsOAuthRedirect(true);
          
          // カートを確認し、空の場合はlocalStorageから復元を試みる
          const savedCart = localStorage.getItem('ikevege_cart');
          if (savedCart) {
            try {
              const parsedCart = JSON.parse(savedCart);
              if (parsedCart.length > 0 && cartItems.length === 0) {
                // カートが空の場合、restoreCart関数でカートを復元
                console.log('OAuthリダイレクト後、カートを復元します:', parsedCart);
                restoreCart();
              }
            } catch (e) {
              console.error('カート復元エラー:', e);
            }
          }
          
          // 現在のURLがチェックアウトページでない場合のみリダイレクト
          const currentHash = window.location.hash.replace('#', '') || '/';
          if (!currentHash.includes('/checkout')) {
            // ハッシュルーティングを使用しているため、ハッシュでリダイレクト
            // リダイレクト先を保存
            localStorage.setItem('auth_redirect', '/checkout');
            window.location.hash = '/checkout';
          }
          
          // カートの復元を待つため、少し遅延させる
          setTimeout(() => {
            setIsOAuthRedirect(false);
          }, 2000);
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
            prefecture: profile.prefecture || prev.prefecture,
            city: profile.city || prev.city,
            address: profile.address || prev.address,
            building: profile.building || prev.building,
          }));
        }
      } catch (err) {
        console.error('プロフィール取得エラー:', err);
      }
    };

    loadProfile();
  }, [isAuthenticated, authUser]);

  // カート内の商品に紐づいている発送方法を取得
  useEffect(() => {
    const fetchShippingMethods = async () => {
      if (!supabase || cartItems.length === 0) {
        setShippingMethods([]);
        setProductShippingMethodIds({});
        return;
      }

      try {
        const productIds = cartItems.map(item => item.product.id);
        
        // 商品と発送方法の紐づけを取得
        const { data: productShippingMethods, error: linkError } = await supabase
          .from('product_shipping_methods')
          .select('product_id, shipping_method_id')
          .in('product_id', productIds);

        if (linkError) throw linkError;

        if (!productShippingMethods || productShippingMethods.length === 0) {
          setShippingMethods([]);
          setProductShippingMethodIds({});
          return;
        }

        // product_id -> shipping_method_ids[]
        const map: Record<string, string[]> = {};
        for (const row of productShippingMethods as any[]) {
          const pid = row.product_id as string;
          const mid = row.shipping_method_id as string;
          if (!map[pid]) map[pid] = [];
          map[pid].push(mid);
        }
        // 重複除去
        for (const pid of Object.keys(map)) {
          map[pid] = Array.from(new Set(map[pid]));
        }
        setProductShippingMethodIds(map);

        // 発送方法IDを取得（重複を除去）
        const shippingMethodIds = [...new Set(
          productShippingMethods.map((psm: any) => psm.shipping_method_id)
        )];

        // 発送方法の詳細を取得
        const { data: methods, error: methodsError } = await supabase
          .from('shipping_methods')
          .select('*')
          .in('id', shippingMethodIds);

        if (methodsError) throw methodsError;

        setShippingMethods((methods || []) as ShippingMethod[]);
      } catch (err) {
        console.error('発送方法の取得エラー:', err);
        setShippingMethods([]);
        setProductShippingMethodIds({});
      }
    };

    fetchShippingMethods();
  }, [cartItems]);

  // 郵便番号から送料を自動計算
  useEffect(() => {
    const calculateShipping = async () => {
      if (!formData.postalCode || cartItems.length === 0 || shippingMethods.length === 0) {
        setCalculatedShippingCost(0);
        setShippingCalculationError(null);
        return;
      }

      try {
        // 郵便番号から都道府県を判定
        const prefecture = getPrefectureFromPostalCode(formData.postalCode);
        if (!prefecture) {
          setCalculatedShippingCost(0);
          setShippingCalculationError(null);
          return;
        }

        // 都道府県から地域を判定
        const area = getAreaFromPrefecture(prefecture);
        if (!area) {
          setCalculatedShippingCost(0);
          setShippingCalculationError(null);
          return;
        }

        const getMethodCost = (method: ShippingMethod): number => {
          if (method.fee_type === 'uniform') {
            return method.uniform_fee || 0;
          }
          if (method.fee_type === 'area') {
            return method.area_fees?.[area] || 0;
          }
          if (method.fee_type === 'size') {
            // サイズ別送料の場合、簡易的に最初のサイズ別送料を使用
            if (method.size_fees) {
              const sizeFeeKeys = Object.keys(method.size_fees);
              if (sizeFeeKeys.length > 0) {
                const firstSizeFee = (method.size_fees as any)[sizeFeeKeys[0]];
                return firstSizeFee?.area_fees?.[area] || 0;
              }
            }
            return 0;
          }
          return 0;
        };

        const getBoxes = (method: ShippingMethod, quantity: number): number => {
          // 簡易版：size_feesの先頭の max_items_per_box を使う。なければ1。
          let perBox = 1;
          if (method.fee_type === 'size' && method.size_fees) {
            const first = Object.values(method.size_fees)[0] as any;
            perBox = Number(first?.max_items_per_box || 1);
          }
          return Math.max(1, Math.ceil(quantity / perBox));
        };

        // 各商品の送料を計算（DBへの追加クエリなし）
        let totalShippingCost = 0;
        const shippingCostsByMethod: { [methodId: string]: number } = {};
        const shippingMethodById: Record<string, ShippingMethod> = Object.fromEntries(
          shippingMethods.map((m) => [m.id, m])
        );

        for (const item of cartItems) {
          const methodIds = productShippingMethodIds[item.product.id] || [];
          if (methodIds.length === 0) continue;

          // 複数ある場合は「その商品にとって最安」を採用（簡易）
          let best = Infinity;
          for (const mid of methodIds) {
            const method = shippingMethodById[mid];
            if (!method) continue;
            if (shippingCostsByMethod[mid] === undefined) {
              shippingCostsByMethod[mid] = getMethodCost(method);
            }
            const boxes = getBoxes(method, item.quantity);
            best = Math.min(best, shippingCostsByMethod[mid] * boxes);
          }
          if (best !== Infinity) {
            totalShippingCost += best;
          }
        }

        setCalculatedShippingCost(totalShippingCost);
        setShippingCalculationError(null);
      } catch (err) {
        console.error('送料計算エラー:', err);
        setCalculatedShippingCost(0);
        setShippingCalculationError('送料の計算に失敗しました');
      }
    };

    calculateShipping();
  }, [formData.postalCode, cartItems, shippingMethods, productShippingMethodIds]);

  // 注文は「決済前にドラフト作成」→「Webhookでpaid確定&在庫確定減算」へ移行

  // 認証成功時の処理
  const handleAuthSuccess = (email: string, userData: any) => {
    setIsAuthenticated(true);
    setAuthUser(userData);
    setFormData(prev => ({ ...prev, email }));
    
    // ログイン成功時にカートを確認し、空の場合はlocalStorageから復元を試みる
    const savedCart = localStorage.getItem('ikevege_cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (parsedCart.length > 0 && cartItems.length === 0) {
          // カートが空の場合、restoreCart関数でカートを復元
          console.log('ログイン成功後、カートを復元します:', parsedCart);
          restoreCart();
        }
      } catch (e) {
        console.error('カート復元エラー:', e);
      }
    }
  };

  // OAuthリダイレクト直後かどうかを判定するフラグ
  const [isOAuthRedirect, setIsOAuthRedirect] = useState(false);

  // カートが空の場合はホームにリダイレクト（OAuthリダイレクト直後は除く）
  useEffect(() => {
    // OAuthリダイレクト直後（URLにaccess_tokenが含まれている）の場合は、カート復元を待つ
    const hash = window.location.hash;
    if (hash && (hash.includes('access_token=') || hash.includes('type=recovery'))) {
      setIsOAuthRedirect(true);
      // OAuthリダイレクト直後は、カートの復元を待つため、少し遅延させる
      setTimeout(() => {
        setIsOAuthRedirect(false);
      }, 2000);
      return;
    }

    // OAuthリダイレクト直後でない場合のみ、カートが空ならリダイレクト
    if (cartItems.length === 0 && !isOAuthRedirect) {
      setLocation('/');
    }
  }, [cartItems.length, setLocation, isOAuthRedirect]);

  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.finalPrice ?? item.product.price;
    return sum + (price * item.quantity);
  }, 0);
  
  // 送料計算（郵便番号から自動計算、計算できない場合はデフォルト値）
  const shippingCost = calculatedShippingCost > 0 ? calculatedShippingCost : (formData.shippingMethod === 'express' ? 1000 : 500);
  const total = subtotal + shippingCost;

  // PaymentIntent 作成（ElementsにclientSecretを渡すため、ここで作る）
  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!isAuthenticated) return;
      if (!cartItems.length || total <= 0) return;
      if (paymentClientSecret && paymentIntentAmount === total && paymentIntentId) return;

      try {
        setPaymentInitError(null);
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: total,
            currency: 'jpy',
            metadata: {
              itemCount: String(cartItems.length),
              subtotal: String(subtotal),
              shippingCost: String(shippingCost),
              total: String(total),
            },
          }),
        });

        const responseText = await response.text();
        let responseData: any = null;
        if (responseText) {
          try {
            responseData = JSON.parse(responseText);
          } catch (e) {
            console.error('PaymentIntent JSONパースエラー:', e, responseText);
          }
        }

        if (!response.ok) {
          throw new Error(responseData?.error || responseText || 'PaymentIntentの作成に失敗しました');
        }

        const cs = responseData?.clientSecret;
        const piId = responseData?.paymentIntentId;
        if (!cs) throw new Error('clientSecretが取得できませんでした');
        if (!piId) throw new Error('paymentIntentIdが取得できませんでした');

        setPaymentClientSecret(cs);
        setPaymentIntentId(piId);
        setPaymentIntentAmount(total);
      } catch (e: any) {
        console.error('PaymentIntent初期化エラー:', e);
        setPaymentClientSecret(null);
        setPaymentIntentId(null);
        setPaymentIntentAmount(null);
        setPaymentInitError(e?.message || '決済の初期化に失敗しました');
      }
    };

    createPaymentIntent();
  }, [isAuthenticated, cartItems.length, total, subtotal, shippingCost, paymentClientSecret, paymentIntentAmount, paymentIntentId]);

  // 注文ドラフトを作成/更新（Webhookが参照するため、決済前にDBへ保存）
  useEffect(() => {
    const upsertOrderDraft = async () => {
      if (!supabase || !authUser) return;
      if (!paymentIntentId) return;
      if (!cartItems.length || total <= 0) return;

      try {
        // プロフィールは先に保存（次回のため）
        await supabase.from('profiles').upsert({
          id: authUser.id,
          email: authUser.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          postal_code: formData.postalCode,
          prefecture: formData.prefecture,
          city: formData.city,
          address: formData.address,
          building: formData.building,
          country: 'JP',
          updated_at: new Date().toISOString(),
        });

        const orderData = {
          auth_user_id: authUser.id,
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          shipping_address: `${formData.prefecture}${formData.city}${formData.address}${formData.building ? ' ' + formData.building : ''}`,
          shipping_city: formData.city,
          shipping_postal_code: formData.postalCode,
          shipping_country: 'JP',
          shipping_method: formData.shippingMethod,
          subtotal: subtotal,
          shipping_cost: shippingCost,
          total: total,
          payment_status: 'pending',
          payment_intent_id: paymentIntentId,
          order_status: 'pending',
          updated_at: new Date().toISOString(),
        };

        const { data: order, error: orderErr } = await supabase
          .from('orders')
          .upsert([orderData], { onConflict: 'payment_intent_id' })
          .select('id')
          .single();

        if (orderErr) throw orderErr;
        if (!order?.id) return;

        // 明細を作り直す（同一PaymentIntentで再計算/再作成があり得るため）
        await supabase.from('order_items').delete().eq('order_id', order.id);

        const orderItems = cartItems.map((item) => {
          const unitPrice = item.finalPrice ?? item.product.price;
          return {
            order_id: order.id,
            product_id: item.product.id,
            product_title: item.product.title,
            product_price: unitPrice,
            product_image: item.product.image,
            variant: item.variant ?? null,
            selected_options: item.selectedOptions ?? null,
            quantity: item.quantity,
            line_total: unitPrice * item.quantity,
          };
        });

        const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
        if (itemsErr) throw itemsErr;
      } catch (e) {
        console.error('注文ドラフト作成/更新エラー:', e);
      }
    };

    upsertOrderDraft();
  }, [supabase, authUser, paymentIntentId, cartItems, total, subtotal, shippingCost, formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 郵便番号から住所を検索
  const handlePostalCodeSearch = async () => {
    if (!formData.postalCode) {
      setPostalCodeError('郵便番号を入力してください');
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

        // 都道府県から送料を再計算
        const area = getAreaFromPrefecture(prefecture);
        if (area) {
          // 送料計算をトリガー（useEffectが自動で実行される）
        }
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
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="postalCode"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handlePostalCodeSearch();
                            }
                          }}
                          required
                          className="flex-1 px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                          placeholder="123-4567"
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

                    <div>
                      <label htmlFor="prefecture" className="block text-sm font-medium text-gray-700 mb-2">
                        都道府県
                      </label>
                      <input
                        type="text"
                        id="prefecture"
                        name="prefecture"
                        value={formData.prefecture}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                        placeholder="東京都"
                      />
                    </div>

                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                        市区町村
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                        placeholder="渋谷区"
                      />
                    </div>

                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                        町名・番地
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                        placeholder="神南1-2-3"
                      />
                    </div>

                    <div>
                      <label htmlFor="building" className="block text-sm font-medium text-gray-700 mb-2">
                        建物名・部屋番号
                      </label>
                      <input
                        type="text"
                        id="building"
                        name="building"
                        value={formData.building}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                        placeholder="マンション名 101号室"
                      />
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

                      {paymentInitError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                          {paymentInitError}
                        </div>
                      )}

                      {paymentClientSecret ? (
                        <Elements
                          stripe={stripePromise}
                          options={{ clientSecret: paymentClientSecret, locale: 'ja' }}
                          key={paymentClientSecret}
                        >
                          <CheckoutForm
                            formData={formData}
                            total={total}
                            clientSecret={paymentClientSecret}
                            onSuccess={handleSuccess}
                          />
                        </Elements>
                      ) : (
                        <div className="border border-gray-200 p-6 rounded bg-gray-50">
                          <p className="text-sm text-gray-500">決済システムを初期化中...</p>
                          <p className="text-xs text-gray-400 mt-2">
                            ※少し待っても表示されない場合は、ページを再読み込みしてください
                          </p>
                        </div>
                      )}
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
                              ¥{((item.finalPrice ?? item.product.price) * item.quantity).toLocaleString()}
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
