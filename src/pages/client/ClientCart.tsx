
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientSidebar from '@/components/client/ClientSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

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
  { id: "standard", name: "Padrão (2-3 dias)", price: 5.90 },
  { id: "express", name: "Expressa (1 dia)", price: 12.90 },
  { id: "free", name: "Grátis (5-7 dias)", price: 0 }
];

// Endereços salvos
const savedAddresses = [
  {
    id: "address1",
    name: "Casa",
    street: "Avenida Paulista, 1000",
    city: "São Paulo",
    state: "SP",
    zipcode: "01310-100"
  },
  {
    id: "address2",
    name: "Trabalho",
    street: "Rua Augusta, 500",
    city: "São Paulo",
    state: "SP",
    zipcode: "01304-000"
  }
];

const ClientCart = () => {
  const [cart, setCart] = useState<CartItem[]>(initialCart);
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [deliveryMethod, setDeliveryMethod] = useState("standard");
  const [deliveryFee, setDeliveryFee] = useState(5.90);
  const [selectedAddress, setSelectedAddress] = useState("address1");
  
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
  
  // Simular finalização da compra
  const checkout = () => {
    toast({
      title: "Pedido finalizado!",
      description: `Seu pedido no valor de R$ ${total.toFixed(2)} foi confirmado!`,
      duration: 3000,
    });
    setCart([]);
    navigate('/cliente-pedidos');
  };
  
  return (
    <div className="min-h-screen bg-element-gray-light">
      <ClientSidebar />
      
      <div className="lg:pl-64 min-h-screen">
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
                      
                      {/* Opções de entrega */}
                      <Accordion type="single" collapsible defaultValue="delivery">
                        <AccordionItem value="delivery">
                          <AccordionTrigger>Opções de Entrega</AccordionTrigger>
                          <AccordionContent>
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
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="address">
                          <AccordionTrigger>Endereço de Entrega</AccordionTrigger>
                          <AccordionContent>
                            <RadioGroup 
                              value={selectedAddress}
                              onValueChange={setSelectedAddress}
                              className="space-y-2"
                            >
                              {savedAddresses.map(address => (
                                <div key={address.id} className="flex items-start space-x-2 rounded-md border p-3">
                                  <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                                  <div>
                                    <Label htmlFor={address.id} className="font-medium">{address.name}</Label>
                                    <p className="text-sm text-gray-500">{address.street}</p>
                                    <p className="text-sm text-gray-500">{address.city}, {address.state} - {address.zipcode}</p>
                                  </div>
                                </div>
                              ))}
                            </RadioGroup>
                            
                            <Button 
                              variant="link" 
                              className="mt-2 p-0 h-auto"
                              onClick={() => navigate('/cliente-enderecos')}
                            >
                              Gerenciar endereços
                            </Button>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                      
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
