
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

interface ComboCardProps {
  title: string;
  items: string[];
  price: string;
  bgColor: string;
  image?: string;
}

const ComboCard = ({ title, items, price, bgColor, image }: ComboCardProps) => {
  return (
    <div className={`rounded-lg p-6 ${bgColor} shadow-md element-card-hover h-full`}>
      <div className="flex flex-col h-full">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <ul className="mb-6 flex-1">
          {items.map((item, index) => (
            <li key={index} className="flex items-center mb-2">
              <span className="mr-2">✓</span>
              {item}
            </li>
          ))}
        </ul>
        {image && (
          <div className="mb-4">
            <img src={image} alt={title} className="w-full h-32 object-cover rounded-md" />
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold">{price}</span>
        </div>
      </div>
    </div>
  );
};

const CombosSection = () => {
  const combos = [
    {
      title: "Combo Cerveja",
      items: [
        "12 Cervejas Skol 350ml",
        "6 Cervejas Heineken 350ml",
        "1 Pacote de Gelo",
        "1 Pacote de Carvão"
      ],
      price: "R$ 79,90",
      bgColor: "bg-white text-element-gray-dark",
      image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9"
    },
    {
      title: "Combo Destilados",
      items: [
        "1 Vodka Absolut 750ml",
        "1 Whisky Red Label 750ml",
        "2 Energéticos",
        "1 Refrigerante 2L"
      ],
      price: "R$ 199,90",
      bgColor: "bg-element-blue-dark text-white",
      image: ""
    },
    {
      title: "Combo Narguilé",
      items: [
        "1 Narguilé Completo",
        "3 Essências Love66",
        "1 Pacote de Carvão",
        "Acessórios"
      ],
      price: "R$ 249,90",
      bgColor: "bg-white text-element-gray-dark",
      image: "https://images.unsplash.com/photo-1721322800607-8c38375eef04"
    },
    {
      title: "Combo Festa",
      items: [
        "24 Cervejas Brahma 350ml",
        "1 Vodka Smirnoff 998ml",
        "2 Refrigerantes 2L",
        "1 Pacote de Gelo Grande"
      ],
      price: "R$ 159,90",
      bgColor: "bg-white text-element-gray-dark",
      image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9"
    },
    {
      title: "Combo Premium",
      items: [
        "1 Whisky Jack Daniel's 750ml",
        "1 Gin Tanqueray 750ml",
        "4 Energéticos Red Bull",
        "1 Pacote de Gelo"
      ],
      price: "R$ 349,90",
      bgColor: "bg-element-blue-dark text-white",
      image: ""
    }
  ];

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
              <CarouselItem key={index} className="pl-6 md:basis-1/2 lg:basis-1/3">
                <div className="h-full">
                  <ComboCard
                    title={combo.title}
                    items={combo.items}
                    price={combo.price}
                    bgColor={combo.bgColor}
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
