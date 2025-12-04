import React, { useState } from 'react';
import { testimonials } from '../data/testimonials';
import { Star, User, Check, ThumbsUp, MessageCircle, BadgeCheck, Filter, X } from 'lucide-react';

const getAverageRating = () => {
  if (!testimonials.length) return 0;
  const sum = testimonials.reduce((acc, t) => acc + t.rating, 0);
  return Math.round((sum / testimonials.length) * 10) / 10;
};

const renderStars = (score: number, size: 'sm' | 'md' | 'lg' = 'md') => {
  const fullStars = Math.floor(score);
  const hasHalfStar = score % 1 >= 0.5;
  
  const starSize = size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';
  const gapSize = size === 'sm' ? 'gap-0.5' : 'gap-1';

  return (
    <div className={`flex items-center ${gapSize}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${starSize} ${
            i < fullStars 
              ? 'fill-[#d4c385] text-[#d4c385]'
              : i === fullStars && hasHalfStar
                ? 'fill-[#d4c385] text-[#d4c385] opacity-50' // 簡易的な半星
                : 'fill-gray-100 text-gray-200'
          }`}
        />
      ))}
    </div>
  );
};

const Testimonials = () => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  if (!testimonials.length) return null;

  const average = getAverageRating();
  const count = testimonials.length;

  // Mock tags for filtering
  const filterTags = [
    { id: 'taste', label: '味が美味しい', count: 12 },
    { id: 'fresh', label: '鮮度が良い', count: 8 },
    { id: 'repeat', label: 'リピート', count: 5 },
    { id: 'package', label: '梱包が丁寧', count: 4 },
    { id: 'gift', label: 'ギフトにおすすめ', count: 3 },
  ];

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-white to-gray-50 border-t border-gray-100 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 1. Hero Header & Scoreboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16 items-center">
          {/* Text & Badge */}
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-[#f8f5ea] text-[#8c7b3e] px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-2 border border-[#e8e0c5]">
              <BadgeCheck className="w-4 h-4" />
              Verified Reviews
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-gray-900 leading-tight">
              愛される理由。<br/>
              <span className="text-gray-400">お客様から届いた、<br className="md:hidden"/>本音の言葉。</span>
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm md:text-base max-w-md mx-auto lg:mx-0">
              お米マイスターをはじめ、多くの方々に選ばれています。<br/>
              日々の食卓を変える、確かな品質を体験してください。
            </p>
          </div>

          {/* Visual Score Card */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10 flex flex-col md:flex-row items-center gap-10 md:gap-16 relative overflow-hidden">
              {/* Decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#f6b01d]/10 to-transparent rounded-bl-full pointer-events-none" />

              {/* Big Score */}
              <div className="flex flex-col items-center relative z-10">
                <div className="text-7xl font-bold text-gray-900 tracking-tighter leading-none">
                  {average.toFixed(1)}
                </div>
                <div className="flex flex-col items-center mt-2">
                   {renderStars(average, 'lg')}
                   <span className="text-xs text-gray-400 mt-2 font-medium tracking-wider">BASED ON {count} REVIEWS</span>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12 relative z-10">
                {[
                  { label: '味・品質', score: 5.0, icon: '😋' },
                  { label: '鮮度・香り', score: 4.9, icon: '🌾' },
                  { label: '梱包・発送', score: 4.8, icon: '📦' },
                  { label: 'リピート率', score: '96%', icon: '🔄' },
                ].map((metric, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg filter grayscale opacity-80">{metric.icon}</span>
                      <span className="text-sm font-medium text-gray-600">{metric.label}</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{metric.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Interactive Filter Tags */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {filterTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setActiveFilter(activeFilter === tag.id ? null : tag.id)}
              className={`group px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 border ${
                activeFilter === tag.id
                  ? 'bg-black text-white border-black shadow-lg transform scale-105'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              {activeFilter === tag.id && <Check className="w-3.5 h-3.5" />}
              {tag.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeFilter === tag.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
              }`}>
                {tag.count}
              </span>
            </button>
          ))}
          {activeFilter && (
            <button 
              onClick={() => setActiveFilter(null)}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
            >
              <X className="w-4 h-4" /> クリア
            </button>
          )}
        </div>

        {/* 3. Masonry Review Grid */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {testimonials.map((t, idx) => (
            <div
              key={t.id}
              className="break-inside-avoid bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 text-gray-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-gray-900 flex items-center gap-2">
                      {t.name}
                      {t.role && (
                        <span className="px-2 py-0.5 rounded bg-green-50 text-green-700 text-[10px] font-medium border border-green-100">
                          {t.role}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{t.date.replace(/-/g, '.')}</div>
                  </div>
                </div>
                <div className="bg-gray-50 px-2 py-1 rounded text-[10px] font-medium text-gray-500 border border-gray-100 truncate max-w-[80px]">
                  {t.productName}
                </div>
              </div>

              {/* Images */}
              {t.images && t.images.length > 0 && (
                <div className="mb-5 -mx-6 mt-2">
                  <div className="flex gap-1 overflow-hidden px-6">
                    {t.images.map((img, i) => (
                      <div key={i} className="relative w-full h-48 rounded-xl overflow-hidden group-hover:opacity-100 transition-opacity">
                        <img 
                          src={img} 
                          alt="Review" 
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                {renderStars(t.rating, 'sm')}
                <span className="text-xs font-bold text-gray-900">{t.rating.toFixed(1)}</span>
              </div>

              {/* Content */}
              <p className="text-sm text-gray-700 leading-relaxed mb-5 font-medium">
                "{t.comment}"
              </p>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-gray-400">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1.5 text-xs hover:text-[#f6b01d] transition-colors group/btn">
                    <ThumbsUp className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                    <span>参考になった</span>
                  </button>
                </div>
                <div className="flex items-center gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>返信を表示</span>
                </div>
              </div>
            </div>
          ))}
          
          {/* "Join the community" Card (CTA) */}
          <div className="break-inside-avoid bg-[#1a1a1a] rounded-2xl p-8 text-center text-white flex flex-col items-center justify-center min-h-[300px] shadow-2xl">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm">
               <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-serif font-medium mb-3">あなたの声も<br/>聞かせてください</h3>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              商品の感想や、美味しい食べ方を<br/>
              シェアしてみませんか？
            </p>
            <button className="bg-white text-black px-8 py-3 rounded-full text-sm font-bold tracking-wide hover:bg-gray-200 transition-colors duration-300 transform hover:scale-105">
              レビューを書く
            </button>
          </div>

        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
           <p className="text-gray-400 text-sm mb-4 tracking-widest">VIEW MORE REVIEWS</p>
           <button className="group inline-flex items-center justify-center w-12 h-12 rounded-full border border-gray-200 text-gray-400 hover:border-black hover:text-black transition-all duration-300">
              <span className="transform group-hover:translate-y-0.5 transition-transform">↓</span>
           </button>
        </div>

      </div>
    </section>
  );
};

export default Testimonials;
