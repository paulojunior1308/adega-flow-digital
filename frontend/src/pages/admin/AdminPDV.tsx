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
  choosableSelections?: Record<string, Record<string, number>>;
}

interface Dose {
  id: string;
  name: string;
  price: number;
  items: {
    productId: string;
    quantity: number;
    product: Product;
  }[];
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
  const [doses, setDoses] = useState<Dose[]>([]);
  const [doseModalOpen, setDoseModalOpen] = useState(false);
  const [doseToConfigure, setDoseToConfigure] = useState<Dose | null>(null);
  const [doseOptionsModalOpen, setDoseOptionsModalOpen] = useState(false);
  
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
      setDoses(dosesRes.data);
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

  // Add item to cart
  const addToCart = (item: any, quantity: number = 1) => {
    if (item.type === 'combo') {
      if (item.items?.some((i: any) => i.isChoosable || i.allowFlavorSelection)) {
        setComboToConfigure(item);
        setComboModalOpen(true);
        return;
      }
    } else if (item.type === 'dose') {
      if (item.items?.some((i: any) => i.allowFlavorSelection)) {
        setDoseToConfigure(item);
        setDoseOptionsModalOpen(true);
        return;
      } else {
        // Dose só com itens fixos
        setCartItems([...cartItems, {
          id: item.id + '-' + Math.random().toString(36).substring(2, 8),
          productId: item.id,
          code: item.id.substring(0, 6),
          name: item.name,
          quantity: 1,
          price: item.price,
          total: item.price,
          doseItems: item.items
        }]);
        toast({ description: `${item.name} (Dose) adicionada ao carrinho.` });
        return;
      }
    }

    const estoqueDisponivel = item.stock ?? Infinity;
    const quantidadeNoCarrinho = cartItems.find(ci => ci.id === item.id)?.quantity || 0;
    
    if (quantidadeNoCarrinho + quantity > estoqueDisponivel) {
      toast({
        variant: "destructive",
        description: `Estoque insuficiente para ${item.name}. Disponível: ${estoqueDisponivel}, solicitado: ${quantidadeNoCarrinho + quantity}`
      });
      return;
    }

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
        total: item.price * quantity
      };
      setCartItems([...cartItems, newItem]);
      toast({ description: `${item.name} adicionado ao carrinho.` });
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
      await api.post('/admin/pdv-sales', {
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        })),
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
                          {/* Se houver seleções escolhíveis, exibir também */}
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
                                {/* Se houver seleções escolhíveis, exibir também */}
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
            onConfirm={(choosableSelections) => {
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
              // 7. Calcula preço unitário ajustado e desconto
              const descontos = produtosCombo.map((p, idx) => {
                const precoAjustado = Math.round((totaisArredondados[idx] / p.quantidade) * 100) / 100;
                return {
                  productId: p.productId,
                  precoOriginal: p.precoOriginal,
                  quantidade: p.quantidade,
                  precoAjustado,
                  nome: p.nome,
                  desconto: p.precoOriginal - precoAjustado
                };
              });
              // 8. Adicionar cada produto ao carrinho já com o preço ajustado
              setCartItems(prev => ([
                ...prev,
                ...descontos.map(d => ({
                  id: d.productId + '-' + Math.random().toString(36).substring(2, 8),
                  productId: d.productId,
                  code: d.productId.substring(0, 6),
                  name: d.nome,
                  quantity: d.quantidade,
                  price: d.precoAjustado,
                  total: d.precoAjustado * d.quantidade
                }))
              ]));
              toast({ description: `${comboToConfigure.name} (Combo) adicionado ao carrinho.` });
              setComboModalOpen(false);
              setComboToConfigure(null);
            }}
          />
        )}

        <Dialog open={doseModalOpen} onOpenChange={setDoseModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurar Dose</DialogTitle>
            </DialogHeader>
            {doseToConfigure && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">{doseToConfigure.name}</h3>
                  <p className="text-sm text-gray-500">
                    Produtos incluídos:
                  </p>
                  <ul className="space-y-2">
                    {doseToConfigure.items.map((item) => (
                      <li key={item.productId} className="flex items-center justify-between">
                        <span>{item.product.name}</span>
                        <span className="text-sm text-gray-500">
                          {item.quantity} {item.product.isFractioned ? 'ml' : 'un'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setDoseModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => {
                      const newItem: CartItem = {
                        id: doseToConfigure.id,
                        productId: doseToConfigure.id,
                        code: doseToConfigure.id.substring(0, 6),
                        name: doseToConfigure.name,
                        quantity: 1,
                        price: doseToConfigure.price,
                        total: doseToConfigure.price
                      };
                      setCartItems([...cartItems, newItem]);
                      setDoseModalOpen(false);
                      toast({ description: `${doseToConfigure.name} adicionado ao carrinho.` });
                    }}
                  >
                    Adicionar ao Carrinho
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {doseToConfigure && (
          <ComboOptionsModal
            open={doseOptionsModalOpen}
            onOpenChange={setDoseOptionsModalOpen}
            combo={{
              id: doseToConfigure.id,
              name: doseToConfigure.name,
              items: doseToConfigure.items.map((item: any) => ({
                ...item,
                isChoosable: item.allowFlavorSelection
              }))
            }}
            onConfirm={(choosableSelections) => {
              setCartItems([...cartItems, {
                id: doseToConfigure.id + '-' + Math.random().toString(36).substring(2, 8),
                productId: doseToConfigure.id,
                code: doseToConfigure.id.substring(0, 6),
                name: doseToConfigure.name,
                quantity: 1,
                price: doseToConfigure.price,
                total: doseToConfigure.price,
                doseItems: doseToConfigure.items,
                choosableSelections
              }]);
              toast({ description: `${doseToConfigure.name} (Dose) adicionada ao carrinho.` });
              setDoseOptionsModalOpen(false);
              setDoseToConfigure(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AdminPDV;
