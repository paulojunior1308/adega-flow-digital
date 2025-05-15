
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Search, Plus, ListPlus, X, ArrowRight, RefreshCcw, DollarSign, QrCode, CreditCard, IdCard } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

interface CartItem {
  id: number;
  code: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface Product {
  id: number;
  code: string;
  name: string;
  price: number;
  pinned?: boolean;
}

const AdminCashRegister = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [productCode, setProductCode] = useState('');
  const [productQuantity, setProductQuantity] = useState(1);
  const [quickProductsOpen, setQuickProductsOpen] = useState(false);
  const [ticketNumber, setTicketNumber] = useState(34);
  const [pinnedProducts, setPinnedProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([
    { id: 1, code: 'CERV1', name: 'Cerveja Skol Lata 350ml', price: 6.00, pinned: false },
    { id: 2, code: 'VINHO1', name: 'Vinho Tinto Taça 150ml', price: 12.00, pinned: false },
    { id: 3, code: 'GUAR1', name: 'Guaraná Lata 350ml', price: 5.00, pinned: false },
    { id: 4, code: 'EMPFR', name: 'Empada de Frango', price: 8.00, pinned: false },
    { id: 5, code: 'CAFE1', name: 'Café Expresso', price: 4.00, pinned: false },
    { id: 6, code: 'BRIG1', name: 'Brigadeiro', price: 3.00, pinned: false },
    { id: 7, code: 'SUCO1', name: 'Suco de Laranja', price: 6.00, pinned: false },
    { id: 8, code: 'SAND1', name: 'Sanduíche Agreste', price: 15.00, pinned: false },
    { id: 9, code: 'COCA1', name: 'Coca Lata 350ml', price: 5.00, pinned: false },
    { id: 10, code: 'BOLO1', name: 'Bolo SESC', price: 7.00, pinned: false },
    { id: 11, code: 'VODKA1', name: 'Vodka Dose 50ml', price: 9.00, pinned: false },
    { id: 12, code: 'ENERG1', name: 'Energético Monster 473ml', price: 12.00, pinned: false },
  ]);
  const { toast } = useToast();
  
  // Atualizar produtos fixados quando houver mudanças nos produtos
  useEffect(() => {
    const newPinnedProducts = products.filter(product => product.pinned);
    setPinnedProducts(newPinnedProducts);
  }, [products]);
  
  // Toggle pin product
  const togglePinProduct = (productId: number) => {
    const updatedProducts = products.map(product => {
      if (product.id === productId) {
        return { ...product, pinned: !product.pinned };
      }
      return product;
    });
    setProducts(updatedProducts);
  };

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const discount = 0;
  const total = subtotal - discount;

  // Add item to cart
  const addToCart = (product: Product, quantity: number = 1) => {
    const existingItemIndex = cartItems.findIndex(item => item.code === product.code);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += quantity;
      updatedItems[existingItemIndex].total = 
        updatedItems[existingItemIndex].price * updatedItems[existingItemIndex].quantity;
      
      setCartItems(updatedItems);
      toast({
        title: "Atualizado",
        description: `Quantidade de ${product.name} atualizada.`,
      });
    } else {
      // Add new item
      const newItem: CartItem = {
        id: cartItems.length + 1,
        code: product.code,
        name: product.name,
        quantity: quantity,
        price: product.price,
        total: product.price * quantity
      };
      
      setCartItems([...cartItems, newItem]);
      toast({
        title: "Adicionado",
        description: `${product.name} adicionado ao carrinho.`,
      });
    }
  };

  // Add product by code
  const handleAddProductByCode = () => {
    if (!productCode) {
      toast({
        title: "Erro",
        description: "Por favor, insira um código de produto.",
        variant: "destructive",
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
        title: "Erro",
        description: "Produto não encontrado.",
        variant: "destructive",
      });
    }
  };

  // Remove item from cart
  const removeItem = (itemId: number) => {
    const itemToRemove = cartItems.find(item => item.id === itemId);
    if (itemToRemove) {
      setCartItems(cartItems.filter(item => item.id !== itemId));
      toast({
        title: "Removido",
        description: `${itemToRemove.name} removido do carrinho.`
      });
    } else if (cartItems.length > 0) {
      // Se não achou o item específico mas tem itens no carrinho, remove o último
      const lastItem = cartItems[cartItems.length - 1];
      setCartItems(cartItems.slice(0, -1));
      toast({
        title: "Removido",
        description: `${lastItem.name} removido do carrinho.`
      });
    } else {
      toast({
        title: "Info",
        description: "Não há itens para remover."
      });
    }
  };

  // Cancel ticket
  const cancelTicket = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Info",
        description: "Não há itens para cancelar.",
      });
      return;
    }

    setCartItems([]);
    toast({
      title: "Sucesso",
      description: "Tíquete cancelado com sucesso.",
    });
  };
  
  // Cancelar operação (extornar)
  const cancelOperation = () => {
    toast({
      title: "Extorno",
      description: "Última operação extornada com sucesso.",
    });
  };

  // Finish ticket with payment method
  const finishTicket = (paymentMethod: string) => {
    if (cartItems.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione itens ao carrinho para finalizar.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: `Venda finalizada! Pagamento via ${paymentMethod}.`,
    });
    
    // Reset cart and increment ticket number
    setCartItems([]);
    setTicketNumber(prev => prev + 1);
  };
  
  // Handle CPF/CNPJ
  const handleCpfCnpj = () => {
    const cpfCnpj = prompt("Digite o CPF/CNPJ do cliente:");
    if (cpfCnpj) {
      toast({
        title: "CPF/CNPJ Adicionado",
        description: `CPF/CNPJ ${cpfCnpj} adicionado à nota.`,
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden p-0 ml-0 lg:ml-64">
        {/* Header */}
        <div className="bg-white shadow-sm p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-element-blue-dark" />
            <h1 className="text-xl font-medium text-element-blue-dark">Caixa Administrativo</h1>
          </div>
          <Button 
            onClick={() => setQuickProductsOpen(true)} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <ListPlus className="h-4 w-4" />
            Produtos Rápidos
          </Button>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left side - Product search */}
          <div className="flex-1 flex flex-col p-4 overflow-y-auto">
            {/* Current selected product */}
            <div className="bg-white border rounded-md p-3 mb-4">
              {cartItems.length > 0 && cartItems[cartItems.length - 1] ? (
                <div className="text-lg font-medium text-element-blue-dark">
                  {cartItems[cartItems.length - 1].code} - {cartItems[cartItems.length - 1].name}
                </div>
              ) : (
                <div className="text-gray-500">Selecione um produto...</div>
              )}
            </div>

            {/* Search bar */}
            <div className="flex gap-2 mb-4">
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
              <div className="w-32">
                <Input 
                  type="text" 
                  placeholder="Cód.Prod" 
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                />
              </div>
              <div className="w-16">
                <Input 
                  type="number" 
                  min="1" 
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              <Button onClick={handleAddProductByCode} className="px-3">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Produtos fixados / Products space */}
            <div className="flex-1 bg-white rounded-md border p-4">
              {pinnedProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {pinnedProducts.map(product => (
                    <Card 
                      key={product.id} 
                      className="cursor-pointer hover:border-cyan-400 transition-colors"
                      onClick={() => addToCart(product)}
                    >
                      <CardContent className="p-3">
                        <div className="font-medium text-sm">{product.name}</div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-green-600 font-medium">R$ {product.price.toFixed(2)}</span>
                          <span className="text-xs text-gray-500">{product.code}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  Use o botão "Produtos Rápidos" e marque os produtos para aparecerem aqui
                </div>
              )}
            </div>
          </div>

          {/* Right side - Cart */}
          <div className="w-96 bg-white shadow-md flex flex-col overflow-hidden">
            {/* Ticket header */}
            <div className="p-4 bg-gray-100 flex justify-between items-center">
              <div className="font-medium">Tíquete: {ticketNumber}</div>
              <div className="text-green-600 font-medium">ABERTO</div>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Item</TableHead>
                    <TableHead className="w-16">Cód.</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="w-12 text-center">Qtd</TableHead>
                    <TableHead className="w-20 text-right">Preço</TableHead>
                    <TableHead className="w-20 text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cartItems.length > 0 ? (
                    cartItems.map((item, index) => (
                      <TableRow key={item.id} className="cursor-pointer hover:bg-gray-50" onClick={() => removeItem(item.id)}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{item.code}</TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">R$ {item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">R$ {item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Nenhum item adicionado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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

            {/* Finish button */}
            <div className="p-4 bg-gray-100">
              <Button 
                className="w-full bg-cyan-400 hover:bg-cyan-500 text-white flex items-center justify-center gap-2"
                onClick={() => finishTicket('Finalizar')}
              >
                <ArrowRight className="h-5 w-5" />
                Finalizar Tíquete
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="grid grid-cols-6 gap-1 bg-gray-200 p-1">
          <Button 
            variant="outline" 
            className="bg-cyan-400 hover:bg-cyan-500 text-white flex flex-col items-center justify-center py-4 h-auto"
            onClick={() => removeItem(cartItems.length > 0 ? cartItems[cartItems.length - 1].id : 0)}
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
          
          <Button 
            variant="outline" 
            className="bg-cyan-400 hover:bg-cyan-500 text-white flex flex-col items-center justify-center py-4 h-auto"
            onClick={() => finishTicket('Dinheiro')}
          >
            <DollarSign className="h-5 w-5 mb-1" />
            <span className="text-xs">Dinheiro</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="bg-cyan-400 hover:bg-cyan-500 text-white flex flex-col items-center justify-center py-4 h-auto"
            onClick={() => finishTicket('PIX')}
          >
            <QrCode className="h-5 w-5 mb-1" />
            <span className="text-xs">PIX</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="bg-cyan-400 hover:bg-cyan-500 text-white flex flex-col items-center justify-center py-4 h-auto"
            onClick={() => finishTicket('Cartão Débito')}
          >
            <CreditCard className="h-5 w-5 mb-1" />
            <span className="text-xs">Cartão Débito</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="bg-cyan-400 hover:bg-cyan-500 text-white flex flex-col items-center justify-center py-4 h-auto col-start-1"
            onClick={() => finishTicket('Cartão Crédito')}
          >
            <CreditCard className="h-5 w-5 mb-1" />
            <span className="text-xs">Cartão Crédito</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="bg-cyan-400 hover:bg-cyan-500 text-white flex flex-col items-center justify-center py-4 h-auto"
            onClick={handleCpfCnpj}
          >
            <IdCard className="h-5 w-5 mb-1" />
            <span className="text-xs">CPF/CNPJ</span>
          </Button>
        </div>

        {/* Quick Products Modal */}
        <Dialog open={quickProductsOpen} onOpenChange={setQuickProductsOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ListPlus className="h-5 w-5" />
                Selecionar Produtos Rápidos
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-4 py-4">
              {products.map((product) => (
                <div 
                  key={product.id} 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${product.pinned ? 'border-yellow-400 bg-yellow-50' : 'hover:border-yellow-400'}`}
                  onClick={() => addToCart(product)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium">{product.name}</span>
                    <Checkbox 
                      id={`product-${product.id}`} 
                      checked={product.pinned}
                      onCheckedChange={() => togglePinProduct(product.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="text-sm text-gray-600">R$ {product.price.toFixed(2)}</div>
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
      </div>
    </div>
  );
};

export default AdminCashRegister;
