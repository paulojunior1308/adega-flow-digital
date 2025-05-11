
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Search, Filter, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

const categories = [
  { id: 'all', name: 'Todos' },
  { id: 'cervejas', name: 'Cervejas' },
  { id: 'destilados', name: 'Destilados' },
  { id: 'narguile', name: 'Narguilé' },
  { id: 'energeticos', name: 'Energéticos' },
];

interface ComboItem {
  id: string;
  title: string;
  description: string;
  price: string;
  oldPrice?: string;
  image: string;
  category: string;
  popular: boolean;
  items: string[];
}

const comboData: ComboItem[] = [
  {
    id: 'combo-1',
    title: 'Combo Cerveja',
    description: 'Combo perfeito para o seu fim de semana com amigos!',
    price: 'R$ 79,90',
    oldPrice: 'R$ 99,90',
    image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9',
    category: 'cervejas',
    popular: true,
    items: [
      "12 Cervejas Skol 350ml",
      "6 Cervejas Heineken 350ml",
      "1 Pacote de Gelo",
      "1 Pacote de Carvão"
    ]
  },
  {
    id: 'combo-2',
    title: 'Combo Destilados',
    description: 'O combo ideal para quem gosta de drinks diversos.',
    price: 'R$ 199,90',
    oldPrice: 'R$ 239,90',
    image: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901',
    category: 'destilados',
    popular: true,
    items: [
      "1 Vodka Absolut 750ml",
      "1 Whisky Red Label 750ml",
      "2 Energéticos",
      "1 Refrigerante 2L"
    ]
  },
  {
    id: 'combo-3',
    title: 'Combo Narguilé',
    description: 'Tudo que você precisa para uma sessão de narguilé completa.',
    price: 'R$ 249,90',
    image: 'https://images.unsplash.com/photo-1721322800607-8c38375eef04',
    category: 'narguile',
    popular: true,
    items: [
      "1 Narguilé Completo",
      "3 Essências Love66",
      "1 Pacote de Carvão",
      "Acessórios"
    ]
  },
  {
    id: 'combo-4',
    title: 'Combo Energético',
    description: 'Energia garantida para suas festas e eventos.',
    price: 'R$ 89,90',
    oldPrice: 'R$ 109,90',
    image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9',
    category: 'energeticos',
    popular: false,
    items: [
      "6 Energéticos Red Bull 250ml",
      "6 Energéticos Monster 473ml",
      "1 Vodka Smirnoff 998ml"
    ]
  },
  {
    id: 'combo-5',
    title: 'Combo Festa',
    description: 'Tudo que você precisa para sua festa!',
    price: 'R$ 349,90',
    oldPrice: 'R$ 399,90',
    image: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901',
    category: 'cervejas',
    popular: false,
    items: [
      "24 Cervejas Brahma 350ml",
      "1 Vodka Smirnoff 998ml",
      "1 Whisky Red Label 750ml",
      "4 Energéticos",
      "2 Refrigerantes 2L",
      "1 Pacote de Gelo"
    ]
  },
  {
    id: 'combo-6',
    title: 'Kit Essencial Narguilé',
    description: 'Kit básico para iniciantes em narguilé.',
    price: 'R$ 149,90',
    image: 'https://images.unsplash.com/photo-1721322800607-8c38375eef04',
    category: 'narguile',
    popular: false,
    items: [
      "1 Narguilé Pequeno",
      "2 Essências",
      "1 Pacote de Carvão",
      "Manual de Instruções"
    ]
  },
];

const Combos = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredCombos = comboData.filter(combo => {
    const matchesCategory = activeCategory === 'all' || combo.category === activeCategory;
    const matchesSearch = combo.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        combo.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  const popularCombos = comboData.filter(combo => combo.popular);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-element-blue-dark to-element-gray-dark text-white py-12">
          <div className="element-container">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0 md:max-w-lg">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">Combos Especiais</h1>
                <p className="text-lg mb-6">
                  As melhores opções em combos de bebidas, destilados e produtos para narguilé. 
                  Economize com nossos pacotes exclusivos!
                </p>
                <Button className="element-btn-primary">Ver todos os combos</Button>
              </div>
              <div className="w-full md:w-1/2 lg:w-1/3">
                <Carousel className="w-full">
                  <CarouselContent>
                    {popularCombos.map((combo) => (
                      <CarouselItem key={combo.id} className="md:basis-1/2">
                        <Card className="bg-element-gray-dark border-element-blue-neon">
                          <CardContent className="p-0">
                            <div className="relative">
                              <img 
                                src={combo.image} 
                                alt={combo.title} 
                                className="w-full h-48 object-cover rounded-t-lg" 
                              />
                              <div className="absolute top-2 right-2 bg-element-blue-neon text-element-gray-dark px-2 py-1 rounded-md text-sm font-bold">
                                Popular
                              </div>
                            </div>
                            <div className="p-4">
                              <h3 className="font-bold text-xl text-element-blue-neon">{combo.title}</h3>
                              <p className="text-element-gray-light line-clamp-2 h-12">{combo.description}</p>
                              <div className="flex justify-between items-center mt-3">
                                <div className="flex flex-col">
                                  <span className="font-bold text-element-blue-neon text-xl">{combo.price}</span>
                                  {combo.oldPrice && (
                                    <span className="text-sm text-element-gray-light line-through">{combo.oldPrice}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden md:flex bg-element-blue-dark text-white border-element-blue-neon" />
                  <CarouselNext className="hidden md:flex bg-element-blue-dark text-white border-element-blue-neon" />
                </Carousel>
              </div>
            </div>
          </div>
        </section>
        
        {/* Filters and Search */}
        <section className="py-8 bg-element-gray-light">
          <div className="element-container">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                <Filter className="h-5 w-5 text-element-blue-dark" />
                <span className="font-medium text-element-blue-dark">Filtrar:</span>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={`px-4 py-2 rounded-full whitespace-nowrap ${
                      activeCategory === category.id
                        ? 'bg-element-blue-dark text-white'
                        : 'bg-white text-element-blue-dark hover:bg-element-blue-neon hover:text-element-gray-dark'
                    }`}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
              
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-element-gray-dark/60" />
                <input
                  type="text"
                  placeholder="Buscar combos..."
                  className="element-input pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>
        
        {/* Combos Grid */}
        <section className="py-12">
          <div className="element-container">
            {filteredCombos.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-bold text-element-blue-dark mb-2">Nenhum combo encontrado</h3>
                <p className="text-element-gray-dark">Tente usar outros filtros ou termos de busca.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCombos.map((combo) => (
                  <div key={combo.id} className="element-card element-card-hover p-0 overflow-hidden">
                    <div className="aspect-video">
                      <img
                        src={combo.image}
                        alt={combo.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-element-blue-dark mb-2">
                        {combo.title}
                      </h3>
                      <p className="text-element-gray-dark mb-4 line-clamp-2">
                        {combo.description}
                      </p>
                      
                      <div className="mb-4">
                        <h4 className="font-medium text-element-blue-dark mb-2">O combo inclui:</h4>
                        <ul className="list-disc pl-5 text-element-gray-dark">
                          {combo.items.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="flex items-end justify-between mt-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-2xl text-element-blue-dark">
                            {combo.price}
                          </span>
                          {combo.oldPrice && (
                            <span className="text-sm text-element-gray-dark line-through">
                              {combo.oldPrice}
                            </span>
                          )}
                        </div>
                        <Button className="element-btn-primary flex items-center">
                          <ShoppingCart className="mr-2 h-5 w-5" />
                          Comprar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-12 bg-element-blue-dark text-white">
          <div className="element-container text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Quer um combo personalizado?
            </h2>
            <p className="text-element-gray-light mb-8 max-w-2xl mx-auto">
              Entre em contato conosco e crie um combo especial com suas bebidas favoritas.
              Oferecemos preços especiais para eventos e festas!
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button className="element-btn-secondary">
                Entrar em contato
              </Button>
              <Link to="/promocoes">
                <Button variant="outline" className="border-element-blue-neon text-element-blue-neon hover:bg-element-blue-neon hover:text-element-gray-dark">
                  Ver promoções
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Combos;
