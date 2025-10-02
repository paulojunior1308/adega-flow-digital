import React, { useState, useEffect } from 'react';
import VendedorLayout from '@/components/vendedor/VendedorLayout';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus,
  Trash2,
  CreditCard,
  DollarSign,
  Package,
  User,
  Phone
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image?: string;
  category: {
    name: string;
  };
}

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  price: number;
  total: number;
}

interface Client {
  id: string;
  name: string;
  phone?: string;
}

const VendedorPDV = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Buscar produtos e clientes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, clientsRes] = await Promise.all([
          api.get('/vendedor/products'),
          api.get('/admin/clients')
        ]);

        setProducts(productsRes.data.data.products || []);
        setClients(clientsRes.data.data || []);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrar produtos
  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [products, searchTerm]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast({
        title: "Estoque insuficiente",
        description: "Este produto não está disponível no estoque",
        variant: "destructive"
      });
      return;
    }

    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast({
          title: "Estoque insuficiente",
          description: "Quantidade solicitada excede o estoque disponível",
          variant: "destructive"
        });
        return;
      }
      
      setCart(prev => 
        prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        )
      );
    } else {
      const newItem: CartItem = {
        id: `${product.id}-${Date.now()}`,
        product,
        quantity: 1,
        price: product.price,
        total: product.price
      };
      setCart(prev => [...prev, newItem]);
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    const item = cart.find(item => item.id === itemId);
    if (item && newQuantity > item.product.stock) {
      toast({
        title: "Estoque insuficiente",
        description: "Quantidade solicitada excede o estoque disponível",
        variant: "destructive"
      });
      return;
    }

    setCart(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
          : item
      )
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedClient('');
    setPaymentMethod('');
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSale = async () => {
    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho antes de finalizar a venda",
        variant: "destructive"
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Método de pagamento obrigatório",
        description: "Selecione um método de pagamento",
        variant: "destructive"
      });
      return;
    }

    try {
      const saleData = {
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.price,
          costPrice: 0 // Vendedor não tem acesso ao custo
        })),
        clientId: selectedClient || null,
        paymentMethodId: paymentMethod,
        total: getTotal(),
        discount: 0
      };

      await api.post('/vendedor/sales', saleData);

      toast({
        title: "Venda realizada",
        description: "Venda finalizada com sucesso!",
      });

      clearCart();
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      toast({
        title: "Erro",
        description: "Não foi possível finalizar a venda",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <VendedorLayout>
        <div className="min-h-screen bg-element-gray-light flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-element-blue-dark mx-auto mb-4"></div>
            <p className="text-element-gray-dark">Carregando PDV...</p>
          </div>
        </div>
      </VendedorLayout>
    );
  }

  return (
    <VendedorLayout>
      <div className="lg:pl-64 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-element-blue-dark mb-2">
              Ponto de Venda (PDV)
            </h1>
            <p className="text-element-gray-dark">
              Sistema de vendas para atendimento presencial
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Produtos */}
            <div className="lg:col-span-2">
              <div className="element-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-element-blue-dark">
                    Produtos Disponíveis
                  </h2>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-element-gray-dark/50 h-4 w-4" />
                    <Input
                      placeholder="Buscar produtos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="flex items-center space-x-3 p-3 bg-element-gray-light/30 rounded-lg hover:bg-element-gray-light/50 transition-colors">
                      <div className="w-12 h-12 bg-element-gray-light rounded-lg flex items-center justify-center">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-element-gray-dark/50" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-element-blue-dark truncate">{product.name}</h3>
                        <p className="text-sm text-element-gray-dark/70">{product.category.name}</p>
                        <p className="text-sm font-medium text-element-blue-dark">
                          R$ {product.price.toFixed(2)}
                        </p>
                        <p className="text-xs text-element-gray-dark/60">
                          Estoque: {product.stock}
                        </p>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => addToCart(product)}
                        disabled={product.stock <= 0}
                        className="bg-element-blue-dark hover:bg-element-blue-dark/90"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Carrinho */}
            <div className="lg:col-span-1">
              <div className="element-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-element-blue-dark">
                    Carrinho
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCart}
                    disabled={cart.length === 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Itens do carrinho */}
                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                  {cart.length === 0 ? (
                    <p className="text-element-gray-dark text-center py-8">
                      Carrinho vazio
                    </p>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-element-gray-light/30 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-element-blue-dark truncate">
                            {item.product.name}
                          </h4>
                          <p className="text-sm text-element-gray-dark/70">
                            R$ {item.price.toFixed(2)} cada
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Cliente e Pagamento */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-element-gray-dark mb-2">
                      Cliente (opcional)
                    </label>
                    <Select value={selectedClient} onValueChange={setSelectedClient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Cliente não informado</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-element-gray-dark mb-2">
                      Método de Pagamento *
                    </label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="cartao-debito">Cartão de Débito</SelectItem>
                        <SelectItem value="cartao-credito">Cartão de Crédito</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Total e Finalizar */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold text-element-blue-dark">
                      Total:
                    </span>
                    <span className="text-xl font-bold text-element-blue-dark">
                      R$ {getTotal().toFixed(2)}
                    </span>
                  </div>
                  
                  <Button
                    onClick={handleSale}
                    disabled={cart.length === 0 || !paymentMethod}
                    className="w-full bg-element-blue-dark hover:bg-element-blue-dark/90"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Finalizar Venda
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </VendedorLayout>
  );
};

export default VendedorPDV;
