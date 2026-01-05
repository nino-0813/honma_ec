
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';

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

interface ScrollGrayscaleImageProps {
  src: string;
  alt: string;
  className?: string;
}

const ScrollGrayscaleImage = ({ src, alt, className = "" }: ScrollGrayscaleImageProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          setIsInView(entry.isIntersecting);
        });
      },
      { 
        threshold: 0.6, // 画像の60%が表示されたらカラーに（カラーになるタイミングを遅らせる）
        rootMargin: '0px 0px -100px 0px' // 下側にマージンを設定して、もっと下にスクロールしてからカラーになる
      }
    );

    const currentImg = imgRef.current;
    if (currentImg) {
      observer.observe(currentImg);
    }

    return () => {
      if (currentImg) observer.unobserve(currentImg);
    };
  }, []);

  return (
    <img 
      ref={imgRef}
      src={src} 
      alt={alt} 
      className={`w-full h-full object-cover transition-all duration-1000 ${isInView ? 'grayscale-0' : 'grayscale'} ${className}`}
    />
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
         <div className="relative z-10 bg-white pt-32 md:pt-40 pb-8 md:pb-12 flex flex-col items-center justify-center text-black">
            <h1 className="text-xl md:text-2xl font-serif tracking-[0.15em] font-normal mb-2">ABOUT US</h1>
         </div>
         
         {/* Image Section */}
         <div className="relative w-full pb-4 flex justify-center">
            <div className="relative w-full max-w-4xl h-[50vh] md:h-[60vh] overflow-hidden mx-auto">
               <img 
                 src="/images/about/hero/LINE_ALBUM_イケベジ田植え_240613_92.jpg" 
                 alt="IKEVEGE" 
                 className="w-full h-full object-cover object-center"
               />
            </div>
         </div>
      </div>

      {/* Introduction / Philosophy */}
      <section className="pt-12 md:pt-16 pb-12 md:pb-20 bg-white relative overflow-hidden">
        {/* Decorative Vertical Text Background */}
        <div className="absolute top-20 right-10 md:right-20 text-7xl md:text-8xl font-serif opacity-[0.03] vertical-text pointer-events-none hidden md:block">
          自然と共に
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
           <FadeInSection>
             <p className="text-xs font-bold tracking-[0.3em] text-gray-400 uppercase mb-4 md:mb-8">CONCEPT</p>
             <h2 className="text-2xl md:text-4xl font-serif font-medium tracking-widest leading-relaxed mb-8 md:mb-16">
               Farm to Social<br/>
               <span className="text-base md:text-2xl mt-2 md:mt-4 block text-gray-600">農から社会へアプローチする</span>
             </h2>
             
           </FadeInSection>
        </div>
      </section>

      {/* Three Stances Section */}
      <section className="py-8 md:py-16 bg-secondary/30 relative">
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
                 <ScrollGrayscaleImage src="/images/about/stories/IMG_8832.jpg" alt="Farmer" />
               </div>
               <div className="absolute -bottom-10 -right-10 w-2/3 h-1/2 border border-primary z-0 hidden md:block"></div>
            </FadeInSection>
            <FadeInSection className="w-full md:w-1/2 space-y-8">
               <h3 className="text-2xl md:text-3xl font-serif tracking-widest">作り手が楽しむ</h3>
               <div className="space-y-6 text-gray-600 leading-loose font-light font-serif">
                 <p>
                   イケベジの田んぼではいつもスタッフのルカの大きな歌声が響いています。
                 </p>
                 <p>
                   作物は作り手の状態を鏡のように映し出すもの。
                 </p>
                 <p>
                   だからこそ、田んぼではまず「自分らしく楽しむこと」を第一に心がけています。
                 </p>
               </div>
            </FadeInSection>
         </div>

         {/* Story 2 (Reverse) */}
         <div className="flex flex-col md:flex-row-reverse gap-12 md:gap-24 items-center mb-32">
            <FadeInSection className="w-full md:w-1/2 relative">
               <div className="aspect-square bg-gray-100 relative z-10">
                 <ScrollGrayscaleImage src="/images/about/stories/P3A9707.jpg" alt="Sunset Rice Field" />
               </div>
               <div className="absolute -top-10 -left-10 w-2/3 h-1/2 bg-secondary z-0 hidden md:block"></div>
            </FadeInSection>
            <FadeInSection className="w-full md:w-1/2 space-y-8 text-right md:text-left">
               <h3 className="text-2xl md:text-3xl font-serif tracking-widest">引き算のものづくり</h3>
               <div className="space-y-6 text-gray-600 leading-loose font-light font-serif">
                 <p>
                   "美味しい"とは、品種が持つ本来の味わいがまっすぐに伝わること。
                 </p>
                 <p>
                   味を邪魔する農薬や化学肥料を使わず、過剰施肥を避け、できる限り島からでる資源で土を育てます。
                 </p>
                 <p>
                   小さな微生物を呼び込み、より大きな生き物が集まり、そして生き絶え、いのちの循環が幾重にも奏でられた良質なアミノ酸で育つお米が、イケてるお米を育みます。
                 </p>
                 <p>
                   子どもを育てるように、それぞれの命がのびのびと命を全うする場を創り続けます。
                 </p>
               </div>
            </FadeInSection>
         </div>

         {/* Story 3 */}
         <div className="flex flex-col md:flex-row gap-12 md:gap-24 items-center mb-32">
            <FadeInSection className="w-full md:w-1/2 relative">
               <div className="aspect-[3/4] bg-gray-100 relative z-10">
                 <ScrollGrayscaleImage src="/images/about/stories/P3A0011.jpg" alt="Farmers" />
               </div>
               <div className="absolute -bottom-10 -right-10 w-2/3 h-1/2 border border-primary z-0 hidden md:block"></div>
            </FadeInSection>
            <FadeInSection className="w-full md:w-1/2 space-y-8">
               <h3 className="text-2xl md:text-3xl font-serif tracking-widest">農へのアクセスを良好に</h3>
               <div className="space-y-6 text-gray-600 leading-loose font-light font-serif">
                 <p>
                   近年、島の子どもたちが暮らしの中で自然に触れる機会が減少しています。そこで私たちは、農へのアクセスを良好にし、農家ならではの学びの場を創出しています。
                 </p>
                 <p>
                   稲刈りや田植えなど体験価値の高い繁忙期にも、依頼に応える体制を整備しました。
                 </p>
                 <p>
                   こうして得られた"原体験"が、島の子どもたちの自然との豊かな関係を育み、未来を創る力へとつながることを願っています。
                 </p>
               </div>
            </FadeInSection>
         </div>
      </section>

      {/* Note Link Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <FadeInSection>
            <Link href="/blog">
              <a className="inline-block text-gray-900 hover:text-gray-700 transition-colors">
              <div className="font-serif text-base md:text-lg leading-relaxed">
                <p className="mb-2">read more</p>
                <p className="underline underline-offset-4">BLOG</p>
              </div>
              </a>
            </Link>
          </FadeInSection>
        </div>
      </section>
    </div>
  );
};

export default About;
    