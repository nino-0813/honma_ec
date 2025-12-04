import React from 'react';

const ContactSection = () => {
  return (
    <section className="py-20 bg-white" id="contact">
      <div className="max-w-2xl mx-auto px-4">
        <h2 className="text-3xl font-serif text-center mb-12 tracking-wide">Contact us</h2>
        
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="flex flex-col gap-2">
               <label htmlFor="name" className="text-sm font-serif">お名前</label>
               <input type="text" id="name" className="border border-secondary p-3 focus:border-primary outline-none transition-colors bg-dim" />
             </div>
             <div className="flex flex-col gap-2">
               <label htmlFor="email" className="text-sm font-serif">メールアドレス</label>
               <input type="email" id="email" className="border border-secondary p-3 focus:border-primary outline-none transition-colors bg-dim" />
             </div>
          </div>
          
          <div className="flex flex-col gap-2">
             <label htmlFor="phone" className="text-sm font-serif">お電話番号</label>
             <input type="tel" id="phone" className="border border-secondary p-3 focus:border-primary outline-none transition-colors bg-dim w-full" />
          </div>

          <div className="flex flex-col gap-2">
             <label htmlFor="message" className="text-sm font-serif">内容</label>
             <textarea id="message" rows={5} className="border border-secondary p-3 focus:border-primary outline-none transition-colors bg-dim w-full"></textarea>
          </div>

          <div className="pt-4 text-center">
            <button type="submit" className="bg-primary text-white px-16 py-4 text-sm tracking-widest hover:bg-gray-800 transition-colors uppercase w-full md:w-auto">
              送信
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center mt-8">
            このサイトはhCaptchaによって保護されており、hCaptchaプライバシーポリシーおよび利用規約が適用されます。
          </p>
        </form>
      </div>
    </section>
  );
};

export default ContactSection;