import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

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
    }, { 
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

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

const Ambassador = () => {
  const leftImageRef = useRef<HTMLImageElement>(null);
  const rightImageRef = useRef<HTMLImageElement>(null);
  const imagesSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const sectionEl = imagesSectionRef.current;
    if (!sectionEl) return;

    const syncImageHeights = () => {
      if (rightImageRef.current && leftImageRef.current) {
        const rightHeight = rightImageRef.current.offsetHeight;
        if (rightHeight > 0) {
          const leftContainer = leftImageRef.current.parentElement;
          if (leftContainer) {
            leftContainer.style.height = `${rightHeight}px`;
          }
        }
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            syncImageHeights();
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(sectionEl);
    window.addEventListener('resize', syncImageHeights);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncImageHeights);
    };
  }, []);

  return (
    <div className="pt-20 animate-fade-in bg-white overflow-x-hidden w-full">
      {/* Top Title Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-8 pb-12 md:pb-16 text-center">
        <h1 className="text-xl md:text-2xl font-serif tracking-[0.15em] font-normal mb-4">JOIN US</h1>
      </div>

      {/* Hero Image */}
      <div className="relative w-full pb-4 flex justify-center">
        <div className="relative w-full max-w-4xl h-auto md:h-[60vh] overflow-visible md:overflow-hidden mx-auto mb-8 md:mb-12">
          <img 
            src="/images/ambassador/banner/ambassador_banner_design.webp" 
            alt="IKEVEGE"
            width={1200}
            height={630}
            className="w-full h-auto md:h-full object-contain md:object-cover object-center object-bottom md:object-center scale-140 md:scale-130"
          />
        </div>
      </div>

      {/* CONCEPT Section - Based on ABOUT US */}
      <section className="pt-12 md:pt-16 pb-16 md:pb-24 bg-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <p className="text-xs font-bold tracking-[0.3em] text-gray-400 uppercase mb-2 md:mb-4">CONCEPT</p>
          <div className="mb-12 md:mb-16">
            <div className="flex justify-center mb-4 md:mb-6">
              <span className="relative inline-block">
                <img 
                  src="/images/joinus/Iketeru_partner_logo_RGB_2409005.webp" 
                  alt="イケてるパートナーズ"
                  width={200}
                  height={80}
                  className="h-20 md:h-32 w-auto object-contain"
                />
                <span className="absolute left-1/2 transform -translate-x-1/2 w-3/4 h-px bg-primary -bottom-2 md:-bottom-4"></span>
              </span>
            </div>
            <span className="text-base md:text-2xl block text-gray-600 mt-10 md:mt-12">社会を共に創る</span>
          </div>
          
          <div className="text-sm md:text-base font-light leading-loose md:leading-loose text-gray-700 space-y-4 md:space-y-6 max-w-2xl mx-auto text-center">
            <p>子どもたちから借りている</p>
            <p>この自然資本の上に生きるものとして</p>
            <p>都市と里山の境界を越えていく。</p>
            <p>どこにいても「自分ごと」として</p>
            <p>手を取り合える社会を。</p>
            <p className="font-medium">イケベジと一緒に。</p>
          </div>
        </div>
      </section>

      {/* OUR CHALLENGE Section with Background */}
      <section className="py-8 md:py-16 bg-secondary/30 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center">
            <h3 className="text-2xl md:text-4xl font-serif tracking-widest mb-4">OUR CHALLENGE</h3>
            <div className="w-12 h-px bg-primary mx-auto"></div>
          </div>
        </div>
      </section>

      {/* Challenge Text Section - No Background */}
      <section className="py-8 md:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="text-sm md:text-base font-light leading-loose md:leading-loose text-gray-700 space-y-4 md:space-y-6">
            <p className="font-medium">
              【佐渡の小学生と世界一へ！】
            </p>
            <p>
              スマート農業で創る「子どもが農家を夢見る島」
            </p>
            <p className="font-medium">
              クラウドファンディング挑戦中！！！
            </p>
            <FadeInSection>
              <div className="mt-6">
                <a 
                  href="https://for-good.net/project/1003099" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block text-sm font-semibold text-gray-700 hover:text-black underline transition-all duration-300"
                >
                  詳細はこちら
                </a>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* Cloud Funding and Ambassador Sections - Side by Side */}
      <section ref={imagesSectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {/* Cloud Funding Section */}
          <div className="flex flex-col">
            <div className="relative w-full bg-white flex items-center justify-center overflow-hidden">
              <img 
                ref={leftImageRef}
                src="/images/joinus/crowdfunding_poster.webp" 
                className="w-full h-full object-contain"
                alt="Cloud Funding"
                width={600}
                height={849}
                style={{ transform: 'scale(1.1)' }}
              />
            </div>
          </div>

          {/* Ambassador Section */}
          <div className="flex flex-col">
            <div className="relative w-full bg-white flex items-center justify-center overflow-hidden">
              <img 
                ref={rightImageRef}
                src="/images/joinus/artboard_1_copy.webp" 
                className="w-full h-auto object-contain"
                alt="Ambassador"
                width={592}
                height={837}
              />
            </div>
          </div>
        </div>
        <FadeInSection>
          <div className="mt-16 md:mt-20 mb-12 md:mb-16 text-center">
            <a 
              href="https://for-good.net/project/1003099" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block text-base md:text-lg font-semibold text-gray-700 hover:text-black underline transition-all duration-300"
            >
              詳細はこちら
            </a>
          </div>
        </FadeInSection>
      </section>

      {/* OUR PROJECT Section with Background */}
      <section className="pt-16 md:pt-24 pb-12 md:pb-20 bg-secondary/30 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center">
            <h3 className="text-2xl md:text-4xl font-serif tracking-widest mb-4">OUR PROJECT</h3>
            <div className="w-12 h-px bg-primary mx-auto"></div>
          </div>
        </div>
      </section>

      {/* Ambassador Recruitment Section */}
      <section className="relative w-full pb-24 md:pb-32 flex justify-center mt-8 md:mt-12">
        <div className="relative w-full max-w-4xl h-[50vh] md:h-[60vh] bg-gray-900 flex items-center justify-center overflow-hidden mx-auto">
          <img 
            src="/images/joinus/crowdfunding-1052.webp" 
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            style={{ objectPosition: 'center 30%' }}
            alt="Ambassador Recruitment"
            width={1052}
            height={700}
            loading="lazy"
            onError={(e) => {
              console.error('画像の読み込みに失敗しました:', e);
            }}
          />
          <div className="relative z-10 text-center text-white p-6">
            <h2 className="text-3xl md:text-4xl font-serif font-bold tracking-[0.2em] mb-4">アンバサダー募集中</h2>
            <p className="text-sm md:text-base tracking-widest font-light mb-4">
              イケベジ版のオーナー制度
            </p>
            <p className="text-sm md:text-base tracking-widest font-light mb-6">
              一緒に田んぼを作りましょう！
            </p>
            <button
              disabled
              className="inline-block bg-orange-500 text-white px-8 py-3 text-sm tracking-widest hover:bg-orange-600 transition-colors uppercase cursor-not-allowed opacity-90"
            >
              Coming Soon
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Ambassador;
