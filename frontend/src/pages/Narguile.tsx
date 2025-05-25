import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { 
  Flame, 
  ShoppingCart, 
  Plus, 
  Star, 
  PackageCheck, 
  ArrowRight, 
  Filter, 
  SlidersHorizontal 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Product interface
interface NarguileProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  originalPrice?: string;
  discountPercentage?: number;
  image: string;
  category: string;
  rating: number;
  stock: string;
  badge?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  tags?: string[];
}

// Função utilitária para imagem
function getImageUrl(image?: string) {
  if (!image) return '/placeholder.png';
  if (image.startsWith('http')) return image;
  if (image.startsWith('/uploads')) return `https://adega-flow-digital.onrender.com${image}`;
  return image;
}

const Narguile = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const ids = [
      '38b881e9-853a-4cbc-b37b-53e4fa96c553', // Essências
      'e1415b1d-c6fc-475c-befb-67f5b27bcf27'  // Carvão
    ];
    Promise.all(ids.map(id => fetch(`https://adega-flow-digital.onrender.com/api/products?categoryId=${id}`).then(res => res.json())))
      .then(results => {
        setProducts(results.flat());
        console.log('Produtos carregados para Narguile:', results.flat());
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Featured products
  const featuredProducts = products.filter(product => product.isFeatured);

  // Rating stars component
  const RatingStars = ({ rating }: { rating: number }) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < Math.floor(rating ?? 0)
                ? 'text-yellow-400 fill-yellow-400'
                : i < (rating ?? 0)
                ? 'text-yellow-400 fill-yellow-400 opacity-50'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-xs text-element-gray-dark/70">{(rating ?? 0).toFixed(1)}</span>
      </div>
    );
  };

  // Card simplificado
  const ProductCard = ({ product }: { product: any }) => {
    return (
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border-element-gray-light hover:border-element-blue-neon h-full flex flex-col">
        <div className="relative">
          <AspectRatio ratio={4/3}>
            <img src={getImageUrl(product.image)} alt={product.name} className="object-contain w-full h-full bg-white" />
          </AspectRatio>
        </div>
        <CardContent className="p-4 flex-grow">
          <h3 className="font-bold text-lg mb-1 text-element-blue-dark">{product.name}</h3>
          <p className="text-element-gray-dark/80 text-sm mb-3 min-h-[40px]">{product.description}</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-element-blue-dark font-bold text-xl">R$ {typeof product.price === 'string' ? product.price : product.price?.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-0 mt-auto">
          <Button className="rounded-none bg-element-blue-dark text-white hover:bg-element-blue-neon hover:text-element-gray-dark h-12 w-full">
            <Plus className="w-4 h-4 mr-2" /> Detalhes
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('todos');
  const [priceRange, setPriceRange] = useState([0, 300]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filtros por categoria (botões)
  const categoriasFiltro = [
    { label: 'Todos', value: 'todos' },
    { label: 'Essências', value: 'Essências' },
    { label: 'Carvão', value: 'Carvão' }
  ];
  
  // IDs das categorias
  const CATEGORIA_ESSENCIAS = '38b881e9-853a-4cbc-b37b-53e4fa96c553';
  const CATEGORIA_CARVAO = 'e1415b1d-c6fc-475c-befb-67f5b27bcf27';
  
  // Filtro de produtos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory =
      activeCategory === 'todos' ||
      (activeCategory === 'Essências' && (product.categoryId === CATEGORIA_ESSENCIAS || product.category?.id === CATEGORIA_ESSENCIAS)) ||
      (activeCategory === 'Carvão' && (product.categoryId === CATEGORIA_CARVAO || product.category?.id === CATEGORIA_CARVAO));
    return matchesSearch && matchesCategory;
  });
  
  // Após o filtro de produtos
  console.log('Produtos filtrados:', filteredProducts);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-element-blue-dark to-element-gray-dark text-white py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="mb-4 bg-element-blue-neon text-element-gray-dark hover:bg-element-blue-neon animate-pulse-soft">
                <Flame className="w-4 h-4 mr-1" /> Experiência Premium
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold mb-4">Produtos para Narguilé</h1>
              <p className="text-element-gray-light mb-6 text-lg">
                Encontre os melhores narguilés, essências e acessórios para a sua sessão perfeita
              </p>
            </div>
          </div>
        </section>
        
        {/* Featured Products Carousel */}
        {featuredProducts.length > 0 && (
          <section className="py-10 bg-element-gray-light">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold mb-6 text-element-blue-dark">Destaques em Narguilé</h2>
              
              <Carousel className="w-full max-w-5xl mx-auto">
                <CarouselContent>
                  {featuredProducts.map((product) => (
                    <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/3">
                      <div className="p-2">
                        <ProductCard product={product} />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex justify-center mt-4">
                  <CarouselPrevious />
                  <CarouselNext />
                </div>
              </Carousel>
            </div>
          </section>
        )}
        
        {/* Filter Section */}
        <section className="bg-white py-6 sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4">
              <h2 className="text-2xl font-bold mb-4 md:mb-0 text-element-blue-dark">Produtos para Narguilé</h2>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-grow md:w-72">
                  <Input
                    type="text"
                    placeholder="Buscar produtos..."
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
                
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setShowFilters(!showFilters)}
                  className="md:hidden"
                >
                  <Filter className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className={`${showFilters ? 'block' : 'hidden md:block'}`}>
              <div className="flex gap-2 mb-6">
                {categoriasFiltro.map((cat) => (
                  <Button
                    key={cat.value}
                    variant={activeCategory === cat.value ? 'default' : 'outline'}
                    onClick={() => {
                      setActiveCategory(cat.value);
                      setSearchTerm('');
                    }}
                    className={activeCategory === cat.value ? 'bg-element-blue-dark text-white' : ''}
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* Products Grid */}
        <section className="py-8 md:py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <h4 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h4>
                  <p className="text-element-gray-dark/70">Tente ajustar sua busca ou filtros</p>
                </div>
              ) : (
                filteredProducts.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))
              )}
            </div>
          </div>
        </section>
        
        {/* Benefits */}
        <section className="bg-element-gray-light py-10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg text-center">
                <div className="w-12 h-12 bg-element-blue-neon rounded-full flex items-center justify-center mx-auto mb-4">
                  <PackageCheck className="h-6 w-6 text-element-gray-dark" />
                </div>
                <h3 className="font-bold text-lg mb-2">Entrega Rápida</h3>
                <p className="text-element-gray-dark/80 text-sm">Receba seus produtos de narguilé em até 24h na região</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg text-center">
                <div className="w-12 h-12 bg-element-blue-neon rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-element-gray-dark" />
                </div>
                <h3 className="font-bold text-lg mb-2">Produtos Premium</h3>
                <p className="text-element-gray-dark/80 text-sm">Selecionamos apenas os melhores produtos para você</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg text-center">
                <div className="w-12 h-12 bg-element-blue-neon rounded-full flex items-center justify-center mx-auto mb-4">
                  <Flame className="h-6 w-6 text-element-gray-dark" />
                </div>
                <h3 className="font-bold text-lg mb-2">Dicas de Especialista</h3>
                <p className="text-element-gray-dark/80 text-sm">Orientação para montagem e uso do seu narguilé</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Call to Action */}
        <section className="bg-element-blue-dark py-8 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-xl md:text-2xl font-bold mb-4">Compre online e retire na loja</h2>
            <p className="text-element-gray-light mb-6 max-w-2xl mx-auto">
              Faça seu pedido agora e retire na Element Adega sem custo de entrega
            </p>
            <Link to="/login" className="inline-flex items-center bg-element-blue-neon text-element-gray-dark px-6 py-3 rounded-lg font-medium hover:bg-element-blue-neon/80 transition-colors">
              Fazer cadastro <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Narguile;
