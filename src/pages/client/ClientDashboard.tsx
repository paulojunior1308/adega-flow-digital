
import React from 'react';
import ClientSidebar from '@/components/client/ClientSidebar';
import { ArrowRight, Bell, Search, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  image: string;
  title: string;
  price: string;
  oldPrice?: string;
}

const ProductCard = ({ image, title, price, oldPrice }: ProductCardProps) => {
  return (
    <div className="element-card p-4 element-card-hover">
      <img src={image} alt={title} className="w-full h-32 object-cover rounded-md mb-3" />
      <h4 className="font-medium line-clamp-2 mb-1">{title}</h4>
      <div className="flex justify-between items-end">
        <div>
          <p className="font-bold text-lg text-element-blue-dark">{price}</p>
          {oldPrice && <p className="text-sm text-element-gray-dark/60 line-through">{oldPrice}</p>}
        </div>
        <Button variant="outline" size="icon" className="rounded-full">
          <ShoppingCart className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const ClientDashboard = () => {
  return (
    <div className="min-h-screen bg-element-gray-light">
      <ClientSidebar />
      
      <div className="lg:pl-64 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-element-blue-dark mb-2">Olá, João!</h1>
              <p className="text-element-gray-dark">Bem-vindo de volta à Element Adega</p>
            </div>
            
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <div className="relative">
                <Button variant="outline" size="icon" className="rounded-full bg-white">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-element-blue-neon rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                    3
                  </span>
                </Button>
              </div>
              
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-element-gray-dark/60" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  className="element-input pl-10 w-full"
                />
              </div>
            </div>
          </div>
          
          {/* Banner */}
          <div className="element-card p-6 md:p-8 mb-8 bg-gradient-to-r from-element-blue-dark to-element-gray-dark text-white">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0">
                <h2 className="text-xl md:text-2xl font-bold mb-4">Promoções Especiais</h2>
                <p className="mb-6 text-element-gray-light">
                  Aproveite descontos exclusivos em bebidas selecionadas!
                </p>
                <Link to="/cliente-catalogo" className="element-btn-primary">
                  Ver ofertas
                </Link>
              </div>
              <div className="w-full md:w-1/3 lg:w-1/4">
                <img 
                  src="https://images.unsplash.com/photo-1618160702438-9b02ab6515c9" 
                  alt="Promoções" 
                  className="rounded-lg shadow-lg animate-float"
                />
              </div>
            </div>
          </div>
          
          {/* Products Grid */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="element-subheading">Comprados Recentemente</h3>
              <Link to="/cliente-catalogo" className="element-link flex items-center text-sm">
                Ver mais <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <ProductCard 
                image="https://images.unsplash.com/photo-1618160702438-9b02ab6515c9"
                title="Skol 350ml - Pack com 12"
                price="R$ 39,90"
              />
              <ProductCard 
                image="https://images.unsplash.com/photo-1582562124811-c09040d0a901"
                title="Vodka Smirnoff 998ml"
                price="R$ 49,90"
                oldPrice="R$ 59,90"
              />
              <ProductCard 
                image="https://images.unsplash.com/photo-1721322800607-8c38375eef04"
                title="Essência Narguilé Love66 - 50g"
                price="R$ 29,90"
              />
              <ProductCard 
                image="https://images.unsplash.com/photo-1618160702438-9b02ab6515c9"
                title="Red Label 750ml"
                price="R$ 89,90"
              />
            </div>
          </div>
          
          {/* Categories */}
          <div>
            <h3 className="element-subheading mb-6">Categorias Populares</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <Link to="/cliente-catalogo?cat=cervejas" className="element-card flex flex-col items-center justify-center p-6 text-center element-card-hover">
                <img 
                  src="https://images.unsplash.com/photo-1618160702438-9b02ab6515c9" 
                  alt="Cervejas" 
                  className="w-16 h-16 object-cover rounded-full mb-3"
                />
                <h4 className="font-medium">Cervejas</h4>
              </Link>
              
              <Link to="/cliente-catalogo?cat=destilados" className="element-card flex flex-col items-center justify-center p-6 text-center element-card-hover">
                <img 
                  src="https://images.unsplash.com/photo-1582562124811-c09040d0a901" 
                  alt="Destilados" 
                  className="w-16 h-16 object-cover rounded-full mb-3"
                />
                <h4 className="font-medium">Destilados</h4>
              </Link>
              
              <Link to="/cliente-catalogo?cat=narguile" className="element-card flex flex-col items-center justify-center p-6 text-center element-card-hover">
                <img 
                  src="https://images.unsplash.com/photo-1721322800607-8c38375eef04" 
                  alt="Narguilé" 
                  className="w-16 h-16 object-cover rounded-full mb-3"
                />
                <h4 className="font-medium">Narguilé</h4>
              </Link>
              
              <Link to="/cliente-catalogo?cat=energeticos" className="element-card flex flex-col items-center justify-center p-6 text-center element-card-hover">
                <img 
                  src="https://images.unsplash.com/photo-1618160702438-9b02ab6515c9" 
                  alt="Energéticos" 
                  className="w-16 h-16 object-cover rounded-full mb-3"
                />
                <h4 className="font-medium">Energéticos</h4>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
