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
      
      <div className="py-32 text-center px-4 animate-slide-up bg-white">
        <div className="max-w-2xl mx-auto space-y-10">
          <h2 className="text-2xl md:text-3xl font-serif font-medium tracking-widest">余計なものは足さない</h2>
          <div className="text-sm md:text-base leading-[2.5] md:leading-[2.5] font-sans text-gray-600 font-light">
            <p>自然栽培の考えをベースに、品種が秘めた旨みと香りをまっすぐに届けるため、</p>
            <p>島の有機資源で土を磨き上げ、農薬に頼らず育てました。</p>
            <p>佐渡ヶ島の森里海とそこで暮らす様々な命が織りなす循環の一粒をご賞味ください。</p>
          </div>
        </div>
      </div>

      <Collections />
      
      <div className="py-32 text-center px-4 bg-dim">
         <div className="max-w-2xl mx-auto space-y-10">
          <h2 className="text-2xl md:text-3xl font-serif font-medium tracking-widest">Brand Design</h2>
          <div className="text-sm md:text-base leading-[2.5] md:leading-[2.5] font-sans text-gray-600 font-light">
            <p>自然界では、多様な命が、無理なく、</p>
            <p>あるがままに響き合い、永遠にめぐっている。</p>
            <br className="hidden md:block"/>
            <p>そんな「ありのまま」が調和する世界を、</p>
            <p>私たちは“イケてる”と呼ぶことにした。</p>
            <p>それはきっと、人間社会の理想のかたち。</p>
            <br className="hidden md:block"/>
            <p>小さな島の、小さな田畑から。</p>
            <p>「イケてる社会」を、少しずつ育てていく。</p>
            <br className="hidden md:block"/>
            <p>― 子どもたちが「ココに生まれてよかった」と思える世界を、創りたい。</p>
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