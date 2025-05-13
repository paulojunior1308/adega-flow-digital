
import React from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
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

const AdminSales = () => {
  // Sample sales data - in a real app, this would come from an API
  const salesData = [
    { id: 1, date: '15/05/2025', customer: 'João Silva', items: 3, total: 'R$ 256,90', status: 'Concluída' },
    { id: 2, date: '15/05/2025', customer: 'Maria Oliveira', items: 5, total: 'R$ 432,50', status: 'Concluída' },
    { id: 3, date: '14/05/2025', customer: 'Carlos Santos', items: 2, total: 'R$ 145,00', status: 'Concluída' },
    { id: 4, date: '13/05/2025', customer: 'Ana Pereira', items: 7, total: 'R$ 749,80', status: 'Concluída' },
    { id: 5, date: '13/05/2025', customer: 'Ricardo Lopes', items: 1, total: 'R$ 89,90', status: 'Cancelada' }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold text-element-blue-dark mb-6">Controle de Vendas</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Vendas (Mês)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">R$ 12.450,75</p>
              <p className="text-xs text-green-500 mt-1">+15% em relação ao mês anterior</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">R$ 235,80</p>
              <p className="text-xs text-green-500 mt-1">+5% em relação ao mês anterior</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Vendas (Hoje)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">R$ 689,40</p>
              <p className="text-xs text-muted-foreground mt-1">3 vendas hoje</p>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">#{sale.id}</TableCell>
                    <TableCell>{sale.date}</TableCell>
                    <TableCell>{sale.customer}</TableCell>
                    <TableCell>{sale.items}</TableCell>
                    <TableCell>{sale.total}</TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        sale.status === 'Concluída' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {sale.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSales;
