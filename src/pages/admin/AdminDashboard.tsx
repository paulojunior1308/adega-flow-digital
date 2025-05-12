
import React, { useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { 
  TrendingUp, 
  Package, 
  Archive, 
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Truck,
  Clock,
  MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// We would normally use recharts for these charts
const StatCard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon 
}: { 
  title: string; 
  value: string; 
  change?: string; 
  changeType?: 'up' | 'down'; 
  icon: React.ReactNode 
}) => {
  return (
    <div className="element-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="bg-element-gray-light rounded-lg p-3">
          {icon}
        </div>
        {change && (
          <div className={`flex items-center ${changeType === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {changeType === 'up' ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
            {change}
          </div>
        )}
      </div>
      <h3 className="text-element-gray-dark/70 text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-element-blue-dark">{value}</p>
    </div>
  );
};

// Interface para pedidos
interface Order {
  id: string;
  customer: string;
  address: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  status: 'pending' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';
  timestamp: Date;
  paymentMethod: string;
}

// Pedidos de exemplo
const initialOrders: Order[] = [
  {
    id: 'PEDIDO-1234',
    customer: 'Carlos Silva',
    address: 'Avenida Paulista, 1000, Apto 101, Bela Vista, São Paulo/SP',
    items: [
      { name: 'Skol 350ml - Pack com 12', quantity: 2, price: 39.90 },
      { name: 'Vodka Smirnoff 998ml', quantity: 1, price: 49.90 }
    ],
    total: 129.70,
    status: 'pending',
    timestamp: new Date(),
    paymentMethod: 'Cartão de Crédito'
  },
  {
    id: 'PEDIDO-1233',
    customer: 'Maria Souza',
    address: 'Rua Augusta, 500, Consolação, São Paulo/SP',
    items: [
      { name: 'Red Bull 250ml', quantity: 3, price: 9.90 },
      { name: 'Vodka Absolut 1L', quantity: 1, price: 89.90 },
      { name: 'Gelo 5kg', quantity: 1, price: 15.00 }
    ],
    total: 145.50,
    status: 'preparing',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
    paymentMethod: 'Pix'
  },
  {
    id: 'PEDIDO-1232',
    customer: 'João Santos',
    address: 'Rua Oscar Freire, 123, Jardins, São Paulo/SP',
    items: [
      { name: 'Heineken Long Neck', quantity: 6, price: 8.50 },
      { name: 'Doritos 300g', quantity: 1, price: 14.00 }
    ],
    total: 65.00,
    status: 'delivering',
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hora atrás
    paymentMethod: 'Dinheiro'
  },
  {
    id: 'PEDIDO-1231',
    customer: 'Ana Costa',
    address: 'Avenida Brasil, 800, Centro, Rio de Janeiro/RJ',
    items: [
      { name: 'Jack Daniel\'s 1L', quantity: 1, price: 112.30 }
    ],
    total: 112.30,
    status: 'delivered',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
    paymentMethod: 'Cartão de Débito'
  }
];

// Status label para tabela
const getStatusLabel = (status: Order['status']) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200">Pendente</Badge>;
    case 'preparing':
      return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">Preparando</Badge>;
    case 'delivering':
      return <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">Em entrega</Badge>;
    case 'delivered':
      return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Entregue</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">Cancelado</Badge>;
    default:
      return <Badge variant="outline">Desconhecido</Badge>;
  }
};

const AdminDashboard = () => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const { toast } = useToast();

  // Função para atualizar o status do pedido
  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus } 
          : order
      )
    );
    
    const statusTexts: Record<Order['status'], string> = {
      pending: "pendente de confirmação",
      preparing: "em preparação",
      delivering: "em entrega",
      delivered: "entregue",
      cancelled: "cancelado"
    };
    
    toast({
      title: "Status atualizado",
      description: `Pedido ${orderId} agora está ${statusTexts[newStatus]}`,
      duration: 3000,
    });
    
    setOrderDetailsOpen(false);
  };

  // Abre o diálogo de detalhes do pedido
  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setOrderDetailsOpen(true);
  };

  // Renderiza o diálogo de detalhes do pedido
  const renderOrderDetailsDialog = () => {
    if (!selectedOrder) return null;
    
    return (
      <Dialog open={orderDetailsOpen} onOpenChange={setOrderDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pedido {selectedOrder.id}</DialogTitle>
            <DialogDescription>
              Informações detalhadas do pedido
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Cliente</h3>
              <p className="text-sm">{selectedOrder.customer}</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Endereço de entrega</h3>
              <p className="text-sm">{selectedOrder.address}</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Forma de pagamento</h3>
              <p className="text-sm">{selectedOrder.paymentMethod}</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Itens do pedido</h3>
              <div className="space-y-2">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span>R$ {(item.quantity * item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between font-medium pt-2">
              <span>Total</span>
              <span>R$ {selectedOrder.total.toFixed(2)}</span>
            </div>
            
            <div className="pt-4">
              <h3 className="text-sm font-medium mb-2">Status do pedido</h3>
              <div className="flex items-center space-x-2">
                {getStatusLabel(selectedOrder.status)}
                <span className="text-sm text-gray-500">
                  {new Date(selectedOrder.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
            
            <div className="pt-2">
              <h3 className="text-sm font-medium mb-2">Atualizar status</h3>
              <div className="flex flex-wrap gap-2">
                {selectedOrder.status === 'pending' && (
                  <>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => updateOrderStatus(selectedOrder.id, 'preparing')}
                    >
                      <Check className="h-4 w-4 mr-1" /> Aceitar e preparar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      className="flex-1"
                      onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                    >
                      Recusar
                    </Button>
                  </>
                )}
                
                {selectedOrder.status === 'preparing' && (
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => updateOrderStatus(selectedOrder.id, 'delivering')}
                  >
                    <Truck className="h-4 w-4 mr-1" /> Enviar para entrega
                  </Button>
                )}
                
                {selectedOrder.status === 'delivering' && (
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                  >
                    <MapPin className="h-4 w-4 mr-1" /> Marcar como entregue
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-start">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Fechar
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen bg-element-gray-light">
      <AdminSidebar />
      
      {renderOrderDetailsDialog()}
      
      <div className="lg:pl-64 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-element-blue-dark mb-2">Dashboard</h1>
            <p className="text-element-gray-dark">Visão geral do seu negócio</p>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard 
              title="Vendas do Dia"
              value="R$ 1.258,90"
              change="12%"
              changeType="up"
              icon={<TrendingUp className="h-6 w-6 text-element-blue-dark" />}
            />
            <StatCard 
              title="Pedidos Pendentes"
              value={orders.filter(o => o.status === 'pending').length.toString()}
              change="5%"
              changeType="up"
              icon={<Package className="h-6 w-6 text-element-blue-dark" />}
            />
            <StatCard 
              title="Itens em Estoque"
              value="315"
              change="3%"
              changeType="down"
              icon={<Archive className="h-6 w-6 text-element-blue-dark" />}
            />
            <StatCard 
              title="Ticket Médio"
              value="R$ 52,45"
              change="8%"
              changeType="up"
              icon={<ShoppingCart className="h-6 w-6 text-element-blue-dark" />}
            />
          </div>
          
          {/* Pedidos pendentes */}
          <div className="element-card p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-element-blue-dark">Pedidos Recentes</h2>
              <Link to="/admin-pedidos" className="element-link text-sm">Ver todos</Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-element-gray-light">
                    <th className="py-3 text-left text-sm font-medium text-element-gray-dark/70">ID</th>
                    <th className="py-3 text-left text-sm font-medium text-element-gray-dark/70">Cliente</th>
                    <th className="py-3 text-left text-sm font-medium text-element-gray-dark/70">Valor</th>
                    <th className="py-3 text-left text-sm font-medium text-element-gray-dark/70">Status</th>
                    <th className="py-3 text-left text-sm font-medium text-element-gray-dark/70">Hora</th>
                    <th className="py-3 text-left text-sm font-medium text-element-gray-dark/70">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-element-gray-light">
                      <td className="py-3 text-sm">{order.id}</td>
                      <td className="py-3 text-sm">{order.customer}</td>
                      <td className="py-3 text-sm">R$ {order.total.toFixed(2)}</td>
                      <td className="py-3 text-sm">
                        {getStatusLabel(order.status)}
                      </td>
                      <td className="py-3 text-sm">
                        {new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openOrderDetails(order)}
                        >
                          Detalhes
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="element-card p-6">
              <h2 className="text-lg font-semibold text-element-blue-dark mb-6">Vendas dos Últimos 7 Dias</h2>
              <div className="h-64 flex items-center justify-center bg-element-gray-light/50 rounded-lg">
                {/* We would normally use recharts here */}
                <p className="text-element-gray-dark text-center">
                  Gráfico de Vendas<br />
                  (Visualização simplificada)
                </p>
              </div>
            </div>
            
            <div className="element-card p-6">
              <h2 className="text-lg font-semibold text-element-blue-dark mb-6">Produtos Mais Vendidos</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-element-gray-light rounded-md flex items-center justify-center mr-4">
                    <span className="font-bold text-element-blue-dark">1</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Skol 350ml</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-element-gray-dark/70">258 unidades</p>
                      <p className="text-sm font-medium">R$ 3,49/un</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-element-gray-light rounded-md flex items-center justify-center mr-4">
                    <span className="font-bold text-element-blue-dark">2</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Red Bull 250ml</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-element-gray-dark/70">147 unidades</p>
                      <p className="text-sm font-medium">R$ 9,90/un</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-element-gray-light rounded-md flex items-center justify-center mr-4">
                    <span className="font-bold text-element-blue-dark">3</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Essência Love66</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-element-gray-dark/70">98 unidades</p>
                      <p className="text-sm font-medium">R$ 29,90/un</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-element-gray-light rounded-md flex items-center justify-center mr-4">
                    <span className="font-bold text-element-blue-dark">4</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Vodka Smirnoff</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-element-gray-dark/70">76 unidades</p>
                      <p className="text-sm font-medium">R$ 42,90/un</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="element-card p-6">
              <h2 className="text-lg font-semibold text-element-blue-dark mb-6">Estoque Baixo</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-2 h-10 bg-red-500 rounded-full mr-4"></div>
                  <div className="flex-1">
                    <h4 className="font-medium">Jack Daniel's 1L</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-element-gray-dark/70">2 unidades restantes</p>
                      <Link to="/admin-estoque" className="text-sm text-element-blue-neon font-medium">
                        Repor
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-2 h-10 bg-red-500 rounded-full mr-4"></div>
                  <div className="flex-1">
                    <h4 className="font-medium">Carvão para Narguilé</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-element-gray-dark/70">3 unidades restantes</p>
                      <Link to="/admin-estoque" className="text-sm text-element-blue-neon font-medium">
                        Repor
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-2 h-10 bg-orange-500 rounded-full mr-4"></div>
                  <div className="flex-1">
                    <h4 className="font-medium">Monster Energy 473ml</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-element-gray-dark/70">8 unidades restantes</p>
                      <Link to="/admin-estoque" className="text-sm text-element-blue-neon font-medium">
                        Repor
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-2 h-10 bg-orange-500 rounded-full mr-4"></div>
                  <div className="flex-1">
                    <h4 className="font-medium">Heineken Long Neck</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-element-gray-dark/70">12 unidades restantes</p>
                      <Link to="/admin-estoque" className="text-sm text-element-blue-neon font-medium">
                        Repor
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
