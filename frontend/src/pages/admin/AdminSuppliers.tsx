import React, { useState, useEffect } from 'react';
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
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, Trash2, Building2 } from 'lucide-react';
import api from '@/lib/axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const AdminSuppliers = () => {
  const [suppliersData, setSuppliersData] = React.useState([]);
  const [modalType, setModalType] = React.useState(null); // 'new' | 'details' | 'edit'
  const [selectedSupplier, setSelectedSupplier] = React.useState(null);
  const [form, setForm] = React.useState({ name: '', email: '', phone: '', document: '', address: '', contact: '', category: '' });
  const [search, setSearch] = React.useState('');
  const [deleteId, setDeleteId] = React.useState(null);

  const fetchSuppliers = () => {
    api.get('/admin/suppliers').then(res => {
      setSuppliersData(res.data);
    });
  };

  React.useEffect(() => {
    fetchSuppliers();
  }, []);

  // Handlers
  const openNew = () => {
    setForm({ name: '', email: '', phone: '', document: '', address: '', contact: '', category: '' });
    setModalType('new');
  };
  const openDetails = (supplier) => {
    setSelectedSupplier(supplier);
    setModalType('details');
  };
  const openEdit = (supplier) => {
    setForm({ ...supplier });
    setSelectedSupplier(supplier);
    setModalType('edit');
  };
  const closeModal = () => {
    setModalType(null);
    setSelectedSupplier(null);
    setDeleteId(null);
  };
  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleCreate = async () => {
    await api.post('/admin/suppliers', form);
    fetchSuppliers();
    closeModal();
  };
  const handleEdit = async () => {
    await api.put(`/admin/suppliers/${selectedSupplier.id}`, form);
    fetchSuppliers();
    closeModal();
  };
  const handleDelete = async () => {
    await api.delete(`/admin/suppliers/${deleteId}`);
    fetchSuppliers();
    closeModal();
  };

  // Busca
  const filteredSuppliers = suppliersData.filter(s => {
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      (s.phone || '').toLowerCase().includes(q) ||
      (s.document || '').toLowerCase().includes(q) ||
      (s.address || '').toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-element-blue-dark">
          Cadastro de Fornecedores
        </h1>
        
        <div className="flex justify-between items-center mb-6">
          <Button className="bg-element-blue-neon text-element-gray-dark hover:bg-element-blue-neon/80" onClick={openNew}>
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
                <Input placeholder="Digite o nome, contato ou categoria" value={search} onChange={e => setSearch(e.target.value)} />
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
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">#{supplier.id}</TableCell>
                    <TableCell>{supplier.name}</TableCell>
                    <TableCell>{supplier.contact ?? '-'}</TableCell>
                    <TableCell>{supplier.email}</TableCell>
                    <TableCell>{supplier.phone}</TableCell>
                    <TableCell>{supplier.category ?? '-'}</TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openDetails(supplier)}>Detalhes</Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(supplier)}>Editar</Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteId(supplier.id)}>Excluir</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modal Novo Fornecedor */}
      <Dialog open={modalType === 'new'} onOpenChange={isOpen => { if (!isOpen) closeModal(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Fornecedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input name="name" placeholder="Nome" value={form.name} onChange={handleFormChange} />
            <Input name="email" placeholder="Email" value={form.email} onChange={handleFormChange} />
            <Input name="phone" placeholder="Telefone" value={form.phone} onChange={handleFormChange} />
            <Input name="document" placeholder="Documento" value={form.document} onChange={handleFormChange} />
            <Input name="address" placeholder="Endereço" value={form.address} onChange={handleFormChange} />
            <Input name="contact" placeholder="Contato" value={form.contact} onChange={handleFormChange} />
            <Input name="category" placeholder="Categoria" value={form.category} onChange={handleFormChange} />
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
            <DialogTitle>Detalhes do Fornecedor</DialogTitle>
          </DialogHeader>
          {selectedSupplier && (
            <div className="space-y-2">
              <div><b>ID:</b> {selectedSupplier.id}</div>
              <div><b>Nome:</b> {selectedSupplier.name}</div>
              <div><b>Email:</b> {selectedSupplier.email}</div>
              <div><b>Telefone:</b> {selectedSupplier.phone}</div>
              <div><b>Documento:</b> {selectedSupplier.document}</div>
              <div><b>Endereço:</b> {selectedSupplier.address}</div>
              <div><b>Ativo:</b> {selectedSupplier.active ? 'Sim' : 'Não'}</div>
              <div><b>Criado em:</b> {selectedSupplier.createdAt ? new Date(selectedSupplier.createdAt).toLocaleString('pt-BR') : '-'}</div>
              <div><b>Atualizado em:</b> {selectedSupplier.updatedAt ? new Date(selectedSupplier.updatedAt).toLocaleString('pt-BR') : '-'}</div>
              <div><b>Contato:</b> {selectedSupplier.contact ?? '-'}</div>
              <div><b>Categoria:</b> {selectedSupplier.category ?? '-'}</div>
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
            <DialogTitle>Editar Fornecedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input name="name" placeholder="Nome" value={form.name} onChange={handleFormChange} />
            <Input name="email" placeholder="Email" value={form.email} onChange={handleFormChange} />
            <Input name="phone" placeholder="Telefone" value={form.phone} onChange={handleFormChange} />
            <Input name="document" placeholder="Documento" value={form.document} onChange={handleFormChange} />
            <Input name="address" placeholder="Endereço" value={form.address} onChange={handleFormChange} />
            <Input name="contact" placeholder="Contato" value={form.contact} onChange={handleFormChange} />
            <Input name="category" placeholder="Categoria" value={form.category} onChange={handleFormChange} />
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
            <DialogTitle>Excluir Fornecedor</DialogTitle>
          </DialogHeader>
          <div>Tem certeza que deseja excluir este fornecedor?</div>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
            <Button variant="outline" onClick={closeModal}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSuppliers;
