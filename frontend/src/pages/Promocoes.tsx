import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { TicketPercent, ShoppingCart, Plus, Calendar, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface PromoCardProps {
  id: string;
  title: string;
  description: string;
  image: string;
  price: string;
  originalPrice?: string;
  discountPercentage?: number;
  validUntil?: string;
  category: string;
  badge?: string;
}

const PromoCard = ({ promo }: { promo: PromoCardProps }) => {
  const daysLeft = promo.validUntil ? 
    Math.ceil((new Date(promo.validUntil).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;
  
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border-element-gray-light hover:border-element-blue-neon">
      <div className="relative">
        <AspectRatio ratio={4/3}>
          <img src={promo.image} alt={promo.title} className="object-contain w-full h-full bg-white" />
        </AspectRatio>
        
        {promo.discountPercentage && (
          <div className="absolute top-2 right-2 bg-element-blue-neon text-element-gray-dark px-2 py-1 rounded-full font-bold text-sm flex items-center gap-1">
            <TicketPercent className="w-4 h-4" />
            {promo.discountPercentage}% OFF
          </div>
        )}
        
        {promo.badge && (
          <div className="absolute top-2 left-2 bg-element-blue-dark text-white px-2 py-1 rounded-full text-xs font-bold">
            {promo.badge}
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-bold text-lg mb-1 text-element-blue-dark">{promo.title}</h3>
        <p className="text-element-gray-dark/80 text-sm mb-3 min-h-[40px]">{promo.description}</p>
        
        <div className="flex items-end justify-between">
          <div>
            <p className="text-element-blue-dark font-bold text-xl">{promo.price}</p>
            {promo.originalPrice && (
              <p className="text-element-gray-dark/60 text-sm line-through">{promo.originalPrice}</p>
            )}
          </div>
          
          {promo.validUntil && (
            <div className="text-right text-xs">
              <p className="text-element-gray-dark/80 flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {daysLeft > 0 ? `Válido por mais ${daysLeft} dias` : 'Expira hoje!'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-0">
        <div className="grid grid-cols-2 w-full">
          <Button className="rounded-none bg-element-blue-dark text-white hover:bg-element-blue-neon hover:text-element-gray-dark h-12">
            <Plus className="w-4 h-4 mr-2" /> Detalhes
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

const Promocoes = () => {
  const [promos, setPromos] = useState<PromoCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetch('http://localhost:3333/api/promotions')
      .then(res => res.json())
      .then(data => {
        setPromos(data.map((promo: any) => ({
          id: promo.id,
          title: promo.name,
          description: promo.description,
          image: promo.image ? `http://localhost:3333${promo.image}` : '',
          price: `R$ ${promo.price.toFixed(2)}`,
          originalPrice: promo.originalPrice ? `R$ ${promo.originalPrice.toFixed(2)}` : undefined,
          discountPercentage: promo.originalPrice ? Math.round(((promo.originalPrice - promo.price) / promo.originalPrice) * 100) : undefined,
          validUntil: undefined,
          category: promo.products[0]?.category?.name?.toLowerCase() || 'outros',
          badge: undefined
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  
  const filteredPromos = promos.filter(promo => {
    return promo.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
           promo.description.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-element-blue-dark to-element-gray-dark text-white py-12 md:py-20">
          <div className="element-container">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="mb-4 bg-element-blue-neon text-element-gray-dark hover:bg-element-blue-neon animate-pulse-soft">
                <TicketPercent className="w-4 h-4 mr-1" /> Descontos Exclusivos
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold mb-4">Promoções Imperdíveis</h1>
              <p className="text-element-gray-light mb-6 text-lg">
                Economize em bebidas, combos e produtos para narguilé com nossas ofertas especiais
              </p>
            </div>
          </div>
        </section>
        
        {/* Filter Section */}
        <section className="bg-element-gray-light py-6">
          <div className="element-container">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
              <h2 className="element-heading mb-4 md:mb-0">Nossas Promoções</h2>
              
              <div className="relative w-full md:w-72">
                <Input
                  type="text"
                  placeholder="Buscar promoções..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute left-2.5 top-2.5 h-5 w-5 text-element-gray-dark/50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>
        
        {/* Promotions Grid */}
        <section className="py-8 md:py-12 bg-white">
          <div className="element-container">
            {filteredPromos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPromos.map((promo) => (
                  <PromoCard key={promo.id} promo={promo} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-bold text-element-gray-dark">Nenhuma promoção encontrada</h3>
                <p className="text-element-gray-dark/70 mt-2">Tente ajustar sua busca ou categoria</p>
              </div>
            )}
          </div>
        </section>
        
        {/* Call to Action */}
        <section className="bg-element-gray-light py-8">
          <div className="element-container text-center">
            <h2 className="text-xl md:text-2xl font-bold mb-4">Não perca nossas ofertas exclusivas</h2>
            <p className="text-element-gray-dark mb-6 max-w-2xl mx-auto">
              Cadastre-se para receber alertas sobre novas promoções e descontos exclusivos
            </p>
            <Link to="/login" className="element-btn-primary inline-flex items-center">
              Fazer cadastro <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Promocoes;
