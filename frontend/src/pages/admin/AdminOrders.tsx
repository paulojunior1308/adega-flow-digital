import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { 
  Check,
  Package,
  Truck,
  Clock,
  MapPin,
  Calendar,
  Search,
  FileText,
  Eye,
  Edit,
  Trash
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import api from '@/lib/axios';

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
  pixPaymentStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  contactPhone?: string;
  deliveryNotes?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  discount?: number;
  deliveryFee?: number;
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
    paymentMethod: 'Cartão de Crédito',
    contactPhone: '(11) 98765-4321'
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
    paymentMethod: 'Pix',
    contactPhone: '(11) 91234-5678',
    deliveryNotes: 'Entregar na portaria'
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
  },
  {
    id: 'PEDIDO-1230',
    customer: 'Paulo Oliveira',
    address: 'Rua das Flores, 45, Botafogo, Rio de Janeiro/RJ',
    items: [
      { name: 'Whisky Johnnie Walker Black Label', quantity: 1, price: 189.90 },
      { name: 'Coca-Cola 2L', quantity: 2, price: 12.00 }
    ],
    total: 213.90,
    status: 'cancelled',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 horas atrás
    paymentMethod: 'Pix'
  },
  {
    id: 'PEDIDO-1229',
    customer: 'Fernanda Lima',
    address: 'Avenida Atlântica, 2000, Copacabana, Rio de Janeiro/RJ',
    items: [
      { name: 'Cerveja Corona 330ml', quantity: 12, price: 8.90 },
      { name: 'Amendoim 500g', quantity: 1, price: 15.50 }
    ],
    total: 122.30,
    status: 'delivered',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrás
    paymentMethod: 'Cartão de Crédito'
  },
  {
    id: 'PEDIDO-1228',
    customer: 'Roberto Santos',
    address: 'Rua Alameda Santos, 700, Jardins, São Paulo/SP',
    items: [
      { name: 'Vodka Grey Goose 750ml', quantity: 1, price: 249.90 },
      { name: 'Red Bull 250ml', quantity: 4, price: 9.90 },
      { name: 'Gelo 2kg', quantity: 1, price: 8.00 }
    ],
    total: 297.50,
    status: 'delivered',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25), // 25 horas atrás
    paymentMethod: 'Pix',
    deliveryNotes: 'Apartamento 1202, Bloco B'
  }
];

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const itemsPerPage = 5;
  
  // Buscar pedidos reais do backend
  React.useEffect(() => {
    api.get('/admin/orders').then(res => {
      const mapped = res.data.map(order => ({
        id: order.id,
        customer: order.user?.name ?? '-',
        address: order.address
          ? `${order.address.title} - ${order.address.street}, ${order.address.number}${order.address.complement ? ' ' + order.address.complement : ''}, ${order.address.neighborhood}, ${order.address.city} - ${order.address.state}, CEP: ${order.address.zipcode}`
          : '-',
        items: (order.items ?? []).map(item => ({
          name: item.product?.name ?? '-',
          quantity: item.quantity,
          price: item.price
        })),
        total: order.total,
        status: (order.status ?? 'pending').toLowerCase(),
        timestamp: order.createdAt ?? order.updatedAt ?? null,
        paymentMethod: order.paymentMethod,
        pixPaymentStatus: order.pixPaymentStatus,
        contactPhone: order.user?.phone ?? '',
        deliveryNotes: order.instructions ?? '',
        discount: order.discount,
        deliveryFee: order.deliveryFee
      }));
      setOrders(mapped);
    });
  }, []);

  // Filtragem baseada na aba selecionada e termo de busca
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      order.customer.toLowerCase().includes(searchTerm.toLowerCase());
      
    if (currentTab === 'all') return matchesSearch;
    return order.status === currentTab && matchesSearch;
  });
  
  // Paginação
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
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

  // Atualizar status do pedido via API
  const updateOrderStatus = async (order: Order, newStatus: Order['status']) => {
    // Só depois atualiza o status
    await api.patch(`/admin/orders/${order.id}/status`, { status: newStatus });
    setOrders((prev) => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
    toast({ title: 'Status atualizado!' });
  };

  // Atualizar localização do entregador via API
  const updateOrderLocation = async (orderId: string, lat: number, lng: number) => {
    await api.patch(`/admin/orders/${orderId}/location`, { deliveryLat: lat, deliveryLng: lng });
    setOrders((prev) => prev.map(o => o.id === orderId ? { ...o, deliveryLat: lat, deliveryLng: lng } : o));
    toast({ title: 'Localização do entregador atualizada!' });
  };

  // Abre o diálogo de detalhes do pedido
  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setOrderDetailsOpen(true);
  };
  
  // Formatar data para exibição
  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Formatar hora para exibição
  const formatTime = (date: Date | string | undefined | null) => {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Renderiza o diálogo de detalhes do pedido
  const renderOrderDetailsDialog = () => {
    if (!selectedOrder) return null;
    
    return (
      <Dialog open={orderDetailsOpen} onOpenChange={setOrderDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5" /> Pedido {selectedOrder.id}
            </DialogTitle>
            <DialogDescription>
              Feito em {formatDate(selectedOrder.timestamp)} às {formatTime(selectedOrder.timestamp)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <p><strong>Nome:</strong> {selectedOrder.customer}</p>
                  {selectedOrder.contactPhone && (
                    <p><strong>Telefone:</strong> {selectedOrder.contactPhone}</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Endereço de entrega</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{selectedOrder.address}</p>
                  {selectedOrder.deliveryNotes && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      <strong>Observações:</strong> {selectedOrder.deliveryNotes}
                    </p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <p><strong>Método:</strong> {selectedOrder.paymentMethod}</p>
                  <p><strong>Total:</strong> R$ {selectedOrder.total.toFixed(2)}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Status do pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 mb-4">
                    {getStatusLabel(selectedOrder.status)}
                    <span className="text-sm text-gray-500">
                      Atualizado: {formatTime(selectedOrder.timestamp)}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {selectedOrder.status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => {
                            openWhatsappMsg(selectedOrder);
                            updateOrderStatus(selectedOrder, 'preparing');
                          }}
                        >
                          <Check className="h-4 w-4 mr-1" /> Aceitar e preparar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          className="flex-1"
                          onClick={() => updateOrderStatus(selectedOrder, 'cancelled')}
                        >
                          Recusar
                        </Button>
                      </>
                    )}
                    
                    {selectedOrder.status === 'preparing' && (
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => updateOrderStatus(selectedOrder, 'delivering')}
                      >
                        <Truck className="h-4 w-4 mr-1" /> Enviar para entrega
                      </Button>
                    )}
                    
                    {selectedOrder.status === 'delivering' && (
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => updateOrderStatus(selectedOrder, 'delivered')}
                      >
                        <MapPin className="h-4 w-4 mr-1" /> Marcar como entregue
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Itens do pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between py-1 border-b last:border-0">
                        <div>
                          <span className="font-medium">{item.quantity}x</span> {item.name}
                        </div>
                        <div className="font-medium">
                          R$ {(item.quantity * item.price).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center mt-4 pt-2 border-t font-semibold">
                    <span>Total</span>
                    <span className="text-lg">R$ {selectedOrder.total.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Cronograma</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="mr-2 mt-0.5">
                        <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">Pedido recebido</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(selectedOrder.timestamp)} às {formatTime(selectedOrder.timestamp)}
                        </p>
                      </div>
                    </div>
                    
                    {(selectedOrder.status === 'preparing' || 
                      selectedOrder.status === 'delivering' || 
                      selectedOrder.status === 'delivered') && (
                      <div className="flex items-start">
                        <div className="mr-2 mt-0.5">
                          <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <Package className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">Pedido em preparação</p>
                          <p className="text-sm text-muted-foreground">
                            Estimativa: 15-20 minutos
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {(selectedOrder.status === 'delivering' || 
                      selectedOrder.status === 'delivered') && (
                      <div className="flex items-start">
                        <div className="mr-2 mt-0.5">
                          <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center">
                            <Truck className="h-4 w-4 text-orange-600" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">Saiu para entrega</p>
                          <p className="text-sm text-muted-foreground">
                            Estimativa: 30-45 minutos
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedOrder.status === 'delivered' && (
                      <div className="flex items-start">
                        <div className="mr-2 mt-0.5">
                          <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">Pedido entregue</p>
                          <p className="text-sm text-muted-foreground">
                            Entrega concluída com sucesso
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedOrder.status === 'cancelled' && (
                      <div className="flex items-start">
                        <div className="mr-2 mt-0.5">
                          <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
                            <Trash className="h-4 w-4 text-red-600" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">Pedido cancelado</p>
                          <p className="text-sm text-muted-foreground">
                            O pedido foi cancelado
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {selectedOrder.paymentMethod && selectedOrder.paymentMethod.toLowerCase().includes('pix') && (
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Pagamento PIX</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <span>Status do pagamento:</span>
                  {selectedOrder.pixPaymentStatus === 'APPROVED' && <Badge className="bg-green-100 text-green-700">Aprovado</Badge>}
                  {selectedOrder.pixPaymentStatus === 'REJECTED' && <Badge className="bg-red-100 text-red-700">Rejeitado</Badge>}
                  {(!selectedOrder.pixPaymentStatus || selectedOrder.pixPaymentStatus === 'PENDING') && <Badge className="bg-yellow-100 text-yellow-700">Pendente</Badge>}
                </div>
                {selectedOrder.pixPaymentStatus === 'PENDING' && (
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" className="bg-green-600 text-white" onClick={async () => {
                      await api.patch(`/admin/orders/${selectedOrder.id}/pix-status`, { pixPaymentStatus: 'APPROVED' });
                      setOrders(orders => orders.map(o => o.id === selectedOrder.id ? { ...o, pixPaymentStatus: 'APPROVED' } : o));
                      setSelectedOrder({ ...selectedOrder, pixPaymentStatus: 'APPROVED' });
                      toast({ title: 'Pagamento aprovado!' });
                    }}>Aprovar</Button>
                    <Button size="sm" variant="destructive" onClick={async () => {
                      await api.patch(`/admin/orders/${selectedOrder.id}/pix-status`, { pixPaymentStatus: 'REJECTED' });
                      setOrders(orders => orders.map(o => o.id === selectedOrder.id ? { ...o, pixPaymentStatus: 'REJECTED' } : o));
                      setSelectedOrder({ ...selectedOrder, pixPaymentStatus: 'REJECTED' });
                      toast({ title: 'Pagamento rejeitado!' });
                    }}>Rejeitar</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          <DialogFooter className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              ID: {selectedOrder.id}
            </div>
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

  function openWhatsappMsg(order: Order) {
    const numeroWhatsApp = order.contactPhone?.replace(/\D/g, '') || '';
    let itensMsg = order.items.map(item => `➡ ${item.quantity}x ${item.name} (R$ ${(item.price * item.quantity).toFixed(2)})`).join('\n');
    let desconto = order.discount ? `Desconto: R$ ${order.discount.toFixed(2)}\n` : '';
    let entrega = order.deliveryFee ? `Entrega: R$ ${order.deliveryFee.toFixed(2)}\n` : '';
    let obs = order.deliveryNotes ? `\nObs: ${order.deliveryNotes}` : '';
    const mensagem =
      `Pedido Element Adega aceito!\n\n` +
      `Acompanhe seu pedido pelo site.\n\n` +
      `Pedido: ${order.id} (${formatDate(order.timestamp)} ${formatTime(order.timestamp)})\n` +
      `Tipo: Delivery\n` +
      `------------------------------\n` +
      `NOME: ${order.customer}\n` +
      `Fone: ${order.contactPhone || '-'}\n` +
      `Endereço: ${order.address}\n` +
      `------------------------------\n` +
      `${itensMsg}\n` +
      `------------------------------\n` +
      `Itens: R$ ${(order.items.reduce((sum, i) => sum + i.price * i.quantity, 0)).toFixed(2)}\n` +
      `${desconto}${entrega}` +
      `\nTOTAL: R$ ${order.total.toFixed(2)}\n` +
      `------------------------------\n` +
      `Pagamento: ${order.paymentMethod}\n` +
      `${obs}`;
    if (numeroWhatsApp.length >= 10) {
      const link = `https://wa.me/55${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
      console.log('Número WhatsApp:', numeroWhatsApp);
      console.log('Link WhatsApp:', link);
      window.open(link, '_blank');
    } else {
      console.log('Número de WhatsApp inválido:', numeroWhatsApp);
    }
  }

  return (
    <div className="min-h-screen bg-element-gray-light">
      <AdminSidebar />
      
      {renderOrderDetailsDialog()}
      
      <div className="lg:pl-64 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-element-blue-dark mb-1">Gerenciar Pedidos</h1>
                <p className="text-element-gray-dark">Visualize e gerencie todos os pedidos realizados</p>
              </div>
              <Button 
                className="mt-4 md:mt-0" 
                onClick={() => navigate('/admin-dashboard')}
              >
                Dashboard
              </Button>
            </div>
            
            {/* Search and filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="col-span-1 md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input 
                    placeholder="Buscar por ID ou cliente..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="col-span-1">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="date" className="min-w-fit">Data:</Label>
                  <Input
                    type="date"
                    id="date"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab} className="mb-6">
            <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-2 bg-background">
              <TabsTrigger value="all" className="text-sm">Todos</TabsTrigger>
              <TabsTrigger value="pending" className="text-sm">Pendentes</TabsTrigger>
              <TabsTrigger value="preparing" className="text-sm">Preparando</TabsTrigger>
              <TabsTrigger value="delivering" className="text-sm">Em entrega</TabsTrigger>
              <TabsTrigger value="delivered" className="text-sm">Entregues</TabsTrigger>
              <TabsTrigger value="cancelled" className="text-sm">Cancelados</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Orders table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table>
              <TableCaption>
                {filteredOrders.length === 0 
                  ? "Nenhum pedido encontrado" 
                  : `Total de ${filteredOrders.length} pedidos`}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{formatDate(order.timestamp)}</span>
                        <span className="text-xs text-gray-500">{formatTime(order.timestamp)}</span>
                      </div>
                    </TableCell>
                    <TableCell>R$ {order.total.toFixed(2)}</TableCell>
                    <TableCell>{getStatusLabel(order.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {order.status === 'pending' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                openWhatsappMsg(order);
                                updateOrderStatus(order, 'preparing');
                              }}
                            >
                              <Check className="h-4 w-4" />
                              <span className="sr-only md:not-sr-only md:ml-2">Aceitar</span>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => updateOrderStatus(order, 'cancelled')}
                            >
                              <Trash className="h-4 w-4" />
                              <span className="sr-only md:not-sr-only md:ml-2">Recusar</span>
                            </Button>
                          </>
                        )}
                        {order.status === 'preparing' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => updateOrderStatus(order, 'delivering')}
                          >
                            <Truck className="h-4 w-4" />
                            <span className="sr-only md:not-sr-only md:ml-2">Saiu para entrega</span>
                          </Button>
                        )}
                        {order.status === 'delivering' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => updateOrderStatus(order, 'delivered')}
                          >
                            <MapPin className="h-4 w-4" />
                            <span className="sr-only md:not-sr-only md:ml-2">Marcar como entregue</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openOrderDetails(order)}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only md:not-sr-only md:ml-2">Detalhes</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink 
                      isActive={currentPage === page}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
