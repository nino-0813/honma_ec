import React, { useEffect } from 'react';
import { Link } from 'wouter';

const Ambassador = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-20 animate-fade-in bg-white">
      {/* Top Title Section - About US style */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-8 md:pb-12 text-center">
        <h1 className="text-xl md:text-2xl font-serif tracking-[0.15em] font-normal mb-2">JOIN US</h1>
      </div>

      {/* Hero Image */}
      <div className="relative w-full pb-4 flex justify-center">
        <div className="relative w-full max-w-4xl h-[50vh] md:h-[60vh] overflow-hidden mx-auto">
          <img 
            src="/images/about/hero/IMG_9172.jpg" 
            alt="IKEVEGE" 
            className="w-full h-full object-cover object-center"
          />
        </div>
      </div>

      {/* Introduction Text */}
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-16 text-center">
        <p className="text-base md:text-lg text-gray-700 leading-relaxed">
          イケベジと関わって一緒に社会を作ろう
        </p>
      </div>

      {/* Cloud Funding Section */}
      <section className="relative w-full pb-4 flex justify-center">
        <div className="relative w-full max-w-4xl h-[50vh] md:h-[60vh] bg-gray-900 flex items-center justify-center overflow-hidden mx-auto">
          <img 
            src="/images/about/hero/IMG_9172.jpg" 
            className="absolute inset-0 w-full h-full object-cover object-center opacity-60"
            alt="Cloud Funding" 
          />
          <div className="relative z-10 text-center text-white p-6">
            <h2 className="text-3xl md:text-4xl font-serif font-bold tracking-[0.2em] mb-4">クラファンについて</h2>
            <p className="text-sm md:text-base tracking-widest font-light mb-6">
              イケベジのプロジェクトを支援し、一緒に「イケてる社会」を創りませんか？<br/>
              キャンプファイヤーで詳細をご確認いただけます。
            </p>
            <a 
              href="https://camp-fire.jp" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-orange-500 text-white px-8 py-3 text-sm tracking-widest hover:bg-orange-600 transition-colors uppercase"
            >
              Coming Soon
            </a>
          </div>
        </div>
      </section>

      {/* Ambassador Section */}
      <section className="relative w-full pb-4 flex justify-center">
        <div className="relative w-full max-w-4xl h-[50vh] md:h-[60vh] bg-gray-900 flex items-center justify-center overflow-hidden mx-auto">
          <img 
            src="/images/about/hero/IMG_9172.jpg" 
            className="absolute inset-0 w-full h-full object-cover object-center opacity-60"
            alt="Ambassador" 
          />
          <div className="relative z-10 text-center text-white p-6">
            <h2 className="text-3xl md:text-4xl font-serif font-bold tracking-[0.2em] mb-4">アンバサダーについて</h2>
            <p className="text-sm md:text-base tracking-widest font-light">
              イケベジのある暮らしを、共に広げるパートナー
            </p>
          </div>
        </div>
      </section>

      {/* Ambassador Plans Section */}
      <section className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 py-12 md:py-20 bg-white">

        <div className="max-w-5xl mx-auto">
          {/* Ambassador Product Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* Small Plan */}
            <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                <img 
                  src="/images/ambassador/banner/スクリーンショット 2025-12-12 0.59.49.png" 
                  alt="アンバサダープラン" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 md:p-8">
                <div className="mb-4">
                  <h3 className="text-lg md:text-xl font-serif font-medium mb-2">小規模プラン</h3>
                  <p className="text-sm text-gray-500 mb-4">0.1反 (10a) - 学校の教室より少し広い</p>
                </div>
                
                <div className="space-y-3 mb-6 text-sm text-gray-700">
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="font-medium">収穫量:</span>
                    <span>各年反収の10%分 (今年コシヒカリで30kg)</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="font-medium">金額:</span>
                    <span className="text-lg font-serif">12万円</span>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-xs text-gray-600 mb-3 font-medium">内容:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• 複数パターンでの発送 (5kg:2袋、1.5kg:7袋、2合:30袋)</li>
                    <li>• イケベジ新嘗祭inTokyoへの招待</li>
                    <li>• ホームページ、リーフレットへのロゴ掲載</li>
                    <li>• 農業体験プログラム無料参加権</li>
                  </ul>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  <p className="mb-1">契約: 年単位で継続可能 (前年参加企業優先)</p>
                  <p>備考: 佐渡への宿泊交通費は含まれません。最低過去3年の平均反収の半量を保証します。</p>
                </div>

                <Link href="/contact">
                  <a className="block w-full text-center bg-black text-white px-6 py-3 text-xs tracking-widest hover:bg-gray-800 transition-colors uppercase">
                    お問い合わせ
                  </a>
                </Link>
              </div>
            </div>

            {/* Large Plan */}
            <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                <img 
                  src="/images/ambassador/banner/スクリーンショット 2025-12-12 0.59.49.png" 
                  alt="アンバサダープラン" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 md:p-8">
                <div className="mb-4">
                  <h3 className="text-lg md:text-xl font-serif font-medium mb-2">大規模プラン</h3>
                  <p className="text-sm text-gray-500 mb-4">0.5反 (50a) - テニスコート約2枚分</p>
                </div>
                
                <div className="space-y-3 mb-6 text-sm text-gray-700">
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="font-medium">収穫量:</span>
                    <span>各年反収の50%分 (今年コシヒカリで152kg)</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="font-medium">金額:</span>
                    <span className="text-lg font-serif">60万円</span>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-xs text-gray-600 mb-3 font-medium">内容:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• 企業ロゴ入りオリジナルパッケージでの発送</li>
                    <li>• アンバサダー指定の複数パターンでの発送</li>
                    <li>• TOKItoWAプログラム(2h)の提供</li>
                    <li>• 島内事業者との交流会への招待</li>
                    <li>• イケベジ新嘗祭inTokyoへの招待</li>
                    <li>• ホームページ、リーフレットへのロゴ掲載</li>
                    <li>• 農業体験プログラムへの招待</li>
                  </ul>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  <p className="mb-1">契約: 年単位で継続可能 (前年参加企業優先)</p>
                  <p>備考: 佐渡への宿泊交通費は含まれません。最低過去3年の平均反収の半量を保証します。</p>
                </div>

                <Link href="/contact">
                  <a className="block w-full text-center bg-black text-white px-6 py-3 text-xs tracking-widest hover:bg-gray-800 transition-colors uppercase">
                    お問い合わせ
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Ambassador;
