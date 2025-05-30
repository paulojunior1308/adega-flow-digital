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
  ChevronRight,
  ChefHat,
  Truck,
  XCircle,
  HelpCircle,
  CheckCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import api from '@/lib/axios';
import socket from '@/lib/socket';
import { useAuth } from '@/hooks/useAuth';
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';

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
  status: 'pending' | 'processing' | 'preparing' | 'shipped' | 'delivering' | 'delivered' | 'cancelled';
  total: number;
  products: OrderProduct[];
  address: string;
  paymentMethod: string;
  pixPaymentStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryFee?: number;
}

// Coordenadas fixas da loja
const STORE_LOCATION = {
  lat: -23.744837, // Latitude da loja (Avenida Antonio Carlos Benjamin dos Santos, 1663)
  lng: -46.579837 // Longitude da loja
};

// Função para geocodificar endereço do cliente (pode ser melhorada para cache)
async function geocodeAddress(address: string, apiKey: string): Promise<{lat: number, lng: number} | null> {
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`);
  const data = await response.json();
  if (data.status === 'OK') {
    return data.results[0].geometry.location;
  }
  return null;
}

const ClientOrders = () => {
  const [selectedTab, setSelectedTab] = React.useState('all');
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const { user } = useAuth();

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [clientLatLng, setClientLatLng] = React.useState<{lat: number, lng: number} | null>(null);
  const [motoboyLatLng, setMotoboyLatLng] = React.useState<{lat: number, lng: number} | null>(null);

  // Função para mapear pedido do backend para o formato do frontend
  function mapOrderFromBackend(order: any): Order {
    return {
      id: order.id,
      date: order.createdAt || order.updatedAt || '',
      status: (order.status ?? 'pending').toLowerCase() as 'pending' | 'processing' | 'preparing' | 'shipped' | 'delivering' | 'delivered' | 'cancelled',
      total: order.total,
      address: order.address
        ? `${order.address.title} - ${order.address.street}, ${order.address.number}${order.address.complement ? ' ' + order.address.complement : ''}, ${order.address.neighborhood}, ${order.address.city} - ${order.address.state}, CEP: ${order.address.zipcode}`
        : '-',
      paymentMethod: order.paymentMethod,
      pixPaymentStatus: order.pixPaymentStatus,
      products: (order.items ?? []).map((item: any) => ({
        id: item.product?.id ?? '',
        name: item.product?.name ?? '',
        price: item.price,
        quantity: item.quantity,
        image: item.product?.image ?? ''
      })),
      deliveryLat: order.deliveryLat,
      deliveryLng: order.deliveryLng,
      deliveryFee: order.deliveryFee ?? 0,
    };
  }

  React.useEffect(() => {
    api.get('/orders').then(res => {
      const mapped = res.data.map(mapOrderFromBackend);
      setOrders(mapped);
    });
  }, []);

  // Conectar ao socket e ouvir atualizações de pedido
  React.useEffect(() => {
    if (user?.id) {
      socket.emit('join', user.id);
      socket.on('order-updated', (data: any) => {
        const mappedOrder = mapOrderFromBackend(data.order);
        setOrders((prev) => prev.map(o => o.id === mappedOrder.id ? mappedOrder : o));
        if (selectedOrder && selectedOrder.id === mappedOrder.id) {
          setSelectedOrder(mappedOrder);
        }
      });
      return () => {
        socket.off('order-updated');
      };
    }
  }, [user, selectedOrder]);

  // Atualizar localização do motoboy em tempo real
  React.useEffect(() => {
    if (!selectedOrder || !['delivering', 'shipped'].includes(selectedOrder.status)) return;
    socket.on('motoboy-location', (data: any) => {
      if (data.orderId === selectedOrder.id) {
        setMotoboyLatLng({ lat: data.lat, lng: data.lng });
      }
    });
    return () => {
      socket.off('motoboy-location');
    };
  }, [selectedOrder]);

  // Geocodificar endereço do cliente quando abrir modal
  React.useEffect(() => {
    if (selectedOrder && ['delivering', 'shipped'].includes(selectedOrder.status) && isLoaded) {
      geocodeAddress(selectedOrder.address, import.meta.env.VITE_GOOGLE_MAPS_API_KEY).then(setClientLatLng);
    }
  }, [selectedOrder, isLoaded]);

  const filteredOrders = React.useMemo(() => {
    if (selectedTab === 'all') return orders;
    return orders.filter(order => {
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
  }, [selectedTab, orders]);
  
  const handleOpenDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };
  
  // Helper function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
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
      case 'preparing':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Preparando</Badge>;
      case 'shipped':
      case 'delivering':
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
      case 'preparing':
        return <ChefHat className="h-5 w-5 text-blue-500" />;
      case 'shipped':
      case 'delivering':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <ShoppingCart className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  // Função para mensagem e ícone amigável do status
  function getOrderStatusInfo(status: string) {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { label: 'Aguardando confirmação do estabelecimento', icon: <Clock className="h-6 w-6 text-yellow-500" /> };
      case 'preparing':
        return { label: 'Pedido sendo preparado', icon: <ChefHat className="h-6 w-6 text-blue-500" /> };
      case 'delivering':
        return { label: 'Saiu para entrega!', icon: <Truck className="h-6 w-6 text-purple-500" /> };
      case 'delivered':
        return { label: 'Pedido entregue! Bom apetite!', icon: <CheckCircle className="h-6 w-6 text-green-500" /> };
      case 'cancelled':
        return { label: 'Pedido cancelado pelo estabelecimento', icon: <XCircle className="h-6 w-6 text-red-500" /> };
      default:
        return { label: 'Status desconhecido', icon: <HelpCircle className="h-6 w-6 text-gray-400" /> };
    }
  }

  return (
    <div className="min-h-screen bg-element-gray-light">
      <ClientSidebar />
      
      <div className="lg:pl-64 min-h-screen pl-24 md:pl-24 lg:pl-64 transition-all duration-300">
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
                            {(order.products?.length ?? 0)} {(order.products?.length === 1 ? 'item' : 'itens')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {(order.products ?? []).slice(0, 2).map((product, idx) => (
                            <span key={product.id}>
                              {product.quantity}x {product.name}
                              {idx < Math.min(1, (order.products?.length ?? 0) - 1) ? ', ' : ''}
                            </span>
                          ))}
                          {(order.products?.length ?? 0) > 2 && (
                            <span> e mais {(order.products?.length ?? 0) - 2} itens</span>
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
                  {/* Status amigável em destaque */}
                  <div className="flex items-center gap-3 p-4 rounded-md bg-element-gray-light border">
                    {getOrderStatusInfo(selectedOrder.status).icon}
                    <span className="font-medium text-lg text-element-blue-dark">
                      {getOrderStatusInfo(selectedOrder.status).label}
                    </span>
                  </div>
                  {/* Timeline visual */}
                  <div className="flex flex-col gap-2 px-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${['pending','preparing','delivering','delivered'].includes(selectedOrder.status) ? 'bg-yellow-500' : 'bg-gray-300'}`}></span>
                      <span className="text-sm">Aguardando confirmação</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${['preparing','delivering','delivered'].includes(selectedOrder.status) ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                      <span className="text-sm">Pedido sendo preparado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${['delivering','delivered'].includes(selectedOrder.status) ? 'bg-purple-500' : 'bg-gray-300'}`}></span>
                      <span className="text-sm">Saiu para entrega</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${selectedOrder.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span className="text-sm">Pedido entregue</span>
                    </div>
                    {selectedOrder.status === 'cancelled' && (
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-red-500"></span>
                        <span className="text-sm">Pedido cancelado</span>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Produtos</h4>
                    <div className="space-y-3">
                      {(selectedOrder?.products ?? []).map((product, idx) => (
                        <div key={product.id ? `${product.id}-${idx}` : idx} className="flex items-center gap-3">
                          <img 
                            src={
                              product.image
                                ? product.image.startsWith('http')
                                  ? product.image
                                  : `https://adega-flow-digital.onrender.com${product.image}`
                                : '/img/no-image.png'
                            } 
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
                      <span>R$ {(selectedOrder.total - (selectedOrder.deliveryFee ?? 0)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="font-medium">Taxa de entrega</span>
                      <span>R$ {(selectedOrder.deliveryFee ?? 0).toFixed(2)}</span>
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
                  
                  {selectedOrder && selectedOrder.paymentMethod && selectedOrder.paymentMethod.toLowerCase().includes('pix') && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-1">Status do pagamento PIX</h4>
                      <div className="flex items-center gap-2">
                        {selectedOrder.pixPaymentStatus === 'APPROVED' && <Badge className="bg-green-100 text-green-700">Aprovado</Badge>}
                        {selectedOrder.pixPaymentStatus === 'REJECTED' && <Badge className="bg-red-100 text-red-700">Rejeitado</Badge>}
                        {(!selectedOrder.pixPaymentStatus || selectedOrder.pixPaymentStatus === 'PENDING') && <Badge className="bg-yellow-100 text-yellow-700">Pendente</Badge>}
                      </div>
                      {selectedOrder.pixPaymentStatus === 'REJECTED' && (
                        <div className="text-xs text-red-600 mt-1">Pagamento não identificado. Entre em contato com o estabelecimento.</div>
                      )}
                      {selectedOrder.pixPaymentStatus === 'PENDING' && (
                        <div className="text-xs text-yellow-600 mt-1">Aguardando confirmação do pagamento pelo estabelecimento.</div>
                      )}
                      {selectedOrder.pixPaymentStatus === 'APPROVED' && (
                        <div className="text-xs text-green-600 mt-1">Pagamento aprovado! Seu pedido será processado.</div>
                      )}
                    </div>
                  )}
                  
                  {selectedOrder && selectedOrder.status === 'shipped' && selectedOrder.deliveryLat && selectedOrder.deliveryLng && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-2">Rastreamento da Entrega</h3>
                      <div style={{ width: '100%', height: 300, borderRadius: 8, overflow: 'hidden' }}>
                        <iframe
                          title="Mapa do Entregador"
                          width="100%"
                          height="300"
                          frameBorder="0"
                          style={{ border: 0 }}
                          src={`https://www.google.com/maps?q=${selectedOrder.deliveryLat},${selectedOrder.deliveryLng}&z=16&output=embed`}
                          allowFullScreen
                        ></iframe>
                      </div>
                    </div>
                  )}
                  
                  {selectedOrder && ['delivering', 'shipped'].includes(selectedOrder.status) && isLoaded && clientLatLng && (
                    <div className="my-4 rounded-md overflow-hidden border" style={{height: 320}}>
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={motoboyLatLng || STORE_LOCATION}
                        zoom={14}
                      >
                        {/* Loja */}
                        <Marker position={STORE_LOCATION} label="Loja" />
                        {/* Cliente */}
                        <Marker position={clientLatLng} label="Cliente" />
                        {/* Motoboy */}
                        {motoboyLatLng && <Marker position={motoboyLatLng} label="Motoboy" icon={{ url: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', scaledSize: new window.google.maps.Size(40, 40) }} />}
                        {/* Linha entre loja, motoboy e cliente */}
                        <Polyline path={[STORE_LOCATION, ...(motoboyLatLng ? [motoboyLatLng] : []), clientLatLng]} options={{ strokeColor: '#007bff', strokeWeight: 4 }} />
                      </GoogleMap>
                    </div>
                  )}
                  
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
