
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
import { Button } from '@/components/ui/button';
import { Plus, Filter } from 'lucide-react';

const AdminAccounts = () => {
  // Sample accounts payable data - in a real app, this would come from an API
  const accountsData = [
    { id: 1, description: 'Fornecedor ABC - Bebidas', dueDate: '20/05/2025', value: 'R$ 3.500,00', status: 'Pendente', type: 'Fornecedor' },
    { id: 2, description: 'Aluguel do Estabelecimento', dueDate: '15/05/2025', value: 'R$ 5.200,00', status: 'Pendente', type: 'Fixo' },
    { id: 3, description: 'Conta de Energia', dueDate: '18/05/2025', value: 'R$ 890,30', status: 'Pendente', type: 'Fixo' },
    { id: 4, description: 'Fornecedor XYZ - Destilados', dueDate: '10/05/2025', value: 'R$ 2.780,50', status: 'Pago', type: 'Fornecedor' },
    { id: 5, description: 'Manutenção Refrigeração', dueDate: '08/05/2025', value: 'R$ 450,00', status: 'Pago', type: 'Serviço' }
  ];

  // Summary calculation
  const totalPending = accountsData
    .filter(account => account.status === 'Pendente')
    .reduce((total, account) => total + parseFloat(account.value.replace('R$ ', '').replace('.', '').replace(',', '.')), 0)
    .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const totalPaid = accountsData
    .filter(account => account.status === 'Pago')
    .reduce((total, account) => total + parseFloat(account.value.replace('R$ ', '').replace('.', '').replace(',', '.')), 0)
    .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-6 overflow-y-auto ml-0 lg:ml-64">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-element-blue-dark">Contas a Pagar</h1>
          <Button className="bg-element-blue-neon text-element-gray-dark hover:bg-element-blue-neon/80">
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total a Pagar (Pendentes)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-600">{totalPending}</p>
              <p className="text-xs text-muted-foreground mt-1">Próximos 30 dias</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Pago (Mês Atual)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{totalPaid}</p>
              <p className="text-xs text-muted-foreground mt-1">Maio 2025</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Vencendo Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">R$ 0,00</p>
              <p className="text-xs text-muted-foreground mt-1">Nenhuma conta vence hoje</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Contas a Pagar</CardTitle>
              <CardDescription>Gerencie suas contas e pagamentos</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountsData.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">#{account.id}</TableCell>
                    <TableCell>{account.description}</TableCell>
                    <TableCell>{account.dueDate}</TableCell>
                    <TableCell>{account.value}</TableCell>
                    <TableCell>{account.type}</TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        account.status === 'Pendente' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {account.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {account.status === 'Pendente' && (
                          <Button variant="outline" size="sm">Pagar</Button>
                        )}
                        <Button variant="outline" size="sm">Detalhes</Button>
                      </div>
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

export default AdminAccounts;
