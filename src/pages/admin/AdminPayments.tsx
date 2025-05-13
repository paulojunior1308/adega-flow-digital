
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { CreditCard, Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

const AdminPayments = () => {
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, name: 'Dinheiro', type: 'money', active: true, fee: 0, installments: 1, minValue: 0 },
    { id: 2, name: 'Cartão de Crédito', type: 'credit', active: true, fee: 2.99, installments: 12, minValue: 10 },
    { id: 3, name: 'Cartão de Débito', type: 'debit', active: true, fee: 1.99, installments: 1, minValue: 5 },
    { id: 4, name: 'Pix', type: 'pix', active: true, fee: 0, installments: 1, minValue: 1 },
    { id: 5, name: 'Vale Alimentação', type: 'voucher', active: false, fee: 3.5, installments: 1, minValue: 0 }
  ]);

  const [newMethod, setNewMethod] = useState({
    name: '',
    type: '',
    active: true,
    fee: 0,
    installments: 1,
    minValue: 0
  });

  const handleAddMethod = () => {
    if (!newMethod.name || !newMethod.type) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setPaymentMethods([
      ...paymentMethods,
      {
        id: paymentMethods.length + 1,
        ...newMethod
      }
    ]);

    setNewMethod({
      name: '',
      type: '',
      active: true,
      fee: 0,
      installments: 1,
      minValue: 0
    });

    toast({
      title: "Meio de pagamento adicionado",
      description: `${newMethod.name} foi adicionado com sucesso.`
    });
  };

  const toggleMethodStatus = (id: number) => {
    setPaymentMethods(paymentMethods.map(method => 
      method.id === id ? { ...method, active: !method.active } : method
    ));

    const method = paymentMethods.find(m => m.id === id);
    if (method) {
      toast({
        title: method.active ? "Meio de pagamento desativado" : "Meio de pagamento ativado",
        description: `${method.name} foi ${method.active ? 'desativado' : 'ativado'} com sucesso.`
      });
    }
  };

  const deleteMethod = (id: number) => {
    const method = paymentMethods.find(m => m.id === id);
    setPaymentMethods(paymentMethods.filter(method => method.id !== id));
    
    if (method) {
      toast({
        title: "Meio de pagamento removido",
        description: `${method.name} foi removido com sucesso.`
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold text-element-blue-dark mb-6">Meios de Pagamento</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Métodos Disponíveis</CardTitle>
              <CardDescription>Meios de pagamento configurados no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{paymentMethods.length}</div>
              <p className="text-sm text-muted-foreground">Total de métodos cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Métodos Ativos</CardTitle>
              <CardDescription>Meios de pagamento disponíveis para uso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">{paymentMethods.filter(method => method.active).length}</div>
              <p className="text-sm text-muted-foreground">Total de métodos ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Adicionar Método</CardTitle>
              <CardDescription>Cadastrar novo meio de pagamento</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Meio de Pagamento
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Meio de Pagamento</DialogTitle>
                    <DialogDescription>
                      Preencha os detalhes do novo método de pagamento.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Nome</Label>
                      <Input 
                        id="name" 
                        className="col-span-3" 
                        value={newMethod.name}
                        onChange={(e) => setNewMethod({...newMethod, name: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="type" className="text-right">Tipo</Label>
                      <Select 
                        value={newMethod.type}
                        onValueChange={(value) => setNewMethod({...newMethod, type: value})}
                      >
                        <SelectTrigger id="type" className="col-span-3">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="money">Dinheiro</SelectItem>
                          <SelectItem value="credit">Cartão de Crédito</SelectItem>
                          <SelectItem value="debit">Cartão de Débito</SelectItem>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="transfer">Transferência</SelectItem>
                          <SelectItem value="voucher">Vale/Voucher</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="fee" className="text-right">Taxa (%)</Label>
                      <Input 
                        id="fee" 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        className="col-span-3"
                        value={newMethod.fee}
                        onChange={(e) => setNewMethod({...newMethod, fee: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="installments" className="text-right">Parcelas</Label>
                      <Input 
                        id="installments" 
                        type="number" 
                        min="1" 
                        className="col-span-3"
                        value={newMethod.installments}
                        onChange={(e) => setNewMethod({...newMethod, installments: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="minValue" className="text-right">Valor Mínimo</Label>
                      <Input 
                        id="minValue" 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        className="col-span-3"
                        value={newMethod.minValue}
                        onChange={(e) => setNewMethod({...newMethod, minValue: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="active" className="text-right">Ativo</Label>
                      <div className="flex items-center space-x-2 col-span-3">
                        <Switch 
                          id="active" 
                          checked={newMethod.active} 
                          onCheckedChange={(checked) => setNewMethod({...newMethod, active: checked})}
                        />
                        <Label htmlFor="active">{newMethod.active ? "Sim" : "Não"}</Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={handleAddMethod}>Adicionar Método</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Meios de Pagamento</CardTitle>
            <CardDescription>Gerencie todos os meios de pagamento do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="active">Ativos</TabsTrigger>
                <TabsTrigger value="inactive">Inativos</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Taxa</TableHead>
                      <TableHead>Parcelas</TableHead>
                      <TableHead>Valor Mínimo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentMethods.map((method) => (
                      <TableRow key={method.id}>
                        <TableCell>{method.name}</TableCell>
                        <TableCell>
                          {method.type === 'money' && 'Dinheiro'}
                          {method.type === 'credit' && 'Cartão de Crédito'}
                          {method.type === 'debit' && 'Cartão de Débito'}
                          {method.type === 'pix' && 'PIX'}
                          {method.type === 'transfer' && 'Transferência'}
                          {method.type === 'voucher' && 'Vale/Voucher'}
                          {method.type === 'other' && 'Outro'}
                        </TableCell>
                        <TableCell>{method.fee}%</TableCell>
                        <TableCell>Até {method.installments}x</TableCell>
                        <TableCell>
                          {method.minValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                            method.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {method.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => toggleMethodStatus(method.id)}
                              title={method.active ? "Desativar" : "Ativar"}
                            >
                              {method.active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              title="Remover"
                              onClick={() => deleteMethod(method.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="active">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Taxa</TableHead>
                      <TableHead>Parcelas</TableHead>
                      <TableHead>Valor Mínimo</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentMethods
                      .filter(method => method.active)
                      .map((method) => (
                        <TableRow key={method.id}>
                          <TableCell>{method.name}</TableCell>
                          <TableCell>
                            {method.type === 'money' && 'Dinheiro'}
                            {method.type === 'credit' && 'Cartão de Crédito'}
                            {method.type === 'debit' && 'Cartão de Débito'}
                            {method.type === 'pix' && 'PIX'}
                            {method.type === 'transfer' && 'Transferência'}
                            {method.type === 'voucher' && 'Vale/Voucher'}
                            {method.type === 'other' && 'Outro'}
                          </TableCell>
                          <TableCell>{method.fee}%</TableCell>
                          <TableCell>Até {method.installments}x</TableCell>
                          <TableCell>
                            {method.minValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => toggleMethodStatus(method.id)}
                                title="Desativar"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                title="Remover"
                                onClick={() => deleteMethod(method.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="inactive">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Taxa</TableHead>
                      <TableHead>Parcelas</TableHead>
                      <TableHead>Valor Mínimo</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentMethods
                      .filter(method => !method.active)
                      .map((method) => (
                        <TableRow key={method.id}>
                          <TableCell>{method.name}</TableCell>
                          <TableCell>
                            {method.type === 'money' && 'Dinheiro'}
                            {method.type === 'credit' && 'Cartão de Crédito'}
                            {method.type === 'debit' && 'Cartão de Débito'}
                            {method.type === 'pix' && 'PIX'}
                            {method.type === 'transfer' && 'Transferência'}
                            {method.type === 'voucher' && 'Vale/Voucher'}
                            {method.type === 'other' && 'Outro'}
                          </TableCell>
                          <TableCell>{method.fee}%</TableCell>
                          <TableCell>Até {method.installments}x</TableCell>
                          <TableCell>
                            {method.minValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => toggleMethodStatus(method.id)}
                                title="Ativar"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                title="Remover"
                                onClick={() => deleteMethod(method.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPayments;
