
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const PromoCard = ({ 
  title, 
  description, 
  price, 
  originalPrice, 
  image, 
  badge 
}: { 
  title: string; 
  description: string; 
  price: string; 
  originalPrice?: string;
  image: string; 
  badge?: string; 
}) => {
  return (
    <div className="element-card overflow-hidden element-card-hover">
      {badge && (
        <div className="absolute top-2 right-2 bg-element-blue-neon text-element-gray-dark px-3 py-1 rounded-full font-medium text-sm animate-pulse-soft">
          {badge}
        </div>
      )}
      <img src={image} alt={title} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="text-element-gray-dark/80 text-sm mb-3">{description}</p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-element-blue-dark font-bold text-xl">{price}</p>
            {originalPrice && (
              <p className="text-element-gray-dark/60 text-sm line-through">{originalPrice}</p>
            )}
          </div>
          <Link 
            to="/promocoes" 
            className="bg-element-blue-dark text-white rounded-full p-2 hover:bg-element-blue-neon hover:text-element-gray-dark transition-colors"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

const PromoSection = () => {
  return (
    <section className="element-section bg-white">
      <div className="element-container">
        <div className="flex items-center justify-between mb-8">
          <h2 className="element-heading">Promoções do Dia</h2>
          <Link to="/promocoes" className="element-link flex items-center">
            Ver todas <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <PromoCard
            title="Kit Skol + Carvão"
            description="12 Cervejas Skol 350ml + 1 pacote de carvão"
            price="R$ 39,90"
            originalPrice="R$ 55,00"
            image="https://images.unsplash.com/photo-1618160702438-9b02ab6515c9"
            badge="30% OFF"
          />
          
          <PromoCard
            title="Combo Festa"
            description="1 Vodka Smirnoff + 6 Energéticos + Gelo"
            price="R$ 89,90"
            originalPrice="R$ 110,00"
            image="https://images.unsplash.com/photo-1582562124811-c09040d0a901"
            badge="Promoção"
          />
          
          <PromoCard
            title="Kit Narguilé Iniciante"
            description="Narguilé + Essência + Carvão + Acessórios"
            price="R$ 120,00"
            originalPrice="R$ 150,00"
            image="https://images.unsplash.com/photo-1721322800607-8c38375eef04"
            badge="Novidade"
          />
          
          <PromoCard
            title="Whisky Jack Daniel's"
            description="Garrafa 1L Original"
            price="R$ 139,90"
            image="https://images.unsplash.com/photo-1618160702438-9b02ab6515c9"
          />
        </div>
      </div>
    </section>
  );
};

export default PromoSection;
