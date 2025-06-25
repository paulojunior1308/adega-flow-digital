import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, FileText, Calendar, User, CreditCard, FileDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from '@/lib/axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Interface para os dados de venda
interface SaleData {
  id: string;
  date: Date;
  customer: string;
  items: number;
  total: number;
  status: string;
  tipo: string;
  originalData?: any; // Dados originais da API
}

const AdminSales = () => {
  const [salesData, setSalesData] = React.useState<SaleData[]>([]);
  const [selectedSale, setSelectedSale] = React.useState<SaleData | null>(null);
  const [saleDetailsOpen, setSaleDetailsOpen] = React.useState(false);
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  React.useEffect(() => {
    Promise.all([
      api.get('/admin/orders'),
      api.get('/admin/pdv-sales')
    ]).then(([ordersRes, pdvRes]) => {
      const online = ordersRes.data.map(order => ({
        id: order.id,
        date: new Date(order.createdAt),
        customer: order.user?.name ?? '-',
        items: order.items?.length ?? 0,
        total: order.total ? Number(order.total) : 0,
        status: order.status === 'DELIVERED' ? 'Concluída' : (order.status === 'CANCELLED' ? 'Cancelada' : 'Pendente'),
        tipo: 'Online',
        originalData: order
      }));
      const pdv = pdvRes.data.map(sale => ({
        id: sale.id,
        date: new Date(sale.createdAt),
        customer: sale.user?.name ?? '-',
        items: sale.items?.length ?? 0,
        total: sale.total ? Number(sale.total) : 0,
        status: 'Concluída',
        tipo: 'PDV',
        originalData: sale
      }));
      // Unifica e ordena por data decrescente
      const all = [...online, ...pdv].sort((a, b) => b.date - a.date);
      setSalesData(all);
    });
  }, []);

  // Função para abrir detalhes da venda
  const openSaleDetails = (sale: SaleData) => {
    setSelectedSale(sale);
    setSaleDetailsOpen(true);
  };

  // Função para formatar data
  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  };

  // Função para formatar hora
  const formatTime = (date: Date | string | undefined | null) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Função para formatar endereço
  const formatAddress = (address: any) => {
    if (!address) return '-';
    
    // Se for uma string, retorna como está
    if (typeof address === 'string') return address;
    
    // Se for um objeto, formata os campos
    if (typeof address === 'object') {
      const parts = [
        address.title,
        address.street,
        address.number,
        address.complement,
        address.neighborhood,
        address.city,
        address.state,
        address.zipcode
      ].filter(Boolean);
      
      return parts.join(', ');
    }
    
    return '-';
  };

  // Renderiza o diálogo de detalhes da venda
  const renderSaleDetailsDialog = () => {
    if (!selectedSale) return null;
    
    const originalData = selectedSale.originalData;
    const items = originalData?.items || [];
    
    return (
      <Dialog open={saleDetailsOpen} onOpenChange={setSaleDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5" /> 
              {selectedSale.tipo === 'PDV' ? 'Venda PDV' : 'Pedido Online'} #{selectedSale.id}
            </DialogTitle>
            <DialogDescription>
              Realizada em {formatDate(selectedSale.date)} às {formatTime(selectedSale.date)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-4 w-4" /> Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p><strong>Nome:</strong> {selectedSale.customer}</p>
                  {originalData?.user?.email && (
                    <p><strong>Email:</strong> {originalData.user.email}</p>
                  )}
                  {originalData?.user?.phone && (
                    <p><strong>Telefone:</strong> {originalData.user.phone}</p>
                  )}
                </CardContent>
              </Card>
              
              {selectedSale.tipo === 'Online' && originalData?.address && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Endereço de entrega</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{formatAddress(originalData.address)}</p>
                    {originalData.instructions && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        <strong>Observações:</strong> {originalData.instructions}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p><strong>Método:</strong> {originalData?.paymentMethod?.name || (typeof originalData?.paymentMethod === 'string' ? originalData.paymentMethod : '-')}</p>
                  <p><strong>Total:</strong> R$ {selectedSale.total.toFixed(2)}</p>
                  {originalData?.discount && (
                    <p><strong>Desconto:</strong> R$ {originalData.discount.toFixed(2)}</p>
                  )}
                  {originalData?.deliveryFee && (
                    <p><strong>Taxa de entrega:</strong> R$ {originalData.deliveryFee.toFixed(2)}</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 mb-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      selectedSale.status === 'Concluída' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedSale.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      Atualizado: {formatTime(selectedSale.date)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Itens da venda</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between py-1 border-b last:border-0">
                        <div>
                          <span className="font-medium">{item.quantity}x</span> {item.product?.name || 'Produto não encontrado'}
                          {item.isDoseItem && (
                            <span className="text-xs text-gray-500 ml-1">(Dose)</span>
                          )}
                          {item.isFractioned && !item.isDoseItem && (
                            <span className="text-xs text-gray-500 ml-1">(Fracionado)</span>
                          )}
                        </div>
                        <div className="font-medium">
                          R$ {(item.quantity * item.price).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center mt-4 pt-2 border-t font-semibold">
                    <span>Total</span>
                    <span className="text-lg">R$ {selectedSale.total.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Informações adicionais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>Tipo:</strong> {selectedSale.tipo}</p>
                    <p><strong>Quantidade de itens:</strong> {selectedSale.items}</p>
                    {originalData?.createdAt && (
                      <p><strong>Data de criação:</strong> {formatDate(originalData.createdAt)} às {formatTime(originalData.createdAt)}</p>
                    )}
                    {originalData?.updatedAt && (
                      <p><strong>Última atualização:</strong> {formatDate(originalData.updatedAt)} às {formatTime(originalData.updatedAt)}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Cálculos reais
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const today = now.getDate();

  // Filtros
  const salesMonth = salesData.filter(sale => sale.date.getMonth() === thisMonth && sale.date.getFullYear() === thisYear && sale.status === 'Concluída');
  const salesLastMonth = salesData.filter(sale => {
    const d = sale.date;
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear && sale.status === 'Concluída';
  });
  const salesToday = salesData.filter(sale => sale.date.getDate() === today && sale.date.getMonth() === thisMonth && sale.date.getFullYear() === thisYear && sale.status === 'Concluída');
  const salesYesterday = salesData.filter(sale => {
    const d = sale.date;
    const yesterday = new Date(now);
    yesterday.setDate(today - 1);
    return d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear() && sale.status === 'Concluída';
  });

  // Totais
  const totalMonth = salesMonth.reduce((sum, sale) => sum + sale.total, 0);
  const totalLastMonth = salesLastMonth.reduce((sum, sale) => sum + sale.total, 0);
  const totalToday = salesToday.reduce((sum, sale) => sum + sale.total, 0);
  const totalYesterday = salesYesterday.reduce((sum, sale) => sum + sale.total, 0);

  // Ticket médio
  const ticketMonth = salesMonth.length ? totalMonth / salesMonth.length : 0;
  const ticketLastMonth = salesLastMonth.length ? totalLastMonth / salesLastMonth.length : 0;

  // Porcentagens
  const percentMonth = totalLastMonth ? ((totalMonth - totalLastMonth) / totalLastMonth) * 100 : 0;
  const percentTicket = ticketLastMonth ? ((ticketMonth - ticketLastMonth) / ticketLastMonth) * 100 : 0;
  const percentToday = totalYesterday ? ((totalToday - totalYesterday) / totalYesterday) * 100 : 0;

  // Formatação
  const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatPercent = (value) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

  // Função para filtrar vendas por data
  const filteredSalesData = React.useMemo(() => {
    if (!startDate && !endDate) return salesData;
    return salesData.filter((sale) => {
      const entryDate = new Date(sale.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (start && entryDate < start) return false;
      if (end) {
        const endOfDay = new Date(end);
        endOfDay.setHours(23,59,59,999);
        if (entryDate > endOfDay) return false;
      }
      return true;
    });
  }, [salesData, startDate, endDate]);

  // Função para exportar XLSX
  const exportToXLSX = () => {
    const data = filteredSalesData.map(sale => ({
      ID: sale.id,
      Data: sale.date.toLocaleString('pt-BR'),
      Cliente: sale.customer,
      Itens: sale.items,
      Produtos: Array.isArray(sale.originalData?.items)
        ? sale.originalData.items.map(
            (item: any) => `${item.quantity}x ${item.product?.name || 'Produto'}`
          ).join('; ')
        : '',
      Total: sale.total,
      Status: sale.status,
      Tipo: sale.tipo,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendas');
    XLSX.writeFile(workbook, 'relatorio_vendas.xlsx');
  };

  // Função para exportar PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Relatório de Vendas', 14, 16);
    doc.setFontSize(10);
    const tableData = filteredSalesData.map(sale => [
      sale.id,
      sale.date.toLocaleString('pt-BR'),
      sale.customer,
      sale.items,
      Array.isArray(sale.originalData?.items)
        ? sale.originalData.items.map(
            (item: any) => `${item.quantity}x ${item.product?.name || 'Produto'}`
          ).join('; ')
        : '',
      sale.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      sale.status,
      sale.tipo
    ]);
    autoTable(doc, {
      head: [['ID', 'Data', 'Cliente', 'Itens', 'Produtos', 'Total', 'Status', 'Tipo']],
      body: tableData,
      startY: 22,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    doc.save('relatorio_vendas.pdf');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminLayout>
      <div className="flex-1 p-6 overflow-y-auto ml-0 lg:ml-64">
        <h1 className="text-2xl font-bold text-element-blue-dark mb-6 flex items-center justify-between">
          Controle de Vendas
          <div className="mb-4">
            <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <label className="text-sm font-medium mr-1">Data Inicial</label>
                <input
                  type="date"
                  className="border rounded px-2 py-1 text-sm focus:outline-none"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  max={endDate || undefined}
                  placeholder="dd/mm/aaaa"
                  style={{ minWidth: 120 }}
                />
              </div>
              <div className="flex items-center gap-2 ml-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <label className="text-sm font-medium mr-1">Data Final</label>
                <input
                  type="date"
                  className="border rounded px-2 py-1 text-sm focus:outline-none"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  min={startDate || undefined}
                  placeholder="dd/mm/aaaa"
                  style={{ minWidth: 120 }}
                />
              </div>
              {(startDate || endDate) && (
                <Button variant="ghost" size="sm" onClick={() => { setStartDate(''); setEndDate(''); }}>
                  Limpar Filtro
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={exportToXLSX}
                  className="flex items-center gap-1 bg-green-700 hover:bg-green-800 text-white px-3 py-1 rounded text-sm font-medium"
                >
                  <FileDown className="h-4 w-4" /> Exportar XLSX
                </button>
                <button
                  onClick={exportToPDF}
                  className="flex items-center gap-1 bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded text-sm font-medium"
                >
                  <FileText className="h-4 w-4" /> Exportar PDF
                </button>
              </div>
            </div>
          </div>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Vendas (Mês)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totalMonth)}</p>
              <p className={`text-xs mt-1 ${percentMonth >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatPercent(percentMonth)} em relação ao mês anterior</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(ticketMonth)}</p>
              <p className={`text-xs mt-1 ${percentTicket >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatPercent(percentTicket)} em relação ao mês anterior</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Vendas (Hoje)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totalToday)}</p>
              <p className={`text-xs mt-1 ${percentToday >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatPercent(percentToday)} em relação a ontem</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Últimas Vendas</CardTitle>
            <CardDescription>Lista das vendas mais recentes</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSalesData.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">#{sale.id}</TableCell>
                    <TableCell>{sale.date.toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{sale.customer}</TableCell>
                    <TableCell>{sale.items}</TableCell>
                    <TableCell>{sale.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        sale.status === 'Concluída' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {sale.status}
                      </span>
                    </TableCell>
                    <TableCell>{sale.tipo}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openSaleDetails(sale)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only md:not-sr-only md:ml-2">Detalhes</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      {renderSaleDetailsDialog()}
    </AdminLayout>
    </div>
  );
};

export default AdminSales;
