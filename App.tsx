
import React, { useState, useEffect, createContext } from 'react';
import { Route, Switch, useLocation, Router } from 'wouter';
import Header from './components/Header';
import Footer from './components/Footer';
import { CartDrawer, MenuDrawer } from './components/Drawers';
import Home from './pages/Home';
import About from './pages/About';
import Category from './pages/Category';
import ProductDetail from './pages/ProductDetail';
import Ambassador from './pages/Ambassador';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import ContactPage from './pages/ContactPage';
import Terms from './pages/Terms';
import FAQ from './pages/FAQ';
import LegalNotice from './pages/LegalNotice';
import Checkout from './pages/Checkout';
import MyPage from './pages/MyPage';
import { Product, CartItem } from './types';
import { checkStockAvailability } from './lib/supabase';
import Dashboard from './pages/admin/Dashboard';
import ProductList from './pages/admin/ProductList';
import ProductEditor from './pages/admin/ProductEditor';
import Orders from './pages/admin/Orders';
import Customers from './pages/admin/Customers';
import Discounts from './pages/admin/Discounts';
import CouponEditor from './pages/admin/CouponEditor';
import Content from './pages/admin/Content';
import Market from './pages/admin/Market';
import Finance from './pages/admin/Finance';
import Analytics from './pages/admin/Analytics';
import Inquiries from './pages/admin/Inquiries';
import Reviews from './pages/admin/Reviews';
import CustomerSupport from './pages/admin/CustomerSupport';
import AdminLogin from './pages/admin/AdminLogin';
import BlogManagement from './pages/admin/BlogManagement';
import BlogEditor from './pages/admin/BlogEditor';
import ShippingMethodManagement from './pages/admin/ShippingMethodManagement';
import ShippingMethodEditor from './pages/admin/ShippingMethodEditor';

// Cart Context
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity: number, variant?: string) => void;
  removeFromCart: (productId: string, variant?: string) => void;
  updateQuantity: (productId: string, quantity: number, variant?: string) => void;
  clearCart: () => void;
  openCart: () => void;
  restoreCart: () => void;
}

export const CartContext = createContext<CartContextType>({
  cartItems: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  openCart: () => {},
  restoreCart: () => {}
});

// --- Hash Location Hook for Sandboxed Environments ---
const useHashLocation = () => {
  const [loc, setLoc] = useState(window.location.hash.replace(/^#/, "") || "/");

  useEffect(() => {
    const handler = () => setLoc(window.location.hash.replace(/^#/, "") || "/");
    // Subscribe to hash changes
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const navigate = (to: string) => {
    window.location.hash = to;
  };

  return [loc, navigate] as [string, (to: string) => void];
};

// Scroll to top component ensuring navigation always starts at top
const ScrollToTop = () => {
  const [pathname] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

const MainLayout = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // カートの初期値をlocalStorageから取得
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('ikevege_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      console.error('カート情報の読み込みに失敗しました', e);
      return [];
    }
  });

  // カートが更新されたらlocalStorageに保存
  useEffect(() => {
    localStorage.setItem('ikevege_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // カートに商品を追加
  const addToCart = (product: Product, quantity: number, variant?: string, finalPrice?: number, selectedOptions?: Record<string, string>) => {
    // finalPriceが指定されていない場合は基本価格を使用
    const price = finalPrice ?? product.price;
    
    setCartItems(prev => {
      const existingItemIndex = prev.findIndex(item => 
        item.product.id === product.id && item.variant === variant
      );
      
      const currentCartQuantity = existingItemIndex > -1 ? prev[existingItemIndex].quantity : 0;
      const newQuantity = currentCartQuantity + quantity;
      
      // 在庫チェック（selectedOptionsが提供されている場合のみ）
      if (selectedOptions) {
        const stockCheck = checkStockAvailability(
          product,
          selectedOptions,
          newQuantity,
          0 // 既にcurrentCartQuantityを考慮しているので0
        );
        if (!stockCheck.available) {
          // エラーは呼び出し元で表示される想定
          console.warn('在庫不足:', stockCheck.message);
          return prev; // カートを更新しない
        }
      }
      
      if (existingItemIndex > -1) {
        const newCart = [...prev];
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: newQuantity,
          // 既存アイテムのfinalPriceを保持（価格変更を防ぐ）
          finalPrice: newCart[existingItemIndex].finalPrice ?? price,
          selectedOptions: newCart[existingItemIndex].selectedOptions ?? selectedOptions
        };
        return newCart;
      }
      return [...prev, { product, quantity, variant, finalPrice: price, selectedOptions }];
    });
  };

  // カートから商品を削除
  const removeFromCart = (productId: string, variant?: string) => {
    setCartItems(prev => prev.filter(item => !(item.product.id === productId && item.variant === variant)));
  };

  // 数量を更新
  const updateQuantity = (productId: string, quantity: number, variant?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variant);
      return;
    }
    
    setCartItems(prev => {
      const item = prev.find(i => i.product.id === productId && i.variant === variant);
      if (!item) return prev;

      // 在庫チェック（selectedOptionsがある場合は厳密に判定）
      const selectedOptions = item.selectedOptions;
      if (selectedOptions && Object.keys(selectedOptions).length > 0) {
        const stockCheck = checkStockAvailability(
          item.product,
          selectedOptions,
          quantity,
          0 // 絶対数量としてチェック
        );
        if (!stockCheck.available) {
          console.warn('在庫不足:', stockCheck.message);
          return prev; // カートを更新しない
        }
      } else {
        // バリエーション情報がない場合は基本在庫でチェック
        const stock = item.product.stock ?? null;
        if (stock !== null && quantity > stock) {
          console.warn('在庫不足');
          return prev; // カートを更新しない
        }
      }
      
      return prev.map(i =>
        (i.product.id === productId && i.variant === variant)
          ? { ...i, quantity }
          : i
      );
    });
  };

  // カートをクリア
  const clearCart = () => {
    setCartItems([]);
  };

  const openCart = () => setIsCartOpen(true);

  // カートをlocalStorageから復元する関数
  const restoreCart = () => {
    try {
      const savedCart = localStorage.getItem('ikevege_cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (parsedCart.length > 0) {
          setCartItems(parsedCart);
          console.log('カートを復元しました:', parsedCart);
        }
      }
    } catch (e) {
      console.error('カート復元エラー:', e);
    }
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, openCart, restoreCart }}>
      <div className="min-h-screen bg-white flex flex-col font-serif font-medium tracking-widest text-primary selection:bg-black selection:text-white overflow-x-hidden w-full">
        <ScrollToTop />
        <Header 
          onOpenCart={() => setIsCartOpen(true)} 
          onOpenMenu={() => setIsMenuOpen(true)} 
        />
        
        <main className="flex-1 w-full overflow-x-hidden">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/about" component={About} />
            <Route path="/collections/rice/:subcategory" component={Category} />
            <Route path="/collections/:category" component={Category} />
            <Route path="/collections" component={Category} />
            <Route path="/products/:handle" component={ProductDetail} /> 
            <Route path="/ambassador" component={Ambassador} />
            <Route path="/blog/:id" component={BlogDetail} />
            <Route path="/blog" component={Blog} />
            <Route path="/contact" component={ContactPage} />
            <Route path="/terms" component={Terms} />
            <Route path="/faq" component={FAQ} />
            <Route path="/legal" component={LegalNotice} />
            <Route path="/checkout" component={Checkout} />
            <Route path="/account" component={MyPage} />
            
            {/* Catch-all fallback */}
            <Route component={Home} />
          </Switch>
        </main>

        <Footer />

        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cartItems={cartItems} onRemove={removeFromCart} onUpdateQuantity={updateQuantity} />
        <MenuDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      </div>
    </CartContext.Provider>
  );
};

import AdminLayout from './pages/admin/AdminLayout'; // Import AdminLayout
import { useAdmin } from './hooks/useAdmin';

// ... (Cart Contextなどはそのまま)

// Admin Routes Wrapper
const AdminRoutes = () => {
  const { isAdmin, loading } = useAdmin();
  const [, setLocation] = useLocation();

  // Basic認証チェック（クライアントサイド）
  useEffect(() => {
    // ローカル開発環境では Basic認証をスキップ
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname.includes('localhost');
    
    if (isLocalhost) {
      // ローカル環境では Basic認証をスキップ
      return;
    }

    const currentPath = window.location.hash.replace('#', '');
    
    // `/admin/login` は Basic認証をスキップ
    if (currentPath === '/admin/login') {
      return;
    }

    // Basic認証のセッションをチェック
    const basicAuthPassed = sessionStorage.getItem('basic_auth_passed');
    if (basicAuthPassed === 'true') {
      return; // 既に認証済み
    }

    // 管理画面へのアクセスを検出した場合、`/admin` にリダイレクトして Basic認証を要求
    if (currentPath.startsWith('/admin')) {
      // サーバーサイドで Basic認証を要求するため、`/admin` にリダイレクト
      // 認証成功後、元のパスに戻る
      const returnPath = currentPath;
      sessionStorage.setItem('admin_return_path', returnPath);
      // フルページリロードでBasic認証を要求
      window.location.href = '/admin';
      return; // リダイレクト後は処理を終了
    }
  }, []);

  useEffect(() => {
    if (!loading && isAdmin === false) {
      // 管理者でない場合はログインページにリダイレクト
      const currentPath = window.location.hash.replace('#', '');
      if (currentPath !== '/admin/login') {
        setLocation('/admin/login');
      }
    }
  }, [isAdmin, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-500">認証を確認中...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // リダイレクト処理中
  }

  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin/products/new" component={ProductEditor} />
        <Route path="/admin/products/:handle" component={ProductEditor} />
        <Route path="/admin/products" component={ProductList} />
        <Route path="/admin/shipping-methods/new" component={ShippingMethodEditor} />
        <Route path="/admin/shipping-methods/:id" component={ShippingMethodEditor} />
        <Route path="/admin/shipping-methods" component={ShippingMethodManagement} />
        <Route path="/admin/orders" component={Orders} />
        <Route path="/admin/customers" component={Customers} />
        <Route path="/admin/discounts/new" component={CouponEditor} />
        <Route path="/admin/discounts/:id" component={CouponEditor} />
        <Route path="/admin/discounts" component={Discounts} />
        <Route path="/admin/content" component={Content} />
        <Route path="/admin/market" component={Market} />
        <Route path="/admin/finance" component={Finance} />
        <Route path="/admin/analytics" component={Analytics} />
        <Route path="/admin/inquiries" component={Inquiries} />
        <Route path="/admin/reviews" component={Reviews} />
        <Route path="/admin/customer-support" component={CustomerSupport} />
        <Route path="/admin/blog/new" component={BlogEditor} />
        <Route path="/admin/blog/:id" component={BlogEditor} />
        <Route path="/admin/blog" component={BlogManagement} />
        <Route path="/admin" component={Dashboard} />
        {/* Default to dashboard if no sub-route matches */}
        <Route component={Dashboard} />
      </Switch>
    </AdminLayout>
  );
};

function App() {
  // Routerの外側なので、直接window.location.hashを参照して判定
  // 注: これは初期レンダリング時のみ有効。動的な変更には追従しないが、
  // wouterのSwitchはマッチする最初のRouteをレンダリングするため、
  // /adminのRouteを先に書けば問題ない。
  
  useEffect(() => {
    // OAuthリダイレクト処理
    const hash = window.location.hash;
    if (hash && (hash.includes('access_token=') || hash.includes('type=recovery'))) {
      const redirectPath = localStorage.getItem('auth_redirect');
      if (redirectPath) {
        console.log('認証後のリダイレクトを実行:', redirectPath);
        
        // カートを確認し、空の場合はlocalStorageから復元を試みる
        const savedCart = localStorage.getItem('ikevege_cart');
        if (savedCart) {
          try {
            const parsedCart = JSON.parse(savedCart);
            if (parsedCart.length > 0) {
              console.log('OAuthリダイレクト後、カートを確認:', parsedCart);
              // カートは既にCartContextで読み込まれているはずだが、念のため確認
            }
          } catch (e) {
            console.error('カート復元エラー:', e);
          }
        }
        
        setTimeout(() => {
          window.location.hash = redirectPath;
          localStorage.removeItem('auth_redirect');
        }, 500);
      }
    }

    // Basic認証後のリダイレクト処理
    const adminReturnPath = sessionStorage.getItem('admin_return_path');
    // Basic認証が成功して`/admin`または`/`にリダイレクトされた場合
    // または、`/admin`に直接アクセスしてBasic認証が成功した場合
    if (adminReturnPath && (window.location.pathname === '/' || window.location.pathname === '/index.html' || window.location.pathname === '/admin')) {
      // Basic認証成功後、元のパスに戻る
      sessionStorage.setItem('basic_auth_passed', 'true');
      sessionStorage.removeItem('admin_return_path');
      // ハッシュルーティングを使用しているため、ハッシュでリダイレクト
      window.location.hash = adminReturnPath;
    } else if (window.location.pathname === '/admin' && !adminReturnPath) {
      // `/admin`に直接アクセスしてBasic認証が成功した場合
      // Basic認証が成功したことを示すフラグを設定
      sessionStorage.setItem('basic_auth_passed', 'true');
      // ハッシュルーティングを使用しているため、ハッシュでリダイレクト
      window.location.hash = '/admin';
    }
  }, []);

  return (
    <Router hook={useHashLocation}>
      <ScrollToTop />
      <Switch>
        {/* Admin Login */}
        <Route path="/admin/login" component={AdminLogin} />
        
        {/* Admin Pages - /admin以下はAdminRoutesで処理 */}
        <Route path="/admin/:rest*">
          <AdminRoutes />
        </Route>
        
        {/* Public Routes */}
        <Route component={MainLayout} />
      </Switch>
    </Router>
  );
}

export default App;
