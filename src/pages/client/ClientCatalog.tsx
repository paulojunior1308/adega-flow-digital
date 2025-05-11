
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ClientSidebar from '@/components/client/ClientSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter, Search, ShoppingCart, Plus, Star } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// Tipos para os produtos
interface Product {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  description: string;
  category: string;
  rating: number;
  tags: string[];
}

// Tipos para os itens do carrinho
interface CartItem {
  product: Product;
  quantity: number;
}

// Dados de exemplo - em uma aplicação real, estes viriam de uma API
const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Skol 350ml - Pack com 12",
    price: 39.90,
    image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9",
    description: "Pack com 12 unidades de cerveja Skol 350ml",
    category: "cervejas",
    rating: 4.5,
    tags: ["cerveja", "pack", "skol"]
  },
  {
    id: 2,
    name: "Vodka Smirnoff 998ml",
    price: 49.90,
    oldPrice: 59.90,
    image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901",
    description: "Vodka Smirnoff Original 998ml",
    category: "destilados",
    rating: 4.8,
    tags: ["vodka", "destilado", "smirnoff"]
  },
  {
    id: 3,
    name: "Essência Narguilé Love66 - 50g",
    price: 29.90,
    image: "https://images.unsplash.com/photo-1721322800607-8c38375eef04",
    description: "Essência para narguilé sabor Love66 - 50g",
    category: "narguile",
    rating: 4.7,
    tags: ["narguile", "essencia", "love66"]
  },
  {
    id: 4,
    name: "Red Label 750ml",
    price: 89.90,
    image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9",
    description: "Whisky Johnnie Walker Red Label 750ml",
    category: "whisky",
    rating: 4.6,
    tags: ["whisky", "destilado", "johnnie walker"]
  },
  {
    id: 5,
    name: "Jack Daniel's 1L",
    price: 129.90,
    image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901",
    description: "Whiskey Jack Daniel's Old No. 7 - 1 Litro",
    category: "whisky",
    rating: 4.9,
    tags: ["whiskey", "destilado", "jack daniels"]
  },
  {
    id: 6,
    name: "Pack Heineken 6 Long Necks",
    price: 45.90,
    oldPrice: 49.90,
    image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9",
    description: "Pack com 6 cervejas Heineken Long Neck 330ml",
    category: "cervejas",
    rating: 4.7,
    tags: ["cerveja", "pack", "heineken"]
  },
  {
    id: 7,
    name: "Monster Energy 473ml",
    price: 9.90,
    image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901",
    description: "Energético Monster Energy tradicional 473ml",
    category: "energeticos",
    rating: 4.5,
    tags: ["energetico", "monster", "bebida"]
  },
  {
    id: 8,
    name: "Carvão para Narguile Premium 1kg",
    price: 24.90,
    image: "https://images.unsplash.com/photo-1721322800607-8c38375eef04",
    description: "Carvão premium para narguile - embalagem com 1kg",
    category: "narguile",
    rating: 4.6,
    tags: ["narguile", "carvao"]
  },
  {
    id: 9,
    name: "Combo Festa: 12 Cervejas + 1 Vodka",
    price: 119.90,
    oldPrice: 139.90,
    image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9",
    description: "Combo para festas com 12 cervejas e 1 vodka Smirnoff",
    category: "combos",
    rating: 4.9,
    tags: ["combo", "festa", "cerveja", "vodka"]
  },
  {
    id: 10,
    name: "Absolut 750ml",
    price: 79.90,
    image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901",
    description: "Vodka Absolut Original 750ml",
    category: "destilados",
    rating: 4.8,
    tags: ["vodka", "destilado", "absolut"]
  },
  {
    id: 11,
    name: "Gin Tanqueray 750ml",
    price: 99.90,
    image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901",
    description: "Gin Tanqueray London Dry 750ml",
    category: "destilados",
    rating: 4.7,
    tags: ["gin", "destilado", "tanqueray"]
  },
  {
    id: 12,
    name: "Corona Extra Long Neck - 6 unidades",
    price: 42.90,
    image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9",
    description: "Kit com 6 cervejas Corona Extra Long Neck 330ml",
    category: "cervejas",
    rating: 4.6,
    tags: ["cerveja", "pack", "corona"]
  },
];

// Categorias disponíveis
const categories = [
  { id: "all", name: "Todos" },
  { id: "cervejas", name: "Cervejas" },
  { id: "destilados", name: "Destilados" },
  { id: "whisky", name: "Whisky" },
  { id: "narguile", name: "Narguile" },
  { id: "energeticos", name: "Energéticos" },
  { id: "combos", name: "Combos" },
];

const ClientCatalog = () => {
  // Estados
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Efeito para carregar a categoria da URL se existir
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const category = query.get('cat');
    if (category) {
      setSelectedCategory(category);
    }
  }, [location.search]);
  
  // Efeito para filtrar produtos baseado na busca e categoria
  useEffect(() => {
    let result = PRODUCTS;
    
    // Filtro por categoria
    if (selectedCategory !== "all") {
      result = result.filter(p => p.category === selectedCategory);
    }
    
    // Filtro por termo de busca
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(lowerSearch) || 
        p.description.toLowerCase().includes(lowerSearch) ||
        p.tags.some(tag => tag.includes(lowerSearch))
      );
    }
    
    setFilteredProducts(result);
  }, [searchTerm, selectedCategory]);
  
  // Efeito para calcular o total do carrinho
  useEffect(() => {
    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    setCartTotal(total);
  }, [cart]);
  
  // Função para adicionar ao carrinho
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      // Verifica se o produto já existe no carrinho
      const existingItem = prevCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        // Incrementa a quantidade
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Adiciona novo item
        return [...prevCart, { product, quantity: 1 }];
      }
    });
    
    toast({
      title: "Produto adicionado",
      description: `${product.name} adicionado ao carrinho`,
      duration: 2000,
    });
  };
  
  // Função para remover item do carrinho
  const removeFromCart = (productId: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === productId);
      
      if (existingItem && existingItem.quantity > 1) {
        // Decrementa a quantidade
        return prevCart.map(item => 
          item.product.id === productId 
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        // Remove o item completamente
        return prevCart.filter(item => item.product.id !== productId);
      }
    });
  };
  
  // Função para limpar o carrinho
  const clearCart = () => {
    setCart([]);
    toast({
      title: "Carrinho limpo",
      description: "Todos os itens foram removidos",
      duration: 2000,
    });
  };
  
  // Função para finalizar o pedido
  const checkout = () => {
    // Aqui você enviaria os dados para um backend
    toast({
      title: "Pedido realizado!",
      description: `Total: R$ ${cartTotal.toFixed(2)}. Seu pedido foi enviado.`,
      duration: 3000,
    });
    setCart([]);
    navigate('/cliente-pedidos');
  };
  
  // Renderiza um card de produto
  const renderProductCard = (product: Product) => (
    <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover"
        />
        {product.oldPrice && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium">
            Oferta
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-center mb-2">
          <div className="flex items-center mr-2">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm ml-1">{product.rating}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {categories.find(c => c.id === product.category)?.name}
          </Badge>
        </div>
        <h3 className="font-medium line-clamp-2 mb-2">{product.name}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{product.description}</p>
        <div className="flex justify-between items-center">
          <div>
            <p className="font-bold text-lg text-element-blue-dark">R$ {product.price.toFixed(2)}</p>
            {product.oldPrice && (
              <p className="text-sm text-element-gray-dark/60 line-through">
                R$ {product.oldPrice.toFixed(2)}
              </p>
            )}
          </div>
          <Button 
            onClick={() => addToCart(product)} 
            variant="outline" 
            size="icon" 
            className="rounded-full hover:bg-element-blue-neon hover:text-white"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-element-gray-light">
      <ClientSidebar />
      
      <div className="lg:pl-64 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          {/* Header com busca e carrinho */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-element-blue-dark mb-4 md:mb-0">
              Catálogo de Produtos
            </h1>
            
            <div className="flex items-center space-x-3">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-element-gray-dark/60" />
                <Input
                  type="text"
                  placeholder="Buscar produtos..."
                  className="pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Carrinho Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <div className="relative">
                    <Button variant="outline" size="icon" className="rounded-full bg-white relative">
                      <ShoppingCart className="h-5 w-5" />
                      {cart.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-element-blue-neon rounded-full w-5 h-5 flex items-center justify-center text-[10px] text-white">
                          {cart.reduce((sum, item) => sum + item.quantity, 0)}
                        </span>
                      )}
                    </Button>
                  </div>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md">
                  <div className="flex flex-col h-full">
                    <h2 className="text-xl font-bold mb-4">Seu Carrinho</h2>
                    
                    {cart.length === 0 ? (
                      <div className="flex flex-col items-center justify-center flex-1 py-8">
                        <ShoppingCart className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500">Seu carrinho está vazio</p>
                        <Button 
                          variant="link" 
                          className="mt-2"
                          onClick={() => navigate('/cliente-catalogo')}
                        >
                          Continuar comprando
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 overflow-y-auto">
                          {cart.map((item) => (
                            <div key={item.product.id} className="flex items-center py-4 border-b">
                              <img 
                                src={item.product.image} 
                                alt={item.product.name} 
                                className="w-16 h-16 object-cover rounded-md mr-3"
                              />
                              <div className="flex-1">
                                <h3 className="font-medium line-clamp-1">{item.product.name}</h3>
                                <p className="text-sm text-gray-500">
                                  R$ {item.product.price.toFixed(2)} x {item.quantity}
                                </p>
                              </div>
                              <div className="flex items-center">
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-full"
                                  onClick={() => removeFromCart(item.product.id)}
                                >
                                  <svg width="15" height="2" viewBox="0 0 15 2" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1.17188 1H13.1719" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </Button>
                                <span className="mx-2">{item.quantity}</span>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-full"
                                  onClick={() => addToCart(item.product)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="pt-4 border-t mt-auto">
                          <div className="flex justify-between mb-2">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-medium">R$ {cartTotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between mb-4">
                            <span className="text-gray-500">Entrega</span>
                            <span className="font-medium">Grátis</span>
                          </div>
                          <div className="flex justify-between mb-6">
                            <span className="text-lg font-bold">Total</span>
                            <span className="text-lg font-bold">R$ {cartTotal.toFixed(2)}</span>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline"
                              className="flex-1"
                              onClick={clearCart}
                            >
                              Limpar
                            </Button>
                            <Button 
                              className="flex-1 bg-element-blue-neon text-element-gray-dark hover:bg-element-blue-neon/90"
                              onClick={checkout}
                              disabled={cart.length === 0}
                            >
                              Finalizar
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
          
          {/* Filters */}
          <div className="mb-6">
            <Tabs defaultValue={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
              <TabsList className="w-full overflow-x-auto flex flex-nowrap justify-start">
                {categories.map(category => (
                  <TabsTrigger 
                    key={category.id} 
                    value={category.id}
                    className="flex-shrink-0"
                  >
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {categories.map(category => (
                <TabsContent 
                  key={category.id} 
                  value={category.id}
                  className="mt-4"
                >
                  {/* O conteúdo é renderizado de forma dinâmica abaixo */}
                </TabsContent>
              ))}
            </Tabs>
          </div>
          
          {/* Products Grid */}
          <div className="mb-8">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Nenhum produto encontrado</p>
                <Button onClick={() => { setSearchTerm(""); setSelectedCategory("all"); }}>
                  Limpar filtros
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  {filteredProducts.length} {filteredProducts.length === 1 ? "produto encontrado" : "produtos encontrados"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredProducts.map(renderProductCard)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientCatalog;
