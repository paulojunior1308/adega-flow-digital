import React, { useState, useEffect } from 'react';
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
import { AspectRatio } from '@/components/ui/aspect-ratio';

const categories = [
  { id: 'all', name: 'Todos' },
  { id: 'cervejas', name: 'Cervejas' },
  { id: 'destilados', name: 'Destilados' },
  { id: 'narguile', name: 'Narguilé' },
  { id: 'energeticos', name: 'Energéticos' },
];

// Adicionar função utilitária para tratar a URL da imagem
function getImageUrl(image?: string) {
  if (!image) return '/placeholder.png';
  if (image.startsWith('http')) return image;
  if (image.startsWith('/uploads')) return `http://localhost:3333${image}`;
  return image;
}

const Combos = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [combos, setCombos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('http://localhost:3333/api/combos')
      .then(res => res.json())
      .then(data => {
        setCombos(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  
  const filteredCombos = combos.filter(combo => {
    const matchesSearch = combo.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (combo.description && combo.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });
  
  const popularCombos = combos.filter(combo => combo.popular);
  
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
                                src={getImageUrl(combo.image)}
                                alt={combo.name}
                                className="w-full h-48 object-contain bg-white rounded-t-lg" 
                              />
                              <div className="absolute top-2 right-2 bg-element-blue-neon text-element-gray-dark px-2 py-1 rounded-md text-sm font-bold">
                                Popular
                              </div>
                            </div>
                            <div className="p-4">
                              <h3 className="font-bold text-xl text-element-blue-neon">{combo.name}</h3>
                              <p className="text-element-gray-light line-clamp-2 h-12">{combo.description || combo.name}</p>
                              <div className="flex justify-between items-center mt-3">
                                <div className="flex flex-col">
                                  {combo.price && (
                                    <span className="font-bold text-element-blue-neon text-xl">R$ {combo.price}</span>
                                  )}
                                  {combo.oldPrice && (
                                    <span className="text-sm text-element-gray-light line-through">R$ {combo.oldPrice}</span>
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
                      <AspectRatio ratio={4/3}>
                        <img
                          src={getImageUrl(combo.image)}
                          alt={combo.name}
                          className="object-contain w-full h-full bg-white"
                        />
                      </AspectRatio>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-element-blue-dark mb-2">
                        {combo.name}
                      </h3>
                      <p className="text-element-gray-dark mb-4 line-clamp-2">
                        {combo.description || combo.name}
                      </p>
                      
                      <div className="mb-4">
                        <h4 className="font-medium text-element-blue-dark mb-2">O combo inclui:</h4>
                        <ul className="list-disc pl-5 text-element-gray-dark">
                          {combo.items.map((item, index) => (
                            <li key={index}>
                              {item.product?.name || 'Produto'}
                              {item.quantity ? ` x${item.quantity}` : ''}
                            </li>
                          ))}
                        </ul>
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
