import React from 'react';
import { Link } from 'wouter';
import { Collection } from '../types';

const collections: Collection[] = [
  { id: '1', title: 'コシヒカリ', handle: 'koshihikari', image: '/images/home/collections/collection_koshihikari.png', path: '/collections/rice/koshihikari' },
  { id: '2', title: '亀の尾', handle: 'kamenoo', image: '/images/home/collections/collection_kamenoo.png', path: '/collections/rice/kamenoo' },
  { id: '3', title: 'にこまる', handle: 'nikomaru', image: '/images/home/collections/collection_nikomaru.png', path: '/collections/rice/nikomaru' },
  { id: '4', title: '年間契約', handle: 'yearly', image: '/images/home/collections/collection_nenkankeiyaku.png', path: '/collections/rice/yearly' },
];

const Collections = () => {
  return (
    <section className="py-8 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-0.5 bg-white md:bg-secondary">
        {collections.map((collection) => (
          <Link key={collection.id} href={collection.path || `/collections/rice/${collection.handle}`}>
            <a className="group relative overflow-hidden bg-gray-200 block aspect-[2.5/1] md:aspect-auto border border-gray-200/40 md:border-0">
              <img 
                src={collection.image} 
                alt={collection.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="eager"
                decoding="async"
              />
              {/* 四隅にグラデーションオーバーレイ */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {/* 左上 */}
                <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gradient-to-br from-black/15 to-transparent"></div>
                {/* 右上 */}
                <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-black/15 to-transparent"></div>
                {/* 左下 */}
                <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-black/15 to-transparent"></div>
                {/* 右下 */}
                <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-black/15 to-transparent"></div>
              </div>
              {/* 常時表示の四隅オーバーレイ（より軽く） */}
              <div className="absolute inset-0 pointer-events-none">
                {/* 左上 */}
                <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gradient-to-br from-black/8 to-transparent"></div>
                {/* 右上 */}
                <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-black/8 to-transparent"></div>
                {/* 左下 */}
                <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-black/8 to-transparent"></div>
                {/* 右下 */}
                <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-black/8 to-transparent"></div>
                {/* 下部に暗いオーバーレイ（白文字を見やすくするため） */}
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
              <div className="absolute inset-0 flex items-end justify-start p-4 md:p-6 z-10">
                <h3 className="text-white text-lg md:text-xl font-serif tracking-wider font-bold relative inline-block drop-shadow-lg max-w-[90%]">
                  {collection.title}
                  <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                </h3>
              </div>
            </a>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default Collections;