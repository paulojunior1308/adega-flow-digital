
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ClientSidebar from '@/components/client/ClientSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, MapPin, Search, CreditCard, Truck, Check, Clock, Map } from 'lucide-react';
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

// Dados para simular o carrinho
interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

// Simulando um endereço
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

// Interface for payment methods
interface PaymentMethod {
  id: string;
  type: "credit" | "debit" | "pix" | "money";
  name: string;
  icon: React.ReactNode;
  description?: string;
  info?: string;
}

// Interface for order status
interface OrderStatus {
  status: "pending" | "confirmed" | "preparing" | "delivering" | "delivered" | "cancelled";
  statusText: string;
  timestamp: Date;
}

// Dados de exemplo para o carrinho
const initialCart: CartItem[] = [
  {
    product: {
      id: 1,
      name: "Skol 350ml - Pack com 12",
      price: 39.90,
      image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9",
      description: "Pack com 12 unidades de cerveja Skol 350ml"
    },
    quantity: 2
  },
  {
    product: {
      id: 2,
      name: "Vodka Smirnoff 998ml",
      price: 49.90,
      image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901",
      description: "Vodka Smirnoff Original 998ml"
    },
    quantity: 1
  }
];

// Opções de entrega
const deliveryOptions = [
  { id: "express", name: "Express (30-45 min)", price: 9.90 },
  { id: "priority", name: "Prioritária (45-60 min)", price: 5.90 },
  { id: "standard", name: "Padrão (60-90 min)", price: 3.90 }
];

// Endereços salvos
const savedAddresses = [
  {
    id: "address1",
    title: "Casa",
    street: "Avenida Paulista",
    number: "1000",
    complement: "Apto 101",
    neighborhood: "Bela Vista",
    city: "São Paulo",
    state: "SP",
    zipcode: "01310-100",
    isDefault: true
  },
  {
    id: "address2",
    title: "Trabalho",
    street: "Rua Augusta",
    number: "500",
    complement: "",
    neighborhood: "Consolação",
    city: "São Paulo",
    state: "SP",
    zipcode: "01304-000",
    isDefault: false
  }
];

// Horários disponíveis para entrega
const deliveryTimeSlots = [
  "Assim que possível",
  "30-45 minutos",
  "45-60 minutos",
  "60-90 minutos"
];

// Opções de pagamento
const paymentMethods: PaymentMethod[] = [
  { 
    id: "credit", 
    type: "credit", 
    name: "Cartão de Crédito", 
    icon: <CreditCard className="h-5 w-5 text-element-blue-neon" />, 
    description: "Visa, Mastercard, Elo, American Express"
  },
  { 
    id: "debit", 
    type: "debit", 
    name: "Cartão de Débito", 
    icon: <CreditCard className="h-5 w-5 text-element-blue-neon" />, 
    description: "Visa, Mastercard, Elo"
  },
  { 
    id: "pix", 
    type: "pix", 
    name: "Pix", 
    icon: <div className="h-5 w-5 flex items-center justify-center text-element-blue-neon font-bold">P</div>, 
    description: "Pagamento instantâneo",
    info: "Você terá 15 minutos para pagar após confirmar o pedido"
  },
  { 
    id: "money", 
    type: "money", 
    name: "Dinheiro", 
    icon: <div className="h-5 w-5 flex items-center justify-center text-element-blue-neon font-bold">R$</div>,
    description: "Troco?"
  }
];

const ClientCart = () => {
  // States for cart management
  const [cart, setCart] = useState<CartItem[]>(initialCart);
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [deliveryMethod, setDeliveryMethod] = useState("express");
  const [deliveryFee, setDeliveryFee] = useState(9.90);
  
  // States for address selection
  const [selectedAddress, setSelectedAddress] = useState<string | null>("address1");
  const [searchZipcode, setSearchZipcode] = useState("");
  const [newAddress, setNewAddress] = useState<Partial<Address> | null>(null);
  const [addressMode, setAddressMode] = useState<"saved" | "new">("saved");
  
  // States for delivery options
  const [deliveryTime, setDeliveryTime] = useState("Assim que possível");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [showZipcodeResults, setShowZipcodeResults] = useState(false);
  
  // New states for payment and order processing
  const [paymentMethod, setPaymentMethod] = useState<string>("credit");
  const [creditCardNumber, setCreditCardNumber] = useState("");
  const [creditCardName, setCreditCardName] = useState("");
  const [creditCardExpiry, setCreditCardExpiry] = useState("");
  const [creditCardCVV, setCreditCardCVV] = useState("");
  const [changeAmount, setChangeAmount] = useState("");
  
  // Order processing and tracking states
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [orderTrackingDialog, setOrderTrackingDialog] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Calcular subtotal e total
  useEffect(() => {
    const calculatedSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    setSubtotal(calculatedSubtotal);
    setTotal(calculatedSubtotal + deliveryFee - discount);
  }, [cart, deliveryFee, discount]);
  
  // Atualizar a taxa de entrega quando o método mudar
  useEffect(() => {
    const selected = deliveryOptions.find(option => option.id === deliveryMethod);
    if (selected) {
      setDeliveryFee(selected.price);
    }
  }, [deliveryMethod]);

  // Simular verificação de status de pedido (em situação real, isso seria feito via API)
  useEffect(() => {
    if (orderPlaced && currentOrderId) {
      // Simula a atualização de status do pedido
      const statusUpdateInterval = setInterval(() => {
        if (!orderStatus || orderStatus.status === "pending") {
          setOrderStatus({
            status: "confirmed",
            statusText: "Pedido confirmado",
            timestamp: new Date()
          });
        } else if (orderStatus.status === "confirmed") {
          setOrderStatus({
            status: "preparing",
            statusText: "Preparando seu pedido",
            timestamp: new Date()
          });
        } else if (orderStatus.status === "preparing") {
          setOrderStatus({
            status: "delivering",
            statusText: "A caminho",
            timestamp: new Date()
          });
          // Abrir o modal de rastreamento quando o pedido sair para entrega
          setOrderTrackingDialog(true);
        } else if (orderStatus.status === "delivering") {
          setOrderStatus({
            status: "delivered",
            statusText: "Entregue",
            timestamp: new Date()
          });
          // Fechar o modal de rastreamento quando o pedido for entregue
          setTimeout(() => setOrderTrackingDialog(false), 5000);
        }
      }, 15000); // Atualiza o status a cada 15 segundos para simulação
      
      return () => clearInterval(statusUpdateInterval);
    }
  }, [orderPlaced, currentOrderId, orderStatus]);
  
  // Incrementar quantidade
  const incrementQuantity = (productId: number) => {
    setCart(prevCart => 
      prevCart.map(item => 
        item.product.id === productId 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };
  
  // Decrementar quantidade
  const decrementQuantity = (productId: number) => {
    setCart(prevCart => 
      prevCart.map(item => 
        item.product.id === productId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };
  
  // Remover do carrinho
  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
    toast({
      title: "Item removido",
      description: "Produto removido do carrinho",
      duration: 2000,
    });
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
  
  // Simular busca de CEP
  const searchByCEP = () => {
    if (searchZipcode.length < 8) {
      toast({
        title: "CEP inválido",
        description: "Por favor, digite um CEP válido",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }
    
    // Simulando busca de CEP (em produção substituir por API real)
    const mockCepData = {
      street: "Avenida Brasil",
      neighborhood: "Centro",
      city: "Rio de Janeiro",
      state: "RJ",
      zipcode: searchZipcode
    };
    
    setNewAddress({
      ...mockCepData,
      number: '',
      title: 'Novo endereço'
    });
    setShowZipcodeResults(true);
    
    toast({
      title: "CEP encontrado",
      description: "Endereço localizado com sucesso",
      duration: 2000,
    });
  };
  
  // Confirmar novo endereço
  const confirmNewAddress = () => {
    if (newAddress && newAddress.number) {
      toast({
        title: "Endereço confirmado",
        description: "Seu pedido será entregue neste endereço",
        duration: 2000,
      });
      setAddressMode("new");
      setShowZipcodeResults(false);
    } else {
      toast({
        title: "Número é obrigatório",
        description: "Por favor, informe o número do endereço",
        variant: "destructive",
        duration: 2000,
      });
    }
  };
  
  // Formatar número de cartão de crédito
  const formatCreditCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const groups = [];
    for (let i = 0; i < digits.length && i < 16; i += 4) {
      groups.push(digits.slice(i, i + 4));
    }
    return groups.join(' ');
  };
  
  // Formatar data de expiração do cartão
  const formatExpiryDate = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  };
  
  // Validar dados de pagamento baseado no método selecionado
  const validatePaymentInfo = () => {
    if (paymentMethod === "credit" || paymentMethod === "debit") {
      if (creditCardNumber.replace(/\s/g, '').length !== 16) {
        toast({
          title: "Dados incompletos",
          description: "Por favor, informe um número de cartão válido",
          variant: "destructive",
          duration: 2000,
        });
        return false;
      }
      if (creditCardName.length < 3) {
        toast({
          title: "Dados incompletos",
          description: "Por favor, informe o nome no cartão",
          variant: "destructive",
          duration: 2000,
        });
        return false;
      }
      if (creditCardExpiry.length !== 5) {
        toast({
          title: "Dados incompletos",
          description: "Por favor, informe a data de validade do cartão",
          variant: "destructive",
          duration: 2000,
        });
        return false;
      }
      if (creditCardCVV.length !== 3) {
        toast({
          title: "Dados incompletos",
          description: "Por favor, informe o código de segurança do cartão",
          variant: "destructive",
          duration: 2000,
        });
        return false;
      }
    }
    return true;
  };
  
  // Simular finalização da compra
  const checkout = () => {
    // Verificação de endereço
    if (addressMode === "saved" && !selectedAddress) {
      toast({
        title: "Endereço não selecionado",
        description: "Por favor, selecione um endereço de entrega",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }
    
    if (addressMode === "new" && (!newAddress || !newAddress.number)) {
      toast({
        title: "Endereço incompleto",
        description: "Por favor, complete as informações do endereço",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }
    
    // Validação dos dados de pagamento
    if (!validatePaymentInfo()) {
      return;
    }
    
    let addressInfo = "";
    
    if (addressMode === "saved") {
      const address = savedAddresses.find(addr => addr.id === selectedAddress);
      if (address) {
        addressInfo = `${address.street}, ${address.number}`;
      }
    } else if (addressMode === "new" && newAddress) {
      addressInfo = `${newAddress.street}, ${newAddress.number}`;
    }
    
    // Gerar um ID de pedido simulado
    const orderId = `PEDIDO-${Math.floor(Math.random() * 10000)}`;
    setCurrentOrderId(orderId);
    
    // Configurar o status inicial do pedido
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
    
    // Marcar que o pedido foi feito
    setOrderPlaced(true);
    setCart([]);
    
    // Redirecionar para a página de acompanhamento do pedido
    setTimeout(() => {
      navigate('/cliente-pedidos');
    }, 2000);
  };
  
  const renderAddressSelection = () => {
    if (addressMode === "saved") {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Selecione um endereço salvo</h3>
            <Button 
              variant="link" 
              onClick={() => setAddressMode("new")}
              className="text-sm p-0 h-auto"
            >
              Novo endereço
            </Button>
          </div>
          
          <RadioGroup 
            value={selectedAddress || undefined}
            onValueChange={setSelectedAddress}
            className="space-y-3"
          >
            {savedAddresses.map(address => (
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
          
          <div className="flex justify-between items-center">
            <Button 
              variant="link" 
              className="p-0 h-auto"
              onClick={() => navigate('/cliente-enderecos')}
            >
              Gerenciar endereços
            </Button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Novo endereço para entrega</h3>
            {savedAddresses.length > 0 && (
              <Button 
                variant="link" 
                onClick={() => setAddressMode("saved")}
                className="text-sm p-0 h-auto"
              >
                Usar endereço salvo
              </Button>
            )}
          </div>
          
          <div className="space-y-3">
            <div className="flex space-x-2">
              <div className="flex-1">
                <Label htmlFor="zipcode">CEP</Label>
                <div className="flex space-x-2">
                  <Input
                    id="zipcode"
                    value={searchZipcode}
                    onChange={(e) => setSearchZipcode(e.target.value)}
                    placeholder="00000-000"
                    className="flex-1"
                  />
                  <Button onClick={searchByCEP} type="button">
                    <Search className="h-4 w-4 mr-1" /> Buscar
                  </Button>
                </div>
              </div>
            </div>
            
            {showZipcodeResults && newAddress && (
              <div className="space-y-3 border p-3 rounded-md">
                <div>
                  <Label htmlFor="street">Rua</Label>
                  <Input
                    id="street"
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                    readOnly
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="number">Número*</Label>
                    <Input
                      id="number"
                      value={newAddress.number || ''}
                      onChange={(e) => setNewAddress({...newAddress, number: e.target.value})}
                      placeholder="123"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={newAddress.complement || ''}
                      onChange={(e) => setNewAddress({...newAddress, complement: e.target.value})}
                      placeholder="Apto, bloco, etc."
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={newAddress.neighborhood}
                    onChange={(e) => setNewAddress({...newAddress, neighborhood: e.target.value})}
                    readOnly
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                      readOnly
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                      readOnly
                    />
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button onClick={confirmNewAddress} className="w-full">
                    Confirmar endereço
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  const renderPaymentMethodSelection = () => {
    return (
      <div className="space-y-4">
        <h3 className="font-medium">Forma de pagamento</h3>
        
        <RadioGroup 
          value={paymentMethod}
          onValueChange={setPaymentMethod}
          className="space-y-3"
        >
          {paymentMethods.map(method => (
            <div key={method.id} className="flex items-start space-x-2 rounded-md border p-3">
              <RadioGroupItem value={method.id} id={method.id} className="mt-1" />
              <div className="flex-1">
                <div className="flex items-center">
                  <div className="mr-2">{method.icon}</div>
                  <Label htmlFor={method.id} className="font-medium">{method.name}</Label>
                </div>
                {method.description && <p className="text-sm text-gray-500">{method.description}</p>}
                {method.info && <p className="text-xs text-blue-500 mt-1">{method.info}</p>}
              </div>
            </div>
          ))}
        </RadioGroup>
        
        {(paymentMethod === "credit" || paymentMethod === "debit") && (
          <div className="space-y-3 pt-2">
            <div>
              <Label htmlFor="cardNumber">Número do cartão</Label>
              <Input
                id="cardNumber"
                value={creditCardNumber}
                onChange={(e) => setCreditCardNumber(formatCreditCardNumber(e.target.value))}
                placeholder="0000 0000 0000 0000"
                maxLength={19}
              />
            </div>
            
            <div>
              <Label htmlFor="cardName">Nome no cartão</Label>
              <Input
                id="cardName"
                value={creditCardName}
                onChange={(e) => setCreditCardName(e.target.value.toUpperCase())}
                placeholder="NOME COMO ESTÁ NO CARTÃO"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="cardExpiry">Validade</Label>
                <Input
                  id="cardExpiry"
                  value={creditCardExpiry}
                  onChange={(e) => setCreditCardExpiry(formatExpiryDate(e.target.value))}
                  placeholder="MM/AA"
                  maxLength={5}
                />
              </div>
              <div>
                <Label htmlFor="cardCvv">CVV</Label>
                <Input
                  id="cardCvv"
                  value={creditCardCVV}
                  onChange={(e) => setCreditCardCVV(e.target.value.replace(/\D/g, ''))}
                  placeholder="123"
                  maxLength={3}
                  type="password"
                />
              </div>
            </div>
          </div>
        )}
        
        {paymentMethod === "money" && (
          <div className="space-y-3 pt-2">
            <div>
              <Label htmlFor="changeAmount">Troco para quanto?</Label>
              <Input
                id="changeAmount"
                value={changeAmount}
                onChange={(e) => setChangeAmount(e.target.value.replace(/\D/g, ''))}
                placeholder="R$ 0,00"
                prefix="R$ "
              />
              <p className="text-xs text-gray-500 mt-1">Deixe em branco se não precisar de troco</p>
            </div>
          </div>
        )}
        
        {paymentMethod === "pix" && (
          <div className="space-y-3 pt-2 text-center">
            <p className="text-sm text-gray-700">
              Após confirmar o pedido, você receberá o QR Code para pagamento via Pix.
            </p>
            <p className="text-xs text-gray-500">
              O pagamento deve ser feito em até 15 minutos, ou seu pedido será cancelado.
            </p>
          </div>
        )}
      </div>
    );
  };
  
  const renderOrderTrackingDialog = () => {
    return (
      <Dialog open={orderTrackingDialog} onOpenChange={setOrderTrackingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Acompanhando seu pedido</DialogTitle>
            <DialogDescription>
              Seu pedido está a caminho! Acompanhe em tempo real.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Mapa simulado (em uma implementação real, seria um mapa interativo) */}
            <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-blue-50 opacity-50"></div>
              <div className="z-10 text-center">
                <Map className="h-10 w-10 mx-auto mb-2 text-element-blue-neon" />
                <p className="text-sm text-gray-700 font-medium">Mapa de Entrega</p>
                <p className="text-xs text-gray-500">O entregador está a caminho!</p>
              </div>
            </div>
            
            {/* Informações do entregador */}
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-element-gray-light rounded-full flex items-center justify-center">
                  <span className="font-bold text-element-blue-dark">JD</span>
                </div>
                <div>
                  <p className="font-medium">João da Silva</p>
                  <p className="text-sm text-gray-500">Entregador</p>
                </div>
              </div>
            </div>
            
            {/* Status de entrega */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Truck className="h-5 w-5 mr-2 text-element-blue-neon" />
                  <span className="font-medium">Tempo estimado:</span>
                </div>
                <span>15-20 minutos</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-element-blue-neon" />
                  <span className="font-medium">Distância:</span>
                </div>
                <span>2.5 km</span>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={() => setOrderTrackingDialog(false)}
            variant="outline"
            className="w-full"
          >
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    );
  };
  
  return (
    <div className="min-h-screen bg-element-gray-light">
      <ClientSidebar />
      
      {renderOrderTrackingDialog()}
      
      <div className="lg:pl-64 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-element-blue-dark mb-6">
            Seu Carrinho
          </h1>
          
          {orderPlaced ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Pedido enviado com sucesso!</h2>
              <p className="text-gray-500 mb-2">
                Pedido #{currentOrderId} - {orderStatus?.statusText}
              </p>
              <p className="text-gray-500 mb-6">Acompanhe o status do seu pedido na seção Meus Pedidos</p>
              <Button 
                onClick={() => navigate('/cliente-pedidos')}
                className="bg-element-blue-neon text-element-gray-dark hover:bg-element-blue-neon/90"
              >
                Acompanhar pedido
              </Button>
            </div>
          ) : cart.length === 0 ? (
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
                <div className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-4">Itens do Carrinho</h2>
                      
                      <div className="space-y-4">
                        {cart.map((item) => (
                          <div key={item.product.id} className="flex items-center py-4 border-b last:border-b-0">
                            <img 
                              src={item.product.image} 
                              alt={item.product.name} 
                              className="w-24 h-24 object-cover rounded-md mr-4"
                            />
                            
                            <div className="flex-1">
                              <h3 className="font-medium mb-1">{item.product.name}</h3>
                              <p className="text-sm text-gray-500 mb-3">{item.product.description}</p>
                              <p className="font-bold text-element-blue-dark">
                                R$ {item.product.price.toFixed(2)}
                              </p>
                            </div>
                            
                            <div className="flex flex-col items-center space-y-2">
                              <div className="flex items-center border rounded-md">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => decrementQuantity(item.product.id)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-8 text-center">{item.quantity}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => incrementQuantity(item.product.id)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => removeFromCart(item.product.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remover
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                
                  <Card>
                    <CardContent className="p-6">
                      <Tabs defaultValue="address" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="address" className="text-sm">
                            <MapPin className="h-4 w-4 mr-1" /> Entrega
                          </TabsTrigger>
                          <TabsTrigger value="delivery" className="text-sm">
                            <Truck className="h-4 w-4 mr-1" /> Opções
                          </TabsTrigger>
                          <TabsTrigger value="payment" className="text-sm">
                            <CreditCard className="h-4 w-4 mr-1" /> Pagamento
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="address" className="pt-4">
                          {renderAddressSelection()}
                        </TabsContent>
                        
                        <TabsContent value="delivery" className="pt-4">
                          <div className="space-y-4">
                            <h3 className="font-medium">Opções de entrega</h3>
                            <RadioGroup 
                              value={deliveryMethod}
                              onValueChange={setDeliveryMethod}
                              className="space-y-2"
                            >
                              {deliveryOptions.map(option => (
                                <div key={option.id} className="flex items-center justify-between space-x-2 rounded-md border p-3">
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value={option.id} id={option.id} />
                                    <Label htmlFor={option.id}>{option.name}</Label>
                                  </div>
                                  <span className="font-medium">
                                    {option.price > 0 
                                      ? `R$ ${option.price.toFixed(2)}` 
                                      : "Grátis"
                                    }
                                  </span>
                                </div>
                              ))}
                            </RadioGroup>
                            
                            <div>
                              <Label htmlFor="deliveryTime">Horário de entrega</Label>
                              <Select 
                                value={deliveryTime} 
                                onValueChange={setDeliveryTime}
                              >
                                <SelectTrigger id="deliveryTime">
                                  <SelectValue placeholder="Selecione um horário" />
                                </SelectTrigger>
                                <SelectContent>
                                  {deliveryTimeSlots.map((slot) => (
                                    <SelectItem key={slot} value={slot}>
                                      {slot}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label htmlFor="instructions">Instruções para entrega</Label>
                              <Textarea 
                                id="instructions"
                                placeholder="Ex: Deixar na portaria, apartamento 101, etc."
                                value={deliveryInstructions}
                                onChange={(e) => setDeliveryInstructions(e.target.value)}
                              />
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="payment" className="pt-4">
                          {renderPaymentMethodSelection()}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
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
                          <span className="text-gray-500">Entrega</span>
                          <span>
                            {deliveryFee > 0 
                              ? `R$ ${deliveryFee.toFixed(2)}` 
                              : "Grátis"
                            }
                          </span>
                        </div>
                        
                        <Separator className="my-2" />
                        
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total</span>
                          <span>R$ {total.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      {/* Cupom de desconto */}
                      <div className="flex space-x-2">
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
    </div>
  );
};

export default ClientCart;
