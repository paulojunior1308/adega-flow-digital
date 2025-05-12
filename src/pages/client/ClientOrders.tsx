
import React from 'react';
import ClientSidebar from '@/components/client/ClientSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package,
  Clock,
  Check,
  ShoppingCart,
  ChevronRight
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

// Types
interface OrderProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  id: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  products: OrderProduct[];
  address: string;
  paymentMethod: string;
}

// Mock Data
const ORDERS: Order[] = [
  {
    id: 'ORD-12345',
    date: '2025-05-10T14:30:00',
    status: 'delivered',
    total: 127.85,
    products: [
      {
        id: '1',
        name: 'Skol 350ml - Pack com 12',
        price: 39.90,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9'
      },
      {
        id: '2',
        name: 'Vodka Smirnoff 998ml',
        price: 49.90,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901'
      }
    ],
    address: 'Rua das Flores, 123, Apto 101, Jardim Primavera, São Paulo - SP',
    paymentMethod: 'Cartão de Crédito - final 1234'
  },
  {
    id: 'ORD-12346',
    date: '2025-05-09T10:15:00',
    status: 'shipped',
    total: 89.90,
    products: [
      {
        id: '4',
        name: 'Red Label 750ml',
        price: 89.90,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9'
      }
    ],
    address: 'Av. Paulista, 1000, Sala 301, Bela Vista, São Paulo - SP',
    paymentMethod: 'PIX'
  },
  {
    id: 'ORD-12347',
    date: '2025-05-08T16:45:00',
    status: 'processing',
    total: 79.80,
    products: [
      {
        id: '1',
        name: 'Skol 350ml - Pack com 12',
        price: 39.90,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9'
      }
    ],
    address: 'Rua das Flores, 123, Apto 101, Jardim Primavera, São Paulo - SP',
    paymentMethod: 'Dinheiro'
  }
];

const ClientOrders = () => {
  const [selectedTab, setSelectedTab] = React.useState('all');
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  
  const filteredOrders = React.useMemo(() => {
    if (selectedTab === 'all') return ORDERS;
    return ORDERS.filter(order => {
      switch (selectedTab) {
        case 'pending':
          return ['pending', 'processing'].includes(order.status);
        case 'delivered':
          return order.status === 'delivered';
        case 'shipped':
          return order.status === 'shipped';
        case 'cancelled':
          return order.status === 'cancelled';
        default:
          return true;
      }
    });
  }, [selectedTab]);
  
  const handleOpenDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };
  
  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Helper function to get status badge
  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Em processamento</Badge>;
      case 'shipped':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">Em entrega</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Entregue</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Cancelado</Badge>;
      default:
        return null;
    }
  };
  
  // Helper function to get status icon
  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'shipped':
        return <Package className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <ShoppingCart className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-element-gray-light">
      <ClientSidebar />
      
      <div className="lg:pl-64 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-element-blue-dark mb-6">Meus Pedidos</h1>
          
          <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab} className="w-full mb-6">
            <TabsList className="w-full grid grid-cols-2 md:grid-cols-5">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="pending">Em andamento</TabsTrigger>
              <TabsTrigger value="shipped">Em entrega</TabsTrigger>
              <TabsTrigger value="delivered">Entregues</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelados</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {filteredOrders.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <ShoppingCart className="h-16 w-16 text-gray-300" />
                <h3 className="text-xl font-medium">Nenhum pedido encontrado</h3>
                <p className="text-gray-500 mb-4">
                  Você ainda não possui pedidos nesta categoria.
                </p>
                <Button onClick={() => setSelectedTab('all')}>
                  Ver todos os pedidos
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <CardTitle className="text-lg">{order.id}</CardTitle>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatDate(order.date)}
                    </p>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="mb-4 md:mb-0">
                        <div className="flex items-center">
                          {getStatusIcon(order.status)}
                          <span className="ml-2 font-medium">
                            {order.products.length} {order.products.length === 1 ? 'item' : 'itens'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {order.products.slice(0, 2).map((product, idx) => (
                            <span key={product.id}>
                              {product.quantity}x {product.name}
                              {idx < Math.min(1, order.products.length - 1) ? ', ' : ''}
                            </span>
                          ))}
                          {order.products.length > 2 && (
                            <span> e mais {order.products.length - 2} itens</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <div className="text-lg font-bold text-element-blue-dark">
                          R$ {order.total.toFixed(2)}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-element-blue-dark"
                          onClick={() => handleOpenDetails(order)}
                        >
                          Ver detalhes <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* Order Details Dialog */}
          <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Detalhes do Pedido {selectedOrder?.id}</DialogTitle>
              </DialogHeader>
              
              {selectedOrder && (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">Data do pedido</p>
                      <p className="font-medium">{formatDate(selectedOrder.date)}</p>
                    </div>
                    <div>
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Produtos</h4>
                    <div className="space-y-3">
                      {selectedOrder.products.map((product) => (
                        <div key={product.id} className="flex items-center gap-3">
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-12 h-12 object-cover rounded-md"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-500">
                              {product.quantity} x R$ {product.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="font-medium">
                            R$ {(product.price * product.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between">
                      <span className="font-medium">Subtotal</span>
                      <span>R$ {selectedOrder.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="font-medium">Taxa de entrega</span>
                      <span>Grátis</span>
                    </div>
                    <div className="flex justify-between mt-3 text-lg font-bold">
                      <span>Total</span>
                      <span>R$ {selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 space-y-4">
                    <div>
                      <h4 className="font-medium mb-1">Endereço de entrega</h4>
                      <p className="text-sm">{selectedOrder.address}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-1">Forma de pagamento</h4>
                      <p className="text-sm">{selectedOrder.paymentMethod}</p>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setDetailsOpen(false)}
                    >
                      Fechar
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default ClientOrders;
