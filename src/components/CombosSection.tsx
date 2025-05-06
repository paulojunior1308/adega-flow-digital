
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface ComboCardProps {
  title: string;
  items: string[];
  price: string;
  bgColor: string;
  image?: string;
}

const ComboCard = ({ title, items, price, bgColor, image }: ComboCardProps) => {
  return (
    <div className={`rounded-lg p-6 ${bgColor} shadow-md element-card-hover`}>
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
          <Link 
            to="/combos" 
            className="element-btn-primary"
          >
            Comprar
          </Link>
        </div>
      </div>
    </div>
  );
};

const CombosSection = () => {
  return (
    <section className="element-section bg-element-gray-light">
      <div className="element-container">
        <div className="flex items-center justify-between mb-8">
          <h2 className="element-heading">Combos Populares</h2>
          <Link to="/combos" className="element-link flex items-center">
            Ver todos <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ComboCard
            title="Combo Cerveja"
            items={[
              "12 Cervejas Skol 350ml",
              "6 Cervejas Heineken 350ml",
              "1 Pacote de Gelo",
              "1 Pacote de Carvão"
            ]}
            price="R$ 79,90"
            bgColor="bg-white text-element-gray-dark"
            image="https://images.unsplash.com/photo-1618160702438-9b02ab6515c9"
          />
          
          <ComboCard
            title="Combo Destilados"
            items={[
              "1 Vodka Absolut 750ml",
              "1 Whisky Red Label 750ml",
              "2 Energéticos",
              "1 Refrigerante 2L"
            ]}
            price="R$ 199,90"
            bgColor="bg-element-blue-dark text-white"
          />
          
          <ComboCard
            title="Combo Narguilé"
            items={[
              "1 Narguilé Completo",
              "3 Essências Love66",
              "1 Pacote de Carvão",
              "Acessórios"
            ]}
            price="R$ 249,90"
            bgColor="bg-white text-element-gray-dark"
            image="https://images.unsplash.com/photo-1721322800607-8c38375eef04"
          />
        </div>
      </div>
    </section>
  );
};

export default CombosSection;
