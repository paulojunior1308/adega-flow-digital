import React, { useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  PlusCircle, 
  ShoppingBag, 
  RotateCcw,
  Trash2,
  DollarSign, 
  QrCode,
  CreditCard, 
  Smartphone,
  FileText,
  Menu,
  X,
  ArrowLeft,
  Image,
  User
} from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const AdminCashRegister = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [ticketNumber, setTicketNumber] = useState(34);
  const [ticketStatus, setTicketStatus] = useState<'ABERTO' | 'FECHADO'>('ABERTO');
  const [quickProductsOpen, setQuickProductsOpen] = useState(false);
  const [cancelItemDialogOpen, setCancelItemDialogOpen] = useState(false);
  const [selectedItemToCancel, setSelectedItemToCancel] = useState<number | null>(null);
  const [cancelTicketDialogOpen, setCancelTicketDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'pix' | 'cartao' | null>(null);
  const [cpfCnpjDialogOpen, setCpfCnpjDialogOpen] = useState(false);
  const [cpfCnpj, setCpfCnpj] = useState('');
  
  // Sample products data
  const productCategories = [
    {
      id: 'bebidas',
      products: [
        { id: 'HEI350', name: 'Cerveja Heineken Lata 350ml', price: 8.50 },
        { id: 'VIN150', name: 'Vinho Tinto Taça 150ml', price: 15.00 },
        { id: 'GUA350', name: 'Guaraná Lata 350ml', price: 5.00 },
        { id: 'COC350', name: 'Coca Lata 350ml', price: 5.00 },
      ]
    },
    {
      id: 'alimentos',
      products: [
        { id: 'EMPR', name: 'Empada de Frango', price: 7.50 },
        { id: 'BRIG', name: 'Brigadeiro', price: 3.50 },
        { id: 'SANDAG', name: 'Sanduíche Agreste', price: 12.00 },
        { id: 'BOLOSESC', name: 'Bolo SESC', price: 6.00 },
      ]
    },
    {
      id: 'bebidashc',
      products: [
        { id: 'CAFEXP', name: 'Café Expresso', price: 4.50 },
        { id: 'SUCOL', name: 'Suco de Laranja', price: 7.00 },
      ]
    }
  ];

  // Quick products for modal
  const quickProducts = [
    { id: 'HEI350', name: 'Cerveja Heineken Lata 350ml', price: 7.50 },
    { id: 'VIN150', name: 'Vinho Tinto Taça 150ml', price: 12.00 },
    { id: 'GUA350', name: 'Guaraná Lata 350ml', price: 5.00 },
    { id: 'EMPR', name: 'Empada de Frango', price: 8.00 },
    { id: 'CAFEXP', name: 'Café Expresso', price: 4.00 },
    { id: 'BRIG', name: 'Brigadeiro', price: 3.00 },
    { id: 'SUCOL', name: 'Suco de Laranja', price: 6.00 },
    { id: 'SANDAG', name: 'Sanduíche Agreste', price: 15.00 },
    { id: 'COC350', name: 'Coca Lata 350ml', price: 5.00 },
    { id: 'BOLOSESC', name: 'Bolo SESC', price: 7.00 },
    { id: 'QUIBEABO', name: 'Quibe de Abóbora', price: 6.00 },
    { id: 'SALADAPQ', name: 'Salada Pequena', price: 10.00 },
  ];

  // Flat list of all products for search
  const allProducts = productCategories.flatMap(category => category.products);

  // Filtered products based on search
  const filteredProducts = searchTerm 
    ? allProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        product.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const addToCart = (product: any) => {
    const existingItemIndex = cartItems.findIndex(item => item.id === product.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity if item already in cart
      const newCart = [...cartItems];
      newCart[existingItemIndex].quantity += parseInt(quantity || '1');
      setCartItems(newCart);
    } else {
      // Add new item to cart
      setCartItems([...cartItems, {
        ...product,
        quantity: parseInt(quantity || '1')
      }]);
    }
    
    setQuantity('1');
    toast({
      title: "Item adicionado",
      description: `${product.name} adicionado ao carrinho.`
    });
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cartItems];
    newCart.splice(index, 1);
    setCartItems(newCart);
    
    toast({
      title: "Item removido",
      description: "Item removido do carrinho."
    });
  };

  const clearCart = () => {
    setCartItems([]);
    toast({
      title: "Carrinho limpo",
      description: "Todos os itens foram removidos."
    });
  };

  const finalizeTicket = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens ao carrinho antes de finalizar.",
        variant: "destructive"
      });
      return;
    }
    
    setTicketStatus('FECHADO');
    toast({
      title: "Venda finalizada",
      description: `Ticket #${ticketNumber} finalizado com sucesso.`
    });
    
    // Reset for next sale
    setTimeout(() => {
      setCartItems([]);
      setTicketNumber(prev => prev + 1);
      setTicketStatus('ABERTO');
    }, 2000);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Quick Products Modal handlers
  const handleQuickProductSelect = (product: any, isSelected: boolean) => {
    if (isSelected) {
      addToCart(product);
    } else {
      const index = cartItems.findIndex(item => item.id === product.id);
      if (index !== -1) {
        removeFromCart(index);
      }
    }
  };

  // Cancel Item handlers
  const openCancelItemDialog = (index: number) => {
    setSelectedItemToCancel(index);
    setCancelItemDialogOpen(true);
  };

  const handleCancelItem = () => {
    if (selectedItemToCancel !== null) {
      removeFromCart(selectedItemToCancel);
      setCancelItemDialogOpen(false);
      setSelectedItemToCancel(null);
      toast({
        title: "Item cancelado",
        description: "Item removido do tíquete."
      });
    }
  };

  // Cancel Ticket handlers
  const handleCancelTicket = () => {
    clearCart();
    setCancelTicketDialogOpen(false);
    toast({
      title: "Tíquete cancelado",
      description: "Todos os itens foram removidos."
    });
  };

  // Handle refund
  const handleRefund = () => {
    toast({
      title: "Operação de estorno",
      description: "Estorno realizado com sucesso."
    });
    setRefundDialogOpen(false);
  };

  // Handle payment methods
  const processPayment = (method: 'dinheiro' | 'pix' | 'cartao') => {
    setPaymentMethod(method);
    
    if (cartItems.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens ao carrinho antes de finalizar.",
        variant: "destructive"
      });
      return;
    }
    
    const methodNames = {
      dinheiro: "Dinheiro",
      pix: "Pix",
      cartao: "Cartão"
    };
    
    toast({
      title: `Pagamento com ${methodNames[method]}`,
      description: `Venda de R$ ${calculateTotal().toFixed(2)} finalizada.`
    });
    
    finalizeTicket();
  };

  // Handle CPF/CNPJ
  const handleCpfCnpjSubmit = () => {
    if (cpfCnpj.trim().length < 11) {
      toast({
        title: "CPF/CNPJ inválido",
        description: "Por favor, insira um CPF/CNPJ válido.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "CPF/CNPJ registrado",
      description: `Documento ${cpfCnpj} vinculado à venda.`
    });
    
    setCpfCnpjDialogOpen(false);
  };

  const isProductInCart = (productId: string) => {
    return cartItems.some(item => item.id === productId);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <header className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold flex items-center">
              <ShoppingBag className="mr-2" />
              PDV - Venda Local
            </h1>
            <Button 
              variant="outline"
              onClick={() => setQuickProductsOpen(true)}
            >
              Produtos Rápidos
            </Button>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-3">
              {/* Product Grid - Top Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {productCategories.flatMap(category => 
                  category.products.slice(0, 3)).map(product => (
                  <Card 
                    key={product.id} 
                    className="hover:border-blue-400 cursor-pointer transition-colors"
                    onClick={() => addToCart(product)}
                  >
                    <CardContent className="p-3">
                      <div className="text-sm font-medium">{product.id} - {product.name}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Search Bar */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produto..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Input
                  placeholder="Cód.Produto"
                  className="w-32"
                />
                <Input
                  type="number"
                  placeholder="Qtd"
                  className="w-20"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                />
                <Button size="icon">
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>

              {/* Search Results */}
              {searchTerm && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {filteredProducts.map(product => (
                    <Card 
                      key={product.id} 
                      className="hover:border-blue-400 cursor-pointer transition-colors"
                      onClick={() => addToCart(product)}
                    >
                      <CardContent className="p-3">
                        <div className="text-sm font-medium">{product.id} - {product.name}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Ticket/Cart */}
            <div className="md:col-span-1">
              <Card className="h-full">
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-4">
                    <div className="font-medium">Tíquete: {ticketNumber}</div>
                    <div className={`font-bold ${ticketStatus === 'ABERTO' ? 'text-green-600' : 'text-red-600'}`}>
                      {ticketStatus}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-2 mb-2 text-sm">
                    <div className="grid grid-cols-5 font-medium">
                      <div className="col-span-1">Item</div>
                      <div className="col-span-1">Cód.</div>
                      <div className="col-span-1">Produto</div>
                      <div className="col-span-1 text-center">Qtd</div>
                      <div className="col-span-1 text-right">Preço</div>
                    </div>
                  </div>
                  
                  <div className="flex-grow overflow-y-auto mb-4">
                    {cartItems.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        Nenhum item adicionado
                      </div>
                    ) : (
                      cartItems.map((item, index) => (
                        <div key={index} className="grid grid-cols-5 text-sm py-1 border-b">
                          <div className="col-span-1">{index + 1}</div>
                          <div className="col-span-1">{item.id}</div>
                          <div className="col-span-1 truncate">{item.name.split(' ')[0]}</div>
                          <div className="col-span-1 text-center">{item.quantity}</div>
                          <div className="col-span-1 text-right flex justify-between">
                            <button 
                              className="text-red-500 hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                openCancelItemDialog(index);
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                            {item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="mt-auto">
                    <div className="flex justify-between text-sm mb-1">
                      <div>Valor:</div>
                      <div className="text-green-600 font-medium">
                        {calculateTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <div>Desconto:</div>
                      <div className="text-red-600 font-medium">
                        R$ 0,00
                      </div>
                    </div>
                    <div className="flex justify-between font-bold mb-4">
                      <div>Total:</div>
                      <div>
                        {calculateTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                      onClick={finalizeTicket}
                    >
                      Finalizar Tíquete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Bottom Action Buttons */}
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            <Button className="bg-cyan-500 hover:bg-cyan-600">
              <Menu className="mr-1 h-4 w-4" />
              <span className="text-xs">Menu</span>
            </Button>
            <Button className="bg-cyan-500 hover:bg-cyan-600">
              <RotateCcw className="mr-1 h-4 w-4" />
              <span className="text-xs">Integração</span>
            </Button>
            <Button 
              className="bg-cyan-500 hover:bg-cyan-600"
              onClick={() => {
                if (cartItems.length > 0) {
                  openCancelItemDialog(cartItems.length - 1);
                } else {
                  toast({
                    title: "Carrinho vazio",
                    description: "Não há itens para cancelar",
                    variant: "destructive"
                  });
                }
              }}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              <span className="text-xs">Cancelar Item</span>
            </Button>
            <Button 
              className="bg-cyan-500 hover:bg-cyan-600"
              onClick={() => {
                if (cartItems.length > 0) {
                  setCancelTicketDialogOpen(true);
                } else {
                  toast({
                    title: "Carrinho vazio",
                    description: "Não há tíquete para cancelar",
                    variant: "destructive"
                  });
                }
              }}
            >
              <X className="mr-1 h-4 w-4" />
              <span className="text-xs">Cancelar Tíquete</span>
            </Button>
            <Button className="bg-cyan-500 hover:bg-cyan-600">
              <ShoppingBag className="mr-1 h-4 w-4" />
              <span className="text-xs">Finalizar</span>
            </Button>
            <Button 
              className="bg-cyan-500 hover:bg-cyan-600"
              onClick={() => setRefundDialogOpen(true)}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              <span className="text-xs">Extornar</span>
            </Button>
            <Button 
              className="bg-cyan-500 hover:bg-cyan-600"
              onClick={() => processPayment('dinheiro')}
            >
              <DollarSign className="mr-1 h-4 w-4" />
              <span className="text-xs">Dinheiro</span>
            </Button>
            <Button 
              className="bg-cyan-500 hover:bg-cyan-600"
              onClick={() => processPayment('pix')}
            >
              <Image className="mr-1 h-4 w-4" />
              <span className="text-xs">Pix</span>
            </Button>
            <Button 
              className="bg-cyan-500 hover:bg-cyan-600"
              onClick={() => processPayment('cartao')}
            >
              <CreditCard className="mr-1 h-4 w-4" />
              <span className="text-xs">Cartão</span>
            </Button>
            <Button 
              className="bg-cyan-500 hover:bg-cyan-600"
              onClick={() => setCpfCnpjDialogOpen(true)}
            >
              <User className="mr-1 h-4 w-4" />
              <span className="text-xs">CPF/CNPJ</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Products Selection Modal */}
      <Dialog open={quickProductsOpen} onOpenChange={setQuickProductsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <span className="text-yellow-500 mr-2">★</span> 
              Selecionar Produtos Rápidos
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-2">
            {quickProducts.map((product) => (
              <div 
                key={product.id}
                className="relative border border-yellow-300 rounded-lg p-4 text-center cursor-pointer hover:bg-yellow-50"
                onClick={() => handleQuickProductSelect(product, !isProductInCart(product.id))}
              >
                <div className="absolute top-2 left-0 right-0 flex justify-center">
                  <Checkbox 
                    checked={isProductInCart(product.id)}
                    onCheckedChange={(checked) => {
                      handleQuickProductSelect(product, !!checked);
                    }}
                    className="h-5 w-5"
                  />
                </div>
                <div className="mt-4 font-medium">{product.name}</div>
                <div className="text-gray-600">R$ {product.price.toFixed(2)}</div>
              </div>
            ))}
          </div>

          <DialogClose asChild>
            <Button className="w-full mt-2 bg-cyan-500">Fechar</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {/* Cancel Item Dialog */}
      <AlertDialog open={cancelItemDialogOpen} onOpenChange={setCancelItemDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Item</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este item do tíquete?
              {selectedItemToCancel !== null && cartItems[selectedItemToCancel] && (
                <div className="font-medium mt-2">
                  {cartItems[selectedItemToCancel].name} - 
                  {cartItems[selectedItemToCancel].price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedItemToCancel(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelItem}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Ticket Dialog */}
      <AlertDialog open={cancelTicketDialogOpen} onOpenChange={setCancelTicketDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Tíquete</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este tíquete inteiro?
              <div className="font-medium mt-2">
                Total: {calculateTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelTicket}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refund Dialog */}
      <AlertDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Extornar Venda</AlertDialogTitle>
            <AlertDialogDescription>
              Insira o número do tíquete que deseja estornar:
              <Input
                type="number"
                placeholder="Número do tíquete"
                className="mt-2"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRefund}>Confirmar Estorno</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CPF/CNPJ Dialog */}
      <AlertDialog open={cpfCnpjDialogOpen} onOpenChange={setCpfCnpjDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>CPF/CNPJ na Nota</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o CPF ou CNPJ para emissão da nota fiscal:
              <Input
                type="text"
                placeholder="CPF ou CNPJ"
                className="mt-2"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCpfCnpjSubmit}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCashRegister;
