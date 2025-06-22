import React, { useState } from 'react';
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
import api from '@/lib/axios';

const AdminPayments = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [newMethod, setNewMethod] = useState({ name: '', active: true });
  const [loading, setLoading] = useState(false);

  const fetchMethods = () => {
    api.get('/admin/payment-methods').then(res => setPaymentMethods(res.data));
  };

  React.useEffect(() => {
    fetchMethods();
  }, []);

  const handleAddMethod = async () => {
    if (!newMethod.name) {
      toast({ title: 'Campo obrigatório', description: 'Informe o nome do método.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/admin/payment-methods', newMethod);
      fetchMethods();
      setNewMethod({ name: '', active: true });
      toast({ title: 'Meio de pagamento adicionado', description: `${newMethod.name} foi adicionado com sucesso.` });
    } catch (err) {
      toast({ title: 'Erro', description: err.response?.data?.error || 'Erro ao adicionar método.', variant: 'destructive' });
    }
    setLoading(false);
  };

  const toggleMethodStatus = async (id, currentActive) => {
    await api.put(`/admin/payment-methods/${id}`, { active: !currentActive });
    fetchMethods();
  };

  const deleteMethod = async (id) => {
    await api.delete(`/admin/payment-methods/${id}`);
    fetchMethods();
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminLayout>
      <div className="flex-1 p-6 overflow-y-auto ml-0 lg:ml-64">
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
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentMethods.map((method) => (
                      <TableRow key={method.id}>
                        <TableCell>{method.name}</TableCell>
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
                              onClick={() => toggleMethodStatus(method.id, method.active)}
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
                      <TableHead>Status</TableHead>
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
                                onClick={() => toggleMethodStatus(method.id, method.active)}
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
                      <TableHead>Status</TableHead>
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
                                onClick={() => toggleMethodStatus(method.id, method.active)}
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
    </AdminLayout>
    </div>
  );
};

export default AdminPayments;
