import React, { useEffect } from 'react';
import ContactSection from '../components/ContactSection';

const ContactPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-20 animate-fade-in">
      <div className="bg-gray-50 py-12 border-b border-secondary">
        <div className="max-w-7xl mx-auto px-4 text-center">
           <h1 className="text-2xl font-serif tracking-widest font-bold">CONTACT</h1>
           <p className="text-xs text-gray-500 mt-2 tracking-wider">お問い合わせ</p>
        </div>
      </div>
      <ContactSection />
    </div>
  );
};

export default ContactPage;