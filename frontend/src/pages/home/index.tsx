import React from 'react';
import { ComboCarousel } from '@/components/home/ComboCarousel';
import { PromotionCarousel } from '@/components/home/PromotionCarousel';

export default function Home() {
  return (
    <main>
      <ComboCarousel />
      <PromotionCarousel />
      {/* Outros componentes da página inicial */}
    </main>
  );
} 