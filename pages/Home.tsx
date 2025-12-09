import React from 'react';
import HeroVideo from '../components/HeroVideo';
import Collections from '../components/Collections';
import ParallaxSection from '../components/ParallaxSection';
import ProductGrid from '../components/ProductGrid';
import ContactSection from '../components/ContactSection';
import Testimonials from '../components/Testimonials';

const Home = () => {
  return (
    <div className="animate-fade-in">
      <HeroVideo />
      
      <div className="pt-24 md:pt-32 pb-8 md:pb-16 text-center px-4 animate-slide-up bg-white">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-2xl md:text-3xl font-serif font-medium tracking-normal">余計なものは足さない</h2>
          <div className="text-sm md:text-base font-medium md:font-normal leading-relaxed md:leading-relaxed text-gray-600">
            <p>自然栽培の考えをベースに、品種が秘めた旨みと香りをまっすぐに届けるため、<br className="mb-2"/><br className="mb-2"/>島の有機資源で土を磨き上げ、農薬に頼らず育てました。<br className="mb-2"/><br className="mb-2"/>佐渡ヶ島の森里海とそこで暮らす様々な命が織りなす循環の一粒をご賞味ください。</p>
          </div>
        </div>
      </div>

      {/* Awards Section */}
      <section className="py-6 md:py-10 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center border-t border-b border-gray-200 py-6 md:py-8">
            <p className="text-xs md:text-sm text-gray-500 mb-3 tracking-wider">第27回米・食味分析鑑定コンクール国際大会</p>
            <p className="text-sm md:text-base text-gray-600 mb-6">国際総合部門</p>
            <h3 className="text-2xl md:text-4xl font-serif font-medium text-gray-900">金賞受賞</h3>
          </div>
        </div>
      </section>

      <Collections />
      
      <div className="pt-8 pb-8 md:pt-16 md:pb-16 text-center px-4 bg-white">
         <div className="max-w-2xl mx-auto space-y-6">
           <h2 className="text-2xl md:text-3xl font-serif font-medium tracking-normal">Brand Design</h2>
          <div className="text-sm md:text-base font-medium md:font-normal leading-relaxed md:leading-relaxed text-gray-600">
            <p>自然界では、多様な命が、無理なく、<br className="mb-2"/>あるがままに響き合い、永遠にめぐっている。<br className="mb-2"/><br className="mb-2"/>そんな「ありのまま」が調和する世界を、<br className="mb-2"/>私たちは"イケてる"と呼ぶことにした。<br className="mb-2"/><br className="mb-2"/>それはきっと、人間社会の理想のかたち。<br className="mb-2"/>小さな島の、小さな田畑から。<br className="mb-2"/><br className="mb-2"/>「イケてる社会」を、少しずつ育てていく。<br className="mb-2"/><br className="mb-2"/>― 子どもたちが「ココに生まれてよかった」と思える世界を、創りたい。</p>
          </div>
        </div>
      </div>

      <ParallaxSection />
      <ProductGrid />
      <Testimonials />
      <ContactSection />
    </div>
  );
};

export default Home;