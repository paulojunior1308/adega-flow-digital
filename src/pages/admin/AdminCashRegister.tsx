
import React, { useState } from 'react';
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
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowDownUp, DollarSign, ArrowDown, ArrowUp } from 'lucide-react';

const AdminCashRegister = () => {
  const [cashStatus, setCashStatus] = useState<'open' | 'closed'>('open');

  // Sample cash register data - in a real app, this would come from an API
  const transactionsData = [
    { id: 1, type: 'entrada', description: 'Venda #1045 - Cliente: João Silva', paymentMethod: 'Cartão de Crédito', time: '15:30', value: 'R$ 156,90' },
    { id: 2, type: 'entrada', description: 'Venda #1046 - Cliente: Maria Oliveira', paymentMethod: 'Dinheiro', time: '15:45', value: 'R$ 82,50' },
    { id: 3, type: 'saída', description: 'Pagamento Fornecedor ABC', paymentMethod: 'Dinheiro', time: '16:20', value: 'R$ 350,00' },
    { id: 4, type: 'entrada', description: 'Venda #1047 - Cliente: Carlos Santos', paymentMethod: 'Pix', time: '16:35', value: 'R$ 215,00' },
    { id: 5, type: 'saída', description: 'Retirada para Troco', paymentMethod: 'Dinheiro', time: '17:00', value: 'R$ 100,00' }
  ];

  // Calculate summary values
  const initialBalance = 500;
  const sales = transactionsData
    .filter(transaction => transaction.type === 'entrada')
    .reduce((total, transaction) => total + parseFloat(transaction.value.replace('R$ ', '').replace('.', '').replace(',', '.')), 0);
  
  const expenses = transactionsData
    .filter(transaction => transaction.type === 'saída')
    .reduce((total, transaction) => total + parseFloat(transaction.value.replace('R$ ', '').replace('.', '').replace(',', '.')), 0);
  
  const currentBalance = initialBalance + sales - expenses;

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold text-element-blue-dark mb-6">Controle de Caixa</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Saldo Inicial</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{initialBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Entradas</CardTitle>
            </CardHeader>
            <CardContent className="text-green-600">
              <div className="flex items-center">
                <ArrowUp className="mr-2 h-4 w-4" />
                <p className="text-2xl font-bold">{sales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Saídas</CardTitle>
            </CardHeader>
            <CardContent className="text-red-600">
              <div className="flex items-center">
                <ArrowDown className="mr-2 h-4 w-4" />
                <p className="text-2xl font-bold">{expenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{currentBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Movimentações do Caixa</CardTitle>
                <CardDescription>Hoje, 15 de Maio de 2025</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionsData.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.time}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>{transaction.paymentMethod}</TableCell>
                        <TableCell>{transaction.value}</TableCell>
                        <TableCell>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                            transaction.type === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type === 'entrada' ? 'Entrada' : 'Saída'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Ações do Caixa</CardTitle>
                <CardDescription>
                  Status: <span className={cashStatus === 'open' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                    {cashStatus === 'open' ? 'Aberto' : 'Fechado'}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="add">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="add">Entrada</TabsTrigger>
                    <TabsTrigger value="remove">Saída</TabsTrigger>
                  </TabsList>
                  <TabsContent value="add" className="space-y-4 mt-4">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <ArrowUp className="mr-2 h-4 w-4" />
                      Nova Entrada
                    </Button>
                  </TabsContent>
                  <TabsContent value="remove" className="space-y-4 mt-4">
                    <Button className="w-full bg-red-600 hover:bg-red-700">
                      <ArrowDown className="mr-2 h-4 w-4" />
                      Nova Saída
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button variant="outline" className="w-full" disabled={cashStatus === 'closed'}>
                  <ArrowDownUp className="mr-2 h-4 w-4" />
                  Sangria de Caixa
                </Button>
                <Button variant="outline" className="w-full" disabled={cashStatus === 'closed'}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Fechamento de Caixa
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCashRegister;
