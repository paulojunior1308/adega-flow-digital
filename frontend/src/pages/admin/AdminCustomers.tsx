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
import api from '@/lib/axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const AdminCustomers = () => {
  const [customersData, setCustomersData] = React.useState([]);
  const [modalType, setModalType] = React.useState(null); // 'new' | 'details' | 'edit'
  const [selectedCustomer, setSelectedCustomer] = React.useState(null);
  const [form, setForm] = React.useState({ name: '', email: '', phone: '', password: '' });
  const [search, setSearch] = React.useState('');
  const [deleteId, setDeleteId] = React.useState(null);

  const fetchCustomers = () => {
    api.get('/admin/users?roles=USER').then(res => {
      setCustomersData(res.data);
    });
  };

  React.useEffect(() => {
    fetchCustomers();
  }, []);

  // Handlers
  const openNew = () => {
    setForm({ name: '', email: '', phone: '', password: '' });
    setModalType('new');
  };
  const openDetails = (customer) => {
    setSelectedCustomer(customer);
    setModalType('details');
  };
  const openEdit = (customer) => {
    setForm({ ...customer, password: '' });
    setSelectedCustomer(customer);
    setModalType('edit');
  };
  const closeModal = () => {
    setModalType(null);
    setSelectedCustomer(null);
    setDeleteId(null);
  };
  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleCreate = async () => {
    await api.post('/admin/users', { ...form, role: 'USER' });
    fetchCustomers();
    closeModal();
  };
  const handleEdit = async () => {
    await api.put(`/admin/users/${selectedCustomer.id}`, form);
    fetchCustomers();
    closeModal();
  };
  const handleDelete = async () => {
    await api.delete(`/admin/users/${deleteId}`);
    fetchCustomers();
    closeModal();
  };

  // Busca
  const filteredCustomers = customersData.filter(c => {
    const s = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(s) ||
      c.email?.toLowerCase().includes(s) ||
      (c.phone || '').toLowerCase().includes(s)
    );
  });

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-6 overflow-y-auto ml-0 lg:ml-64">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-element-blue-dark">Lista de Clientes</h1>
          <Button className="bg-element-blue-neon text-element-gray-dark hover:bg-element-blue-neon/80" onClick={openNew}>
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
                <Input placeholder="Digite o nome, e-mail ou telefone" value={search} onChange={e => setSearch(e.target.value)} />
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
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">#{customer.id}</TableCell>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.orders ?? '-'}</TableCell>
                    <TableCell>{customer.totalSpent ?? '-'}</TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openDetails(customer)}>Detalhes</Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(customer)}>Editar</Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteId(customer.id)}>Excluir</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Modal Novo Cliente */}
        <Dialog open={modalType === 'new'} onOpenChange={closeModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input name="name" placeholder="Nome" value={form.name} onChange={handleFormChange} />
              <Input name="email" placeholder="Email" value={form.email} onChange={handleFormChange} />
              <Input name="phone" placeholder="Telefone" value={form.phone} onChange={handleFormChange} />
              <Input name="password" placeholder="Senha" type="password" value={form.password} onChange={handleFormChange} />
            </div>
            <DialogFooter>
              <Button onClick={handleCreate}>Salvar</Button>
              <Button variant="outline" onClick={closeModal}>Cancelar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Detalhes */}
        <Dialog open={modalType === 'details'} onOpenChange={closeModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Cliente</DialogTitle>
            </DialogHeader>
            {selectedCustomer && (
              <div className="space-y-2">
                <div><b>ID:</b> {selectedCustomer.id}</div>
                <div><b>Nome:</b> {selectedCustomer.name}</div>
                <div><b>Email:</b> {selectedCustomer.email}</div>
                <div><b>Telefone:</b> {selectedCustomer.phone ?? '-'}</div>
                <div><b>Role:</b> {selectedCustomer.role}</div>
                <div><b>Criado em:</b> {selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleString('pt-BR') : '-'}</div>
                <div><b>Atualizado em:</b> {selectedCustomer.updatedAt ? new Date(selectedCustomer.updatedAt).toLocaleString('pt-BR') : '-'}</div>
                <div><b>Pedidos:</b> {selectedCustomer.orders ?? '-'}</div>
                <div><b>Total Gasto:</b> {selectedCustomer.totalSpent ?? '-'}</div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={closeModal}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Editar */}
        <Dialog open={modalType === 'edit'} onOpenChange={closeModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input name="name" placeholder="Nome" value={form.name} onChange={handleFormChange} />
              <Input name="email" placeholder="Email" value={form.email} onChange={handleFormChange} />
              <Input name="phone" placeholder="Telefone" value={form.phone} onChange={handleFormChange} />
              <Input name="password" placeholder="Senha (deixe em branco para não alterar)" type="password" value={form.password} onChange={handleFormChange} />
            </div>
            <DialogFooter>
              <Button onClick={handleEdit}>Salvar</Button>
              <Button variant="outline" onClick={closeModal}>Cancelar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Exclusão */}
        <Dialog open={!!deleteId} onOpenChange={closeModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Cliente</DialogTitle>
            </DialogHeader>
            <div>Tem certeza que deseja excluir este cliente?</div>
            <DialogFooter>
              <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
              <Button variant="outline" onClick={closeModal}>Cancelar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminCustomers;
