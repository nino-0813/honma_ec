
import React from 'react';
import { Link } from 'wouter';
import { Product } from '../types';
import { products } from '../data/products';
import { FadeInImage } from './UI';

const ProductGrid = () => {
  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <p className="text-sm font-serif text-gray-500 mb-2 tracking-widest">IKEVEGE online</p>
        <h3 className="text-2xl font-serif uppercase tracking-widest border-b border-gray-300 inline-block pb-1">All Items</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
        {products.slice(0, 8).map((product, index) => (
          <Link key={product.id} href={`/products/${product.handle}`}>
            <a 
              className="group flex flex-col opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative aspect-square overflow-hidden bg-[#f9f9f9] mb-4">
                <div className="absolute top-2 left-2 z-20 flex flex-col gap-2">
                  {product.soldOut && (
                    <span className="bg-primary text-white px-3 py-1 text-[10px] font-bold tracking-wider uppercase shadow-sm">
                      Sold Out
                    </span>
                  )}
                  {product.title.includes('新米') && (
                    <span className="bg-white text-primary border border-primary px-3 py-1 text-[10px] font-bold tracking-widest uppercase shadow-sm">
                      新米
                    </span>
                  )}
                </div>

                {/* Main Image with FadeIn */}
                <div className="absolute inset-0 z-10 transition-opacity duration-700 ease-in-out group-hover:opacity-0">
                  <FadeInImage src={product.images[0]} alt={product.title} className="w-full h-full" />
                </div>
                
                {/* Secondary Image (Hover) */}
                <div className="absolute inset-0 z-0 transform scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out">
                   <FadeInImage src={product.images[1] || product.images[0]} alt={product.title} className="w-full h-full" />
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-2 text-center">
                <h3 className="text-sm font-medium text-primary leading-relaxed group-hover:text-gray-600 transition-colors line-clamp-2 min-h-[2.8em]">
                  {product.title}
                </h3>
                <p className="text-sm text-gray-900 font-serif tracking-wide">
                  ¥{product.price.toLocaleString()} {product.title.includes('〜') ? '〜' : ''}
                </p>
              </div>
            </a>
          </Link>
        ))}
      </div>

      <div className="text-center mt-16">
         <Link href="/collections">
           <a className="inline-block bg-primary text-white px-12 py-4 text-sm tracking-widest hover:bg-gray-800 transition-all duration-300 uppercase border border-transparent hover:shadow-lg">
             View All
           </a>
         </Link>
      </div>
    </section>
  );
};

export default ProductGrid;
