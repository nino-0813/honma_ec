
import React, { useState, useEffect, useContext } from 'react';
import { useRoute, Link } from 'wouter';
import { products } from '../data/products';
import { Product } from '../types';
import { IconChevronDown } from '../components/Icons';
import { FadeInImage, LoadingButton } from '../components/UI';
import { CartContext } from '../App';

const ProductDetail = () => {
  const [match, params] = useRoute<{ handle?: string }>("/products/:handle");
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeAccordion, setActiveAccordion] = useState<string | null>('desc');
  const { openCart } = useContext(CartContext);

  useEffect(() => {
    if (match && params && params.handle) {
      const found = products.find(p => p.handle === params.handle);
      setProduct(found || null);
      window.scrollTo(0, 0);
    }
  }, [match, params]);

  if (!product) return <div className="h-screen flex items-center justify-center text-sm text-gray-500">Loading...</div>;

  const toggleAccordion = (id: string) => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };

  return (
    <div className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-fade-in min-h-screen">
      {/* Breadcrumb */}
      <div className="text-[10px] text-gray-400 mb-8 md:mb-12 tracking-widest uppercase">
        <Link href="/"><a className="hover:text-black transition-colors">Home</a></Link>
        <span className="mx-2">/</span>
        <Link href="/collections"><a className="hover:text-black transition-colors">Collections</a></Link>
        <span className="mx-2">/</span>
        <span className="text-black">{product.title}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
        {/* Left: Image Gallery */}
        <div className="w-full lg:w-3/5">
          <div className="relative aspect-square bg-[#f4f4f4] overflow-hidden mb-4">
             {/* Main Image */}
             <div className="w-full h-full">
                <FadeInImage 
                    src={product.images[selectedImage]} 
                    alt={product.title} 
                    className="w-full h-full"
                    priority={true}
                />
             </div>
             {product.soldOut && (
                <span className="absolute top-4 left-4 bg-primary text-white px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase z-10">
                  Sold Out
                </span>
             )}
          </div>
          
          {/* Thumbnails */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {product.images.map((img, idx) => (
              <button 
                key={idx} 
                onClick={() => setSelectedImage(idx)}
                className={`relative w-20 h-20 flex-shrink-0 overflow-hidden border transition-all duration-300 ${selectedImage === idx ? 'border-black opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <FadeInImage src={img} alt="" className="w-full h-full" />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Product Info (Sticky on Desktop) */}
        <div className="w-full lg:w-2/5 lg:sticky lg:top-32 h-fit">
          <h1 className="text-xl md:text-2xl font-medium text-primary leading-relaxed tracking-wide mb-4">
            {product.title}
          </h1>
          
          <div className="flex items-baseline gap-4 mb-8 border-b border-gray-100 pb-8">
            <span className="text-xl md:text-2xl font-serif text-primary">
              ¥{product.price.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">税込</span>
          </div>

          {/* Actions */}
          <div className="space-y-6 mb-12">
             {!product.soldOut && (
               <div className="flex items-center justify-between border border-gray-200 p-1 max-w-[140px]">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black transition-colors"
                  >−</button>
                  <span className="text-sm font-serif w-8 text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black transition-colors"
                  >+</button>
               </div>
             )}

             {product.soldOut ? (
               <button 
                 disabled
                 className="w-full py-4 text-sm tracking-widest uppercase bg-gray-200 text-gray-400 cursor-not-allowed"
               >
                 Sold Out
               </button>
             ) : (
               <LoadingButton 
                 onClick={openCart}
                 className="w-full py-4 text-sm tracking-widest uppercase bg-primary text-white hover:bg-gray-800 hover:shadow-lg"
               >
                 カートに入れる
               </LoadingButton>
             )}
             
             <div className="text-xs text-gray-500 text-center underline cursor-pointer hover:text-black">
               送料・お支払いについて
             </div>
          </div>

          {/* Accordions */}
          <div className="border-t border-gray-200">
            {/* Description */}
            <div className="border-b border-gray-200">
              <button 
                onClick={() => toggleAccordion('desc')}
                className="w-full py-4 flex justify-between items-center text-sm font-medium tracking-wider hover:text-gray-600 transition-colors"
              >
                <span>アイテム説明</span>
                <IconChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeAccordion === 'desc' ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${activeAccordion === 'desc' ? 'max-h-[500px] opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
                <p className="text-sm leading-loose text-gray-600 font-light whitespace-pre-wrap">
                  {product.description}
                  <br/><br/>
                  ※自然栽培のため、粒の大きさや色味に多少のバラつきがある場合がございますが、品質には問題ございません。安心してお召し上がりください。
                </p>
              </div>
            </div>

            {/* Shipping */}
            <div className="border-b border-gray-200">
              <button 
                onClick={() => toggleAccordion('shipping')}
                className="w-full py-4 flex justify-between items-center text-sm font-medium tracking-wider hover:text-gray-600 transition-colors"
              >
                <span>配送について</span>
                <IconChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeAccordion === 'shipping' ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${activeAccordion === 'shipping' ? 'max-h-[200px] opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
                <p className="text-sm leading-loose text-gray-600 font-light">
                  通常、ご注文から3営業日以内に発送いたします。<br/>
                  ※天候や交通状況により遅れる場合がございます。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Related Products / Recommendations Section (Simplified for demo) */}
      <div className="mt-32">
         <h3 className="text-center text-lg font-serif tracking-[0.2em] mb-12">RECOMMEND</h3>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.filter(p => p.id !== product.id).slice(0, 4).map(rel => (
               <Link key={rel.id} href={`/products/${rel.handle}`}>
                  <a className="group block">
                    <div className="aspect-square bg-[#f4f4f4] overflow-hidden mb-3 relative">
                      <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                        <FadeInImage src={rel.image} alt={rel.title} className="w-full h-full" />
                      </div>
                    </div>
                    <h4 className="text-xs text-gray-600 line-clamp-1 group-hover:text-black">{rel.title}</h4>
                    <p className="text-xs font-serif mt-1">¥{rel.price.toLocaleString()}</p>
                  </a>
               </Link>
            ))}
         </div>
      </div>
    </div>
  );
};

export default ProductDetail;
