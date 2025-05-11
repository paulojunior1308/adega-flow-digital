
import React, { useState } from 'react';
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

// Sample data
const narguileProducts: NarguileProduct[] = [
  {
    id: '1',
    title: 'Narguilé Small Hookah',
    description: 'Kit completo para iniciantes com todos os acessórios',
    price: 'R$ 199,90',
    originalPrice: 'R$ 239,90',
    discountPercentage: 15,
    image: 'https://images.unsplash.com/photo-1721322800607-8c38375eef04',
    category: 'kits',
    rating: 4.5,
    stock: 'Em estoque',
    badge: 'MAIS VENDIDO',
    isFeatured: true,
    tags: ['iniciante', 'completo']
  },
  {
    id: '2',
    title: 'Essência Premium Menta',
    description: 'Sabor refrescante para uma experiência incrível',
    price: 'R$ 29,90',
    image: 'https://images.unsplash.com/photo-1721322800607-8c38375eef04',
    category: 'essencias',
    rating: 5,
    stock: 'Em estoque',
    isNew: true,
    tags: ['menta', 'premium']
  },
  {
    id: '3',
    title: 'Carvão Natural Premium',
    description: 'Carvão de alta duração para uma sessão perfeita',
    price: 'R$ 19,90',
    originalPrice: 'R$ 24,90',
    discountPercentage: 20,
    image: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901',
    category: 'acessorios',
    rating: 4.8,
    stock: 'Em estoque',
    tags: ['carvão', 'premium']
  },
  {
    id: '4',
    title: 'Queimador para Carvão',
    description: 'Acenda seus carvões de forma prática e rápida',
    price: 'R$ 39,90',
    image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9',
    category: 'acessorios',
    rating: 4.2,
    stock: 'Em estoque',
    tags: ['acendedor', 'acessório']
  },
  {
    id: '5',
    title: 'Mangueira de Narguilé Silicone',
    description: 'Mangueira de alta qualidade para maior durabilidade',
    price: 'R$ 59,90',
    originalPrice: 'R$ 79,90',
    discountPercentage: 25,
    image: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901',
    category: 'acessorios',
    rating: 4.7,
    stock: 'Em estoque',
    tags: ['mangueira', 'silicone']
  },
  {
    id: '6',
    title: 'Rosh Premium de Cerâmica',
    description: 'Rosh de alta qualidade para maior sabor',
    price: 'R$ 69,90',
    image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9',
    category: 'acessorios',
    rating: 4.9,
    stock: 'Em estoque',
    badge: 'PREMIUM',
    isNew: true,
    tags: ['rosh', 'cerâmica']
  },
  {
    id: '7',
    title: 'Kit com 5 Essências Variadas',
    description: 'Experimente diferentes sabores com esse kit exclusivo',
    price: 'R$ 99,90',
    originalPrice: 'R$ 129,90',
    discountPercentage: 23,
    image: 'https://images.unsplash.com/photo-1721322800607-8c38375eef04',
    category: 'essencias',
    rating: 4.8,
    stock: 'Em estoque',
    badge: 'COMBO',
    isFeatured: true,
    tags: ['essências', 'kit']
  },
  {
    id: '8',
    title: 'Narguilé Compacto Portátil',
    description: 'Ideal para levar em viagens e reuniões',
    price: 'R$ 149,90',
    image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9',
    category: 'kits',
    rating: 4.3,
    stock: 'Últimas unidades',
    tags: ['portátil', 'compacto']
  }
];

// Featured products
const featuredProducts = narguileProducts.filter(product => product.isFeatured);

// Rating stars component
const RatingStars = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < Math.floor(rating)
              ? 'text-yellow-400 fill-yellow-400'
              : i < rating
              ? 'text-yellow-400 fill-yellow-400 opacity-50'
              : 'text-gray-300'
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-element-gray-dark/70">{rating.toFixed(1)}</span>
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product }: { product: NarguileProduct }) => {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border-element-gray-light hover:border-element-blue-neon h-full flex flex-col">
      <div className="relative">
        <AspectRatio ratio={4/3}>
          <img src={product.image} alt={product.title} className="object-cover w-full h-full" />
        </AspectRatio>
        
        {product.discountPercentage && (
          <div className="absolute top-2 right-2 bg-element-blue-neon text-element-gray-dark px-2 py-1 rounded-full font-bold text-sm flex items-center gap-1">
            <Flame className="w-4 h-4" />
            {product.discountPercentage}% OFF
          </div>
        )}
        
        {product.badge && (
          <div className="absolute top-2 left-2 bg-element-blue-dark text-white px-2 py-1 rounded-full text-xs font-bold">
            {product.badge}
          </div>
        )}

        {product.isNew && !product.badge && (
          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            NOVO
          </div>
        )}
      </div>
      
      <CardContent className="p-4 flex-grow">
        <h3 className="font-bold text-lg mb-1 text-element-blue-dark">{product.title}</h3>
        <p className="text-element-gray-dark/80 text-sm mb-3 min-h-[40px]">{product.description}</p>
        
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-2">
            <RatingStars rating={product.rating} />
            <span className="text-xs flex items-center gap-1 text-green-600 font-medium">
              <PackageCheck className="h-3 w-3" /> {product.stock}
            </span>
          </div>
          
          <div className="flex items-end justify-between">
            <div>
              <p className="text-element-blue-dark font-bold text-xl">{product.price}</p>
              {product.originalPrice && (
                <p className="text-element-gray-dark/60 text-sm line-through">{product.originalPrice}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-0 mt-auto">
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

const Narguile = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('todos');
  const [priceRange, setPriceRange] = useState([0, 300]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter products based on search, category and price
  const filteredProducts = narguileProducts.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeCategory === 'todos' ? true : product.category === activeCategory;
    
    // Extract numeric price for comparison
    const numericPrice = parseInt(product.price.replace(/\D/g, '')) / 100;
    const matchesPrice = numericPrice >= priceRange[0] && numericPrice <= priceRange[1];
    
    return matchesSearch && matchesCategory && matchesPrice;
  });
  
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
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <Tabs
                  defaultValue="todos"
                  className="w-full md:w-auto"
                  onValueChange={setActiveCategory}
                  value={activeCategory}
                >
                  <TabsList className="grid grid-cols-3 md:flex bg-white overflow-x-auto">
                    <TabsTrigger value="todos">Todos</TabsTrigger>
                    <TabsTrigger value="kits">Narguilés</TabsTrigger>
                    <TabsTrigger value="essencias">Essências</TabsTrigger>
                    <TabsTrigger value="acessorios">Acessórios</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <div className="md:ml-auto flex items-center gap-2 w-full md:w-auto">
                  <span className="text-sm text-element-gray-dark/70 whitespace-nowrap">Preço: R${priceRange[0]} - R${priceRange[1]}</span>
                  <Slider
                    defaultValue={[0, 300]}
                    max={300}
                    step={10}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="w-full max-w-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Products Grid */}
        <section className="py-8 md:py-12 bg-white">
          <div className="container mx-auto px-4">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-bold text-element-gray-dark">Nenhum produto encontrado</h3>
                <p className="text-element-gray-dark/70 mt-2">Tente ajustar sua busca ou filtros</p>
              </div>
            )}
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
