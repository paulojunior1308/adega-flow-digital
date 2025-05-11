
import React, { useState } from 'react';
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

const promoData: PromoCardProps[] = [
  {
    id: '1',
    title: 'Kit Skol + Carvão',
    description: '12 Cervejas Skol 350ml + 1 pacote de carvão',
    image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9',
    price: 'R$ 39,90',
    originalPrice: 'R$ 55,00',
    discountPercentage: 30,
    validUntil: '2025-05-20',
    category: 'cerveja',
    badge: 'TOP VENDAS'
  },
  {
    id: '2',
    title: 'Combo Festa',
    description: '1 Vodka Smirnoff + 6 Energéticos + Gelo',
    image: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901',
    price: 'R$ 89,90',
    originalPrice: 'R$ 110,00',
    discountPercentage: 20,
    validUntil: '2025-05-25',
    category: 'destilado',
    badge: 'PROMOÇÃO'
  },
  {
    id: '3',
    title: 'Kit Narguilé Iniciante',
    description: 'Narguilé + Essência + Carvão + Acessórios',
    image: 'https://images.unsplash.com/photo-1721322800607-8c38375eef04',
    price: 'R$ 120,00',
    originalPrice: 'R$ 150,00',
    discountPercentage: 20,
    validUntil: '2025-05-30',
    category: 'narguile',
    badge: 'NOVIDADE'
  },
  {
    id: '4',
    title: 'Whisky Jack Daniel\'s',
    description: 'Garrafa 1L Original',
    image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9',
    price: 'R$ 139,90',
    originalPrice: 'R$ 169,90',
    discountPercentage: 15,
    validUntil: '2025-05-18',
    category: 'destilado'
  },
  {
    id: '5',
    title: 'Kit Red Bull + Vodka',
    description: '6 Red Bull 250ml + 1 Vodka Absolut 750ml',
    image: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901',
    price: 'R$ 119,90',
    originalPrice: 'R$ 145,00',
    discountPercentage: 17,
    validUntil: '2025-05-22',
    category: 'energetico'
  },
  {
    id: '6',
    title: 'Brahma Duplo Malte',
    description: 'Pack com 12 latas de 350ml',
    image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9',
    price: 'R$ 39,90',
    originalPrice: 'R$ 48,00',
    discountPercentage: 17,
    validUntil: '2025-06-01',
    category: 'cerveja'
  },
  {
    id: '7',
    title: 'Essências Premium',
    description: 'Kit com 5 essências de narguilé premium',
    image: 'https://images.unsplash.com/photo-1721322800607-8c38375eef04',
    price: 'R$ 99,90',
    originalPrice: 'R$ 125,00',
    discountPercentage: 20,
    validUntil: '2025-05-15',
    category: 'narguile'
  },
  {
    id: '8',
    title: 'Monster Energy',
    description: 'Kit com 6 latas de 473ml',
    image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9',
    price: 'R$ 45,90',
    originalPrice: 'R$ 59,90',
    discountPercentage: 23,
    validUntil: '2025-05-28',
    category: 'energetico'
  }
];

const PromoCard = ({ promo }: { promo: PromoCardProps }) => {
  const daysLeft = promo.validUntil ? 
    Math.ceil((new Date(promo.validUntil).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;
  
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border-element-gray-light hover:border-element-blue-neon">
      <div className="relative">
        <AspectRatio ratio={4/3}>
          <img src={promo.image} alt={promo.title} className="object-cover w-full h-full" />
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
          <Button variant="outline" className="rounded-none border-t border-r h-12">
            <ShoppingCart className="w-4 h-4 mr-2" /> Adicionar
          </Button>
          <Button className="rounded-none bg-element-blue-dark text-white hover:bg-element-blue-neon hover:text-element-gray-dark h-12">
            <Plus className="w-4 h-4 mr-2" /> Detalhes
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

const Promocoes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('todos');
  
  const filteredPromos = promoData.filter(promo => {
    const matchesSearch = promo.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          promo.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeCategory === 'todos') {
      return matchesSearch;
    }
    
    return matchesSearch && promo.category === activeCategory;
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
            
            <Tabs
              defaultValue="todos"
              className="w-full"
              onValueChange={setActiveCategory}
              value={activeCategory}
            >
              <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-6 bg-white overflow-x-auto">
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="cerveja">Cervejas</TabsTrigger>
                <TabsTrigger value="destilado">Destilados</TabsTrigger>
                <TabsTrigger value="narguile">Narguilé</TabsTrigger>
                <TabsTrigger value="energetico">Energéticos</TabsTrigger>
                <TabsTrigger value="combo">Combos</TabsTrigger>
              </TabsList>
            </Tabs>
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
