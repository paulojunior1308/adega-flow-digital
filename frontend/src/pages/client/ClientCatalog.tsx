import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ClientSidebar from '@/components/client/ClientSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter, Search, ShoppingCart, Plus, Star, Package, Wine, Beer, Coffee, ShoppingBag } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';
import { ComboOptionsModal } from '@/components/home/ComboOptionsModal';
import CartDetails from '@/components/client/CartDetails';

// Defina a URL base do backend
const API_URL = import.meta.env.VITE_API_URL;

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
  type: string;
  stock: number;
  isFractioned?: boolean;
  totalVolume?: number;
  unitVolume?: number;
}

// Tipos para os itens do carrinho
interface CartItem {
  product: Product;
  quantity: number;
}

const ClientCatalog = () => {
  // Estados
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [combos, setCombos] = useState([]);
  const [doses, setDoses] = useState([]);
  const [comboModalOpen, setComboModalOpen] = useState(false);
  const [comboToConfigure, setComboToConfigure] = useState<any>(null);
  const [doseModalOpen, setDoseModalOpen] = useState(false);
  const [doseToConfigure, setDoseToConfigure] = useState<any>(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [isFilterSheetOpen, setFilterSheetOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Função para pegar a categoria da URL
  const getCategoryFromUrl = () => {
    const query = new URLSearchParams(location.search);
    return query.get('cat') || 'all';
  };
  const selectedCategory = getCategoryFromUrl();
  
  // Efeito para calcular o total do carrinho
  useEffect(() => {
    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    setCartTotal(total);
  }, [cart]);
  
  // Buscar carrinho real do backend ao carregar a página
  useEffect(() => {
    api.get('/cart').then(res => setCart(res.data?.items || []));
  }, []);
  
  // Função para verificar se um combo está esgotado (apenas itens fixos)
  const isComboOutOfStock = (combo: any) => {
    if (!combo.items) return false;
    // Só considera fixos (não escolhíveis)
    return combo.items.filter((item: any) => !item.isChoosable).some((item: any) => item.product && item.product.stock === 0);
  };
  
  // Função para adicionar ao carrinho (backend)
  const addToCart = async (product: Product) => {
    if (product.type === 'combo') {
      const combo = combos.find((c: any) => c.id === product.id);
      if (combo && combo.items) {
        if (isComboOutOfStock(combo)) {
          toast({
            title: 'Combo esgotado',
            description: 'Um ou mais itens fixos deste combo estão esgotados.',
            variant: 'destructive',
          });
          return;
        }
        setComboToConfigure(combo);
        setComboModalOpen(true);
        return;
      }
    } else if (product.type === 'dose') {
      const dose = doses.find((d: any) => d.id === product.id);
      if (dose && dose.items.some((item: any) => item.allowFlavorSelection)) {
        setDoseToConfigure(dose);
        setDoseModalOpen(true);
        return;
      }
      // Se não houver escolhíveis, adiciona direto
      await api.post('/cart', { doseId: product.id, quantity: 1 });
      const res = await api.get('/cart');
      setCart(res.data?.items || []);
      toast({
        title: 'Dose adicionada',
        description: `${product.name} adicionada ao carrinho`,
        duration: 2000,
      });
      return;
    } else {
      // Produto avulso: checar estoque antes de adicionar
      const cartItem = cart.find(item => item.product.id === product.id);
      const quantidadeNoCarrinho = cartItem ? cartItem.quantity : 0;
      if (quantidadeNoCarrinho + 1 > product.stock) {
        toast({
          title: 'Estoque insuficiente',
          description: `Só temos ${product.stock} unidade(s) de ${product.name} no estoque.`,
          variant: 'destructive',
        });
        return;
      }
      await api.post('/cart', { productId: product.id, quantity: 1, comboId: null });
      const res = await api.get('/cart');
      setCart(res.data?.items || []);
      toast({
        title: 'Produto adicionado',
        description: `${product.name} adicionado ao carrinho`,
        duration: 2000,
      });
    }
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
  const checkout = async () => {
    try {
      await api.post('/orders/finalizar', { /* dados do pedido */ });
      toast({
        title: 'Pedido realizado!',
        description: `Total: R$ ${cartTotal.toFixed(2)}. Seu pedido foi enviado.`,
        duration: 3000,
      });
      setCart([]);
      navigate('/cliente-pedidos');
    } catch (error: any) {
      toast({
        title: 'Erro ao finalizar pedido',
        description: error.response?.data?.error || error.response?.data?.message || error.message || 'Estoque insuficiente para um ou mais produtos.',
        variant: 'destructive',
      });
    }
  };
  
  // Renderiza um card de produto
  const renderProductCard = (product: Product) => {
    const isOutOfStock = product.type === 'combo'
      ? isComboOutOfStock(combos.find((c: any) => c.id === product.id))
      : product.stock === 0;
    return (
      <Card key={product.id} className={`overflow-hidden transition-shadow ${isOutOfStock ? 'opacity-60 grayscale pointer-events-none' : 'hover:shadow-lg'}`}>
        <div className="relative h-48 flex items-center justify-center bg-white">
          <img 
            src={product.image && !product.image.startsWith('http') ? API_URL + product.image : product.image} 
            alt={product.name} 
            className="max-h-40 max-w-full object-contain"
          />
          {product.oldPrice && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium">
              Oferta
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-gray-700 text-white px-3 py-1 rounded-md text-xs font-semibold shadow">Esgotado</div>
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
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product);
              }} 
              variant="outline" 
              size="icon" 
              className="rounded-full hover:bg-element-blue-neon hover:text-white"
              disabled={isOutOfStock}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  useEffect(() => {
    api.get('/products').then(res => setProducts(res.data));
  }, []);

  useEffect(() => {
    api.get('/products/categories').then(res => {
      setCategories([{ id: 'all', name: 'Todos' }, ...res.data]);
    });
    api.get('/combos').then(res => {
      // Corrigir combos: mapear allowFlavorSelection para isChoosable
      const combosCorrigidos = res.data.map((combo: any) => ({
        ...combo,
        items: combo.items.map((item: any) => ({
          ...item,
          isChoosable: item.allowFlavorSelection
        }))
      }));
      setCombos(combosCorrigidos);
    });
    api.get('/doses').then(res => {
      setDoses(res.data);
    });
  }, []);

  const allProducts = React.useMemo(() => [
    ...products.map(p => ({ ...p, type: 'product' })),
    ...combos.map(c => ({
      ...c,
      type: 'combo',
      name: c.name,
      price: c.price,
      oldPrice: undefined,
      image: c.image,
      description: c.description,
      category: c.categoryId || (c.category && c.category.id) || 'combo',
      rating: 5,
      tags: [],
    })),
    ...doses.map(d => ({
      ...d,
      type: 'dose',
      name: d.name,
      price: d.price,
      oldPrice: undefined,
      image: d.image,
      description: d.description,
      category: d.categoryId || (d.category && d.category.id) || 'dose',
      rating: 5,
      tags: [],
    })),
  ], [products, combos, doses]);

  useEffect(() => {
    let result = allProducts;
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'combo') {
        result = result.filter(p => p.type === 'combo');
      } else {
        result = result.filter(p => {
          // Se o produto tem category como objeto, comparar id
          if (p.category && typeof p.category === 'object' && p.category.id) {
            return String(p.category.id) === String(selectedCategory);
          }
          // Se o produto tem category como string (id), comparar direto
          return String(p.category) === String(selectedCategory);
        });
      }
    }
    if (searchTerm) {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    setFilteredProducts(result);
  }, [searchTerm, selectedCategory, allProducts]);

  // Função para verificar se uma categoria tem produtos disponíveis
  const hasAvailableProducts = (categoryId: string) => {
    if (categoryId === 'all') return true;
    
    const categoryProducts = allProducts.filter(product => {
      if (product.category && typeof product.category === 'object' && product.category.id) {
        return String(product.category.id) === String(categoryId);
      }
      return String(product.category) === String(categoryId);
    });
    
    return categoryProducts.some(product => {
      if (product.type === 'combo') {
        const combo = combos.find((c: any) => c.id === product.id);
        return combo && !isComboOutOfStock(combo);
      }
      return product.stock > 0;
    });
  };

  // Filtrar categorias que têm produtos disponíveis
  const availableCategories = React.useMemo(() => {
    return categories.filter(category => hasAvailableProducts(category.id));
  }, [categories, allProducts, combos]);

  // Mapeamento de ícones para categorias
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('cerveja') || name.includes('beer')) return <Beer className="h-4 w-4" />;
    if (name.includes('vinho') || name.includes('wine')) return <Wine className="h-4 w-4" />;
    if (name.includes('energético') || name.includes('energetico') || name.includes('energy')) return <Coffee className="h-4 w-4" />;
    if (name.includes('combo') || name.includes('pack')) return <ShoppingBag className="h-4 w-4" />;
    return <Package className="h-4 w-4" />;
  };

  // Contar produtos disponíveis por categoria
  const getCategoryProductCount = (categoryId: string) => {
    if (categoryId === 'all') {
      return allProducts.filter(product => {
        if (product.type === 'combo') {
          const combo = combos.find((c: any) => c.id === product.id);
          return combo && !isComboOutOfStock(combo);
        }
        return product.stock > 0;
      }).length;
    }
    
    if (categoryId === 'combo') {
      return combos.filter(combo => !isComboOutOfStock(combo)).length;
    }
    
    const categoryProducts = allProducts.filter(product => {
      if (product.category && typeof product.category === 'object' && product.category.id) {
        return String(product.category.id) === String(categoryId);
      }
      return String(product.category) === String(categoryId);
    });
    
    return categoryProducts.filter(product => {
      if (product.type === 'combo') {
        const combo = combos.find((c: any) => c.id === product.id);
        return combo && !isComboOutOfStock(combo);
      }
      return product.stock > 0;
    }).length;
  };

  // Função para navegar entre categorias com loading
  const handleCategoryChange = (value: string) => {
    setCategoryLoading(true);
    if (value === 'all') {
      navigate('/cliente-catalogo');
    } else {
      navigate(`/cliente-catalogo?cat=${value}`);
    }
    setFilterSheetOpen(false); // Fecha o menu de filtros no mobile
    // Simular um pequeno delay para mostrar o loading
    setTimeout(() => setCategoryLoading(false), 300);
  };

  const selectedCategoryName = React.useMemo(() => {
    if (selectedCategory === 'all') return 'Todos';
    if (selectedCategory === 'combo') return 'Combos';
    return categories.find(c => c.id === selectedCategory)?.name || 'Categoria';
  }, [selectedCategory, categories]);

  const allCategoryButtons = React.useMemo(() => {
    const buttons = [...availableCategories];
    if (!availableCategories.some(c => c.name.toLowerCase() === 'combos')) {
      buttons.push({ id: 'combo', name: 'Combos' });
    }
    return buttons;
  }, [availableCategories]);

  // Função para renderizar um botão de categoria
  const renderCategoryButton = (category: any) => {
    const value = String(category.id);
    const isActive = selectedCategory === value;

    return (
      <Button
        key={value}
        variant={isActive ? 'default' : 'outline'}
        onClick={() => handleCategoryChange(value)}
        className={`flex items-center justify-center gap-2 transition-all duration-200 ${isActive ? 'bg-element-blue-dark text-white shadow-md' : 'bg-white'}`}
      >
        {getCategoryIcon(category.name)}
        <span className="font-medium">{category.name}</span>
        <Badge variant={isActive ? 'secondary' : 'outline'} className="ml-1 text-xs">
          {getCategoryProductCount(value)}
        </Badge>
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-element-gray-light pt-16 md:pt-0">
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
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-white relative"
                onClick={() => navigate('/cliente-carrinho')}
              >
                <ShoppingCart className="h-5 w-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-element-blue-neon rounded-full w-5 h-5 flex items-center justify-center text-[10px] text-white">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="mb-6">
            {/* Filtros para telas Maiores (md+) */}
            <div className="hidden md:block">
              <div className="flex flex-wrap gap-2">
                {allCategoryButtons.map(renderCategoryButton)}
              </div>
            </div>

            {/* Botão de Filtro para Telas Pequenas (<md) */}
            <div className="md:hidden">
              <Sheet open={isFilterSheetOpen} onOpenChange={setFilterSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full justify-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Filtrar por Categoria ({selectedCategoryName})</span>
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Categorias</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col space-y-2 mt-4">
                    {allCategoryButtons.map(renderCategoryButton)}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
          
          {/* Products Grid */}
          <div className="mb-8 animate-fade-in">
            {categoryLoading ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-element-gray-light rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-soft">
                    <Package className="h-8 w-8 text-element-gray-dark" />
                  </div>
                  <h3 className="text-lg font-semibold text-element-gray-dark mb-2">
                    Carregando produtos...
                  </h3>
                  <p className="text-element-gray-dark/70">
                    Buscando produtos nesta categoria
                  </p>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-element-gray-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-8 w-8 text-element-gray-dark" />
                  </div>
                  <h3 className="text-lg font-semibold text-element-gray-dark mb-2">
                    Nenhum produto encontrado
                  </h3>
                  <p className="text-element-gray-dark/70 mb-6">
                    {searchTerm 
                      ? `Não encontramos produtos para "${searchTerm}"`
                      : selectedCategory !== 'all' 
                        ? `Não há produtos disponíveis nesta categoria no momento`
                        : 'Não há produtos disponíveis no momento'
                    }
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      onClick={() => { 
                        setSearchTerm(""); 
                        navigate('/cliente-catalogo');
                      }}
                      variant="outline"
                    >
                      Limpar filtros
                    </Button>
                    <Button onClick={() => navigate('/cliente-catalogo')}>
                      Ver todos os produtos
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-element-gray-dark/70">
                    {filteredProducts.length} {filteredProducts.length === 1 ? "produto encontrado" : "produtos encontrados"}
                  </p>
                  {searchTerm && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSearchTerm("")}
                      className="text-element-blue-dark hover:text-element-blue-dark/80"
                    >
                      Limpar busca
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {renderProductCard(product)}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Modal de configuração do combo */}
      {comboToConfigure && (
        <ComboOptionsModal
          open={comboModalOpen}
          onOpenChange={setComboModalOpen}
          combo={comboToConfigure}
          onConfirm={async (choosableSelections) => {
            // 1. Montar lista de todos os produtos do combo (fixos + escolhidos)
            const produtosCombo: { productId: string, nome: string, precoOriginal: number, quantidade: number }[] = [];
            // Fixos
            for (const item of comboToConfigure.items) {
              if (!item.isChoosable) {
                produtosCombo.push({
                  productId: item.productId,
                  nome: item.product?.name || '',
                  precoOriginal: item.product?.price || 0,
                  quantidade: Math.max(1, item.quantity)
                });
              }
            }
            // Escolhíveis
            for (const [categoryId, selections] of Object.entries(choosableSelections)) {
              for (const [productId, quantidade] of Object.entries(selections)) {
                if (quantidade > 0) {
                  // Buscar o preço do produto nas opções carregadas
                  const categoria = comboToConfigure.items.find(i => i.categoryId === categoryId);
                  let preco = 0;
                  let nome = '';
                  if (categoria && categoria.product && categoria.product.category && categoria.product.category.id === categoryId) {
                    preco = categoria.product.price;
                    nome = categoria.product.name;
                  } else if (comboToConfigure.options && comboToConfigure.options[categoryId]) {
                    const prod = comboToConfigure.options[categoryId].find((p: any) => p.id === productId);
                    if (prod) {
                      preco = prod.price;
                      nome = prod.name;
                    }
                  }
                  produtosCombo.push({
                    productId,
                    nome,
                    precoOriginal: preco,
                    quantidade: Number(quantidade)
                  });
                }
              }
            }
            // 2. Calcular valor total original
            const totalOriginal = produtosCombo.reduce((sum, p) => sum + p.precoOriginal * p.quantidade, 0);
            // 3. Distribuir valor do combo proporcionalmente (sem arredondar no loop)
            const totaisNaoArredondados = produtosCombo.map(p =>
              totalOriginal > 0
                ? ((p.precoOriginal * p.quantidade) / totalOriginal) * comboToConfigure.price
                : p.precoOriginal * p.quantidade
            );
            // 4. Arredonde cada total
            let totaisArredondados = totaisNaoArredondados.map(v => Math.round(v * 100) / 100);
            // 5. Calcule a diferença
            let soma = totaisArredondados.reduce((a, b) => a + b, 0);
            let diff = Math.round((comboToConfigure.price - soma) * 100); // em centavos
            // 6. Distribua o ajuste entre todos os itens do combo de forma cíclica
            if (diff !== 0) {
              // Índices de todos os itens
              const indicesOrdenados = Array.from({ length: totaisArredondados.length }, (_, i) => i);
              let i = 0;
              while (diff !== 0) {
                const idx = indicesOrdenados[i % indicesOrdenados.length];
                // Ajusta 1 centavo para cima ou para baixo
                totaisArredondados[idx] += diff > 0 ? 0.01 : -0.01;
                totaisArredondados[idx] = Math.round(totaisArredondados[idx] * 100) / 100;
                diff += diff > 0 ? -1 : 1;
                i++;
              }
            }
            // 7. Calcula preço unitário ajustado e desconto
            const descontos = produtosCombo.map((p, idx) => {
              const precoAjustado = Math.round((totaisArredondados[idx] / p.quantidade) * 100) / 100;
              return {
                productId: p.productId,
                precoOriginal: p.precoOriginal,
                quantidade: p.quantidade,
                totalAjustado: totaisArredondados[idx],
                precoAjustado,
                desconto: p.precoOriginal - precoAjustado
              };
            });
            // 8. Salvar descontos no localStorage
            localStorage.setItem('comboDescontos', JSON.stringify(descontos));
            // 9. Enviar apenas UM POST para o backend com comboId, quantity, choosableSelections e priceByProduct
            await api.post('/cart', {
              comboId: comboToConfigure.id,
              quantity: 1,
              choosableSelections,
              priceByProduct: descontos.reduce((acc, d) => ({ ...acc, [d.productId]: d.precoAjustado }), {})
            });
            const res = await api.get('/cart');
            setCart(res.data?.items || []);
            toast({
              title: 'Combo adicionado',
              description: `${comboToConfigure.name} adicionado ao carrinho`,
              duration: 2500,
            });
            setComboToConfigure(null);
          }}
        />
      )}
      {doseToConfigure && (
        <ComboOptionsModal
          open={doseModalOpen}
          onOpenChange={setDoseModalOpen}
          combo={{
            ...doseToConfigure,
            items: doseToConfigure.items.map((item: any) => ({
              ...item,
              isChoosable: item.allowFlavorSelection,
              nameFilter: item.nameFilter
            }))
          }}
          onConfirm={async (choosableSelections) => {
            // Enviar dose como item único para o backend
            await api.post('/cart', {
              doseId: doseToConfigure.id,
              quantity: 1,
              choosableSelections
            });
            const res = await api.get('/cart');
            setCart(res.data?.items || []);
            toast({
              title: 'Dose adicionada',
              description: `${doseToConfigure.name} (Dose) adicionada ao carrinho`,
              duration: 2000,
            });
            setDoseToConfigure(null);
          }}
          isDoseConfiguration={true}
        />
      )}
    </div>
  );
};

export default ClientCatalog;
