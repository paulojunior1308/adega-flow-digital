import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, Check, Clock, MapPin, LogOut } from 'lucide-react';
import api from '@/lib/axios';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import socket from '@/lib/socket';

interface DeliveryOrder {
  id: string;
  status: string;
  address: string;
  products: { name: string; quantity: number; }[];
  createdAt: string;
  total: number;
}

const MotoboyDashboard = () => {
  const [orders, setOrders] = React.useState<DeliveryOrder[]>([]);
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [trackingOrderId, setTrackingOrderId] = React.useState<string | null>(null);
  const trackingRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    api.get('/motoboy/orders').then(res => setOrders(res.data));
    socket.on('order-updated', (data: any) => {
      if (data.order && data.order.status === 'DELIVERING') {
        setOrders(prev => {
          const exists = prev.some(o => o.id === data.order.id);
          if (exists) {
            return prev.map(o => o.id === data.order.id ? {
              ...o,
              status: data.order.status,
              address: `${data.order.address.title} - ${data.order.address.street}, ${data.order.address.number}${data.order.address.complement ? ' ' + data.order.address.complement : ''}, ${data.order.address.neighborhood}, ${data.order.address.city} - ${data.order.address.state}, CEP: ${data.order.address.zipcode}`,
              products: (data.order.items ?? []).map((item: any) => ({ name: item.product?.name ?? '', quantity: item.quantity })),
              createdAt: data.order.createdAt,
              total: data.order.total
            } : o);
          } else {
            return [
              {
                id: data.order.id,
                status: data.order.status,
                address: `${data.order.address.title} - ${data.order.address.street}, ${data.order.address.number}${data.order.address.complement ? ' ' + data.order.address.complement : ''}, ${data.order.address.neighborhood}, ${data.order.address.city} - ${data.order.address.state}, CEP: ${data.order.address.zipcode}`,
                products: (data.order.items ?? []).map((item: any) => ({ name: item.product?.name ?? '', quantity: item.quantity })),
                createdAt: data.order.createdAt,
                total: data.order.total
              },
              ...prev
            ];
          }
        });
      } else if (data.order && data.order.status === 'DELIVERED') {
        setOrders(prev => prev.filter(o => o.id !== data.order.id));
      }
    });
    return () => {
      socket.off('order-updated');
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERING':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Em entrega</Badge>;
      case 'DELIVERED':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Entregue</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
    }
  };

  const startTracking = (orderId: string) => {
    if (trackingRef.current) return;
    setTrackingOrderId(orderId);
    trackingRef.current = window.setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          socket.emit('motoboy-location', {
            orderId,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        });
      }
    }, 4000);
  };

  const stopTracking = () => {
    if (trackingRef.current) {
      clearInterval(trackingRef.current);
      trackingRef.current = null;
      setTrackingOrderId(null);
    }
  };

  const handleNavigate = (address: string, orderId: string) => {
    const semTitulo = address.replace(/^[^-]+- /, '');
    const semCep = semTitulo.replace(/, CEP: [0-9-]+\.?$/, '');
    const encoded = encodeURIComponent(semCep.trim());
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
    const wazeUrl = `https://waze.com/ul?q=${encoded}`;
    const escolha = window.prompt('Digite 1 para abrir no Google Maps ou 2 para abrir no Waze:', '1');
    if (escolha === '2') {
      window.open(wazeUrl, '_blank');
    } else if (escolha === '1') {
      window.open(googleMapsUrl, '_blank');
    }
    startTracking(orderId);
  };

  const handleMarkDelivered = async (orderId: string) => {
    try {
      await api.patch(`/motoboy/orders/${orderId}/status`, { status: 'delivered' });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'DELIVERED' } : o));
      toast({ title: 'Pedido entregue!', description: 'O status foi atualizado com sucesso.', variant: 'default' });
      if (trackingOrderId === orderId) stopTracking();
    } catch (err) {
      toast({ title: 'Erro ao marcar como entregue', description: 'Tente novamente.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-element-gray-light">
      {/* Header fixo */}
      <header className="w-full bg-element-blue-dark text-white py-4 px-6 flex items-center justify-between shadow-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Truck className="h-7 w-7 text-element-blue-neon" />
          <span className="font-semibold text-lg">Motoboy</span>
          {user?.name && <span className="ml-2 text-base font-normal text-element-blue-neon">{user.name}</span>}
        </div>
        <Button variant="ghost" className="text-white hover:bg-element-blue-neon/20" onClick={logout}>
          <LogOut className="h-5 w-5 mr-2" /> Sair
        </Button>
      </header>

      <main className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6 text-element-blue-dark">Minhas Entregas</h1>
        <div className="space-y-6">
          {orders.length === 0 ? (
            <Card className="p-8 text-center border-2 border-dashed border-element-blue-neon bg-white/80">
              <Truck className="h-12 w-12 mx-auto text-element-blue-neon mb-4" />
              <span className="text-gray-400">Nenhuma entrega atribuída no momento.</span>
            </Card>
          ) : (
            orders.map(order => (
              <Card key={order.id} className="overflow-hidden shadow-md border border-element-blue-neon/30 bg-white">
                <CardHeader className="pb-2 flex flex-row items-center justify-between bg-element-blue-neon/10">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5 text-element-blue-neon" />
                    Entrega #{order.id.substring(0, 8)}
                  </CardTitle>
                  {getStatusBadge(order.status)}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-1 text-element-blue-dark">
                        <MapPin className="h-5 w-5 text-element-blue-neon mr-2" />
                        <span className="font-medium">{order.address}</span>
                      </div>
                      <div className="text-sm text-gray-500 mb-2">
                        {order.products.map((p, idx) => (
                          <span key={p.name}>{p.quantity}x {p.name}{idx < order.products.length - 1 ? ', ' : ''}</span>
                        ))}
                      </div>
                      <div className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString('pt-BR')}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-lg font-bold text-element-blue-dark">R$ {order.total.toFixed(2)}</div>
                      {order.status === 'DELIVERING' && (
                        <div className="flex gap-2">
                          <Button variant="outline" className="border-element-blue-neon text-element-blue-dark hover:bg-element-blue-neon/10" onClick={() => handleNavigate(order.address, order.id)}>
                            Navegar <MapPin className="ml-2 h-4 w-4" />
                          </Button>
                          <Button variant="outline" className="border-green-500 text-green-700 hover:bg-green-100" onClick={() => handleMarkDelivered(order.id)}>
                            Marcar como entregue <Check className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {order.status === 'DELIVERED' && (
                        <span className="text-green-600 flex items-center"><Check className="h-4 w-4 mr-1" /> Entregue</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default MotoboyDashboard; 