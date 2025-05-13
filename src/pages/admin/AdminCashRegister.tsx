
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const AdminCashRegister = () => {
  const [cashStatus, setCashStatus] = useState<'open' | 'closed'>('open');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  
  // Sample cash register data - in a real app, this would come from an API
  const [transactionsData, setTransactionsData] = useState([
    { id: 1, type: 'entrada', description: 'Venda #1045 - Cliente: João Silva', paymentMethod: 'Cartão de Crédito', time: '15:30', value: 'R$ 156,90' },
    { id: 2, type: 'entrada', description: 'Venda #1046 - Cliente: Maria Oliveira', paymentMethod: 'Dinheiro', time: '15:45', value: 'R$ 82,50' },
    { id: 3, type: 'saída', description: 'Pagamento Fornecedor ABC', paymentMethod: 'Dinheiro', time: '16:20', value: 'R$ 350,00' },
    { id: 4, type: 'entrada', description: 'Venda #1047 - Cliente: Carlos Santos', paymentMethod: 'Pix', time: '16:35', value: 'R$ 215,00' },
    { id: 5, type: 'saída', description: 'Retirada para Troco', paymentMethod: 'Dinheiro', time: '17:00', value: 'R$ 100,00' }
  ]);

  // Calculate summary values
  const initialBalance = 500;
  const sales = transactionsData
    .filter(transaction => transaction.type === 'entrada')
    .reduce((total, transaction) => total + parseFloat(transaction.value.replace('R$ ', '').replace('.', '').replace(',', '.')), 0);
  
  const expenses = transactionsData
    .filter(transaction => transaction.type === 'saída')
    .reduce((total, transaction) => total + parseFloat(transaction.value.replace('R$ ', '').replace('.', '').replace(',', '.')), 0);
  
  const currentBalance = initialBalance + sales - expenses;

  const handleNewTransaction = (type: 'entrada' | 'saída') => {
    if (!amount || !description || !paymentMethod) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }

    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const time = `${hours}:${minutes}`;

    const newTransaction = {
      id: transactionsData.length + 1,
      type,
      description,
      paymentMethod,
      time,
      value: `R$ ${parseFloat(amount).toFixed(2).replace('.', ',')}`
    };

    setTransactionsData([newTransaction, ...transactionsData]);
    setAmount('');
    setDescription('');
    setPaymentMethod('');

    toast({
      title: type === 'entrada' ? "Entrada registrada" : "Saída registrada",
      description: `${type === 'entrada' ? 'Entrada' : 'Saída'} de R$ ${parseFloat(amount).toFixed(2).replace('.', ',')} registrada com sucesso.`
    });
  };

  const handleCashOperation = (operation: 'close' | 'withdrawal') => {
    if (operation === 'close') {
      setCashStatus('closed');
      toast({
        title: "Caixa fechado",
        description: `Saldo final: ${currentBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
      });
    } else {
      toast({
        title: "Sangria realizada",
        description: "Sangria de caixa registrada com sucesso."
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold text-element-blue-dark mb-6">PDV - Ponto de Venda</h1>

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
                <CardDescription>Hoje, {new Date().toLocaleDateString('pt-BR')}</CardDescription>
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-green-600 hover:bg-green-700" disabled={cashStatus === 'closed'}>
                          <ArrowUp className="mr-2 h-4 w-4" />
                          Nova Venda / Entrada
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Registrar Nova Entrada</DialogTitle>
                          <DialogDescription>
                            Preencha os detalhes da nova entrada de caixa.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">
                              Valor
                            </Label>
                            <Input
                              id="amount"
                              className="col-span-3"
                              placeholder="0,00"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">
                              Descrição
                            </Label>
                            <Input
                              id="description"
                              className="col-span-3"
                              placeholder="Venda de produto"
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="paymentMethod" className="text-right">
                              Método
                            </Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                                <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                                <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                                <SelectItem value="Pix">Pix</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" onClick={() => handleNewTransaction('entrada')}>
                            Registrar Entrada
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TabsContent>
                  <TabsContent value="remove" className="space-y-4 mt-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-red-600 hover:bg-red-700" disabled={cashStatus === 'closed'}>
                          <ArrowDown className="mr-2 h-4 w-4" />
                          Nova Despesa / Saída
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Registrar Nova Saída</DialogTitle>
                          <DialogDescription>
                            Preencha os detalhes da nova saída de caixa.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">
                              Valor
                            </Label>
                            <Input
                              id="amount"
                              className="col-span-3"
                              placeholder="0,00"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">
                              Descrição
                            </Label>
                            <Input
                              id="description"
                              className="col-span-3"
                              placeholder="Pagamento de fornecedor"
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="paymentMethod" className="text-right">
                              Método
                            </Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                                <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                                <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                                <SelectItem value="Pix">Pix</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" variant="destructive" onClick={() => handleNewTransaction('saída')}>
                            Registrar Saída
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" disabled={cashStatus === 'closed'}>
                      <ArrowDownUp className="mr-2 h-4 w-4" />
                      Sangria de Caixa
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Realizar Sangria de Caixa</DialogTitle>
                      <DialogDescription>
                        Confirme a retirada de dinheiro do caixa.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <p>Tem certeza que deseja realizar uma sangria do caixa?</p>
                      <p className="text-sm text-muted-foreground mt-2">Esta ação será registrada no histórico de movimentações.</p>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={() => handleCashOperation('withdrawal')}>
                        Confirmar Sangria
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" disabled={cashStatus === 'closed'}>
                      <DollarSign className="mr-2 h-4 w-4" />
                      Fechamento de Caixa
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Fechamento de Caixa</DialogTitle>
                      <DialogDescription>
                        Confirme o fechamento do caixa com os valores abaixo.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Saldo Inicial:</p>
                          <p className="text-lg">{initialBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Total de Entradas:</p>
                          <p className="text-lg text-green-600">{sales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Total de Saídas:</p>
                          <p className="text-lg text-red-600">{expenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Saldo Final:</p>
                          <p className="text-lg font-bold">{currentBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Ao fechar o caixa, você não poderá adicionar mais transações até que seja aberto novamente.
                      </p>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={() => handleCashOperation('close')}>
                        Confirmar Fechamento
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCashRegister;
