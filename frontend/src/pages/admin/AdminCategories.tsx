import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Eye, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';

interface Category {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true
  });

  // Carregar categorias
  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/categories');
      console.log('Categorias recebidas da API:', response.data);
      // Garantir que todas as categorias tenham _count
      const categoriesWithCount = response.data.map((category: any) => ({
        ...category,
        _count: category._count || { products: 0 }
      }));
      console.log('Categorias processadas:', categoriesWithCount);
      setCategories(categoriesWithCount);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast.error('Erro ao carregar categorias');
      setCategories([]); // Garantir que categories seja um array vazio em caso de erro
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Filtrar categorias
  const filteredCategories = categories.filter(category => {
    // Verificação de segurança
    if (!category || !category.name) return false;
    
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && category.active) ||
                         (filterActive === 'inactive' && !category.active);

    return matchesSearch && matchesFilter;
  });

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      active: true
    });
  };

  // Abrir diálogo de criação
  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  // Abrir diálogo de edição
  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      active: category.active
    });
    setIsEditDialogOpen(true);
  };

  // Criar categoria
  const handleCreate = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error('Nome da categoria é obrigatório');
        return;
      }

      await api.post('/admin/categories', formData);
      toast.success('Categoria criada com sucesso!');
      setIsCreateDialogOpen(false);
      resetForm();
      loadCategories();
    } catch (error: any) {
      console.error('Erro ao criar categoria:', error);
      toast.error(error.response?.data?.error || 'Erro ao criar categoria');
    }
  };

  // Atualizar categoria
  const handleUpdate = async () => {
    try {
      if (!editingCategory || !formData.name.trim()) {
        toast.error('Nome da categoria é obrigatório');
        return;
      }

      await api.put(`/admin/categories/${editingCategory.id}`, formData);
      toast.success('Categoria atualizada com sucesso!');
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      resetForm();
      loadCategories();
    } catch (error: any) {
      console.error('Erro ao atualizar categoria:', error);
      toast.error(error.response?.data?.error || 'Erro ao atualizar categoria');
    }
  };

  // Deletar categoria
  const handleDelete = async (category: Category) => {
    try {
      await api.delete(`/admin/categories/${category.id}`);
      toast.success('Categoria deletada com sucesso!');
      loadCategories();
    } catch (error: any) {
      console.error('Erro ao deletar categoria:', error);
      if (error.response?.data?.productCount) {
        toast.error(`Não é possível deletar. Esta categoria possui ${error.response.data.productCount} produtos associados.`);
      } else {
        toast.error(error.response?.data?.error || 'Erro ao deletar categoria');
      }
    }
  };

  // Alternar status ativo/inativo
  const toggleActive = async (category: Category) => {
    try {
      await api.patch(`/admin/categories/${category.id}/active`, {
        active: !category.active
      });
      toast.success(`Categoria ${category.active ? 'desativada' : 'ativada'} com sucesso!`);
      loadCategories();
    } catch (error: any) {
      console.error('Erro ao alterar status da categoria:', error);
      toast.error('Erro ao alterar status da categoria');
    }
  };

  return (
    <AdminLayout>
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Categorias</h1>
          <p className="text-gray-600 mt-2">
            Crie e gerencie as categorias dos produtos
          </p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar categorias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">Todas</option>
                <option value="active">Ativas</option>
                <option value="inactive">Inativas</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Categorias */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCategories.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhuma categoria encontrada</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredCategories.map((category) => (
              <Card key={category.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {category.name}
                        </h3>
                        <Badge variant={category.active ? "default" : "secondary"}>
                          {category.active ? "Ativa" : "Inativa"}
                        </Badge>
                        <Badge variant="outline">
                          {category._count?.products || 0} produtos
                        </Badge>
                      </div>
                      {category.description && (
                        <p className="text-gray-600 mt-1">{category.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Criada em: {category.createdAt && !isNaN(new Date(category.createdAt).getTime())
                          ? new Date(category.createdAt).toLocaleDateString('pt-BR')
                          : 'Data não disponível'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={category.active}
                        onCheckedChange={() => toggleActive(category)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja deletar a categoria "{category.name}"?
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(category)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Deletar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Diálogo de Criação */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Categoria</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar uma nova categoria de produtos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Categoria *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Bebidas, Comidas, etc."
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição opcional da categoria"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active">Categoria ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Criar Categoria</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Modifique os dados da categoria selecionada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome da Categoria *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Bebidas, Comidas, etc."
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição opcional da categoria"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="edit-active">Categoria ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate}>Atualizar Categoria</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </AdminLayout>
  );
} 