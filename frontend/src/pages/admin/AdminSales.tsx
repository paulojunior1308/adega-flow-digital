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
import api from '@/lib/axios';

const AdminSales = () => {
  const [salesData, setSalesData] = React.useState([]);
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
        tipo: 'Online'
      }));
      const pdv = pdvRes.data.map(sale => ({
        id: sale.id,
        date: new Date(sale.createdAt),
        customer: sale.user?.name ?? '-',
        items: sale.items?.length ?? 0,
        total: sale.total ? Number(sale.total) : 0,
        status: 'Concluída',
        tipo: 'PDV'
      }));
      // Unifica e ordena por data decrescente
      const all = [...online, ...pdv].sort((a, b) => b.date - a.date);
      setSalesData(all);
    });
  }, []);

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

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminLayout>
      <div className="flex-1 p-6 overflow-y-auto ml-0 lg:ml-64">
        <h1 className="text-2xl font-bold text-element-blue-dark mb-6">Controle de Vendas</h1>

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
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.map((sale) => (
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
    </div>
  );
};

export default AdminSales;
