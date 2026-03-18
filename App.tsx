import React, { useState, useEffect, createContext, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { CartDrawer, MenuDrawer } from './components/Drawers';
import { Product, CartItem } from './types';
import { checkStockAvailability } from './lib/supabase';

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
  </div>
);

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

// Scroll to top: 画面遷移時にトップへ
const ScrollToTop = () => {
  const { pathname } = useLocation();
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
    if (typeof window === 'undefined') return [];
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
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>

        <Footer />

        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cartItems={cartItems} onRemove={removeFromCart} onUpdateQuantity={updateQuantity} />
        <MenuDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      </div>
    </CartContext.Provider>
  );
};

export default MainLayout;
