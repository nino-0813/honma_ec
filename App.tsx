
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
import Content from './pages/admin/Content';
import Market from './pages/admin/Market';
import Finance from './pages/admin/Finance';
import Analytics from './pages/admin/Analytics';
import Inquiries from './pages/admin/Inquiries';
import Reviews from './pages/admin/Reviews';
import CustomerSupport from './pages/admin/CustomerSupport';
import AdminLogin from './pages/admin/AdminLogin';
import BlogManagement from './pages/admin/BlogManagement';

// Cart Context
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity: number, variant?: string) => void;
  removeFromCart: (productId: string, variant?: string) => void;
  updateQuantity: (productId: string, quantity: number, variant?: string) => void;
  clearCart: () => void;
  openCart: () => void;
}

export const CartContext = createContext<CartContextType>({
  cartItems: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  openCart: () => {}
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
          finalPrice: newCart[existingItemIndex].finalPrice ?? price
        };
        return newCart;
      }
      return [...prev, { product, quantity, variant, finalPrice: price }];
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
      
      // バリエーションがある場合、選択されたオプションを再構築
      // 注意: variant文字列からselectedOptionsを再構築するのは難しいため、
      // ここでは簡易的に在庫チェックをスキップするか、product.stockのみをチェック
      // より正確な実装には、CartItemにselectedOptionsも保存する必要がある
      if (item.product.hasVariants && item.product.variants_config && item.product.variants_config.length > 0) {
        // バリエーションがある場合、簡易的に基本在庫のみチェック
        const stock = item.product.stock ?? null;
        if (stock !== null && quantity > stock) {
          console.warn('在庫不足');
          return prev; // カートを更新しない
        }
      } else {
        // バリエーションがない場合
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

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, openCart }}>
      <div className="min-h-screen bg-white flex flex-col font-serif font-medium tracking-widest text-primary selection:bg-black selection:text-white">
        <ScrollToTop />
        <Header 
          onOpenCart={() => setIsCartOpen(true)} 
          onOpenMenu={() => setIsMenuOpen(true)} 
        />
        
        <main className="flex-1">
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
        <Route path="/admin/orders" component={Orders} />
        <Route path="/admin/customers" component={Customers} />
        <Route path="/admin/discounts" component={Discounts} />
        <Route path="/admin/content" component={Content} />
        <Route path="/admin/market" component={Market} />
        <Route path="/admin/finance" component={Finance} />
        <Route path="/admin/analytics" component={Analytics} />
        <Route path="/admin/inquiries" component={Inquiries} />
        <Route path="/admin/reviews" component={Reviews} />
        <Route path="/admin/customer-support" component={CustomerSupport} />
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
        setTimeout(() => {
          window.location.hash = redirectPath;
          localStorage.removeItem('auth_redirect');
        }, 500);
      }
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
