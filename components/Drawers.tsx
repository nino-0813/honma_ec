import React from 'react';
import { Link } from 'wouter';
import { IconClose, IconInstagram, IconYoutube } from './Icons';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  position?: 'left' | 'right';
}

const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, children, title, position = 'right' }) => {
  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Content */}
      <div 
        className={`fixed top-0 bottom-0 z-[70] w-full max-w-[350px] bg-white shadow-2xl transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
          position === 'right' 
            ? (isOpen ? 'translate-x-0 right-0' : 'translate-x-full right-0')
            : (isOpen ? 'translate-x-0 left-0' : '-translate-x-full left-0')
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-base font-serif tracking-wider font-medium">{title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <IconClose className="w-5 h-5 opacity-60" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export const CartDrawer = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Drawer isOpen={isOpen} onClose={onClose} title="カート">
    <div className="flex flex-col h-full justify-center items-center p-8 text-gray-400">
      <p className="mb-6 text-sm tracking-wider">カートに商品がありません</p>
      <button onClick={onClose} className="border-b border-black text-primary hover:text-gray-600 pb-1 text-sm tracking-widest transition-colors">
        買い物を続ける
      </button>
    </div>
  </Drawer>
);

export const MenuDrawer = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Drawer isOpen={isOpen} onClose={onClose} title="" position="right">
    <div className="flex flex-col px-8 py-6 gap-10">
      <nav className="flex flex-col gap-6 text-base font-serif tracking-widest">
        <Link href="/">
          <a 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }} 
            className="border-b border-gray-100 pb-3 hover:text-gray-500 transition-colors block"
          >
            HOME
          </a>
        </Link>
        <Link href="/about">
          <a 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }} 
            className="border-b border-gray-100 pb-3 hover:text-gray-500 transition-colors block"
          >
            ABOUT US
          </a>
        </Link>
        
        <div className="flex flex-col gap-4 border-b border-gray-100 pb-4">
          <span className="font-medium">CATEGORY</span>
          <div className="pl-4 flex flex-col gap-3 text-sm text-gray-500">
             <Link href="/collections">
               <a 
                 onClick={(e) => {
                   e.stopPropagation();
                   onClose();
                 }} 
                 className="hover:text-black transition-colors block py-1"
               >
                 ALL ITEMS
               </a>
             </Link>
             <Link href="/collections/rice">
               <a 
                 onClick={(e) => {
                   e.stopPropagation();
                   onClose();
                 }} 
                 className="hover:text-black transition-colors block py-1"
               >
                 お米
               </a>
             </Link>
             <Link href="/collections/crescent">
               <a 
                 onClick={(e) => {
                   e.stopPropagation();
                   onClose();
                 }} 
                 className="hover:text-black transition-colors block py-1"
               >
                 Crescentmoon
               </a>
             </Link>
             <Link href="/collections/other">
               <a 
                 onClick={(e) => {
                   e.stopPropagation();
                   onClose();
                 }} 
                 className="hover:text-black transition-colors block py-1"
               >
                 その他
               </a>
             </Link>
          </div>
        </div>

        <Link href="/ambassador">
          <a 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }} 
            className="border-b border-gray-100 pb-3 hover:text-gray-500 transition-colors block"
          >
            AMBASSADOR
          </a>
        </Link>
        <Link href="/contact">
          <a 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }} 
            className="border-b border-gray-100 pb-3 hover:text-gray-500 transition-colors block"
          >
            CONTACT
          </a>
        </Link>
        <a href="#" className="border-b border-gray-100 pb-3 hover:text-gray-500 transition-colors block">ログイン</a>
      </nav>

      <div className="flex gap-8 justify-center mt-4">
        <a href="#" className="text-primary hover:text-gray-500 transition-colors"><IconInstagram className="w-5 h-5" /></a>
        <a href="#" className="text-primary hover:text-gray-500 transition-colors"><IconYoutube className="w-5 h-5" /></a>
      </div>
    </div>
  </Drawer>
);