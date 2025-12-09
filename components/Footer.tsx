import React from 'react';
import { Link } from 'wouter';
import { IconInstagram, IconYoutube } from './Icons';

const Footer = () => {
  return (
    <footer className="bg-[#1a1a1a] text-white pt-16 pb-8 md:pt-20 md:pb-12">
      <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          
          {/* Menu 1 */}
          <div className="text-left">
            <ul className="space-y-4 text-xs tracking-[0.2em] text-gray-300 font-medium">
              <li><Link href="/"><a className="hover:text-white transition-colors">HOME</a></Link></li>
              <li><Link href="/about"><a className="hover:text-white transition-colors">ABOUT US</a></Link></li>
              <li><Link href="/collections"><a className="hover:text-white transition-colors">CATEGORY</a></Link></li>
              <li><Link href="/ambassador"><a className="hover:text-white transition-colors">AMBASSADOR</a></Link></li>
              <li><Link href="/contact"><a className="hover:text-white transition-colors">CONTACT</a></Link></li>
            </ul>
          </div>

          {/* Menu 2 */}
          <div className="text-left">
            <ul className="space-y-4 text-xs tracking-[0.15em] text-gray-400">
              <li><Link href="/legal"><a className="hover:text-white transition-colors">特定商取引法に基づく表記</a></Link></li>
              <li><Link href="/terms"><a className="hover:text-white transition-colors">利用規約</a></Link></li>
              <li><Link href="/faq"><a className="hover:text-white transition-colors">よくあるご質問</a></Link></li>
              <li><Link href="/contact"><a className="hover:text-white transition-colors">お問い合わせ</a></Link></li>
            </ul>
          </div>

          {/* Social & Copyright */}
          <div className="flex flex-col items-center md:items-end gap-8">
             <div className="flex gap-6">
                <a 
                  href="https://www.instagram.com/ikevege_official?igsh=MXg1amN3bWZjMHZuaQ%3D%3D&utm_source=qr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white hover:text-gray-400 transition-colors"
                >
                  <IconInstagram className="w-5 h-5" />
                </a>
                <a href="#" className="text-white hover:text-gray-400 transition-colors">
                  <IconYoutube className="w-5 h-5" />
                </a>
             </div>
             <div className="text-center md:text-right">
                <p className="text-[10px] tracking-widest text-gray-600 leading-relaxed">
                  &copy; {new Date().getFullYear()} IKEVEGE
                </p>
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;