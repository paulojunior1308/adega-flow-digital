import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface Promotion {
  id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  originalPrice: number;
  products: Product[];
}

const API_URL = import.meta.env.VITE_API_URL; // URL base do backend

export function PromotionCarousel() {
  const [promotions, setPromotions] = React.useState<Promotion[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { addToCart } = useCart();

  React.useEffect(() => {
    api.get('/promotions')
      .then(response => {
        setPromotions(response.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <span className="text-muted-foreground">Carregando promoções...</span>
      </div>
    );
  }

  if (promotions.length === 0) {
    return null;
  }

  const calculateDiscount = (original: number, promotional: number) => {
    return Math.round(((original - promotional) / original) * 100);
  };

  const getImageUrl = (image?: string) => {
    if (!image) return '';
    if (image.startsWith('http')) return image;
    return `${API_URL}${image}`;
  };

  return (
    <section className="py-8 bg-muted/50">
      <div className="container">
        <h2 className="text-2xl font-bold mb-6">Promoções do Dia</h2>
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {promotions.map((promotion) => (
              <CarouselItem key={promotion.id} className="md:basis-1/2 lg:basis-1/3">
                <Card>
                  {promotion.image && (
                    <div className="relative w-full h-64 flex items-center justify-center bg-gray-50">
                      <img
                        src={getImageUrl(promotion.image)}
                        alt={promotion.name}
                        className="w-full h-full object-contain p-4 rounded-t-lg"
                      />
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-sm font-bold">
                        {calculateDiscount(promotion.originalPrice, promotion.price)}% OFF
                      </div>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{promotion.name}</CardTitle>
                    <CardDescription>{promotion.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {promotion.products.map((product) => (
                        <li key={product.id} className="text-sm text-muted-foreground">
                          {product.name}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="flex flex-col items-start gap-2">
                    <span className="text-sm line-through text-muted-foreground">
                      {formatPrice(promotion.originalPrice)}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {formatPrice(promotion.price)}
                    </span>
                  </CardFooter>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
} 