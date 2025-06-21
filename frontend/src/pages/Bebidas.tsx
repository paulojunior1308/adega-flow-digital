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
  Martini, 
  Beer, 
  Wine, 
  ShoppingCart, 
  Plus, 
  Search, 
  SlidersHorizontal 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductProps {
  id: string;
  title: string;
  description: string;
  image: string;
  price: string;
  originalPrice?: string;
  discountPercentage?: number;
  category: string;
  subCategory: string;
  badge?: string;
  rating?: number;
  stock: number;
}

const productsData: ProductProps[] = [
  {
    id: '1',
    title: 'Cerveja Heineken',
    description: 'Lata 350ml - Original Holandesa',
    image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9',
    price: 'R$ 5,90',
    category: 'cerveja',
    subCategory: 'importada',
    stock: 120
  },
  {
    id: '2',
    title: 'Vodka Absolut',
    description: 'Garrafa 750ml - Original Sueca',
    image: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901',
    price: 'R$ 89,90',
    originalPrice: 'R$ 99,90',
    discountPercentage: 10,
    category: 'destilado',
    subCategory: 'vodka',
    badge: 'PROMOÇÃO',
    rating: 5,
    stock: 35
  },
  {
    id: '3',
    title: 'Red Bull Energy Drink',
    description: 'Lata 250ml - Tradicional',
    image: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e',
    price: 'R$ 9,90',
    category: 'energetico',
    subCategory: 'tradicional',
    rating: 4.8,
    stock: 86
  },
  {
    id: '4',
    title: 'Whisky Jack Daniel\'s',
    description: 'Garrafa 1L - Tennessee',
    image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9',
    price: 'R$ 139,90',
    category: 'destilado',
    subCategory: 'whisky',
    rating: 4.9,
    stock: 42
  },
  {
    id: '5',
    title: 'Vinho Tinto Salton',
    description: 'Intenso - Garrafa 750ml',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3',
    price: 'R$ 45,90',
    originalPrice: 'R$ 55,90',
    discountPercentage: 18,
    category: 'vinho',
    subCategory: 'tinto',
    badge: 'DESTAQUE',
    rating: 4.7,
    stock: 28
  },
  {
    id: '6',
    title: 'Cerveja Brahma Duplo Malte',
    description: 'Pack com 12 latas de 350ml',
    image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9',
    price: 'R$ 39,90',
    category: 'cerveja',
    subCategory: 'nacional',
    rating: 4.5,
    stock: 72
  },
  {
    id: '7',
    title: 'Gin Tanqueray',
    description: 'Garrafa 750ml - Londres',
    image: 'https://images.unsplash.com/photo-1617824254359-269da6fa0a83',
    price: 'R$ 129,90',
    originalPrice: 'R$ 149,90',
    discountPercentage: 13,
    category: 'destilado',
    subCategory: 'gin',
    rating: 4.9,
    stock: 23
  },
  {
    id: '8',
    title: 'Coca-Cola Zero',
    description: 'Pack com 6 latas de 350ml',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97',
    price: 'R$ 25,90',
    category: 'refrigerante',
    subCategory: 'zero',
    stock: 96
  },
  {
    id: '9',
    title: 'Cerveja Corona',
    description: 'Pack com 6 garrafas de 330ml',
    image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9',
    price: 'R$ 42,90',
    category: 'cerveja',
    subCategory: 'importada',
    rating: 4.7,
    stock: 45
  },
  {
    id: '10',
    title: 'Água Mineral Sem Gás',
    description: 'Garrafa 500ml',
    image: 'https://images.unsplash.com/photo-1564419320461-6870880221ad',
    price: 'R$ 2,50',
    category: 'agua',
    subCategory: 'sem-gas',
    stock: 150
  },
  {
    id: '11',
    title: 'Tequila José Cuervo',
    description: 'Garrafa 750ml - Prata',
    image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9',
    price: 'R$ 109,90',
    category: 'destilado',
    subCategory: 'tequila',
    rating: 4.6,
    stock: 18
  },
  {
    id: '12',
    title: 'Suco Del Valle',
    description: 'Caixa 1L - Uva',
    image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b',
    price: 'R$ 8,90',
    category: 'suco',
    subCategory: 'pronto',
    stock: 64
  }
];

const featuredProducts = [
  productsData[1], // Vodka Absolut
  productsData[4], // Vinho Tinto
  productsData[6], // Gin Tanqueray
  productsData[3]  // Whisky Jack Daniel's
];

const ProductCard = ({ product }: { product: any }) => {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border-element-gray-light hover:border-element-blue-neon h-full flex flex-col">
      <AspectRatio ratio={4/3} className="bg-white">
        <img 
          src={product.image ? (product.image.startsWith('http') ? product.image : `${import.meta.env.VITE_API_URL}${product.image}`) : ''}
          alt={product.name}
          className="w-full h-full object-contain"
        />
      </AspectRatio>
      
      <CardContent className="p-4 flex-grow flex flex-col">
        <h3 className="font-bold text-lg mb-1 text-element-blue-dark flex-grow">{product.name}</h3>
        <p className="text-element-gray-dark/80 text-sm mb-3 min-h-[40px]">{product.description}</p>
        
        <div className="flex items-end justify-between mt-auto">
          <div>
            <p className="text-element-blue-dark font-bold text-xl">R$ {product.price?.toFixed(2)}</p>
            {product.originalPrice && (
              <p className="text-element-gray-dark/60 text-sm line-through">R$ {product.originalPrice.toFixed(2)}</p>
            )}
          </div>
          
          {product.rating && (
            <div className="flex items-center text-yellow-500">
              <span className="text-sm font-medium mr-1">{product.rating}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const categoryIcons = {
  cerveja: <Beer className="h-5 w-5" />,
  vinho: <Wine className="h-5 w-5" />,
  destilado: <Martini className="h-5 w-5" />,
};

const Bebidas = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('todos');
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/products/categories`)
      .then(res => res.json())
      .then(categories => {
        const nomes = ['refrigerante', 'whisky', 'cerveja', 'energético', 'energetico', 'gin'];
        const ids = categories.filter((cat: any) => nomes.some(nome => cat.name.toLowerCase().includes(nome))).map((cat: any) => cat.id);
        if (ids.length === 0) return setLoading(false);
        Promise.all(ids.map(id => fetch(`${import.meta.env.VITE_API_URL}/api/products?categoryId=${id}`).then(res => res.json())))
          .then(results => {
            setProducts(results.flat());
            setLoading(false);
          })
          .catch(() => setLoading(false));
      });
  }, []);
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    // Pega o nome exato da categoria
    let categoryName = '';
    if (typeof product.category === 'object' && product.category !== null) {
      categoryName = (product.category.name || '').trim();
    } else {
      categoryName = (product.category || '').trim();
    }
    const matchesCategory = activeCategory === 'todos' || categoryName === activeCategory;
    // Extract numeric price value (remove 'R$ ' and convert ',' to '.')
    const numericPrice = typeof product.price === 'string'
      ? parseFloat(product.price.replace('R$ ', '').replace(',', '.'))
      : Number(product.price);
    const matchesPriceRange = numericPrice >= priceRange[0] && numericPrice <= priceRange[1];
    return matchesSearch && matchesCategory && matchesPriceRange;
  });
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center py-12">
            <span>Carregando produtos...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-element-blue-dark to-element-blue-neon text-white py-12 md:py-16">
          <div className="element-container">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="mb-4 bg-white text-element-blue-dark hover:bg-white">
                Bebidas para todos os gostos
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                Bebidas de Qualidade
              </h1>
              <p className="text-white/90 mb-6 text-lg">
                De cervejas artesanais a destilados premium, temos a bebida perfeita para sua ocasião
              </p>
            </div>
          </div>
        </section>
        
        {/* Filter Section */}
        <section className="bg-element-gray-light py-6">
          <div className="element-container">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
              <h2 className="element-heading mb-4 md:mb-0">Nosso Catálogo</h2>
              
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                  <Input
                    type="text"
                    placeholder="Buscar bebidas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-element-gray-dark/50" />
                </div>
                
                <Button 
                  variant="outline" 
                  className="md:flex items-center gap-2"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden md:inline">Filtros</span>
                </Button>
              </div>
            </div>
            
            {showFilters && (
              <div className="bg-white p-4 rounded-md mb-6 animate-fade-in">
                <h3 className="font-medium mb-3">Faixa de preço</h3>
                <div className="px-3">
                  <Slider
                    defaultValue={[0, 200]}
                    max={200}
                    step={10}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="mb-6"
                  />
                  <div className="flex justify-between text-sm text-element-gray-dark">
                    <span>R$ {priceRange[0]}</span>
                    <span>R$ {priceRange[1]}</span>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setPriceRange([0, 200]);
                      setActiveCategory('todos');
                    }}
                    className="mr-2"
                  >
                    Limpar
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => setShowFilters(false)}
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            )}
            
            <Tabs
              defaultValue="todos"
              className="w-full"
              onValueChange={setActiveCategory}
              value={activeCategory}
            >
              <TabsList className="grid grid-cols-2 md:grid-cols-6 mb-6 bg-white overflow-x-auto">
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="Whisky">Whisky</TabsTrigger>
                <TabsTrigger value="GIN">GIN</TabsTrigger>
                <TabsTrigger value="Energéticos">Energéticos</TabsTrigger>
                <TabsTrigger value="Cervejas">Cervejas</TabsTrigger>
                <TabsTrigger value="Refrigerantes">Refrigerantes</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </section>
        
        {/* Products Grid */}
        <section className="py-8 md:py-12 bg-white">
          <div className="element-container">
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
        
        {/* Call to Action */}
        <section className="bg-element-gray-light py-8">
          <div className="element-container text-center">
            <h2 className="text-xl md:text-2xl font-bold mb-4">Não encontrou o que procurava?</h2>
            <p className="text-element-gray-dark mb-6 max-w-2xl mx-auto">
              Entre em contato conosco para verificarmos a disponibilidade ou fazermos uma encomenda especial
            </p>
            <Link to="/contato" className="element-btn-primary inline-flex items-center">
              Fale Conosco <Plus className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Bebidas;
