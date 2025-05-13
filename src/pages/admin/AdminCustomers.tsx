
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
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

const AdminCustomers = () => {
  // Sample customer data - in a real app, this would come from an API
  const customersData = [
    { id: 1, name: 'João Silva', email: 'joao.silva@example.com', phone: '(11) 99123-4567', orders: 5, totalSpent: 'R$ 1.250,90' },
    { id: 2, name: 'Maria Oliveira', email: 'maria.oliveira@example.com', phone: '(11) 98765-4321', orders: 8, totalSpent: 'R$ 3.432,50' },
    { id: 3, name: 'Carlos Santos', email: 'carlos.santos@example.com', phone: '(11) 97654-3210', orders: 2, totalSpent: 'R$ 645,00' },
    { id: 4, name: 'Ana Pereira', email: 'ana.pereira@example.com', phone: '(11) 96543-2109', orders: 12, totalSpent: 'R$ 4.749,80' },
    { id: 5, name: 'Ricardo Lopes', email: 'ricardo.lopes@example.com', phone: '(11) 95432-1098', orders: 1, totalSpent: 'R$ 189,90' }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-element-blue-dark">Lista de Clientes</h1>
          <Button className="bg-element-blue-neon text-element-gray-dark hover:bg-element-blue-neon/80">
            + Novo Cliente
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buscar Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input placeholder="Digite o nome, e-mail ou telefone" />
              </div>
              <Button className="bg-element-blue-dark">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clientes Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Pedidos</TableHead>
                  <TableHead>Total Gasto</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customersData.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">#{customer.id}</TableCell>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.orders}</TableCell>
                    <TableCell>{customer.totalSpent}</TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="outline" size="sm">Detalhes</Button>
                      <Button variant="outline" size="sm">Editar</Button>
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

export default AdminCustomers;
