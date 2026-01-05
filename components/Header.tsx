
import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'wouter';
import { IconBag, IconSearch, IconMenu, IconUser, IconChevronDown } from './Icons';
import { CartContext } from '../App';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  onOpenCart: () => void;
  onOpenMenu: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenCart, onOpenMenu }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [location] = useLocation();
  const { cartItems } = useContext(CartContext);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // カート内の商品の総数を計算
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };

    checkAuth();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsLoggedIn(!!session);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => {
    if (path === '/collections') {
      return location === '/collections' || location.startsWith('/collections/');
    }
    return location === path;
  };

  // ホームページかどうかを判定
  const isHomePage = location === '/';

  return (
    <header 
      className={`fixed top-0 w-full z-50 transition-all duration-500 border-b ${
        isScrolled ? 'bg-white/95 backdrop-blur-md py-3 md:py-[15px] border-secondary shadow-sm' : 'bg-transparent py-[15px] border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center z-50">
            <Link href="/">
              <a className="hover:opacity-70 transition-opacity block">
                <img 
                  src="/images/logo.png" 
                  alt="IKEVEGE" 
                  className={`w-auto object-contain transition-all duration-500 ${
                    isScrolled ? 'h-12 md:h-20' : 'h-6 md:h-10'
                  }`}
                />
              </a>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-10 items-center">
            <Link href="/">
              <a className={`text-sm font-medium tracking-[0.15em] transition-colors relative group ${
                isActive('/') 
                  ? (isHomePage && !isScrolled ? 'text-white' : 'text-black') 
                  : (isHomePage && !isScrolled ? 'text-white hover:text-white/80' : 'text-gray-500 hover:text-black')
              }`}>
                HOME
                <span className={`absolute -bottom-2 left-0 w-full h-px ${isHomePage && !isScrolled ? 'bg-white' : 'bg-black'} transition-transform duration-300 origin-left ${isActive('/') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
              </a>
            </Link>
            <Link href="/about">
              <a className={`text-sm font-medium tracking-[0.15em] transition-colors relative group ${
                isActive('/about') 
                  ? (isHomePage && !isScrolled ? 'text-white' : 'text-black') 
                  : (isHomePage && !isScrolled ? 'text-white hover:text-white/80' : 'text-gray-500 hover:text-black')
              }`}>
                ABOUT US
                <span className={`absolute -bottom-2 left-0 w-full h-px ${isHomePage && !isScrolled ? 'bg-white' : 'bg-black'} transition-transform duration-300 origin-left ${isActive('/about') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
              </a>
            </Link>
            <div className="relative group h-full flex items-center cursor-pointer">
              <Link href="/collections">
                <a className={`text-sm font-medium tracking-[0.15em] transition-colors ${
                  isActive('/collections') 
                    ? (isHomePage && !isScrolled ? 'text-white' : 'text-black') 
                    : (isHomePage && !isScrolled ? 'text-white group-hover:text-white/80' : 'text-gray-500 group-hover:text-black')
                }`}>
                  CATEGORY
                </a>
              </Link>
              <div className="absolute left-1/2 -translate-x-1/2 top-full pt-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out transform group-hover:translate-y-0 translate-y-2">
                <div className="bg-white border border-gray-100 shadow-xl p-6 min-w-[240px] flex flex-col gap-4 text-center rounded-sm">
                  <Link href="/collections"><a className="text-xs tracking-widest text-gray-500 hover:text-black transition-colors">ALL ITEMS</a></Link>
                  <Link href="/collections/rice"><a className="text-xs tracking-widest text-gray-500 hover:text-black transition-colors">お米</a></Link>
                  <Link href="/collections/crescent"><a className="text-xs tracking-widest text-gray-500 hover:text-black transition-colors">Crescentmoon</a></Link>
                  <Link href="/collections/other"><a className="text-xs tracking-widest text-gray-500 hover:text-black transition-colors">その他</a></Link>
                </div>
              </div>
            </div>
            <Link href="/blog">
              <a className={`text-sm font-medium tracking-[0.15em] transition-colors relative group ${
                isActive('/blog') 
                  ? (isHomePage && !isScrolled ? 'text-white' : 'text-black') 
                  : (isHomePage && !isScrolled ? 'text-white hover:text-white/80' : 'text-gray-500 hover:text-black')
              }`}>
                BLOG
                <span className={`absolute -bottom-2 left-0 w-full h-px ${isHomePage && !isScrolled ? 'bg-white' : 'bg-black'} transition-transform duration-300 origin-left ${isActive('/blog') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
              </a>
            </Link>
            <Link href="/ambassador">
              <a className={`text-sm font-medium tracking-[0.15em] transition-colors relative group ${
                isActive('/ambassador') 
                  ? (isHomePage && !isScrolled ? 'text-white' : 'text-black') 
                  : (isHomePage && !isScrolled ? 'text-white hover:text-white/80' : 'text-gray-500 hover:text-black')
              }`}>
                JOIN US
                <span className={`absolute -bottom-2 left-0 w-full h-px ${isHomePage && !isScrolled ? 'bg-white' : 'bg-black'} transition-transform duration-300 origin-left ${isActive('/ambassador') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
              </a>
            </Link>
            <Link href="/contact">
              <a className={`text-sm font-medium tracking-[0.15em] transition-colors relative group ${
                isActive('/contact') 
                  ? (isHomePage && !isScrolled ? 'text-white' : 'text-black') 
                  : (isHomePage && !isScrolled ? 'text-white hover:text-white/80' : 'text-gray-500 hover:text-black')
              }`}>
                CONTACT
                <span className={`absolute -bottom-2 left-0 w-full h-px ${isHomePage && !isScrolled ? 'bg-white' : 'bg-black'} transition-transform duration-300 origin-left ${isActive('/contact') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
              </a>
            </Link>
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-5 sm:gap-6">
            <Link href="/account">
              <a className={`hidden sm:block transition-colors ${
                isHomePage && !isScrolled ? 'text-white hover:text-white/80' : 'text-primary hover:text-gray-500'
              }`} title={isLoggedIn ? 'マイページ' : 'ログイン'}>
                <IconUser className="w-5 h-5" />
              </a>
            </Link>
            <button className={`transition-colors ${
              isHomePage && !isScrolled ? 'text-white hover:text-white/80' : 'text-primary hover:text-gray-500'
            }`}>
              <IconSearch className="w-5 h-5" />
            </button>
            <button onClick={onOpenCart} className={`transition-colors relative ${
              isHomePage && !isScrolled ? 'text-white hover:text-white/80' : 'text-primary hover:text-gray-500'
            }`}>
              <IconBag className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px] font-medium w-4 h-4 flex items-center justify-center rounded-full">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </button>
            <button onClick={onOpenMenu} className={`md:hidden transition-colors ${
              isHomePage && !isScrolled ? 'text-white hover:text-white/80' : 'text-primary hover:text-gray-500'
            }`}>
              <IconMenu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
