import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, UserPlus } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';

const userTypes = [
  { value: 'admin', label: 'Administrador' },
  { value: 'motoboy', label: 'Motoboy' },
];

const API_URL = 'http://localhost:3333/api';

const AdminUsers = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', type: 'admin' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      setError('Faça login novamente para acessar esta página.');
      setLoading(false);
      return;
    }
    setLoading(true);
    axios.get(`${API_URL}/admin/users?roles=ADMIN,MOTOBOY`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        setUsers(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao buscar usuários:', err);
        setError('Erro ao buscar usuários');
        setLoading(false);
      });
  }, [token]);

  const handleOpenModal = () => {
    setForm({ name: '', email: '', password: '', type: 'admin' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTypeChange = (value: string) => {
    setForm({ ...form, type: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_URL}/admin/users`, {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.type.toUpperCase(),
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const res = await axios.get(`${API_URL}/admin/users?roles=ADMIN,MOTOBOY`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(res.data);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Erro ao cadastrar usuário:', err);
      setError('Erro ao cadastrar usuário');
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-6 overflow-y-auto ml-0 lg:ml-64">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-element-blue-dark">Usuários do Sistema</h1>
          <Button className="bg-element-blue-neon text-element-gray-dark hover:bg-element-blue-neon/80" onClick={handleOpenModal}>
            <UserPlus className="h-4 w-4 mr-2" />
            + Novo Usuário
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buscar Usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input placeholder="Digite o nome ou e-mail" />
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
            <CardTitle>Usuários Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : error ? (
              <div className="text-center text-red-500 py-8">{error}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">#{user.id}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role === 'ADMIN' ? 'Administrador' : 'Motoboy'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input id="password" name="password" type="password" value={form.password} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="type">Tipo de Usuário</Label>
                <Select value={form.type} onValueChange={handleTypeChange}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {userTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseModal}>Cancelar</Button>
                <Button type="submit" className="bg-element-blue-neon text-element-gray-dark hover:bg-element-blue-neon/90">Cadastrar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminUsers; 