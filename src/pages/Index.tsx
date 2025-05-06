
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import PromoSection from '@/components/PromoSection';
import CombosSection from '@/components/CombosSection';
import LocationContact from '@/components/LocationContact';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <Hero />
        <PromoSection />
        <CombosSection />
        <LocationContact />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
