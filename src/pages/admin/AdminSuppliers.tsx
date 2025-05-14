
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';

const AdminSuppliers = () => {
  // Sample suppliers data - in a real app, this would come from an API
  const suppliersData = [
    { id: 1, name: 'Distribuidora ABC', contact: 'Roberto Almeida', email: 'contato@abcdist.com', phone: '(11) 5555-1234', category: 'Bebidas', lastDelivery: '10/05/2025' },
    { id: 2, name: 'Importadora XYZ', contact: 'Fernanda Costa', email: 'comercial@xyzimport.com', phone: '(11) 5555-5678', category: 'Destilados', lastDelivery: '08/05/2025' },
    { id: 3, name: 'Vinícola Bons Vinhos', contact: 'Marcelo Santos', email: 'vendas@bonsvinhos.com', phone: '(11) 5555-9012', category: 'Vinhos', lastDelivery: '12/05/2025' },
    { id: 4, name: 'Tabacos Premium', contact: 'Paulo Oliveira', email: 'paulo@tabacospremium.com', phone: '(11) 5555-3456', category: 'Tabacaria', lastDelivery: '05/05/2025' },
    { id: 5, name: 'Artigos para Narguile', contact: 'Carla Mendes', email: 'carla@narguiles.com', phone: '(11) 5555-7890', category: 'Narguile', lastDelivery: '11/05/2025' }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-6 overflow-y-auto ml-0 lg:ml-64">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-element-blue-dark">Cadastro de Fornecedores</h1>
          <Button className="bg-element-blue-neon text-element-gray-dark hover:bg-element-blue-neon/80">
            <Plus className="h-4 w-4 mr-2" />
            Novo Fornecedor
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buscar Fornecedor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input placeholder="Digite o nome, contato ou categoria" />
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
            <CardTitle>Fornecedores Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Última Entrega</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliersData.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">#{supplier.id}</TableCell>
                    <TableCell>{supplier.name}</TableCell>
                    <TableCell>{supplier.contact}</TableCell>
                    <TableCell>{supplier.email}</TableCell>
                    <TableCell>{supplier.phone}</TableCell>
                    <TableCell>{supplier.category}</TableCell>
                    <TableCell>{supplier.lastDelivery}</TableCell>
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

export default AdminSuppliers;
