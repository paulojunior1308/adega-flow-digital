import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ClientSidebar from '@/components/client/ClientSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, MapPin, Search, CreditCard, Truck, Check, Clock, Map, Copy } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import api from '@/lib/axios';

// Defina a URL base do backend
const API_URL = import.meta.env.VITE_API_URL || 'https://adega-flow-digital.onrender.com';

// Interfaces
interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
}

interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  price?: number;
}

interface Address {
  id: string;
  title: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
  isDefault: boolean;
}

interface PaymentMethod {
  id: string;
  type: "credit" | "debit" | "pix" | "money";
  name: string;
  icon: React.ReactNode;
  description?: string;
  info?: string;
}

interface OrderStatus {
  status: "pending" | "confirmed" | "preparing" | "delivering" | "delivered" | "cancelled";
  statusText: string;
  timestamp: Date;
}

const ClientCart = () => {
  // States for cart management
  const [cart, setCart] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState(0);
  
  // States for address selection
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [addressMode, setAddressMode] = useState<"saved" | "new">("saved");
  
  // States for payment and order processing
  const [paymentMethod, setPaymentMethod] = useState<string>("money");
  const [changeAmount, setChangeAmount] = useState("");
  const [instructions, setInstructions] = useState("");
  
  // Order processing and tracking states
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  
  const [paymentMethods, setPaymentMethods] = useState<{ id: string, name: string }[]>([]);
  
  // Buscar descontos do combo do localStorage
  const [comboDescontos, setComboDescontos] = useState<any[]>([]);
  const [deliveryFee, setDeliveryFee] = useState(0);
  
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const PIX_KEY = 'Elementstore516@gmail.com';
  
  // Adicionar state para user
  const [user, setUser] = useState<{ name: string; phone: string } | null>(null);
  
  useEffect(() => {
    const descontos = localStorage.getItem('comboDescontos');
    if (descontos) {
      setComboDescontos(JSON.parse(descontos));
    }
  }, []);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Buscar endereços do usuário
  useEffect(() => {
    api.get('/cliente-enderecos').then(res => {
      console.log('Resposta da API de endereços:', res.data);
      setAddresses(res.data);
      // Se houver um endereço padrão, seleciona ele
      const defaultAddress = res.data.find((addr: Address) => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress.id);
      }
    }).catch(error => {
      console.error('Erro ao buscar endereços:', error);
      toast({
        title: "Erro ao carregar endereços",
        description: "Não foi possível carregar seus endereços. Por favor, tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    });
  }, []);
  
  // Buscar taxa de entrega ao selecionar endereço
  useEffect(() => {
    if (selectedAddress) {
      api.post('/orders/calculate-delivery-fee', { addressId: selectedAddress })
        .then(res => {
          setDeliveryFee(res.data.deliveryFee ?? 0);
        })
        .catch(() => setDeliveryFee(0));
    } else {
      setDeliveryFee(0);
    }
  }, [selectedAddress]);
  
  // Calcular subtotal e total
  useEffect(() => {
    const calculatedSubtotal = cart.reduce((sum, item) => sum + ((item.price ?? item.product.price) * item.quantity), 0);
    setSubtotal(calculatedSubtotal);
    setTotal(calculatedSubtotal - discount + deliveryFee);
  }, [cart, discount, deliveryFee]);
  
  // Buscar carrinho real do backend ao carregar a página
  useEffect(() => {
    api.get('/cart').then(res => setCart(res.data?.items || []));
  }, []);

  useEffect(() => {
    api.get('/payment-methods').then(res => {
      setPaymentMethods(res.data);
      if (res.data.length > 0) {
        setPaymentMethod(res.data[0].id); // Seleciona o primeiro método automaticamente
      }
    });
  }, []);

  // Buscar perfil do usuário ao carregar a página
  useEffect(() => {
    api.get('/cliente-perfil').then(res => {
      console.log('Perfil do cliente:', res.data);
      setUser({ 
        name: res.data.name, 
        phone: res.data.phone || res.data.telefone || ''
      });
    });
  }, []);

  // Incrementar quantidade (backend)
  const incrementQuantity = async (itemId: number) => {
    const item = cart.find(item => item.id === itemId);
    if (item) {
      await api.put(`/cart/${item.id}`, { quantity: item.quantity + 1 });
      const res = await api.get('/cart');
      setCart(res.data?.items || []);
    }
  };

  // Decrementar quantidade (backend)
  const decrementQuantity = async (itemId: number) => {
    const item = cart.find(item => item.id === itemId);
    if (item && item.quantity > 1) {
      await api.put(`/cart/${item.id}`, { quantity: item.quantity - 1 });
      const res = await api.get('/cart');
      setCart(res.data?.items || []);
    toast({
      title: "Item removido",
      description: "Produto removido do carrinho",
      duration: 2000,
    });
    }
  };

  // Remover do carrinho (backend)
  const removeFromCart = async (itemId: number) => {
    const item = cart.find(item => item.id === itemId);
    if (item) {
      await api.delete(`/cart/${item.id}`);
      const res = await api.get('/cart');
      setCart(res.data?.items || []);
    toast({
      title: "Item removido",
      description: "Produto removido do carrinho",
      duration: 2000,
    });
    }
  };
  
  // Aplicar código de desconto
  const applyDiscount = () => {
    if (discountCode.toLowerCase() === "promo10") {
      const discountAmount = subtotal * 0.1;
      setDiscount(discountAmount);
      toast({
        title: "Desconto aplicado",
        description: "10% de desconto aplicado ao seu pedido!",
        duration: 2000,
      });
    } else {
      toast({
        title: "Código inválido",
        description: "O código informado não é válido",
        variant: "destructive",
        duration: 2000,
      });
      setDiscount(0);
    }
  };
  
  const handlePixConfirm = async () => {
    setShowPixModal(false);
    await sendOrder();
  };

  const sendOrder = async () => {
    try {
      const payload = {
        addressId: selectedAddress,
        paymentMethodId: paymentMethod,
        instructions,
        discountCode: discountCode || undefined
      };
      const res = await api.post('/orders', payload);
      const { id: orderId, items, total } = res.data;
      setCurrentOrderId(orderId);
      setOrderStatus({
        status: "pending",
        statusText: "Aguardando confirmação",
        timestamp: new Date()
      });
      toast({
        title: "Pedido enviado!",
        description: `Seu pedido #${orderId} foi enviado para processamento`,
        duration: 3000,
      });
      setOrderPlaced(true);
      setCart([]);
      setTimeout(() => {
        navigate('/cliente-pedidos');
      }, 2000);

      // Montar mensagem profissional para o WhatsApp
      if (user) {
        const numeroWhatsApp = '5511949885625'; // Seu número
        // Montar lista de produtos
        const produtosMsg = (items || cart).map((item: any) => {
          const nome = item.product?.name || item.productName || '';
          const quantidade = item.quantity || 1;
          const preco = (item.price ?? item.product?.price ?? 0).toFixed(2).replace('.', ',');
          const totalItem = ((item.price ?? item.product?.price ?? 0) * quantidade).toFixed(2).replace('.', ',');
          return `- *${quantidade}x ${nome}* (R$ ${preco} cada) = R$ ${totalItem}`;
        }).join('\n');

        const totalPedido = (total ?? cart.reduce((sum, item) => sum + ((item.price ?? item.product.price) * item.quantity), 0)).toFixed(2).replace('.', ',');

        const mensagem =
          `Olá, realizei o pagamento via PIX e segue o comprovante.\n\n` +
          `Dados do pedido:\n` +
          `Nome: *${user.name}*\n` +
          `Telefone: *${user.phone}*\n` +
          `Pedido: *#${orderId}*\n\n` +
          `Itens:\n${produtosMsg}\n\n` +
          `Total: *R$ ${totalPedido}*\n\n` +
          `Por favor, confirme o pagamento e prossiga com o pedido.`;
        const link = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
        window.open(link, '_blank');
      }

      return orderId;
    } catch (error: any) {
        toast({
        title: "Erro ao finalizar pedido",
        description: error?.response?.data?.error || error?.response?.data?.message || error?.message || "Tente novamente mais tarde.",
          variant: "destructive",
        duration: 3000,
      });
      return null;
    }
  };

  const checkout = async () => {
    if (!selectedAddress) {
      toast({
        title: "Endereço obrigatório",
        description: "Por favor, selecione um endereço de entrega",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    if (!paymentMethod) {
      toast({
        title: "Forma de pagamento obrigatória",
        description: "Por favor, selecione uma forma de pagamento",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    // Se for PIX, mostrar modal antes de enviar pedido
    const selectedPayment = paymentMethods.find(m => m.id === paymentMethod);
    if (selectedPayment && selectedPayment.name.toLowerCase().includes('pix')) {
      setShowPixModal(true);
      return;
    }
    await sendOrder();
  };
  
  return (
    <div className="min-h-screen bg-element-gray-light">
      <ClientSidebar />
      
      <div className="lg:pl-64 min-h-screen pl-24 md:pl-24 lg:pl-64 transition-all duration-300 flex flex-col items-center justify-center">
        <div className="p-4 md:p-6 lg:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-element-blue-dark mb-6">
            Seu Carrinho
          </h1>
          
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Seu carrinho está vazio</h2>
              <p className="text-gray-500 mb-6">Adicione produtos para continuar comprando</p>
              <Button 
                onClick={() => navigate('/cliente-catalogo')}
                className="bg-element-blue-neon text-element-gray-dark hover:bg-element-blue-neon/90"
              >
                Ver catálogo
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lista de itens */}
              <div className="lg:col-span-2">
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-4">Itens do Carrinho</h2>
                      
                      <div className="space-y-4">
                        {cart.map((item) => {
                          // Verifica se há desconto para este produto
                          const descontoCombo = comboDescontos.find((d) => d.productId === item.product.id);
                          return (
                          <div key={item.id} className="flex items-center py-4 border-b last:border-b-0">
                            <img 
                                src={item.product.image && !item.product.image.startsWith('http') ? API_URL + item.product.image : item.product.image} 
                              alt={item.product.name} 
                              className="w-24 h-24 object-cover rounded-md mr-4"
                            />
                            <div className="flex-1">
                              <h3 className="font-medium mb-1">{item.product.name}</h3>
                              <p className="text-sm text-gray-500 mb-3">{item.product.description}</p>
                              <p className="font-bold text-element-blue-dark">
                                  R$ {(item.price ?? item.product.price).toFixed(2)}
                                </p>
                                {descontoCombo && descontoCombo.desconto > 0 && (
                                  <p className="text-xs text-green-700 mt-1">
                                    <span className="line-through text-red-500 mr-1">R$ {descontoCombo.precoOriginal.toFixed(2)}</span>
                                    <span>Desconto combo: -R$ {descontoCombo.desconto.toFixed(2)}</span>
                                  </p>
                                )}
                            </div>
                              <div className="flex items-center space-x-2">
                              <div className="flex items-center border rounded-md">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => decrementQuantity(item.id)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-8 text-center">{item.quantity}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => incrementQuantity(item.id)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  console.log('Remover item:', item);
                                  removeFromCart(item.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remover
                              </Button>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                
                <Card className="mt-6">
                    <CardContent className="p-6">
                      <Tabs defaultValue="address" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="address" className="text-sm">
                          <MapPin className="h-4 w-4 mr-1" /> Endereço
                          </TabsTrigger>
                          <TabsTrigger value="payment" className="text-sm">
                            <CreditCard className="h-4 w-4 mr-1" /> Pagamento
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="address" className="pt-4">
                          <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">Selecione um endereço</h3>
                            <Button 
                              variant="link" 
                              onClick={() => navigate('/cliente-enderecos')}
                              className="text-sm p-0 h-auto"
                            >
                              Gerenciar endereços
                            </Button>
                          </div>
                          
                          {addresses.length === 0 ? (
                            <div className="text-center py-6">
                              <p className="text-gray-500 mb-4">Você ainda não tem endereços cadastrados</p>
                              <Button 
                                onClick={() => navigate('/cliente-enderecos')}
                                className="bg-element-blue-neon text-element-gray-dark hover:bg-element-blue-neon/90"
                              >
                                Cadastrar endereço
                              </Button>
                            </div>
                          ) : (
                            <RadioGroup 
                              value={selectedAddress || undefined}
                              onValueChange={setSelectedAddress}
                              className="space-y-3"
                            >
                              {addresses.map(address => (
                                <div key={address.id} className="flex items-start space-x-2 rounded-md border p-3">
                                  <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                                  <div>
                                    <Label htmlFor={address.id} className="font-medium">{address.title}</Label>
                                    <p className="text-sm text-gray-500">{address.street}, {address.number}</p>
                                    {address.complement && <p className="text-sm text-gray-500">{address.complement}</p>}
                                    <p className="text-sm text-gray-500">{address.neighborhood}</p>
                                    <p className="text-sm text-gray-500">{address.city}, {address.state} - {address.zipcode}</p>
                                  </div>
                                </div>
                              ))}
                            </RadioGroup>
                          )}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="payment" className="pt-4">
                        <div className="space-y-4">
                          <h3 className="font-medium">Forma de pagamento</h3>
                          
                          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                            {paymentMethods.map(method => (
                              <div key={method.id} className="flex items-center space-x-2 mb-2">
                                <RadioGroupItem value={method.id} id={method.id} />
                                <Label htmlFor={method.id}>{method.name}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                            </div>
                            
                        <div className="mt-6">
                          <h3 className="font-medium mb-2">Instruções adicionais</h3>
                              <Textarea 
                            placeholder="Alguma observação para a entrega?"
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                          />
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
              </div>
              
              {/* Resumo do pedido */}
              <div>
                <Card className="sticky top-4">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Resumo do Pedido</h2>
                    
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Subtotal</span>
                          <span>R$ {subtotal.toFixed(2)}</span>
                        </div>
                        
                        {discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Desconto</span>
                            <span>-R$ {discount.toFixed(2)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <span className="text-gray-500">Taxa de entrega</span>
                          <span>R$ {deliveryFee.toFixed(2)}</span>
                        </div>
                        
                        <Separator className="my-2" />
                        
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total</span>
                          <span>R$ {total.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Input
                          placeholder="Código de desconto"
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value)}
                          className="flex-1"
                        />
                        <Button variant="outline" onClick={applyDiscount}>
                          Aplicar
                        </Button>
                      </div>
                      
                      <Button 
                        className="w-full bg-element-blue-neon text-element-gray-dark hover:bg-element-blue-neon/90"
                        size="lg"
                        onClick={checkout}
                      >
                        Finalizar Pedido
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        className="w-full"
                        onClick={() => navigate('/cliente-catalogo')}
                      >
                        Continuar comprando
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
      {showPixModal && (
        <Dialog open={showPixModal} onOpenChange={setShowPixModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pagamento via PIX</DialogTitle>
              <DialogDescription>
                Para finalizar seu pedido, faça um PIX para a chave abaixo e clique em "Já paguei".
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 bg-gray-100 rounded p-2 select-all">
              <span className="font-mono text-sm">{PIX_KEY}</span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(PIX_KEY);
                  setPixCopied(true);
                  setTimeout(() => setPixCopied(false), 1500);
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
              {pixCopied && <span className="text-green-600 text-xs ml-2">Copiado!</span>}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              <b>Importante:</b> O pedido só será processado após a confirmação do pagamento pelo estabelecimento.
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowPixModal(false)}>Cancelar</Button>
              <Button onClick={handlePixConfirm} className="bg-element-blue-neon text-element-gray-dark hover:bg-element-blue-neon/90">Já paguei</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ClientCart;
