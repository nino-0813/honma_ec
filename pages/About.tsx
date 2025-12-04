
import React, { useEffect, useRef } from 'react';

interface FadeInSectionProps {
  children?: React.ReactNode;
  className?: string;
}

const FadeInSection = ({ children, className = "" }: FadeInSectionProps) => {
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-10');
        }
      });
    }, { threshold: 0.1 });

    const currentElement = domRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }
    return () => {
      if (currentElement) observer.unobserve(currentElement);
    };
  }, []);

  return (
    <div ref={domRef} className={`opacity-0 translate-y-10 transition-all duration-1000 ease-out ${className}`}>
      {children}
    </div>
  );
};

const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-0 animate-fade-in bg-white">
      {/* Hero Image - Full Screen with Parallax feel */}
      <div className="relative w-full">
         {/* Text Section - Above Image */}
         <div className="relative z-10 bg-white pt-20 pb-12 flex flex-col items-center justify-center text-black">
            <h1 className="text-4xl md:text-5xl font-serif tracking-[0.15em] font-normal mb-6">ABOUT US</h1>
            <p className="text-sm md:text-base tracking-widest font-light">私たちが目指す未来</p>
         </div>
         
         {/* Image Section */}
         <div className="relative w-full h-[80vh] overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105"
              style={{
                backgroundImage: "url('/images/about/hero/IMG_9172.jpg')"
              }}
            />
         </div>
      </div>

      {/* Introduction / Philosophy */}
      <section className="py-32 md:py-48 bg-white relative overflow-hidden">
        {/* Decorative Vertical Text Background */}
        <div className="absolute top-20 right-10 md:right-20 text-9xl font-serif opacity-[0.03] vertical-text pointer-events-none hidden md:block">
          自然と共に
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
           <FadeInSection>
             <p className="text-xs font-bold tracking-[0.3em] text-gray-400 uppercase mb-8">Philosophy</p>
             <h2 className="text-3xl md:text-4xl font-serif font-medium tracking-widest leading-relaxed mb-16">
               Farm to Social<br/>
               <span className="text-xl md:text-2xl mt-4 block text-gray-600">農業から社会をデザインする</span>
             </h2>
             
             <div className="text-sm md:text-base leading-[2.8] text-gray-600 font-light font-serif space-y-8">
               <p>
                 自然界では、多様な命が、無理なく、<br/>
                 あるがままに響き合い、永遠にめぐっている。
               </p>
               <p>
                 そんな「ありのまま」が調和する世界を、<br/>
                 私たちは“イケてる”と呼ぶことにした。
               </p>
               <p>
                 それはきっと、人間社会の理想のかたち。<br/>
                 小さな島の、小さな田畑から。<br/>
                 「イケてる社会」を、少しずつ育てていく。
               </p>
               <p className="text-lg mt-8 border-t border-b border-gray-200 py-8 inline-block px-12">
                 ― 子どもたちが「ココに生まれてよかった」と思える世界を、創りたい。
               </p>
             </div>
           </FadeInSection>
        </div>
      </section>

      {/* Three Stances Section */}
      <section className="py-24 bg-secondary/30 relative">
        <div className="max-w-6xl mx-auto px-6">
           <FadeInSection className="text-center">
             <h3 className="text-2xl font-serif tracking-widest mb-4">OUR 3 STANCES</h3>
             <div className="w-12 h-px bg-primary mx-auto"></div>
           </FadeInSection>
        </div>
      </section>

      {/* Visual Storytelling Section */}
      <section className="py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         {/* Story 1 */}
         <div className="flex flex-col md:flex-row gap-12 md:gap-24 items-center mb-32">
            <FadeInSection className="w-full md:w-1/2 relative">
               <div className="aspect-[3/4] bg-gray-100 relative z-10">
                 <img src="/images/about/stories/IMG_8832.jpg" alt="Farmer" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" />
               </div>
               <div className="absolute -bottom-10 -right-10 w-2/3 h-1/2 border border-primary z-0 hidden md:block"></div>
            </FadeInSection>
            <FadeInSection className="w-full md:w-1/2 space-y-8">
               <h3 className="text-2xl md:text-3xl font-serif tracking-widest">土を磨き、<br/>命を育む。</h3>
               <div className="space-y-6 text-gray-600 leading-loose font-light font-serif">
                 <p>
                   私たちの田んぼは、佐渡の豊かな自然の中にあります。<br/>
                   山から流れ出る清らかな水、ミネラルを含んだ潮風、<br/>
                   そして、多種多様な生き物たちが暮らす土壌。
                 </p>
                 <p>
                   余計なものは足さない。<br/>
                   あるがままの自然の力を借りて、<br/>
                   お米一粒一粒に生命を吹き込んでいきます。
                 </p>
               </div>
            </FadeInSection>
         </div>

         {/* Story 2 (Reverse) */}
         <div className="flex flex-col md:flex-row-reverse gap-12 md:gap-24 items-center">
            <FadeInSection className="w-full md:w-1/2 relative">
               <div className="aspect-square bg-gray-100 relative z-10">
                 <img src="/images/about/stories/P3A9707.jpg" alt="Sunset Rice Field" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" />
               </div>
               <div className="absolute -top-10 -left-10 w-2/3 h-1/2 bg-secondary z-0 hidden md:block"></div>
            </FadeInSection>
            <FadeInSection className="w-full md:w-1/2 space-y-8 text-right md:text-left">
               <h3 className="text-2xl md:text-3xl font-serif tracking-widest">「ココに生まれてよかった」<br/>そう思える島へ。</h3>
               <div className="space-y-6 text-gray-600 leading-loose font-light font-serif">
                 <p>
                   農業は、風景を作ります。<br/>
                   美しい田園風景は、人々の心の原風景となります。
                 </p>
                 <p>
                   私たちが汗を流し、楽しみながら農業を続けることで、<br/>
                   この島の魅力が少しでも伝われば嬉しい。<br/>
                   それが、私たちの原動力です。
                 </p>
               </div>
            </FadeInSection>
         </div>
      </section>

      {/* Company Profile */}
      <div className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-6">
          <FadeInSection>
            <h3 className="text-center text-lg font-serif tracking-[0.2em] mb-16">COMPANY PROFILE</h3>
            <div className="grid grid-cols-1 gap-y-6 text-sm font-light font-sans">
               <div className="flex flex-col md:flex-row border-b border-gray-100 pb-6">
                  <span className="w-32 font-medium text-gray-900 tracking-widest mb-2 md:mb-0">屋号</span>
                  <span className="text-gray-600">イケベジ / IKEVEGE</span>
               </div>
               <div className="flex flex-col md:flex-row border-b border-gray-100 pb-6">
                  <span className="w-32 font-medium text-gray-900 tracking-widest mb-2 md:mb-0">代表</span>
                  <span className="text-gray-600">佐藤 健太</span>
               </div>
               <div className="flex flex-col md:flex-row border-b border-gray-100 pb-6">
                  <span className="w-32 font-medium text-gray-900 tracking-widest mb-2 md:mb-0">所在地</span>
                  <span className="text-gray-600">〒952-0000 新潟県佐渡市...</span>
               </div>
               <div className="flex flex-col md:flex-row border-b border-gray-100 pb-6">
                  <span className="w-32 font-medium text-gray-900 tracking-widest mb-2 md:mb-0">事業内容</span>
                  <span className="text-gray-600 leading-relaxed">
                     農産物の生産・販売<br/>
                     農業体験の企画・運営<br/>
                     地域活性化事業
                  </span>
               </div>
            </div>
          </FadeInSection>
        </div>
      </div>
    </div>
  );
};

export default About;
    