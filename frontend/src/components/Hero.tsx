
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Beer, Package, Cigarette } from 'lucide-react';

const Hero = () => {
  return (
    <div className="bg-gradient-to-r from-element-blue-dark to-element-gray-dark text-white">
      <div className="element-container py-16 md:py-24">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 text-center md:text-left mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
              Bem-vindo à <span className="text-element-blue-neon">Element Adega</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-element-gray-light animate-fade-in" style={{animationDelay: '0.2s'}}>
              As melhores bebidas, combos exclusivos e produtos para narguilé com entrega rápida!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start animate-fade-in" style={{animationDelay: '0.4s'}}>
              <Link to="/promocoes" className="element-btn-primary text-lg">
                Ver Promoções
              </Link>
              <Link to="/catalogo" className="element-btn-secondary text-lg">
                Catálogo Completo
              </Link>
            </div>
          </div>
          
          <div className="md:w-1/2 flex justify-center">
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-lg shadow-lg animate-fade-in" style={{animationDelay: '0.6s'}}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col items-center text-center element-card-hover">
                  <div className="bg-element-blue-neon rounded-full p-4 mb-4">
                    <Beer className="h-10 w-10 text-element-blue-dark" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Bebidas</h3>
                  <p className="text-element-gray-light text-sm">Cervejas, destilados e energéticos</p>
                </div>
                
                <div className="flex flex-col items-center text-center element-card-hover">
                  <div className="bg-element-blue-neon rounded-full p-4 mb-4">
                    <Package className="h-10 w-10 text-element-blue-dark" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Combos</h3>
                  <p className="text-element-gray-light text-sm">Economize com nossos kits</p>
                </div>
                
                <div className="flex flex-col items-center text-center element-card-hover">
                  <div className="bg-element-blue-neon rounded-full p-4 mb-4">
                    <Cigarette className="h-10 w-10 text-element-blue-dark" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Narguilé</h3>
                  <p className="text-element-gray-light text-sm">Essências e acessórios</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
