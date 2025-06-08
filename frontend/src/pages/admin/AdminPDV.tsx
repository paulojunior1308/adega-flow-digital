import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, X, RefreshCcw, DollarSign, QrCode, CreditCard, IdCard, Plus, Minus, ChevronUp, ChevronDown, Package, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import api from '@/lib/axios';
import { ComboOptionsModal } from '@/components/home/ComboOptionsModal';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Types definition
interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  pinned?: boolean;
  stock: number;
  image?: string;
  categoryId?: string;
}

interface CartItem {
  id: string;
  productId?: string;
  doseId?: string;
  code?: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
  image?: string;
  isDose?: boolean;
  choosableItems?: {
    productId: string;
    name: string;
    quantity: number;
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
  const [doses, setDoses] = useState<any[]>([]);
  const [selectedDose, setSelectedDose] = useState<any>(null);
  const [showDoseModal, setShowDoseModal] = useState(false);
  const [selectedChoosableItems, setSelectedChoosableItems] = useState<{[key: string]: string[]}>({});
  
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
      if (item.items && Array.isArray(item.items) && item.items.some((i: any) => i.isChoosable || i.allowFlavorSelection)) {
        setComboToConfigure(item);
        setComboModalOpen(true);
        return;
      }
      // Produto avulso: id normal
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
    } else {
      // Produto avulso: id normal
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
    try {
      // Preparar itens para envio
      const items = cartItems.map(item => ({
        productId: item.productId,
        doseId: item.doseId,
        quantity: item.quantity,
        price: item.price,
        choosableItems: item.choosableItems
      }));

      // Enviar venda para o backend
      const response = await api.post('/admin/sales', {
        items,
        paymentMethodId,
        cpfCnpj: cpfCnpjValue
      });

      // Limpar carrinho e estado
      setCartItems([]);
      setCpfCnpjValue('');
      setTicketNumber(prev => prev + 1);

      toast({
        description: 'Venda realizada com sucesso!'
      });

      // Imprimir comprovante
      if (response.data) {
        printReceipt(response.data);
      }
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      toast({
        variant: 'destructive',
        description: 'Erro ao finalizar venda. Tente novamente.'
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

  const fetchDoses = async () => {
    try {
      const response = await api.get('/admin/doses');
      setDoses(response.data);
    } catch (error) {
      console.error('Erro ao buscar doses:', error);
    }
  };

  const handleAddDose = (dose: any) => {
    setSelectedDose(dose);
    setShowDoseModal(true);
  };

  const handleConfirmDose = () => {
    if (!selectedDose) return;

    const choosableItems = selectedDose.items
      .filter((item: any) => item.isChoosable)
      .map((item: any) => ({
        productId: selectedChoosableItems[item.id]?.[0] || '',
        name: products.find(p => p.id === selectedChoosableItems[item.id]?.[0])?.name || '',
        quantity: item.quantity
      }));

    const cartItem: CartItem = {
      id: Math.random().toString(),
      doseId: selectedDose.id,
      name: selectedDose.name,
      price: selectedDose.price,
      quantity: 1,
      total: selectedDose.price,
      image: selectedDose.image,
      isDose: true,
      choosableItems
    };

    setCartItems(prev => [...prev, cartItem]);
    setShowDoseModal(false);
    setSelectedDose(null);
    setSelectedChoosableItems({});
  };

  const printReceipt = (sale: any) => {
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) return;

    const content = `
      <html>
        <head>
          <title>Comprovante de Venda</title>
          <style>
            body {
              font-family: monospace;
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .items {
              margin: 20px 0;
            }
            .item {
              margin-bottom: 10px;
            }
            .total {
              margin-top: 20px;
              text-align: right;
              font-weight: bold;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Adega Flow</h2>
            <p>Comprovante de Venda</p>
            <p>Ticket #${sale.id}</p>
            <p>${new Date(sale.createdAt).toLocaleString()}</p>
          </div>

          <div class="items">
            ${sale.items.map((item: any) => `
              <div class="item">
                <div>${item.name}</div>
                <div>${item.quantity}x R$ ${item.price.toFixed(2)}</div>
                <div>Total: R$ ${item.total.toFixed(2)}</div>
                ${item.choosableItems ? `
                  <div style="font-size: 12px; margin-left: 10px;">
                    ${item.choosableItems.map((choosable: any) => `
                      <div>${choosable.name} (${choosable.quantity}ml)</div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>

          <div class="total">
            Total: R$ ${sale.total.toFixed(2)}
          </div>

          <div class="footer">
            <p>Obrigado pela preferência!</p>
            <p>Volte sempre!</p>
          </div>
        </body>
      </html>
    `;

    receiptWindow.document.write(content);
    receiptWindow.document.close();
    receiptWindow.print();
  };

  return (
    <div className="min-h-screen bg-element-gray-light flex">
      <AdminSidebar />
      
      <div className="flex-1 p-8 ml-0 lg:ml-64">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna da esquerda - Lista de produtos */}
          <div className="lg:col-span-2 space-y-4">
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

            {/* Lista de produtos */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => addToCart(product)}
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 rounded mb-2 flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <h3 className="font-medium text-sm">{product.name}</h3>
                  <p className="text-element-blue-dark font-medium">
                    R$ {product.price.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {/* Lista de doses */}
            <div className="mt-8">
              <h2 className="text-lg font-medium mb-4">Doses</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {doses.map((dose) => (
                  <div
                    key={dose.id}
                    className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleAddDose(dose)}
                  >
                    {dose.image ? (
                      <img
                        src={dose.image}
                        alt={dose.name}
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded mb-2 flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <h3 className="font-medium text-sm">{dose.name}</h3>
                    <p className="text-element-blue-dark font-medium">
                      R$ {dose.price.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Coluna da direita - Carrinho */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-medium mb-4">Carrinho</h2>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div>
                      <h3 className="font-medium text-sm">{item.name}</h3>
                      {item.isDose && item.choosableItems && (
                        <div className="text-xs text-gray-500">
                          {item.choosableItems.map((choosable, index) => (
                            <div key={index}>
                              {choosable.name} ({choosable.quantity}ml)
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
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
      </div>

      {/* Modal de seleção de produtos escolhíveis */}
      <Dialog open={showDoseModal} onOpenChange={setShowDoseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar Produtos</DialogTitle>
            <DialogDescription>
              Selecione os produtos para a dose {selectedDose?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedDose?.items
              .filter((item: any) => item.isChoosable)
              .map((item: any) => (
                <div key={item.id} className="space-y-2">
                  <Label>Escolha até {item.maxChoices} {item.product.name}</Label>
                  <Select
                    value={selectedChoosableItems[item.id]?.[0] || ''}
                    onValueChange={(value) => {
                      setSelectedChoosableItems(prev => ({
                        ...prev,
                        [item.id]: [value]
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products
                        .filter(p => p.categoryId === item.categoryId)
                        .map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDoseModal(false);
                setSelectedDose(null);
                setSelectedChoosableItems({});
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmDose}>
              Adicionar ao Carrinho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPDV;
