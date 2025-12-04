import React from 'react';

const ParallaxSection = () => {
  return (
    <section className="relative h-[500px] md:h-[650px] flex items-center justify-end overflow-hidden my-16">
      {/* Background with fixed attachment for parallax feel */}
      <div className="absolute inset-0">
        <img 
          src="/images/home/parallax/P3A0020.jpg" 
          alt="IKEVEGE" 
          className="w-full h-full object-cover parallax-bg"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 flex justify-end">
        <div className="bg-white/90 backdrop-blur-sm p-8 md:p-12 max-w-lg shadow-2xl">
            <p className="text-sm font-bold tracking-widest mb-4 text-gray-500 uppercase">About Us</p>
            <h2 className="text-3xl md:text-4xl font-serif mb-6 text-primary">Farm to Social</h2>
            <p className="text-gray-600 leading-relaxed mb-8 font-sans text-sm md:text-base">
              私たちは、安全でおいしいお米を届けること、そして農家として社会に貢献すること。その二つを支える３つのスタンスを指針に、日々取り組んでいます。
            </p>
            <a href="/about" className="inline-block border-b border-primary pb-1 text-primary hover:text-gray-600 transition-colors uppercase text-sm tracking-widest">
              View More
            </a>
        </div>
      </div>
    </section>
  );
};

export default ParallaxSection;