import React, { useEffect } from 'react';

const Ambassador = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-20 animate-fade-in bg-white">
      {/* Top Banner */}
      <div className="relative w-full h-[40vh] md:h-[50vh] bg-gray-900 flex items-center justify-center overflow-hidden">
        <img 
           src="https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=2070&auto=format&fit=crop" 
           className="absolute inset-0 w-full h-full object-cover opacity-60"
           alt="Ambassador" 
        />
        <div className="relative z-10 text-center text-white p-6">
          <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-[0.2em] mb-4">IKEVEGE AMBASSADOR</h1>
          <p className="text-sm md:text-base tracking-widest font-light">イケベジのある暮らしを、共に広げるパートナー</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="prose prose-slate mx-auto text-center">
           <h3 className="text-xl font-serif tracking-widest mb-8">アンバサダー募集について</h3>
           <div className="text-sm md:text-base leading-loose text-gray-600 space-y-6 font-light">
             <p>
               IKEVEGEでは、私たちの想いや活動に共感し、<br/>
               共にその魅力を発信してくださるアンバサダーを募集しています。
             </p>
             <p>
               自然栽培のお米の美味しさ、<br/>
               佐渡ヶ島の豊かな自然、<br/>
               そして「イケてる社会」を目指す私たちの挑戦。
             </p>
             <p>
               あなたのライフスタイルの中で、<br/>
               IKEVEGEを表現してみませんか？
             </p>
           </div>
        </div>

        <div className="mt-20 border-t border-gray-100 pt-16">
           <h3 className="text-lg font-serif tracking-widest text-center mb-10">ACTIVITIES</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="text-center p-6 bg-gray-50 rounded-sm">
               <div className="text-2xl mb-4">📷</div>
               <h4 className="font-bold mb-3 text-sm">SNS発信</h4>
               <p className="text-xs text-gray-500 leading-relaxed">Instagramなどで、IKEVEGEのある食卓や暮らしの風景を発信してください。</p>
             </div>
             <div className="text-center p-6 bg-gray-50 rounded-sm">
               <div className="text-2xl mb-4">🍚</div>
               <h4 className="font-bold mb-3 text-sm">商品モニター</h4>
               <p className="text-xs text-gray-500 leading-relaxed">新米や新商品をいち早くお届け。感想やレシピの考案をお願いします。</p>
             </div>
             <div className="text-center p-6 bg-gray-50 rounded-sm">
               <div className="text-2xl mb-4">🌾</div>
               <h4 className="font-bold mb-3 text-sm">イベント参加</h4>
               <p className="text-xs text-gray-500 leading-relaxed">収穫祭や交流会など、佐渡ヶ島でのイベントにご招待します（不定期）。</p>
             </div>
           </div>
        </div>

        <div className="mt-20 text-center">
           <h3 className="text-lg font-serif tracking-widest mb-6">ENTRY</h3>
           <p className="text-sm text-gray-500 mb-8">詳細な条件や応募方法は、以下のフォームよりお問い合わせください。</p>
           <a 
             href="/contact" 
             className="inline-block bg-primary text-white px-12 py-4 text-sm tracking-widest hover:bg-gray-800 transition-colors uppercase"
           >
             応募フォームへ
           </a>
        </div>
      </div>
    </div>
  );
};

export default Ambassador;