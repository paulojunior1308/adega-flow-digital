
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
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { DollarSign, CreditCard, Search, FileText, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AdminCashRegister = () => {
  // Sample data for cash register
  const [transactions, setTransactions] = useState([
    { id: 1, type: 'entrada', description: 'Venda #1052', method: 'Dinheiro', value: 'R$ 150,00', time: '14:25', operator: 'João Silva' },
    { id: 2, type: 'saida', description: 'Pagamento Fornecedor', method: 'Dinheiro', value: 'R$ 230,50', time: '12:10', operator: 'João Silva' },
    { id: 3, type: 'entrada', description: 'Venda #1051', method: 'Cartão', value: 'R$ 75,90', time: '11:42', operator: 'Maria Oliveira' },
    { id: 4, type: 'entrada', description: 'Venda #1050', method: 'PIX', value: 'R$ 98,30', time: '10:15', operator: 'João Silva' },
    { id: 5, type: 'saida', description: 'Retirada para Troco', method: 'Dinheiro', value: 'R$ 100,00', time: '09:30', operator: 'Maria Oliveira' },
  ]);
  
  // Calculate totals
  const totalCash = 'R$ 1.540,00';
  const totalIn = 'R$ 1.870,50';
  const totalOut = 'R$ 330,50';

  const [selectedTab, setSelectedTab] = useState('all');
  
  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-6 overflow-y-auto ml-0 lg:ml-64">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-element-blue-dark">Caixa</h1>
          <div className="flex space-x-2">
            <Button className="bg-green-500 hover:bg-green-600">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Entrada no Caixa
            </Button>
            <Button className="bg-amber-500 hover:bg-amber-600">
              <ArrowDownLeft className="h-4 w-4 mr-2" />
              Saída do Caixa
            </Button>
            <Button className="bg-element-blue-dark hover:bg-element-blue-dark/80">
              <FileText className="h-4 w-4 mr-2" />
              Fechar Caixa
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-green-500" /> Total em Caixa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{totalCash}</p>
              <p className="text-xs text-muted-foreground mt-1">Atualizado: Hoje, 14:25</p>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <ArrowUpRight className="h-4 w-4 mr-2 text-blue-500" /> Entradas (Hoje)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{totalIn}</p>
              <p className="text-xs text-muted-foreground mt-1">15 operações realizadas</p>
            </CardContent>
          </Card>
          
          <Card className="bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <ArrowDownLeft className="h-4 w-4 mr-2 text-amber-500" /> Saídas (Hoje)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-600">{totalOut}</p>
              <p className="text-xs text-muted-foreground mt-1">4 operações realizadas</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Movimentações de Caixa</CardTitle>
                <CardDescription>Acompanhe todas as entradas e saídas do caixa</CardDescription>
              </div>
              <div className="flex gap-4">
                <div className="relative w-60">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar operações..." className="pl-8" />
                </div>
                <Select defaultValue="today">
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="yesterday">Ontem</SelectItem>
                    <SelectItem value="week">Esta semana</SelectItem>
                    <SelectItem value="month">Este mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="mb-4" onValueChange={setSelectedTab}>
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="in">Entradas</TabsTrigger>
                <TabsTrigger value="out">Saídas</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions
                  .filter(trans => {
                    if (selectedTab === 'in') return trans.type === 'entrada';
                    if (selectedTab === 'out') return trans.type === 'saida';
                    return true;
                  })
                  .map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">#{transaction.id}</TableCell>
                      <TableCell className="flex items-center">
                        {transaction.type === 'entrada' ? (
                          <ArrowUpRight className="h-4 w-4 mr-2 text-green-500" />
                        ) : (
                          <ArrowDownLeft className="h-4 w-4 mr-2 text-amber-500" />
                        )}
                        {transaction.description}
                      </TableCell>
                      <TableCell>{transaction.method}</TableCell>
                      <TableCell className={transaction.type === 'entrada' ? "text-green-600" : "text-amber-600"}>
                        {transaction.value}
                      </TableCell>
                      <TableCell>{transaction.time}</TableCell>
                      <TableCell>{transaction.operator}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">Detalhes</Button>
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

export default AdminCashRegister;
