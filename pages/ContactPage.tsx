import React, { useEffect } from 'react';
import ContactSection from '../components/ContactSection';

const ContactPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-20 animate-fade-in overflow-x-hidden w-full">
      <div className="pt-16 md:pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
           <h1 className="text-xl md:text-2xl font-serif tracking-[0.15em] font-normal">CONTACT</h1>
           <p className="text-xs text-gray-500 mt-2 tracking-wider">お問い合わせ</p>
        </div>
      </div>
      <ContactSection />
    </div>
  );
};

export default ContactPage;