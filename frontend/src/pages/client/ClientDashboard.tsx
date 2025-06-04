import React from 'react';
import { Link } from 'react-router-dom';
import ClientSidebar from '@/components/client/ClientSidebar';
import { ArrowRight, Bell, Search, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import NotificationDropdown from '@/components/NotificationDropdown';
import { useAuth } from '@/hooks/useAuth';

interface ProductCardProps {
  image: string;
  title: string;
  price: string;
  oldPrice?: string;
  category?: string;
  id: string;
  onAddToCart?: (id: string) => void;
}

const ProductCard = ({ image, title, price, oldPrice, category, id, onAddToCart }: ProductCardProps) => {
  return (
    <div className="element-card p-4 element-card-hover">
      <div className="w-full h-40 flex items-center justify-center bg-gray-50 rounded-md mb-3">
        <img src={image} alt={title} className="w-full h-full object-contain p-2" />
      </div>
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
        {onAddToCart && (
          <Button size="sm" className="ml-2" onClick={() => onAddToCart(id)}>
            Adicionar ao Carrinho
          </Button>
        )}
      </div>
    </div>
  );
};

const getRandomProducts = (products, count = 4) => {
  if (!products || products.length <= count) return products;
  const shuffled = [...products].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const API_URL = 'https://adega-flow-digital.onrender.com';

const categoryImages = {
  'Whisky': '/uploads/whisky.png',
  'Refrigerantes': '/uploads/refrigerantes.png',
  'Gin': '/uploads/gin.png',
  'GIN': '/uploads/gin.png',
  'Carvão': '/uploads/carvao.png',
  'Energéticos': '/uploads/energeticos.png',
  'Essências': '/uploads/essencias.png',
  'Cervejas': '/uploads/cervejas.png',
  'Gelo de Coco': '/uploads/gelo-de-coco.png',
};

const getImageUrl = (image?: string) => {
  if (!image) return '';
  if (image.startsWith('http')) return image;
  return `${API_URL}${image}`;
};

const ClientDashboard = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [cartCount, setCartCount] = React.useState(0);
  const [promotions, setPromotions] = React.useState([]);
  const [featuredProducts, setFeaturedProducts] = React.useState([]);
  const [recentProducts, setRecentProducts] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [specialPromotionIndex, setSpecialPromotionIndex] = React.useState(0);
  const { user } = useAuth();
  
  // Buscar dados reais ao montar
  React.useEffect(() => {
    api.get('/promotions').then(res => setPromotions(res.data));
    api.get('/products').then(res => setFeaturedProducts(res.data));
    api.get('/products/categories').then(res => setCategories(res.data));
    api.get('/cliente-pedidos').then(res => {
      // Extrair produtos dos pedidos recentes, evitando duplicatas e produtos nulos
      const pedidos = res.data;
      const produtosRecentes = [];
      const ids = new Set();
      pedidos.forEach(p => {
        p.items.forEach(i => {
          if (i.product && !ids.has(i.product.id)) {
            produtosRecentes.push(i.product);
            ids.add(i.product.id);
          }
        });
      });
      setRecentProducts(produtosRecentes);
    });
  }, []);

  // Alternância automática de promoção especial
  React.useEffect(() => {
    if (promotions.length <= 1) return;
    const interval = setInterval(() => {
      setSpecialPromotionIndex(i => (i + 1) % promotions.length);
    }, 60000); // 1 minuto
    return () => clearInterval(interval);
  }, [promotions]);

  return (
    <div className="min-h-screen bg-element-gray-light pt-16 md:pt-0">
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
                <NotificationDropdown userId={user?.id || ''} />
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
                {promotions.length > 0 ? (
                  <>
                    <p className="mb-2 text-element-gray-light font-bold">{promotions[specialPromotionIndex].name}</p>
                    <ul className="mb-2 text-element-gray-light text-sm">
                      {promotions[specialPromotionIndex].products.map(prod => (
                        <li key={prod.id}>- {prod.name}</li>
                      ))}
                    </ul>
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-2xl font-bold">R$ {promotions[specialPromotionIndex].price.toFixed(2)}</span>
                      <span className="text-lg line-through text-element-gray-light">R$ {promotions[specialPromotionIndex].originalPrice.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <p className="mb-6 text-element-gray-light">Aproveite descontos exclusivos em bebidas selecionadas!</p>
                )}
                <Link to="/cliente-catalogo" className="element-btn-primary">
                  Ver ofertas
                </Link>
              </div>
              <div className="w-full md:w-1/3 lg:w-1/4 flex items-center justify-center">
                {promotions.length > 0 && promotions[specialPromotionIndex].image && (
                  <img
                    src={getImageUrl(promotions[specialPromotionIndex].image)}
                    alt={promotions[specialPromotionIndex].name}
                    className="w-full h-48 object-contain rounded-md bg-white p-2"
                  />
                )}
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
              {getRandomProducts(featuredProducts, 4).map((product) => (
                <Link to={`/cliente-catalogo/produto/${product.id}`} key={product.id}>
                  <ProductCard 
                    id={product.id}
                    image={getImageUrl(product.image)}
                    title={product.name}
                    price={`R$ ${product.price?.toFixed(2)}`}
                    oldPrice={product.oldPrice ? `R$ ${product.oldPrice?.toFixed(2)}` : undefined}
                    category={product.category?.name}
                  />
                </Link>
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
              {getRandomProducts(recentProducts, 4).map((product) => (
                <Link to={`/cliente-catalogo/produto/${product.id}`} key={product.id} style={{ textDecoration: 'none' }}>
                  <ProductCard 
                    id={product.id}
                    image={getImageUrl(product.image)}
                    title={product.name}
                    price={`R$ ${product.price?.toFixed(2)}`}
                    oldPrice={product.oldPrice ? `R$ ${product.oldPrice?.toFixed(2)}` : undefined}
                    category={product.category?.name}
                    onAddToCart={async (id) => {
                      try {
                        await api.post('/client/cart', { productId: id, quantity: 1 });
                        toast({ title: 'Produto adicionado ao carrinho!' });
                      } catch (err) {
                        toast({ title: 'Erro ao adicionar ao carrinho', variant: 'destructive' });
                      }
                    }}
                  />
                </Link>
              ))}
            </div>
          </div>
          
          {/* Categories */}
          <div>
            <h3 className="element-subheading mb-6">Categorias Populares</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {categories.filter(category => category.name !== 'Sucos').map((category) => (
                <Link 
                  key={category.id}
                  to={`/cliente-catalogo?cat=${category.id}`} 
                  className="element-card flex flex-col items-center justify-center p-6 text-center element-card-hover"
                >
                  <img 
                    src={getImageUrl(category.image) || (categoryImages[category.name] ? `${API_URL}${categoryImages[category.name]}` : 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9')} 
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
