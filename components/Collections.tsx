import React from 'react';
import { Collection } from '../types';

const collections: Collection[] = [
  { id: '1', title: 'コシヒカリ', handle: 'koshihikari', image: '/images/home/collections/collection_koshihikari.png' },
  { id: '2', title: '亀の尾', handle: 'kamenoo', image: '/images/home/collections/collection_kamenoo.png' },
  { id: '3', title: 'にこまる', handle: 'nikomaru', image: '/images/home/collections/collection_nikomaru.png' },
  { id: '4', title: '年間契約', handle: 'yearly', image: '/images/home/collections/collection_nenkankeiyaku.png' },
];

const Collections = () => {
  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5 bg-secondary">
        {collections.map((collection) => (
          <a key={collection.id} href={`/collections/${collection.handle}`} className="group relative overflow-hidden bg-gray-200">
            <img 
              src={collection.image} 
              alt={collection.title} 
              className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-105"
              loading="eager"
              decoding="async"
            />
            <div className="absolute inset-0 flex items-end justify-start p-4 md:p-6">
              <h3 className="text-white text-lg md:text-xl font-serif tracking-wider font-bold relative inline-block drop-shadow-lg max-w-[90%]">
                {collection.title}
                <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
              </h3>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};

export default Collections;