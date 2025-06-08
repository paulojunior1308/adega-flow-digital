import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, X, RefreshCcw, DollarSign, QrCode, CreditCard, IdCard, Plus, Minus, ChevronUp, ChevronDown } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import api from '@/lib/axios';
import { ComboOptionsModal } from '@/components/home/ComboOptionsModal';
import { Drawer, DrawerContent } from '@/components/ui/drawer';

// Types definition
interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  pinned?: boolean;
  stock: number;
  unit?: string;
  quantityPerUnit?: number;
}

interface CartItem {
  id: string;
  productId: string;
  code: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  comboId?: string;
  type: string;
  comboType?: string;
  items?: any[];
}

const AdminPDV = () => {
  // State management
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [productCode, setProductCode] = useState('');
  const [productQuantity, setProductQuantity] = useState(1);
  const [quickProductsOpen, setQuickProductsOpen] = useState(false);
  const [ticketNumber, setTicketNumber] = useState(34);
  const [cpfCnpjDialogOpen, setCpfCnpjDialogOpen] = useState(false);
  const [cpfCnpjValue, setCpfCnpjValue] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [pinnedProducts, setPinnedProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<{id: string, name: string}[]>([]);
  const [combos, setCombos] = useState<any[]>([]);
  const [comboModalOpen, setComboModalOpen] = useState(false);
  const [comboToConfigure, setComboToConfigure] = useState<any>(null);
  const { toast } = useToast();
  const [cartOpen, setCartOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showActions, setShowActions] = useState(false);
  
  // Buscar produtos e combos ao carregar
  useEffect(() => {
    api.get('/admin/products').then(res => setProducts(res.data.filter((p: any) => p.stock > 0)));
    api.get('/admin/combos').then(res => {
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
    api.get('/admin/products', { params: { pinned: true } }).then(res => setPinnedProducts(res.data.filter((p: any) => p.stock > 0)));
  }, []);

  // Unificar produtos e combos para exibição (useMemo para evitar loop)
  const allItems = React.useMemo(() => [
    ...products.map(p => ({ ...p, type: 'product' })),
    ...combos.map(c => ({
      ...c,
      type: 'combo',
      code: c.id.substring(0, 6),
      name: c.name,
      price: c.price,
    }))
  ], [products, combos]);

  // Busca dinâmica
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts([]);
    } else {
      setFilteredProducts(
        allItems.filter(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      );
    }
  }, [searchQuery, allItems]);

  // Buscar métodos de pagamento ao carregar
  useEffect(() => {
    api.get('/admin/payment-methods').then(res => {
      setPaymentMethods(res.data.filter((m: any) => m.active));
    });
  }, []);

  // Toggle produto rápido persistente
  const togglePinProduct = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    await api.patch(`/admin/products/${productId}/pinned`, { pinned: !product.pinned });
    // Atualizar listas após alteração
    const [all, pinned] = await Promise.all([
      api.get('/admin/products'),
      api.get('/admin/products', { params: { pinned: true } })
    ]);
    setProducts(all.data);
    setPinnedProducts(pinned.data);
  };

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const discount = 0; 
  const total = subtotal - discount;

  // Add item to cart
  const addToCart = (item: any, quantity: number = 1) => {
    // Verifica estoque antes de adicionar
    const estoqueDisponivel = item.stock ?? Infinity;
    const quantidadeNoCarrinho = cartItems.find(ci => ci.id === item.id)?.quantity || 0;
    if (quantidadeNoCarrinho + quantity > estoqueDisponivel) {
      toast({
        variant: "destructive",
        description: `Estoque insuficiente para ${item.name}. Disponível: ${estoqueDisponivel}, solicitado: ${quantidadeNoCarrinho + quantity}`
      });
      return;
    }
    if (item.type === 'combo') {
      if (item.items && Array.isArray(item.items) && item.comboType === 'dose') {
        // Adicionar ingredientes do combo dose ao carrinho
        const ingredientes = item.items.map((comboItem: any) => {
          // Buscar produto completo para pegar unit e quantityPerUnit
          let produto = products.find(p => p.id === comboItem.productId);
          if (!produto && comboItem.unit && comboItem.quantityPerUnit) {
            produto = comboItem;
          }
          let quantidadeFinal = comboItem.amount || comboItem.quantity;
          if (produto && produto.unit === 'ml' && produto.quantityPerUnit) {
            quantidadeFinal = (comboItem.amount || comboItem.quantity) / produto.quantityPerUnit;
            console.log(`[FRONTEND][CARRINHO][CONVERSAO] Produto: ${produto.name}, Amount: ${(comboItem.amount || comboItem.quantity)}ml, Unidade: ${produto.quantityPerUnit}ml, Fração: ${quantidadeFinal}`);
          } else {
            console.log(`[FRONTEND][CARRINHO][CONVERSAO] Produto: ${produto?.name}, Quantidade: ${quantidadeFinal} un`);
          }
          return {
            id: `${item.id}-${comboItem.productId}-${Math.random().toString(36).substring(2, 8)}`,
            productId: comboItem.productId,
            code: produto?.code || '',
            name: `${produto?.name || ''} (Dose de ${item.name})`,
            quantity: quantidadeFinal,
            price: comboItem.product?.price || 0, // ou calcule proporcionalmente se necessário
            total: (comboItem.product?.price || 0) * quantidadeFinal,
            type: 'product',
            parentCombo: { id: item.id, name: item.name, price: item.price, quantity },
          };
        });
        setCartItems([...cartItems, ...ingredientes]);
        toast({ description: `Produtos da dose ${item.name} adicionados ao carrinho.` });
        return;
      }
      // Se for combo do tipo dose, discriminar os produtos reais no carrinho
      if (item.type === 'combo' && item.comboType === 'dose' && Array.isArray(item.items)) {
        // Distribuir o valor proporcionalmente entre os ingredientes
        const totalAmount = item.items.reduce((sum: number, ci: any) => sum + (ci.amount || 1), 0);
        const ingredientes = item.items.map((comboItem: any) => {
          const ingredienteValor = ((comboItem.amount || 1) / totalAmount) * item.price;
          const logMsg = `[FRONTEND][CARRINHO][COMBO-DOSE] Produto: ${comboItem.product?.name}, Qtd: ${(comboItem.amount || 1) * quantity}, Unidade: ml, Valor: ${ingredienteValor}`;
          console.log(logMsg);
          return {
            id: `${item.id}-${comboItem.productId}`,
            productId: comboItem.productId,
            code: comboItem.product?.code || '',
            name: `${comboItem.product?.name || ''} (Dose de ${item.name})`,
            quantity: (comboItem.amount || 1) * quantity,
            price: Number(ingredienteValor.toFixed(2)),
            total: Number((Number(ingredienteValor.toFixed(2)) * ((comboItem.amount || 1) * quantity)).toFixed(2)),
            type: 'product',
            parentCombo: { id: item.id, name: item.name, price: item.price, quantity },
          };
        });
        setCartItems([...cartItems, ...ingredientes]);
        toast({ description: `Produtos da dose ${item.name} adicionados ao carrinho.` });
        return;
      }
      // Combo tradicional
      const existingItemIndex = cartItems.findIndex(ci => ci.id === item.id);
      if (existingItemIndex >= 0) {
        const updatedItems = [...cartItems];
        updatedItems[existingItemIndex].quantity += quantity;
        updatedItems[existingItemIndex].total = updatedItems[existingItemIndex].price * updatedItems[existingItemIndex].quantity;
        setCartItems(updatedItems);
        toast({ description: `Quantidade de ${item.name} atualizada.` });
      } else {
        const newItem: CartItem = {
          id: item.id,
          productId: item.id, // para combos, productId = id do combo
          code: item.code,
          name: item.name,
          quantity: quantity,
          price: item.price, // sempre usar o preço do combo
          total: item.price * quantity,
          comboId: item.id, // garantir que comboId seja enviado
          type: 'combo',
        };
        setCartItems([...cartItems, newItem]);
        toast({ description: `${item.name} adicionado ao carrinho.` });
      }
    } else {
      // Produto avulso: id normal
      const produtoLog = products.find(p => p.id === item.productId);
      const unidadeLog = produtoLog?.unit || 'unidade';
      console.log(`[FRONTEND][CARRINHO] Produto: ${item.name}, Qtd: ${quantity}, Unidade: ${unidadeLog}`);
      const existingItemIndex = cartItems.findIndex(ci => ci.id === item.id);
      if (existingItemIndex >= 0) {
        const updatedItems = [...cartItems];
        updatedItems[existingItemIndex].quantity += quantity;
        updatedItems[existingItemIndex].total = updatedItems[existingItemIndex].price * updatedItems[existingItemIndex].quantity;
        setCartItems(updatedItems);
        toast({ description: `Quantidade de ${item.name} atualizada.` });
      } else {
        const newItem: CartItem = {
          id: item.id,
          productId: item.id,
          code: item.code,
          name: item.name,
          quantity: quantity,
          price: item.price,
          total: item.price * quantity,
          type: 'product',
        };
        setCartItems([...cartItems, newItem]);
        toast({ description: `${item.name} adicionado ao carrinho.` });
      }
    }
  };

  // Update cart item quantity
  const updateCartItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return; // Prevent quantity less than 1
    const item = cartItems.find(ci => ci.id === itemId);
    const produto = products.find(p => p.id === item?.productId);
    const estoqueDisponivel = produto?.stock ?? Infinity;
    if (newQuantity > estoqueDisponivel) {
      toast({
        variant: "destructive",
        description: `Estoque insuficiente para ${item?.name}. Disponível: ${estoqueDisponivel}`
      });
      return;
    }
    const updatedItems = cartItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity: newQuantity,
          total: item.price * newQuantity
        };
      }
      return item;
    });
    
    setCartItems(updatedItems);
  };

  // Add product by code
  const handleAddProductByCode = () => {
    if (!productCode) {
      toast({
        variant: "destructive",
        description: "Por favor, insira um código de produto.",
      });
      return;
    }

    const product = products.find(p => p.code === productCode);
    if (product) {
      addToCart(product, productQuantity);
      setProductCode('');
      setProductQuantity(1);
    } else {
      toast({
        variant: "destructive",
        description: "Produto não encontrado.",
      });
    }
  };

  // Remove item from cart
  const removeItem = (itemId: string) => {
    const itemToRemove = cartItems.find(item => item.id === itemId);
    if (itemToRemove) {
      setCartItems(cartItems.filter(item => item.id !== itemId));
      toast({
        description: `${itemToRemove.name} removido do carrinho.`,
      });
    }
  };

  // Cancel ticket
  const cancelTicket = () => {
    if (cartItems.length === 0) {
      toast({
        description: "Não há itens para cancelar.",
      });
      return;
    }

    setCartItems([]);
    toast({
      description: "Tíquete cancelado com sucesso.",
    });
  };

  // Cancel last operation
  const cancelOperation = () => {
    toast({
      description: "Última operação extornada.",
    });
  };

  // Finish ticket with payment method
  const finishTicket = async (paymentMethodId: string) => {
    if (cartItems.length === 0) {
      toast({
        variant: "destructive",
        description: "Adicione itens ao carrinho para finalizar.",
      });
      return;
    }
    try {
      // Envie exatamente o que está no carrinho
      const itemsToSend = cartItems.map(item => ({
        productId: item.productId,
        comboId: item.comboId,
        quantity: item.quantity,
        price: item.price,
        type: item.type,
      }));
      console.log('[FRONTEND][ENVIO][FINAL] Itens enviados para o backend:', JSON.stringify(itemsToSend, null, 2));
      await api.post('/admin/pdv-sales', {
        items: itemsToSend,
        paymentMethodId
      });
      toast({
        description: `Venda finalizada!`,
      });
      setCartItems([]);
      setTicketNumber(prev => prev + 1);
    } catch (error: any) {
      const msg = error?.response?.data?.error || "Erro ao finalizar pedido. Verifique o estoque.";
      toast({
        title: "Erro ao finalizar pedido",
        description: msg,
        variant: "destructive"
      });
    }
  };

  // Handle CPF/CNPJ submission
  const handleCpfCnpjSubmit = () => {
    if (cpfCnpjValue) {
      toast({
        description: `CPF/CNPJ ${cpfCnpjValue} adicionado à nota.`,
      });
      setCpfCnpjDialogOpen(false);
      setCpfCnpjValue('');
    } else {
      toast({
        variant: "destructive",
        description: "Por favor, informe um CPF/CNPJ válido.",
      });
    }
  };

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden p-0 ml-0 lg:ml-64">
        {/* Header */}
        <div className="bg-white shadow-sm p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-element-blue-dark" />
            <h1 className="text-xl font-medium text-element-blue-dark">PDV - Venda Local</h1>
          </div>
          <Button 
            onClick={() => setQuickProductsOpen(true)} 
            variant="outline" 
            className="flex items-center gap-2 w-full md:w-auto"
          >
            <span>Produtos Rápidos</span>
          </Button>
        </div>

        {/* Main content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Left side - Product search and display */}
          <div className="flex-1 flex flex-col p-4 overflow-y-auto">
            {/* Pinned Products - Quick access buttons */}
            <div className="mb-4">
              <div className="flex gap-2 overflow-x-auto pb-2 md:grid md:grid-cols-3 xl:grid-cols-4 md:gap-2 md:overflow-x-visible">
                {pinnedProducts.map(product => (
                  <button
                    key={product.id}
                    className="min-w-[220px] md:min-w-0 text-left p-3 border rounded-md hover:border-cyan-400 transition-colors bg-white"
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                  >
                    <div className="text-sm font-medium truncate">{product.code} - {product.name}</div>
                    <div className="text-sm text-green-600">R$ {product.price.toFixed(2)}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Search bar */}
            <div className="flex flex-col md:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                  type="text" 
                  placeholder="Buscar por nome ou código..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="w-full md:w-32">
                <Input 
                  type="text" 
                  placeholder="Cód.Prod" 
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                />
              </div>
              <div className="w-full md:w-16">
                <Input 
                  type="number" 
                  min="1" 
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              <Button onClick={handleAddProductByCode} className="px-3 w-full md:w-auto" disabled={!productCode || !products.find(p => p.code === productCode) || products.find(p => p.code === productCode)?.stock === 0}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Search results */}
            <div className={`${isMobile ? '' : 'flex-1 overflow-y-auto'}`}>
              {searchQuery.trim() !== '' && (
                <div className="grid grid-cols-1 gap-2">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      className="text-left p-3 border rounded-md hover:border-cyan-400 transition-colors bg-white w-full"
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                    >
                      <div className="font-medium">{product.code} - {product.name}</div>
                      <div className="text-green-600 mt-1">R$ {product.price.toFixed(2)}</div>
                    </button>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      Nenhum produto encontrado para "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
              {searchQuery.trim() === '' && pinnedProducts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Selecione produtos na opção "Produtos Rápidos" para aparecerem aqui
                </div>
              )}
            </div>
          </div>

          {/* Carrinho - responsivo: cards no mobile, tabela no desktop */}
          <div className={`w-full md:w-96 bg-white shadow-md flex flex-col overflow-hidden ${isMobile ? 'px-2 pb-32 mt-0' : 'mt-4'} md:mt-0`}>
            {/* Ticket header */}
            <div className="p-4 bg-gray-100 flex justify-between items-center">
              <div className="font-medium">Tíquete: {ticketNumber}</div>
              <div className="text-green-600 font-medium">ABERTO</div>
            </div>

            {/* Cart items */}
            {isMobile ? (
              <div className="flex flex-col gap-2 p-2">
                {cartItems.length > 0 ? (
                  cartItems.map((item, index) => (
                    <div key={item.id} className="rounded-lg border p-3 flex flex-col gap-2 bg-gray-50">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm">{item.name}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 p-0 text-red-500"
                          onClick={() => removeItem(item.id)}
                          aria-label="Remover item"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Cód: {item.code}</span>
                        <span>Preço: R$ {item.price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-6 w-6 rounded-full p-0"
                          onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                          aria-label="Diminuir quantidade"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="mx-2 font-medium">
                          {(() => {
                            let produto = products.find(prod => prod.id === item.productId);
                            // Se não encontrar, tenta pegar do próprio p (caso venha do combo)
                            if (!produto && (item as any).unit && (item as any).quantityPerUnit) {
                              produto = item as any;
                            }
                            let quantidadeFinal = item.quantity;
                            if (produto && produto.unit === 'ml' && produto.quantityPerUnit) {
                              const quantidadeMl = (item as any).amount || item.quantity;
                              quantidadeFinal = quantidadeMl / produto.quantityPerUnit;
                              console.log(`[FRONTEND][CARRINHO][CONVERSAO] Produto: ${produto.name}, Amount: ${quantidadeMl}ml, Unidade: ${produto.quantityPerUnit}ml, Fração: ${quantidadeFinal}`);
                            } else {
                              console.log(`[FRONTEND][CARRINHO][CONVERSAO] Produto: ${produto?.name}, Quantidade: ${quantidadeFinal} un`);
                            }
                            return quantidadeFinal;
                          })()}
                        </span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-6 w-6 rounded-full p-0"
                          onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                          aria-label="Aumentar quantidade"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <span className="ml-auto font-semibold text-sm">Total: R$ {item.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">Nenhum item adicionado</div>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-x-auto">
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Item</TableHead>
                      <TableHead className="w-16">Cód.</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="w-24 text-center">Qtd</TableHead>
                      <TableHead className="w-20 text-right">Preço</TableHead>
                      <TableHead className="w-20 text-right">Total</TableHead>
                      <TableHead className="w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cartItems.length > 0 ? (
                      cartItems.map((item, index) => (
                        <TableRow key={item.id} className="hover:bg-gray-50">
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{item.code}</TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-6 w-6 rounded-full p-0"
                                onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="mx-2">
                                {(() => {
                                  let produto = products.find(prod => prod.id === item.productId);
                                  // Se não encontrar, tenta pegar do próprio p (caso venha do combo)
                                  if (!produto && (item as any).unit && (item as any).quantityPerUnit) {
                                    produto = item as any;
                                  }
                                  let quantidadeFinal = item.quantity;
                                  if (produto && produto.unit === 'ml' && produto.quantityPerUnit) {
                                    const quantidadeMl = (item as any).amount || item.quantity;
                                    quantidadeFinal = quantidadeMl / produto.quantityPerUnit;
                                    console.log(`[FRONTEND][CARRINHO][CONVERSAO] Produto: ${produto.name}, Amount: ${quantidadeMl}ml, Unidade: ${produto.quantityPerUnit}ml, Fração: ${quantidadeFinal}`);
                                  } else {
                                    console.log(`[FRONTEND][CARRINHO][CONVERSAO] Produto: ${produto?.name}, Quantidade: ${quantidadeFinal} un`);
                                  }
                                  return quantidadeFinal;
                                })()}
                              </span>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-6 w-6 rounded-full p-0"
                                onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">R$ {item.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">R$ {item.total.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 p-0 text-red-500"
                              onClick={() => removeItem(item.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Nenhum item adicionado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Totals */}
            <div className="p-4 border-t">
              <div className="flex justify-between mb-1">
                <div>Valor:</div>
                <div className="font-medium text-green-600">R$ {subtotal.toFixed(2)}</div>
              </div>
              <div className="flex justify-between mb-1">
                <div>Desconto:</div>
                <div className="font-medium text-red-600">R$ {discount.toFixed(2)}</div>
              </div>
              <div className="flex justify-between">
                <div>Total:</div>
                <div className="font-medium text-element-blue-dark text-lg">R$ {total.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Painel retrátil de botões no rodapé (mobile) */}
        {isMobile ? (
          <div className="fixed bottom-0 left-0 w-full z-20 flex flex-col items-center">
            <button
              className="bg-element-blue-neon text-white rounded-t-lg shadow-lg flex items-center justify-center w-12 h-7 mb-1 animate-bounce-short"
              style={{ marginBottom: showActions ? 0 : 8, transition: 'margin-bottom 0.2s' }}
              onClick={() => setShowActions((v) => !v)}
              aria-label={showActions ? 'Ocultar ações' : 'Mostrar ações'}
            >
              {showActions ? <ChevronDown className="h-6 w-6" /> : <ChevronUp className="h-6 w-6" />}
            </button>
            <div
              className={`w-full bg-gray-200 transition-all duration-300 overflow-hidden ${showActions ? 'max-h-[500px] py-2' : 'max-h-0 py-0'}`}
              style={{ boxShadow: showActions ? '0 -2px 16px rgba(0,0,0,0.08)' : 'none' }}
            >
              <div className="grid grid-cols-2 gap-1 px-2">
                <Button 
                  variant="outline" 
                  className="bg-cyan-400 hover:bg-cyan-500 text-white flex flex-col items-center justify-center py-4 h-auto"
                  onClick={() => cartItems.length > 0 && removeItem(cartItems[cartItems.length - 1].id)}
                >
                  <X className="h-5 w-5 mb-1" />
                  <span className="text-xs">Cancelar Item</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="bg-cyan-400 hover:bg-cyan-500 text-white flex flex-col items-center justify-center py-4 h-auto"
                  onClick={cancelTicket}
                >
                  <X className="h-5 w-5 mb-1" />
                  <span className="text-xs">Cancelar Tíquete</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="bg-cyan-400 hover:bg-cyan-500 text-white flex flex-col items-center justify-center py-4 h-auto"
                  onClick={cancelOperation}
                >
                  <RefreshCcw className="h-5 w-5 mb-1" />
                  <span className="text-xs">Extornar</span>
                </Button>
                
                {paymentMethods.map((method) => (
                  <Button
                    key={method.id}
                    variant="outline"
                    className="bg-cyan-400 hover:bg-cyan-500 text-white flex flex-col items-center justify-center py-4 h-auto"
                    onClick={() => finishTicket(method.id)}
                  >
                    <span className="text-xs">{method.name}</span>
                  </Button>
                ))}
                
                <Button 
                  variant="outline" 
                  className="bg-cyan-400 hover:bg-cyan-500 text-white flex flex-col items-center justify-center py-4 h-auto"
                  onClick={() => setCpfCnpjDialogOpen(true)}
                >
                  <IdCard className="h-5 w-5 mb-1" />
                  <span className="text-xs">CPF/CNPJ</span>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full bg-gray-200 p-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1 md:static md:z-auto">
            <Button 
              variant="outline" 
              className="bg-cyan-400 hover:bg-cyan-500 text-white flex flex-col items-center justify-center py-4 h-auto"
              onClick={() => cartItems.length > 0 && removeItem(cartItems[cartItems.length - 1].id)}
            >
              <X className="h-5 w-5 mb-1" />
              <span className="text-xs">Cancelar Item</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="bg-cyan-400 hover:bg-cyan-500 text-white flex flex-col items-center justify-center py-4 h-auto"
              onClick={cancelTicket}
            >
              <X className="h-5 w-5 mb-1" />
              <span className="text-xs">Cancelar Tíquete</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="bg-cyan-400 hover:bg-cyan-500 text-white flex flex-col items-center justify-center py-4 h-auto"
              onClick={cancelOperation}
            >
              <RefreshCcw className="h-5 w-5 mb-1" />
              <span className="text-xs">Extornar</span>
            </Button>
            
            {paymentMethods.map((method) => (
              <Button
                key={method.id}
                variant="outline"
                className="bg-cyan-400 hover:bg-cyan-500 text-white flex flex-col items-center justify-center py-4 h-auto"
                onClick={() => finishTicket(method.id)}
              >
                <span className="text-xs">{method.name}</span>
              </Button>
            ))}
            
            <Button 
              variant="outline" 
              className="bg-cyan-400 hover:bg-cyan-500 text-white flex flex-col items-center justify-center py-4 h-auto"
              onClick={() => setCpfCnpjDialogOpen(true)}
            >
              <IdCard className="h-5 w-5 mb-1" />
              <span className="text-xs">CPF/CNPJ</span>
            </Button>
          </div>
        )}

        {/* Quick Products Modal */}
        <Dialog open={quickProductsOpen} onOpenChange={setQuickProductsOpen}>
          <DialogContent className="sm:max-w-[600px] w-full p-2 sm:p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Selecionar Produtos Rápidos
              </DialogTitle>
            </DialogHeader>
            <div className="flex gap-2 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:gap-4 md:overflow-x-visible">
              {allItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`min-w-[220px] md:min-w-0 border rounded-lg p-4 transition-colors ${item.pinned ? 'border-yellow-400 bg-yellow-50' : 'hover:border-yellow-400'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium">{item.code}</span>
                    {item.type === 'product' && (
                      <Checkbox 
                        id={`product-${item.id}`} 
                        checked={item.pinned}
                        onCheckedChange={() => togglePinProduct(item.id)}
                      />
                    )}
                  </div>
                  <div className="text-sm mb-1">{item.name} {item.type === 'combo' && <span className="text-xs text-blue-600">(Combo)</span>}</div>
                  <div className="text-sm text-green-600">R$ {item.price.toFixed(2)}</div>
                </div>
              ))}
            </div>
            <Button 
              onClick={() => setQuickProductsOpen(false)} 
              className="w-full bg-cyan-400 hover:bg-cyan-500 text-white"
            >
              Fechar
            </Button>
          </DialogContent>
        </Dialog>

        {/* CPF/CNPJ Modal */}
        <Dialog open={cpfCnpjDialogOpen} onOpenChange={setCpfCnpjDialogOpen}>
          <DialogContent className="sm:max-w-[400px] w-full p-2 sm:p-6">
            <DialogHeader>
              <DialogTitle>Adicionar CPF/CNPJ</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Digite o CPF/CNPJ"
                value={cpfCnpjValue}
                onChange={(e) => setCpfCnpjValue(e.target.value)}
                className="mb-4"
              />
              <Button 
                onClick={handleCpfCnpjSubmit} 
                className="w-full bg-cyan-400 hover:bg-cyan-500 text-white"
              >
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {comboToConfigure && (
          <ComboOptionsModal
            open={comboModalOpen}
            onOpenChange={setComboModalOpen}
            combo={comboToConfigure}
            onConfirm={async (choosableSelections) => {
              // 1. Montar lista de todos os produtos do combo (fixos + escolhidos)
              const produtosCombo: { productId: string, nome: string, precoOriginal: number, quantidade: number, amount: number }[] = [];
              // Fixos
              for (const item of comboToConfigure.items) {
                if (!item.isChoosable) {
                  produtosCombo.push({
                    productId: item.productId,
                    nome: item.product?.name || '',
                    precoOriginal: item.product?.price || 0,
                    quantidade: Math.max(1, item.quantity),
                    amount: item.amount || item.quantity // Salva o valor em ml para conversão depois
                  });
                }
              }
              // Escolhíveis
              for (const [categoryId, selections] of Object.entries(choosableSelections)) {
                for (const [productId, quantidade] of Object.entries(selections)) {
                  if (quantidade > 0) {
                    // Buscar o preço do produto nas opções carregadas
                    const categoria = comboToConfigure.items.find((i: any) => i.categoryId === categoryId);
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
                      quantidade: Number(quantidade),
                      amount: quantidade // Salva o valor em ml para conversão depois
                    });
                  }
                }
              }
              // 2. Calcular valor total original
              // (Removido: cálculo antigo de totaisNaoArredondados e totaisArredondados)
              // 3. Distribuir valor do combo proporcionalmente (sem arredondar no loop)
              // 4. Arredonde cada total
              // 5. Calcule a diferença
              // 6. Distribua o ajuste entre todos os itens do combo de forma cíclica
              const totalAmount = produtosCombo.reduce((sum, p) => sum + (p.quantidade), 0);
              let totaisNaoArredondados = produtosCombo.map(p =>
                totalAmount > 0
                  ? ((p.quantidade) / totalAmount) * comboToConfigure.price
                  : 0
              );
              let totaisArredondados = totaisNaoArredondados.map(v => Math.round(v * 100) / 100);
              let soma = totaisArredondados.reduce((a, b) => a + b, 0);
              let diff = Math.round((comboToConfigure.price - soma) * 100); // em centavos
              if (diff !== 0) {
                const indicesOrdenados = Array.from({ length: totaisArredondados.length }, (_, i) => i);
                let i = 0;
                while (diff !== 0) {
                  const idx = indicesOrdenados[i % indicesOrdenados.length];
                  totaisArredondados[idx] += diff > 0 ? 0.01 : -0.01;
                  totaisArredondados[idx] = Math.round(totaisArredondados[idx] * 100) / 100;
                  diff += diff > 0 ? -1 : 1;
                  i++;
                }
              }
              setCartItems((prev: CartItem[]) => ([
                ...prev,
                ...produtosCombo.map((p, idx) => {
                  let produto = products.find(prod => prod.id === p.productId);
                  // Se não encontrar, tenta pegar do próprio p (caso venha do combo)
                  if (!produto && (p as any).unit && (p as any).quantityPerUnit) {
                    produto = p as any;
                  }
                  let quantidadeFinal = p.quantidade;
                  if (produto && produto.unit === 'ml' && produto.quantityPerUnit) {
                    const quantidadeMl = (p as any).amount || p.quantidade;
                    quantidadeFinal = quantidadeMl / produto.quantityPerUnit;
                    console.log(`[FRONTEND][CARRINHO][CONVERSAO] Produto: ${produto.name}, Amount: ${quantidadeMl}ml, Unidade: ${produto.quantityPerUnit}ml, Fração: ${quantidadeFinal}`);
                  } else {
                    console.log(`[FRONTEND][CARRINHO][CONVERSAO] Produto: ${produto?.name}, Quantidade: ${quantidadeFinal} un`);
                  }
                  return {
                    id: comboToConfigure.id + '-' + p.productId + '-' + Math.random().toString(36).substring(2, 8),
                    productId: p.productId,
                    code: '',
                    name: `${p.nome} (Dose de ${comboToConfigure.name})`,
                    quantity: quantidadeFinal,
                    price: totaisArredondados[idx],
                    total: totaisArredondados[idx],
                    type: 'product',
                    parentCombo: { id: comboToConfigure.id, name: comboToConfigure.name }
                  };
                })
              ]));
              toast({ description: `Produtos da dose ${comboToConfigure.name} adicionados ao carrinho.` });
              setComboModalOpen(false);
              setComboToConfigure(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AdminPDV;
