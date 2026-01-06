import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'wouter';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CartContext } from '../App';
import { FadeInImage } from '../components/UI';
import Header from '../components/Header';
import AuthForm from '../components/AuthForm';
import { supabase, checkStockAvailability } from '../lib/supabase';
import { ShippingMethod, AreaFees } from '../types';

// Stripe公開可能キー（環境変数から取得）
// NOTE: 未設定だとPaymentElementが無言で出ないことがあるため、フォールバック文字列は使わない
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

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
// NOTE: 送料テーブルの地域キーは運用で変遷しやすい（旧: north_tohoku/kanto... 新: kitatohoku/kanto_area...）
//       Checkout側は両方に対応して「0円」にならないようにする。
const getAreaFromPrefecture = (prefecture: string): keyof AreaFees | null => {
  if (!prefecture) return null;
  
  if (prefecture === '北海道') return 'hokkaido';
  // 新地域区分（ShippingMethodEditorのキーに合わせる）
  if (['青森県', '秋田県', '岩手県'].includes(prefecture)) return 'kitatohoku' as any;
  if (['宮城県', '山形県', '福島県'].includes(prefecture)) return 'minamitohoku' as any;
  if (['東京都', '神奈川県', '山梨県', '千葉県', '茨城県', '栃木県', '群馬県', '埼玉県'].includes(prefecture)) return 'kanto_area' as any;
  if (['新潟県', '長野県'].includes(prefecture)) return 'shinetsu';
  if (['富山県', '石川県', '福井県'].includes(prefecture)) return 'hokuriku';
  if (['静岡県', '愛知県', '三重県', '岐阜県'].includes(prefecture)) return 'chubu_area' as any;
  if (['大阪府', '京都府', '滋賀県', '奈良県', '和歌山県', '兵庫県'].includes(prefecture)) return 'kansai_area' as any;
  if (['岡山県', '広島県', '山口県', '鳥取県', '島根県'].includes(prefecture)) return 'chugoku_area' as any;
  if (['香川県', '徳島県', '愛媛県', '高知県'].includes(prefecture)) return 'shikoku_area' as any;
  if (['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県'].includes(prefecture)) return 'kyushu_area' as any;
  if (prefecture === '沖縄県') return 'okinawa_area' as any;
  
  return null;
};

const AREA_KEY_COMPAT: Record<string, string> = {
  // new -> old
  kitatohoku: 'north_tohoku',
  minamitohoku: 'south_tohoku',
  kanto_area: 'kanto',
  chubu_area: 'chubu',
  kansai_area: 'kansai',
  chugoku_area: 'chugoku',
  shikoku_area: 'shikoku',
  kyushu_area: 'kyushu',
  okinawa_area: 'okinawa',
  // old -> new
  north_tohoku: 'kitatohoku',
  south_tohoku: 'minamitohoku',
  kanto: 'kanto_area',
  chubu: 'chubu_area',
  kansai: 'kansai_area',
  chugoku: 'chugoku_area',
  shikoku: 'shikoku_area',
  kyushu: 'kyushu_area',
  okinawa: 'okinawa_area',
};

const getAreaFee = (fees: any, areaKey: string | null): number => {
  if (!fees || !areaKey) return 0;
  const direct = fees?.[areaKey];
  if (direct !== undefined && direct !== null) return Number(direct) || 0;
  const compat = AREA_KEY_COMPAT[areaKey];
  const alt = compat ? fees?.[compat] : undefined;
  if (alt !== undefined && alt !== null) return Number(alt) || 0;
  return 0;
};

type SizeBoxType = {
  size?: number;
  weight_kg?: number;
  cap: number;   // 1箱に入る数
  cost: number;  // 1箱あたりの送料（地域別）
};

type SizeFeePlan = {
  cost: number;
  boxes: Array<{ label: string; count: number; perBoxCost: number; cap: number }>;
};

// サイズ別送料（size_fees）で、qty個を送る最小送料と箱割りを求める
// - boxType: { max_items_per_box, area_fees } を1箱として扱う
// - 例: 100サイズ(5個/箱) + 60サイズ(1個/箱) など「混在」も最小化に含める
const getMinPlanForSizeFees = (sizeFees: any, qty: number, areaKey: string | null): SizeFeePlan => {
  const target = Math.max(0, Number(qty || 0));
  if (!sizeFees || target <= 0) return { cost: 0, boxes: [] };

  const boxTypes: SizeBoxType[] = [];
  for (const sf of Object.values(sizeFees as any)) {
    const cap = Math.max(1, Number((sf as any)?.max_items_per_box || 1));
    const cost = getAreaFee((sf as any)?.area_fees, areaKey);
    const size = (sf as any)?.size;
    const weight_kg = (sf as any)?.weight_kg;
    if (cost > 0) boxTypes.push({ size, weight_kg, cap, cost });
  }
  if (boxTypes.length === 0) return { cost: 0, boxes: [] };

  // dp[i] = i個送る最小送料（iは0..target）
  const dp = Array(target + 1).fill(Infinity) as number[];
  const prev = Array(target + 1).fill(-1) as number[];
  const prevBoxIdx = Array(target + 1).fill(-1) as number[];
  dp[0] = 0;
  for (let i = 0; i <= target; i++) {
    if (!Number.isFinite(dp[i])) continue;
    for (let b = 0; b < boxTypes.length; b++) {
      const bt = boxTypes[b];
      const next = Math.min(target, i + bt.cap);
      const cand = dp[i] + bt.cost;
      if (cand < dp[next]) {
        dp[next] = cand;
        prev[next] = i;
        prevBoxIdx[next] = b;
      }
    }
  }
  if (!Number.isFinite(dp[target])) return { cost: 0, boxes: [] };

  // reconstruct
  const counts = new Map<number, number>(); // boxIdx -> count
  let cur = target;
  while (cur > 0 && prev[cur] !== -1 && prevBoxIdx[cur] !== -1) {
    const bi = prevBoxIdx[cur];
    counts.set(bi, (counts.get(bi) || 0) + 1);
    cur = prev[cur];
  }

  const boxes: SizeFeePlan['boxes'] = [];
  for (const [bi, count] of counts.entries()) {
    const bt = boxTypes[bi];
    const label = bt.size ? `${bt.size}サイズ` : 'サイズ別';
    boxes.push({ label, count, perBoxCost: bt.cost, cap: bt.cap });
  }
  // size順に並べる（見やすさ）
  boxes.sort((a, b) => {
    const an = Number(String(a.label).replace(/[^0-9]/g, '') || 0);
    const bn = Number(String(b.label).replace(/[^0-9]/g, '') || 0);
    return an - bn;
  });

  return { cost: dp[target], boxes };
};

const resolvePrefectureForShipping = (formData: any): string | null => {
  // 住所検索（Zipcloud）で入ってきた都道府県を最優先（郵便番号テーブルは網羅できないため）
  if (formData?.prefecture && String(formData.prefecture).trim().length > 0) {
    return String(formData.prefecture).trim();
  }
  if (formData?.postalCode) {
    return getPrefectureFromPostalCode(String(formData.postalCode));
  }
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
  const [paymentElementReady, setPaymentElementReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 住所/連絡先の必須項目（このフォームは配送先入力とは別なので、ここで必須チェックする）
    const hasRequired =
      Boolean(formData.email && String(formData.email).length > 3) &&
      Boolean(formData.firstName && String(formData.firstName).trim().length > 0) &&
      Boolean(formData.lastName && String(formData.lastName).trim().length > 0) &&
      Boolean(formData.postalCode && String(formData.postalCode).replace(/[^0-9]/g, '').length === 7) &&
      Boolean(formData.prefecture && String(formData.prefecture).trim().length > 0) &&
      Boolean(formData.city && String(formData.city).trim().length > 0) &&
      Boolean(formData.address && String(formData.address).trim().length > 0);
    if (!hasRequired) {
      setError('配送先住所（郵便番号・都道府県・市区町村・町名・番地）と氏名/メールを入力してください');
      return;
    }

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
        {!paymentElementReady && (
          <div className="text-sm text-gray-500 mb-3">決済フォームを読み込み中...</div>
        )}
        <PaymentElement
          onReady={() => setPaymentElementReady(true)}
          onLoadError={(e) => {
            console.error('PaymentElement load error:', e);
            setError('決済フォームの読み込みに失敗しました（Stripe設定を確認してください）');
          }}
        />
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
    shippingMethod: '', // 互換用（旧仕様）。現在は自動割り当てのため選択不要。
    deliveryTimeSlot: '', // 配送時間希望
    notes: '' // 備考
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
  const [paymentIntentLivemode, setPaymentIntentLivemode] = useState<boolean | null>(null);
  const [paymentIntentSecretKeyPrefix, setPaymentIntentSecretKeyPrefix] = useState<string | null>(null);
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
        // 都道府県を判定（prefecture入力を優先）
        const prefecture = resolvePrefectureForShipping(formData);
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

        // 1つの発送方法が「その商品(quantity)」に対していくらになるかを計算
        // sizeの場合は size_fees を使って「箱の分割（混在含む）」まで最小化する
        const getMethodCostForQuantity = (method: ShippingMethod, quantity: number): number => {
          if (method.fee_type === 'uniform') {
            return Number(method.uniform_fee || 0);
          }
          if (method.fee_type === 'area') {
            return getAreaFee(method.area_fees, area as any);
          }
          if (method.fee_type === 'size' && method.size_fees) {
            return getMinPlanForSizeFees(method.size_fees, quantity, area as any).cost;
          }
          return 0;
        };

        // 各商品の送料を計算（DBへの追加クエリなし）
        let totalShippingCost = 0;
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
            const cost = getMethodCostForQuantity(method, item.quantity);
            if (cost > 0) {
              best = Math.min(best, cost);
            }
          }
          if (best !== Infinity) {
            totalShippingCost += best;
          }
        }

        setCalculatedShippingCost(totalShippingCost);
        setShippingCalculationError(null);
        
        // NOTE: 配送方法はユーザーが明示的に選ぶ（自動選択しない）
      } catch (err) {
        console.error('送料計算エラー:', err);
        setCalculatedShippingCost(0);
        setShippingCalculationError('送料の計算に失敗しました');
      }
    };

    calculateShipping();
  }, [formData.postalCode, cartItems, shippingMethods, productShippingMethodIds, formData.shippingMethod]);

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
  
  // カート内の全商品に紐づく発送方法の和集合を取得
  const availableShippingMethods = useMemo(() => {
    const methodIds = new Set<string>();
    cartItems.forEach(item => {
      const linkedIds = productShippingMethodIds[item.product.id] || [];
      linkedIds.forEach(id => methodIds.add(id));
    });
    return shippingMethods.filter(m => methodIds.has(m.id));
  }, [cartItems, shippingMethods, productShippingMethodIds]);

  const shippingPlan = useMemo(() => {
    const empty = {
      totalCost: 0,
      byMethod: {} as Record<string, { cost: number; itemsText: string; sizeBreakdownText?: string }>,
    };

    if (!formData.postalCode || cartItems.length === 0 || shippingMethods.length === 0) return empty;

    const prefecture = resolvePrefectureForShipping(formData);
    const areaKey = prefecture ? getAreaFromPrefecture(prefecture) : null;
    if (!areaKey) return empty;

    const shippingMethodById: Record<string, ShippingMethod> = Object.fromEntries(
      shippingMethods.map((m) => [m.id, m])
    );

    const getMethodCostForQuantity = (m: ShippingMethod, quantity: number): number => {
      if (m.fee_type === 'uniform') return Number(m.uniform_fee || 0);
      if (m.fee_type === 'area') return getAreaFee(m.area_fees, areaKey as any);
      if (m.fee_type === 'size' && m.size_fees) {
        return getMinPlanForSizeFees(m.size_fees, quantity, areaKey as any).cost;
      }
      return 0;
    };

    // 1) 各商品を「どの発送方法で送るか」に割り当て（選択されたshippingMethodがあれば優先）
    const assigned: Record<string, Array<{ title: string; qty: number }>> = {};
    for (const item of cartItems) {
      const linkedIds = productShippingMethodIds[item.product.id] || [];
      if (linkedIds.length === 0) continue;

      let chosenId: string | null = null;
      if (formData.shippingMethod && linkedIds.includes(formData.shippingMethod)) {
        chosenId = formData.shippingMethod;
      } else {
        // 最安の発送方法を選ぶ
        let best = Infinity;
        for (const mid of linkedIds) {
          const m = shippingMethodById[mid];
          if (!m) continue;
          const c = getMethodCostForQuantity(m, item.quantity);
          if (c > 0 && c < best) {
            best = c;
            chosenId = mid;
          }
        }
        // コストが取れない場合は先頭にフォールバック
        if (!chosenId) chosenId = linkedIds[0];
      }

      if (!assigned[chosenId]) assigned[chosenId] = [];
      assigned[chosenId].push({ title: item.product.title, qty: item.quantity });
    }

    // 2) 発送方法ごとに送料を計算（sizeは「その方法に割り当てられた数量合計」で箱割り）
    let totalCost = 0;
    const byMethod: Record<string, { cost: number; itemsText: string; sizeBreakdownText?: string }> = {};
    for (const methodId of Object.keys(assigned)) {
      const method = shippingMethodById[methodId];
      if (!method) continue;

      const items = assigned[methodId];
      const totalQty = items.reduce((s, it) => s + Number(it.qty || 0), 0);
      const itemsText = items
        .slice(0, 3)
        .map((it) => `${it.title}×${it.qty}`)
        .join(' / ') + (items.length > 3 ? ` (+${items.length - 3})` : '');

      let cost = 0;
      let sizeBreakdownText: string | undefined = undefined;
      if (method.fee_type === 'uniform') {
        cost = Number(method.uniform_fee || 0);
      } else if (method.fee_type === 'area') {
        cost = getAreaFee(method.area_fees, areaKey as any);
      } else if (method.fee_type === 'size' && method.size_fees) {
        const plan = getMinPlanForSizeFees(method.size_fees, totalQty, areaKey as any);
        cost = plan.cost;
        if (plan.boxes.length > 0) {
          sizeBreakdownText = plan.boxes.map(b => `${b.label}×${b.count}箱`).join(' + ');
        }
      }

      byMethod[methodId] = { cost, itemsText, sizeBreakdownText };
      totalCost += cost;
    }

    return { totalCost, byMethod };
  }, [
    formData.postalCode,
    formData.prefecture,
    formData.shippingMethod,
    cartItems,
    productShippingMethodIds,
    shippingMethods,
  ]);

  // 選択された発送方法の送料を計算
  const getShippingCostForMethod = (methodId: string): number => {
    if (!formData.postalCode) return 0;
    
    const prefecture = resolvePrefectureForShipping(formData);
    if (!prefecture) return 0;
    
    const area = getAreaFromPrefecture(prefecture);
    if (!area) return 0;

    const method = shippingMethods.find(m => m.id === methodId);
    if (!method) return 0;

    const getMethodCostForQuantity = (m: ShippingMethod, quantity: number): number => {
      if (m.fee_type === 'uniform') {
        return Number(m.uniform_fee || 0);
      } else if (m.fee_type === 'area') {
        return getAreaFee(m.area_fees, area as any);
      } else if (m.fee_type === 'size' && m.size_fees) {
        return getMinPlanForSizeFees(m.size_fees, quantity, area as any).cost;
      }
      return 0;
    };

    // 各商品に対して、選択された発送方法が適用可能かどうかを確認
    let totalCost = 0;
    for (const item of cartItems) {
      const linkedIds = productShippingMethodIds[item.product.id] || [];
      if (!linkedIds.includes(methodId)) {
        // この商品には選択された発送方法が適用できない → 最安の送料を使用
        let best = Infinity;
        for (const mid of linkedIds) {
          const m = shippingMethods.find(mm => mm.id === mid);
          if (!m) continue;
          const cost = getMethodCostForQuantity(m, item.quantity);
          if (cost > 0) best = Math.min(best, cost);
        }
        if (best !== Infinity) {
          totalCost += best;
        }
      } else {
        // 選択された発送方法が適用可能（サイズ別なら最安サイズを自動選択）
        const cost = getMethodCostForQuantity(method, item.quantity);
        totalCost += cost;
      }
    }
    return totalCost;
  };

  // 送料（複数口を想定して「方法ごとの合計」を表示）
  const shippingCost = shippingPlan.totalCost || 0;
  
  // デバッグ: 送料計算の状態を確認
  useEffect(() => {
    if (cartItems.length > 0) {
      console.log('[送料デバッグ]', {
        postalCode: formData.postalCode,
        prefecture: formData.prefecture,
        shippingMethodsCount: shippingMethods.length,
        productShippingMethodIds,
        shippingPlan,
        shippingCost,
      });
    }
  }, [formData.postalCode, formData.prefecture, shippingMethods, productShippingMethodIds, shippingPlan, shippingCost, cartItems]);
  
  // クーポン関連の状態
  const [couponCode, setCouponCode] = useState('');
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    name: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
  } | null>(null);
  
  // クーポン検証関数
  const validateCoupon = async (code: string) => {
    if (!code.trim()) {
      setCouponError('クーポンコードを入力してください');
      return;
    }
    
    if (!supabase || !authUser) {
      setCouponError('ログインが必要です');
      return;
    }
    
    setCouponValidating(true);
    setCouponError(null);
    
    try {
      // クーポンを取得（大文字・小文字を区別しない検索）
      const normalizedCode = code.trim();
      const { data: couponData, error: couponErr } = await supabase
        .rpc('get_coupon_by_code', { p_code: normalizedCode });
      
      const coupon = (Array.isArray(couponData) && couponData.length > 0 ? couponData[0] : null) as any;
      
      if (couponErr || !coupon) {
        setCouponError('クーポンコードが見つかりません');
        setAppliedCoupon(null);
        return;
      }
      
      // 有効期間チェック
      const now = new Date();
      if (coupon.starts_at && new Date(coupon.starts_at) > now) {
        setCouponError('このクーポンはまだ利用できません');
        setAppliedCoupon(null);
        return;
      }
      if (coupon.ends_at && new Date(coupon.ends_at) < now) {
        setCouponError('このクーポンの有効期限が切れています');
        setAppliedCoupon(null);
        return;
      }
      
      // 発行枚数制限チェック
      if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
        setCouponError('このクーポンの使用回数が上限に達しています');
        setAppliedCoupon(null);
        return;
      }
      
      // 最低購入金額チェック
      if (coupon.min_order_amount !== null && subtotal < coupon.min_order_amount) {
        setCouponError(`最低購入金額¥${coupon.min_order_amount.toLocaleString()}以上でご利用いただけます`);
        setAppliedCoupon(null);
        return;
      }
      
      // 1人1回制限チェック
      if (coupon.once_per_user) {
        const { data: existingOrder, error: orderErr } = await supabase
          .from('orders')
          .select('id')
          .eq('auth_user_id', authUser.id)
          .eq('coupon_id', coupon.id)
          .eq('payment_status', 'paid')
          .limit(1);
        
        if (!orderErr && existingOrder && existingOrder.length > 0) {
          setCouponError('このクーポンは既にご利用済みです');
          setAppliedCoupon(null);
          return;
        }
      }
      
      // 対象商品チェック（一部商品のみ対象の場合）
      if (!coupon.applies_to_all) {
        const { data: couponProducts, error: cpErr } = await supabase
          .from('coupon_products')
          .select('product_id')
          .eq('coupon_id', coupon.id);
        
        if (!cpErr && couponProducts) {
          const allowedProductIds = couponProducts.map(cp => cp.product_id);
          const cartProductIds = cartItems.map(item => item.product.id);
          const hasAllowedProduct = cartProductIds.some(id => allowedProductIds.includes(id));
          
          if (!hasAllowedProduct) {
            setCouponError('このクーポンは対象商品に適用できません');
            setAppliedCoupon(null);
            return;
          }
        }
      }
      
      // 検証成功
      setAppliedCoupon({
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
      });
      setCouponError(null);
    } catch (err: any) {
      console.error('クーポン検証エラー:', err);
      setCouponError(err.message || 'クーポンの検証に失敗しました');
      setAppliedCoupon(null);
    } finally {
      setCouponValidating(false);
    }
  };
  
  // 割引額を計算
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    
    if (appliedCoupon.discount_type === 'percentage') {
      // 割引率: 小計に対して適用（送料は対象外）
      return Math.floor(subtotal * appliedCoupon.discount_value / 100);
    } else {
      // 固定額: 小計から引く（ただし小計を超えない）
      return Math.min(appliedCoupon.discount_value, subtotal);
    }
  }, [appliedCoupon, subtotal]);
  
  const total = subtotal + shippingCost - discountAmount;

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
        const livemode = responseData?.livemode;
        const secretKeyPrefix = responseData?.secretKeyPrefix;
        if (!cs) throw new Error('clientSecretが取得できませんでした');
        if (!piId) throw new Error('paymentIntentIdが取得できませんでした');

        setPaymentClientSecret(cs);
        setPaymentIntentId(piId);
        if (typeof livemode === 'boolean') setPaymentIntentLivemode(livemode);
        if (typeof secretKeyPrefix === 'string') setPaymentIntentSecretKeyPrefix(secretKeyPrefix);
        setPaymentIntentAmount(total);
      } catch (e: any) {
        console.error('PaymentIntent初期化エラー:', e);
        setPaymentClientSecret(null);
        setPaymentIntentId(null);
        setPaymentIntentLivemode(null);
        setPaymentIntentSecretKeyPrefix(null);
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
        // 入力途中でRLSやバリデーションに弾かれるのを防ぐ（最低限の必須項目が揃ってから保存）
        const hasRequired =
          Boolean(formData.email && formData.email.length > 3) &&
          Boolean(formData.firstName && formData.firstName.trim().length > 0) &&
          Boolean(formData.lastName && formData.lastName.trim().length > 0) &&
          Boolean(formData.postalCode && formData.postalCode.replace(/[^0-9]/g, '').length === 7) &&
          Boolean(formData.city && formData.city.trim().length > 0) &&
          Boolean(formData.address && formData.address.trim().length > 0) &&
          Boolean(formData.prefecture && String(formData.prefecture).trim().length > 0);

        if (!hasRequired) return;

        // プロフィールは先に保存（次回のため）
        // NOTE: Supabase側の profiles に prefecture/building が無い環境があるため、
        //       ここでは確実に存在する列だけ保存する（エラー防止）
        await supabase.from('profiles').upsert({
          id: authUser.id,
          email: authUser.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          postal_code: formData.postalCode,
          city: formData.city,
          address: `${formData.prefecture}${formData.city}${formData.address}${formData.building ? ' ' + formData.building : ''}`,
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
          // 自動割り当て結果を保存（管理画面で確認できるようにする）
          shipping_method: JSON.stringify(
            Object.entries(shippingPlan.byMethod || {}).map(([id, v]) => ({
              shipping_method_id: id,
              cost: v.cost,
              items: v.itemsText,
              breakdown: v.sizeBreakdownText || null,
            }))
          ),
          subtotal: subtotal,
          shipping_cost: shippingCost,
          discount_amount: discountAmount,
          coupon_id: appliedCoupon?.id || null,
          total: total,
          payment_status: 'pending',
          payment_intent_id: paymentIntentId,
          order_status: 'pending',
          delivery_time_slot: formData.deliveryTimeSlot || null,
          notes: formData.notes || null,
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
  }, [supabase, authUser, paymentIntentId, cartItems, total, subtotal, shippingCost, discountAmount, appliedCoupon, formData, shippingPlan]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 郵便番号から住所を検索
  const handlePostalCodeSearch = async () => {
    if (!formData.postalCode) {
      setPostalCodeError('郵便番号を入力してください');
      return;
    }

    // 既に都道府県と市区町村が入力されている場合は、郵便番号検索をスキップ（プロフィールから自動入力された場合など）
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

                {/* 配送（自動割り当て / 選択不要） */}
                {availableShippingMethods.length > 0 && (
                  <div className="border-t border-gray-200 pt-6">
                    <h2 className="text-lg font-medium mb-4">配送</h2>
                    {!formData.postalCode ? (
                      <p className="text-sm text-gray-500">郵便番号を入力すると送料の詳細が表示されます</p>
                    ) : (
                      <div className="space-y-3">
                        {availableShippingMethods.map((method) => {
                          const methodPlan = shippingPlan.byMethod?.[method.id];
                          // その配送方法が今回の注文で使われない場合は表示しない（見やすさ）
                          if (!methodPlan) return null;

                          const methodCost = methodPlan.cost ?? 0;
                          const sizeBreakdownText = methodPlan.sizeBreakdownText ?? null;
                          const itemsText = methodPlan.itemsText ?? '';

                          return (
                            <div
                              key={method.id}
                              className="p-4 border border-gray-200 rounded"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="font-medium">{method.name}</div>
                                  {method.fee_type === 'size' && method.size_fees && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {Object.keys(method.size_fees).length}種類のサイズに対応
                                    </div>
                                  )}
                                </div>
                                <div className="font-serif whitespace-nowrap">
                                  ¥{methodCost.toLocaleString()}
                                </div>
                              </div>
                              {itemsText && (
                                <div className="text-xs text-gray-600 mt-2">
                                  対象商品: {itemsText}
                                </div>
                              )}
                              {sizeBreakdownText && (
                                <div className="text-xs text-gray-600 mt-1">
                                  内訳: {sizeBreakdownText}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 配送時間希望 */}
                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-lg font-medium mb-4">配送時間希望</h2>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deliveryTimeSlot"
                        value=""
                        checked={formData.deliveryTimeSlot === ''}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                      />
                      <span className="text-sm">時間帯 指定しない</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deliveryTimeSlot"
                        value="8~12時"
                        checked={formData.deliveryTimeSlot === '8~12時'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                      />
                      <span className="text-sm">8~12時</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deliveryTimeSlot"
                        value="14~16時"
                        checked={formData.deliveryTimeSlot === '14~16時'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                      />
                      <span className="text-sm">14~16時</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deliveryTimeSlot"
                        value="16~18時"
                        checked={formData.deliveryTimeSlot === '16~18時'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                      />
                      <span className="text-sm">16~18時</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deliveryTimeSlot"
                        value="18~20時"
                        checked={formData.deliveryTimeSlot === '18~20時'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                      />
                      <span className="text-sm">18~20時</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deliveryTimeSlot"
                        value="19~21時"
                        checked={formData.deliveryTimeSlot === '19~21時'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                      />
                      <span className="text-sm">19~21時</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    ※配送日は指定できません。何かご事情等ありましたら備考に記載いただければ幸いです。
                  </p>
                </div>

                {/* 備考欄 */}
                <div className="border-t border-gray-200 pt-6">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    備考
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors resize-none"
                    placeholder="ご要望やご質問がございましたらご記入ください"
                  />
                </div>
                  </div>

                  {/* Stripe決済フォーム（配送の選択は不要なので常時表示） */}
                  {isAuthenticated && (
                    <div className="border-t border-gray-200 pt-6">
                      <h2 className="text-lg font-medium mb-6">お支払い</h2>

                      {paymentInitError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                          {paymentInitError}
                        </div>
                      )}

                      {!STRIPE_PUBLISHABLE_KEY ? (
                        <div className="border border-red-200 bg-red-50 text-red-700 px-4 py-3 rounded">
                          Stripe公開可能キー（<code className="font-mono">VITE_STRIPE_PUBLISHABLE_KEY</code>）が未設定です。<br />
                          <span className="text-xs">
                            ※ <code className="font-mono">.env.local</code> を設定後、Viteを再起動してください
                          </span>
                        </div>
                      ) : paymentClientSecret ? (
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

                  {/* クーポン入力 */}
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium mb-3">クーポンコード</h3>
                    {appliedCoupon ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-900">{appliedCoupon.name}</p>
                            <p className="text-xs text-green-700">{appliedCoupon.code}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setAppliedCoupon(null);
                              setCouponCode('');
                              setCouponError(null);
                            }}
                            className="text-xs text-green-700 hover:text-green-900 underline"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              validateCoupon(couponCode);
                            }
                          }}
                          placeholder="クーポンコードを入力"
                          className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                        />
                        <button
                          type="button"
                          onClick={() => validateCoupon(couponCode)}
                          disabled={couponValidating || !couponCode.trim()}
                          className="px-4 py-2 text-sm bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {couponValidating ? '確認中...' : '適用'}
                        </button>
                      </div>
                    )}
                    {couponError && (
                      <p className="text-xs text-red-600 mt-2">{couponError}</p>
                    )}
                  </div>

                  {/* 合計 */}
                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">小計</span>
                      <span className="font-serif">¥{subtotal.toLocaleString()}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>割引</span>
                        <span className="font-serif">-¥{discountAmount.toLocaleString()}</span>
                      </div>
                    )}
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
    </div>
  );
};

export default Checkout;
