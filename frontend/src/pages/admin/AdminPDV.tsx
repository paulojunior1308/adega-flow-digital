import React, { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, X, RefreshCcw, DollarSign, QrCode, CreditCard, IdCard, Plus, Minus, ChevronUp, ChevronDown, Receipt } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import api from '@/lib/axios';
import { ComboOptionsModal } from '@/components/home/ComboOptionsModal';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { ComandaModal } from '@/components/admin/ComandaModal';
import { Label } from '@/components/ui/label';

// Types definition
interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  pinned?: boolean;
  stock: number;
  isFractioned?: boolean;
  totalVolume?: number;
  unitVolume?: number;
}

interface CartItem {
  id: string;
  productId: string;
  code: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  doseItems?: any[];
  isDoseItem?: boolean;
  isComboItem?: boolean;
  isFractioned?: boolean;
  discountBy?: 'volume' | 'unit';
  choosableSelections?: Record<string, Record<string, number>>;
  comboInstanceId?: string;
}

interface Dose {
  id: string;
  name: string;
  price: number;
  items: DoseItem[];
}

interface DoseItem {
  productId: string;
  quantity: number;
  product: Product;
  isChoosable?: boolean;
  allowFlavorSelection?: boolean;
  categoryId?: string;
  nameFilter?: string;
  discountBy?: 'volume' | 'unit';
  volumeToDiscount?: number;
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
  const [doses, setDoses] = useState<any[]>([]);
  const [doseModalOpen, setDoseModalOpen] = useState(false);
  const [doseToConfigure, setDoseToConfigure] = useState<Dose | null>(null);
  const [doseOptionsModalOpen, setDoseOptionsModalOpen] = useState(false);
  const [comandaModalOpen, setComandaModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Buscar produtos e combos ao carregar
  useEffect(() => {
    Promise.all([
      api.get('/admin/products'),
      api.get('/admin/combos'),
      api.get('/admin/doses'),
      api.get('/admin/products', { params: { pinned: true } })
    ]).then(([productsRes, combosRes, dosesRes, pinnedRes]) => {
      setProducts(productsRes.data.filter((p: any) => p.stock > 0));
      setCombos(combosRes.data.map((combo: any) => ({
        ...combo,
        items: combo.items.map((item: any) => ({
          ...item,
          isChoosable: item.allowFlavorSelection
        }))
      })));
      setDoses(dosesRes.data.map((dose: any) => ({
        ...dose,
        items: dose.items.map((item: any) => ({
          ...item,
          isChoosable: item.allowFlavorSelection,
        }))
      })));
      setPinnedProducts(pinnedRes.data.filter((p: any) => p.stock > 0));
    });
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
    })),
    ...doses.map(d => ({
      ...d,
      type: 'dose',
      code: d.id.substring(0, 6),
      name: d.name,
      price: d.price,
    }))
  ], [products, combos, doses]);

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

  const handleConfirm = (selections: Record<string, Record<string, number>>) => {
    if (!comboToConfigure) return;

    const { type, items, price: finalPrice, name } = comboToConfigure;
    const allItemsFromConfig: { product: Product; quantity: number; discountBy?: 'volume' | 'unit' }[] = [];

    // 1. Derivar o modo de seleção de cada categoria (volume ou unidade)
    const categoryConfigMap: Record<string, { mode: 'volume' | 'unit' }> = {};
    items.forEach((item: any) => {
        if(item.isChoosable && item.categoryId && !categoryConfigMap[item.categoryId]) {
            categoryConfigMap[item.categoryId] = { mode: item.discountBy === 'volume' ? 'volume' : 'unit' };
        }
    });

    items.forEach((item: any) => {
      if (!item.isChoosable && item.product) {
        allItemsFromConfig.push({ product: item.product, quantity: item.quantity, discountBy: item.discountBy });
      }
    });

    for (const categoryId in selections) {
      const categoryMode = categoryConfigMap[categoryId]?.mode || 'unit';
      for (const productId in selections[categoryId]) {
        const quantity = selections[categoryId][productId];
        if (quantity > 0) {
          const product = products.find(p => p.id === productId);
          if (product) {
            // 2. Usar o modo derivado para garantir a consistência
            allItemsFromConfig.push({ product, quantity, discountBy: categoryMode });
          }
        }
      }
    }

    const totalOriginalPrice = allItemsFromConfig.reduce((sum, item) => sum + item.product.price * (item.discountBy === 'volume' ? 1 : item.quantity), 0);
    
    let accumulatedPrice = 0;
    const newItems: CartItem[] = allItemsFromConfig.map((item, index) => {
      const proportion = (item.product.price * (item.discountBy === 'volume' ? 1 : item.quantity)) / totalOriginalPrice;
      let proportionalPrice = finalPrice * proportion;
      
      proportionalPrice = Math.round(proportionalPrice * 100) / 100;
      accumulatedPrice += proportionalPrice;

      if (index === allItemsFromConfig.length - 1) {
        proportionalPrice += (finalPrice - accumulatedPrice);
      }

      return {
        id: `${comboToConfigure.id}-${item.product.id}-${Date.now()}`,
        productId: item.product.id,
        code: item.product.code,
        name: `${item.product.name} (${type === 'combo' ? 'Combo' : 'Dose'}: ${name})`,
        quantity: item.quantity,
        price: proportionalPrice / item.quantity,
        total: proportionalPrice,
        isComboItem: type === 'combo',
        isDoseItem: type === 'dose',
        isFractioned: item.product.isFractioned,
        discountBy: item.discountBy,
      };
    });

    setCartItems(prev => [...prev, ...newItems]);
    setComboModalOpen(false);
    setComboToConfigure(null);
    toast({ description: `${name} adicionado ao carrinho.` });
  };

  const addToCart = (item: any, quantity: number = 1) => {
    if (item.type === 'combo' || item.type === 'dose') {
      const hasChoosableItems = item.items?.some((i: any) => i.isChoosable || i.allowFlavorSelection);
      if (hasChoosableItems) {
        setComboToConfigure(item);
        setComboModalOpen(true);
      } else {
        // Lógica para adicionar direto no carrinho (para itens sem opções)
        const allItems = item.items.map((i: any) => ({ product: i.product, quantity: i.quantity }));
        const totalOriginalPrice = allItems.reduce((sum: number, p: any) => sum + p.product.price * p.quantity, 0);
        const finalPrice = item.price;

        let accumulatedPrice = 0;
        const newItems: CartItem[] = allItems.map((p: any, index: number) => {
          const proportion = (p.product.price * p.quantity) / totalOriginalPrice;
          let proportionalPrice = finalPrice * proportion;

          proportionalPrice = Math.round(proportionalPrice * 100) / 100;
          accumulatedPrice += proportionalPrice;
          
          if (index === allItems.length - 1) {
            proportionalPrice += (finalPrice - accumulatedPrice);
          }

          return {
            id: `${item.id}-${p.product.id}-${Date.now()}`,
            productId: p.product.id,
            code: p.product.code,
            name: `${p.product.name} (${item.type === 'combo' ? 'Combo' : 'Dose'}: ${item.name})`,
            quantity: p.quantity,
            price: proportionalPrice / p.quantity,
            total: proportionalPrice,
            isComboItem: item.type === 'combo',
            isDoseItem: item.type === 'dose',
            isFractioned: item.isFractioned,
            discountBy: item.discountBy,
          };
        });
  
        setCartItems(prev => [...prev, ...newItems]);
        toast({ description: `${item.name} adicionado ao carrinho.` });
      }
    } else { // Produto Simples
      // Apenas incrementa se já existir um item avulso (não de combo ou dose)
      const existingItem = cartItems.find(cartItem => 
        cartItem.productId === item.id && 
        !cartItem.isComboItem && 
        !cartItem.isDoseItem
      );

      if (existingItem) {
        updateCartItemQuantity(existingItem.id, existingItem.quantity + quantity);
      } else {
        const newItem: CartItem = {
          id: `${item.id}-${Date.now()}`,
          productId: item.id,
          code: item.code,
          name: item.name,
          quantity: quantity,
          price: item.price,
          total: item.price * quantity,
          isFractioned: item.isFractioned,
        };
        setCartItems(prev => [...prev, newItem]);
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

  // Transfer items from comanda to main cart
  const handleTransferFromComanda = (comandaItems: CartItem[]) => {
    const updatedCartItems = [...cartItems];

    // Agrupar combos por nome para gerar um comboInstanceId único para cada grupo
    const comboGroups: Record<string, string> = {};

    comandaItems.forEach(item => {
      let newItem = { ...item };
      // Se for combo, gera um comboInstanceId único por grupo de combo
      if (item.name.toLowerCase().includes('combo')) {
        if (!comboGroups[item.name]) {
          comboGroups[item.name] = Math.random().toString(36).substring(2, 10);
        }
        newItem.comboInstanceId = comboGroups[item.name];
      }
      // Corrige o total do item
      newItem.total = newItem.price * newItem.quantity;

      // Adiciona ao carrinho
      const existingItemIndex = updatedCartItems.findIndex(cartItem => 
        cartItem.productId === newItem.productId && cartItem.name === newItem.name && (!newItem.comboInstanceId || cartItem.comboInstanceId === newItem.comboInstanceId)
      );

      if (existingItemIndex > -1) {
        // Se já existe, soma a quantidade
        const existingItem = updatedCartItems[existingItemIndex];
        existingItem.quantity += newItem.quantity;
        existingItem.total = existingItem.quantity * existingItem.price;
      } else {
        updatedCartItems.push(newItem);
      }
    });

    setCartItems(updatedCartItems);
  };

  // Finish ticket with payment method
  const finishTicket = async (paymentMethodId: string) => {
    if (cartItems.length === 0) {
      toast({
        variant: 'destructive',
        description: 'O carrinho está vazio.',
      });
      return;
    }

    try {
      setLoading(true);
      const saleData = {
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          isDoseItem: !!item.isDoseItem,
          isComboItem: !!item.isComboItem,
          isFractioned: !!item.isFractioned,
          discountBy: item.discountBy,
          sellingByVolume: item.discountBy === 'volume',
          // O campo choosableSelections é removido pois não é usado pelo backend aqui
        })),
        paymentMethodId: paymentMethodId,
      };

      console.log("Payload FINAL enviado:", JSON.stringify(saleData, null, 2));
      await api.post('/admin/pdv-sales', saleData);

      toast({
        description: `Venda finalizada!`,
      });
      // Resetar estado
      setCartItems([]);
      setProductCode('');
      setSearchQuery('');
      setTicketNumber(prev => prev + 1);
      setCpfCnpjValue('');
      setCpfCnpjDialogOpen(false);
    } catch (error) {
      console.error('Erro ao finalizar a venda:', error);
      toast({
        title: 'Erro na Venda',
        description:
          'Não foi possível registrar a venda. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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

  const actionButtons = [
    { label: 'Cancelar Item', icon: <X className="h-5 w-5 mb-1" />, onClick: () => cartItems.length > 0 && removeItem(cartItems[cartItems.length - 1].id), visible: true },
    { label: 'Cancelar Tíquete', icon: <X className="h-5 w-5 mb-1" />, onClick: cancelTicket, visible: true },
    { label: 'Extornar', icon: <RefreshCcw className="h-5 w-5 mb-1" />, onClick: cancelOperation, visible: true },
    ...paymentMethods.map(method => ({
      label: method.name,
      icon: <CreditCard className="h-5 w-5 mb-1" />, // Ícone genérico, pode ser melhorado
      onClick: () => finishTicket(method.id),
      visible: true
    })),
    { label: 'CPF/CNPJ', icon: <IdCard className="h-5 w-5 mb-1" />, onClick: () => setCpfCnpjDialogOpen(true), visible: true },
  ];

  return (
    <AdminLayout noPadding={true}>
      <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-screen bg-gray-100">
        {/* Container principal que controla a rolagem e o layout */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-y-auto lg:overflow-hidden p-2 lg:p-4 pb-24 lg:pb-2">
          
          {/* Lado Esquerdo: Busca e Produtos (não tem mais overflow próprio no mobile) */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="bg-white shadow-sm p-4 flex flex-col sm:flex-row justify-between items-center gap-2 rounded-lg">
              <h1 className="text-xl font-medium text-element-blue-dark">PDV - Venda Local</h1>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={() => setComandaModalOpen(true)} variant="outline" className="w-full">Abrir Comanda</Button>
                <Button onClick={() => setQuickProductsOpen(true)} variant="outline" className="w-full">Produtos Rápidos</Button>
              </div>
            </div>

            {/* Search inputs */}
            <div className="flex flex-col sm:flex-row gap-2">
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
              <div className="w-full sm:w-32">
                <Input 
                  type="text" 
                  placeholder="Cód.Prod" 
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-16">
                <Input 
                  type="number" 
                  min="1" 
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              <Button onClick={handleAddProductByCode} className="px-3 w-full sm:w-auto" disabled={!productCode || !products.find(p => p.code === productCode) || products.find(p => p.code === productCode)?.stock === 0}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Pinned/Searched Products (toma o espaço restante, mas não rola independentemente no mobile) */}
            <div className="flex-1 bg-white rounded-lg p-2 space-y-2">
              {/* Pinned Products */}
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

              {/* Search results (removido o overflow daqui) */}
              <div>
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
          </div>

          {/* Lado Direito: Carrinho (não tem mais overflow próprio) */}
          <div className="w-full lg:w-[450px] bg-white shadow-md flex flex-col rounded-lg lg:overflow-hidden">
            {/* Ticket header */}
            <div className="p-4 bg-gray-100 flex justify-between items-center">
              <div className="font-medium">Tíquete: {ticketNumber}</div>
              <div className="text-green-600 font-medium">ABERTO</div>
            </div>

            {/* Cart items */}
            <div className="lg:flex-1 lg:overflow-y-auto">
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
                          <span className="mx-2 font-medium">{item.quantity}</span>
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
                        {item.doseItems && (
                          <div className="mt-2 bg-gray-100 rounded p-2">
                            <div className="font-semibold text-xs mb-1 text-cyan-700">Composição:</div>
                            <ul className="text-xs text-gray-700 space-y-1">
                              {item.doseItems.map((doseItem, idx) => (
                                <li key={doseItem.productId + '-' + idx} className="flex justify-between">
                                  <span>{doseItem.product?.name || 'Produto'}</span>
                                  <span>
                                    {doseItem.quantity} {doseItem.discountBy === 'volume' || (doseItem.discountBy === undefined && doseItem.product?.isFractioned) ? 'ml' : 'un'}
                                  </span>
                                </li>
                              ))}
                            </ul>
                            {item.choosableSelections && Object.keys(item.choosableSelections).length > 0 && (
                              <div className="mt-1 text-cyan-800">
                                <div className="font-semibold">Escolhas do cliente:</div>
                                <ul className="list-disc ml-4">
                                  {Object.entries(item.choosableSelections).map(([cat, prods]) => (
                                    Object.entries(prods).map(([prodId, qty]) => (
                                      <li key={cat + '-' + prodId}>
                                        {qty}x {prodId}
                                      </li>
                                    ))
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">Nenhum item adicionado</div>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                            <TableCell className="font-medium">
                              {item.name}
                              {item.doseItems && (
                                <div className="mt-1 text-xs text-gray-700">
                                  <div className="font-semibold text-cyan-700">Composição:</div>
                                  <ul className="ml-2">
                                    {item.doseItems.map((doseItem, idx) => (
                                      <li key={doseItem.productId + '-' + idx} className="flex justify-between">
                                        <span>{doseItem.product?.name || 'Produto'}</span>
                                        <span>
                                          {doseItem.quantity} {doseItem.discountBy === 'volume' || (doseItem.discountBy === undefined && doseItem.product?.isFractioned) ? 'ml' : 'un'}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                  {item.choosableSelections && Object.keys(item.choosableSelections).length > 0 && (
                                    <div className="mt-1 text-cyan-800">
                                      <div className="font-semibold">Escolhas do cliente:</div>
                                      <ul className="list-disc ml-4">
                                        {Object.entries(item.choosableSelections).map(([cat, prods]) => (
                                          Object.entries(prods).map(([prodId, qty]) => (
                                            <li key={cat + '-' + prodId}>
                                              {qty}x {prodId}
                                            </li>
                                          ))
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                            </TableCell>
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
                                <span className="mx-2">{item.quantity}</span>
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
            </div>

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

        {/* Barra de Ações Retrátil (Mobile) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 flex flex-col items-center">
          <button
            className="bg-element-blue-neon text-white rounded-t-lg shadow-lg flex items-center justify-center w-12 h-6"
            onClick={() => setShowActions(prev => !prev)}
            aria-label={showActions ? 'Ocultar ações' : 'Mostrar ações'}
          >
            {showActions ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </button>
          <div
            className={`w-full bg-gray-200 transition-all duration-300 overflow-hidden ${showActions ? 'max-h-[500px] p-2' : 'max-h-0'}`}
          >
            <div className="grid grid-cols-3 gap-2">
              {actionButtons.map(btn => btn.visible && (
                <Button 
                  key={btn.label}
                  variant="outline"
                  className="bg-cyan-400 hover:bg-cyan-500 text-white flex flex-col items-center justify-center py-3 h-auto"
                  onClick={btn.onClick}
                >
                  {btn.icon}
                  <span className="text-xs text-center">{btn.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Barra de Ações Fixa (Desktop) */}
        <div className="hidden lg:grid bg-gray-200 p-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {actionButtons.map(btn => btn.visible && (
            <Button 
              key={btn.label}
              variant="outline"
              className="bg-cyan-400 hover:bg-cyan-500 text-white flex flex-col items-center justify-center py-3 h-auto"
              onClick={btn.onClick}
            >
              {btn.icon}
              <span className="text-xs">{btn.label}</span>
            </Button>
          ))}
        </div>
      </div>
      
      {/* Modals */}
      <Dialog open={cpfCnpjDialogOpen} onOpenChange={setCpfCnpjDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar CPF/CNPJ</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cpfCnpj" className="text-right">
                CPF/CNPJ
              </Label>
              <Input
                id="cpfCnpj"
                value={cpfCnpjValue}
                onChange={(e) => setCpfCnpjValue(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleCpfCnpjSubmit}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ComandaModal 
        open={comandaModalOpen} 
        onOpenChange={setComandaModalOpen} 
        onTransferToCart={handleTransferFromComanda}
      />
      {/* Combo/Dose Options Modal */}
      {comboToConfigure && (
        <ComboOptionsModal
          open={comboModalOpen}
          onOpenChange={setComboModalOpen}
          combo={comboToConfigure}
          onConfirm={handleConfirm}
          products={products}
        />
      )}
      <Drawer open={cartOpen} onOpenChange={() => setCartOpen(false)}>
        {/* ... (conteúdo do drawer) ... */}
      </Drawer>
      <Drawer open={doseModalOpen} onOpenChange={() => setDoseModalOpen(false)}>
        {/* ... (conteúdo do drawer) ... */}
      </Drawer>
      <Drawer open={doseOptionsModalOpen} onOpenChange={() => setDoseOptionsModalOpen(false)}>
        {/* ... (conteúdo do drawer) ... */}
      </Drawer>
      <Dialog open={quickProductsOpen} onOpenChange={setQuickProductsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Selecionar Produtos Rápidos
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4 max-h-[60vh] overflow-y-auto">
            {products.map((product) => (
              <div 
                key={product.id} 
                className={`border rounded-lg p-3 transition-colors cursor-pointer ${product.pinned ? 'border-yellow-400 bg-yellow-50' : 'hover:border-yellow-400'}`}
                onClick={() => togglePinProduct(product.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium">{product.name}</span>
                  <Checkbox 
                    checked={!!product.pinned}
                    onCheckedChange={() => togglePinProduct(product.id)}
                  />
                </div>
                <div className="text-sm text-gray-600">{product.price.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPDV;