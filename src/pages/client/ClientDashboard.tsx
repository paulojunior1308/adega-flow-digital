import React from 'react';
import { Link } from 'react-router-dom';
import ClientSidebar from '@/components/client/ClientSidebar';
import { ArrowRight, Bell, Search, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  image: string;
  title: string;
  price: string;
  oldPrice?: string;
  category?: string;
  id: string;
  onAddToCart: (id: string) => void;
}

const ProductCard = ({ image, title, price, oldPrice, category, id, onAddToCart }: ProductCardProps) => {
  return (
    <div className="element-card p-4 element-card-hover">
      <img src={image} alt={title} className="w-full h-32 object-cover rounded-md mb-3" />
      {category && (
        <Badge variant="secondary" className="mb-2 text-xs">
          {category}
        </Badge>
      )}
      <h4 className="font-medium line-clamp-2 mb-1">{title}</h4>
      <div className="flex justify-between items-end">
        <div>
          <p className="font-bold text-lg text-element-blue-dark">{price}</p>
          {oldPrice && <p className="text-sm text-element-gray-dark/60 line-through">{oldPrice}</p>}
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full hover:bg-element-blue-neon hover:text-element-gray-dark"
          onClick={() => onAddToCart(id)}
        >
          <ShoppingCart className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Sample products by category
const FEATURED_PRODUCTS = [
  {
    id: '1',
    title: 'Skol 350ml - Pack com 12',
    price: 'R$ 39,90',
    image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9',
    category: 'Cervejas',
  },
  {
    id: '2',
    title: 'Vodka Smirnoff 998ml',
    price: 'R$ 49,90',
    oldPrice: 'R$ 59,90',
    image: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901',
    category: 'Destilados',
  },
  {
    id: '3',
    title: 'Essência Narguilé Love66 - 50g',
    price: 'R$ 29,90',
    image: 'https://images.unsplash.com/photo-1721322800607-8c38375eef04',
    category: 'Narguilé',
  },
  {
    id: '4',
    title: 'Red Label 750ml',
    price: 'R$ 89,90',
    image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9',
    category: 'Whisky',
  },
];

const RECENT_PRODUCTS = [
  {
    id: '5',
    title: 'Corona Extra Long Neck - 6 unidades',
    price: 'R$ 42,90',
    image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9',
    category: 'Cervejas',
    oldPrice: null, // Added the oldPrice property with null value
  },
  {
    id: '6',
    title: 'Gin Tanqueray 750ml',
    price: 'R$ 99,90',
    image: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901',
    category: 'Destilados',
    oldPrice: null, // Added the oldPrice property with null value
  },
  {
    id: '7',
    title: 'Monster Energy 473ml',
    price: 'R$ 9,90',
    image: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901',
    category: 'Energéticos',
    oldPrice: null, // Added the oldPrice property with null value
  },
  {
    id: '8',
    title: 'Carvão para Narguile Premium 1kg',
    price: 'R$ 24,90',
    image: 'https://images.unsplash.com/photo-1721322800607-8c38375eef04',
    category: 'Narguilé',
    oldPrice: null, // Added the oldPrice property with null value
  },
];

const CATEGORIES = [
  {
    id: 'cervejas',
    name: 'Cervejas',
    image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9',
  },
  {
    id: 'destilados',
    name: 'Destilados',
    image: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901',
  },
  {
    id: 'narguile',
    name: 'Narguilé',
    image: 'https://images.unsplash.com/photo-1721322800607-8c38375eef04',
  },
  {
    id: 'energeticos',
    name: 'Energéticos',
    image: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901',
  },
];

const ClientDashboard = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [cartCount, setCartCount] = React.useState(0);
  
  const handleAddToCart = (id: string) => {
    setCartCount(prev => prev + 1);
    const product = [...FEATURED_PRODUCTS, ...RECENT_PRODUCTS].find(p => p.id === id);
    
    if (product) {
      toast({
        title: "Produto adicionado",
        description: `${product.title} adicionado ao carrinho`,
        duration: 2000,
      });
    }
  };
  
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
                <Link to="/cliente-carrinho">
                  <Button variant="outline" size="icon" className="rounded-full bg-white">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-element-blue-neon rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
              </div>
              
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchTerm.trim() !== '') {
                      window.location.href = `/cliente-buscar?q=${encodeURIComponent(searchTerm)}`;
                    }
                  }}
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
          
          {/* Featured Products */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="element-subheading">Produtos em Destaque</h3>
              <Link to="/cliente-catalogo" className="element-link flex items-center text-sm">
                Ver mais <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {FEATURED_PRODUCTS.map((product) => (
                <ProductCard 
                  key={product.id}
                  id={product.id}
                  image={product.image}
                  title={product.title}
                  price={product.price}
                  oldPrice={product.oldPrice}
                  category={product.category}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </div>
          
          {/* Recent Products */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="element-subheading">Comprados Recentemente</h3>
              <Link to="/cliente-catalogo" className="element-link flex items-center text-sm">
                Ver mais <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {RECENT_PRODUCTS.map((product) => (
                <ProductCard 
                  key={product.id}
                  id={product.id}
                  image={product.image}
                  title={product.title}
                  price={product.price}
                  oldPrice={product.oldPrice}
                  category={product.category}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </div>
          
          {/* Categories */}
          <div>
            <h3 className="element-subheading mb-6">Categorias Populares</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {CATEGORIES.map((category) => (
                <Link 
                  key={category.id}
                  to={`/cliente-catalogo?cat=${category.id}`} 
                  className="element-card flex flex-col items-center justify-center p-6 text-center element-card-hover"
                >
                  <img 
                    src={category.image} 
                    alt={category.name} 
                    className="w-16 h-16 object-cover rounded-full mb-3"
                  />
                  <h4 className="font-medium">{category.name}</h4>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
