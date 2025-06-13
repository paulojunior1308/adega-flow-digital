import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselPrevious, 
  CarouselNext 
} from "@/components/ui/carousel";
import { api } from '@/lib/api';

const API_URL = 'https://adega-flow-digital.onrender.com'; // URL base do backend

const getImageUrl = (image?: string) => {
  if (!image) return '';
  if (image.startsWith('http')) return image;
  if (image.startsWith('/uploads')) return `${API_URL}${image}`;
  return image;
};

const ComboCard = ({ title, items, price, bgColor, image }: any) => {
  return (
    <div className={`rounded-lg overflow-hidden shadow-md element-card-hover h-full ${bgColor}`}>
      {image && (
        <div className="w-full h-64 flex items-center justify-center bg-gray-50">
          <img 
            src={getImageUrl(image)} 
            alt={title} 
            className="w-full h-full object-contain p-4" 
          />
        </div>
      )}
      <div className="p-6">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <ul className="mb-6 flex-1">
          {items.map((item: string, index: number) => (
            <li key={index} className="flex items-center mb-2">
              <span className="mr-2">✓</span>
              {item}
            </li>
          ))}
        </ul>
        <div className="flex justify-between items-center mt-auto">
          <span className="text-2xl font-bold">{price}</span>
        </div>
      </div>
    </div>
  );
};

const CombosSection = () => {
  const [combos, setCombos] = React.useState<any[]>([]);
  React.useEffect(() => {
    api.get('/combos').then(res => setCombos(res.data));
  }, []);

  return (
    <section className="element-section bg-element-gray-light">
      <div className="element-container">
        <div className="flex items-center justify-between mb-8">
          <h2 className="element-heading">Combos Populares</h2>
          <Link to="/combos" className="element-link flex items-center">
            Ver todos <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
        <Carousel className="w-full">
          <CarouselContent className="-ml-6">
            {combos.map((combo, index) => (
              <CarouselItem key={combo.id} className="pl-6 md:basis-1/2 lg:basis-1/3">
                <div className="h-full">
                  <ComboCard
                    title={combo.name}
                    items={combo.items.map((item: any) => item.product.name)}
                    price={`R$ ${combo.price.toFixed(2)}`}
                    bgColor={index % 2 === 1 ? 'bg-element-blue-dark text-white' : 'bg-white text-element-gray-dark'}
                    image={combo.image}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0" />
          <CarouselNext className="right-0" />
        </Carousel>
      </div>
    </section>
  );
};

export default CombosSection;
