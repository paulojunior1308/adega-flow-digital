import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Package, 
  Search, 
  SlidersHorizontal, 
  AlertCircle, 
  Plus,
  ArrowUpDown,
  Archive
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from "@/components/ui/use-toast";
import api from '@/lib/axios';
import { Switch } from '@/components/ui/switch';
import { uploadToCloudinary } from '@/lib/cloudinary';

// Product interface
interface Product {
  id: string;
  name: string;
  category: {
    id: string;
    name: string;
  };
  price: number;
  stock: number;
  stockStatus: 'low' | 'medium' | 'high' | 'out';
  supplier: string;
  updatedAt: string;
  costPrice?: number;
  description?: string;
  image?: string;
  active: boolean;
  unit?: string; // 'ml', 'unidade', etc.
  quantityPerUnit?: number; // Ex: 900 para gin 900ml
  canSellByDose?: boolean;
  canSellByUnit?: boolean;
}

// Category interface
interface Category {
  id: string;
  name: string;
}

const AdminStock = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockUpdateAmount, setStockUpdateAmount] = useState<number>(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product, direction: 'asc' | 'desc' } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    price: '',
    costPrice: '',
    stock: '',
    description: '',
    image: null as File | null,
    unit: '',
    quantityPerUnit: '',
    canSellByUnit: false,
    canSellByDose: false
  });
  const [categories, setCategories] = useState<Category[]>([]);
  
  const suppliers = Array.from(new Set(products.map(product => product.supplier)));

  const { toast } = useToast();

  useEffect(() => {
    api.get('/admin/products').then(res => setProducts(res.data));
    
    api.get('/admin/categories').then(res => {
      setCategories(res.data);
    });
  }, []);

  // Function to handle sorting
  const requestSort = (key: keyof Product) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  // Apply sorting to products
  const sortedProducts = React.useMemo(() => {
    const sortableProducts = [...products];
    
    if (sortConfig !== null) {
      sortableProducts.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return sortableProducts;
  }, [products, sortConfig]);

  // Filter products based on search term, category and stock status
  const filteredProducts = sortedProducts.filter(product => {
    const categoryName = typeof product.category === 'string' ? product.category : product.category?.name || '';
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || categoryName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || categoryName === categoryFilter;
    const matchesStock = stockFilter === 'all' || 
                        (stockFilter === 'low' && product.stockStatus === 'low') ||
                        (stockFilter === 'out' && product.stockStatus === 'out') ||
                        (stockFilter === 'available' && product.stockStatus !== 'out');
    return matchesSearch && matchesCategory && matchesStock;
  });

  // Open stock update dialog
  const openUpdateDialog = (product: Product) => {
    setSelectedProduct(product);
    setStockUpdateAmount(0);
    setIsUpdateDialogOpen(true);
  };

  // Update stock handler
  const handleStockUpdate = async (productId: string, newStock: number) => {
    try {
      await api.put(`/admin/products/${productId}/stock`, { stock: newStock });
      setProducts(products.map(p => p.id === productId ? { ...p, stock: newStock } : p));
      toast({ title: 'Estoque atualizado com sucesso!' });
      setIsUpdateDialogOpen(false);
    } catch (error: any) {
      toast({ 
        title: 'Erro ao atualizar estoque.', 
        description: error.response?.data?.error || 'Tente novamente mais tarde.',
        variant: 'destructive' 
      });
    }
  };

  // Function to get stock status badge
  const getStockStatusBadge = (status: 'low' | 'medium' | 'high' | 'out') => {
    switch (status) {
      case 'high':
        return <Badge className="bg-green-500">Alto</Badge>;
      case 'medium':
        return <Badge className="bg-blue-500">Médio</Badge>;
      case 'low':
        return <Badge className="bg-yellow-500">Baixo</Badge>;
      case 'out':
        return <Badge className="bg-red-500">Esgotado</Badge>;
      default:
        return null;
    }
  };

  // Função para abrir o modal de edição
  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      category: product.category?.id || '',
      price: product.price.toString(),
      costPrice: product.costPrice?.toString() || '',
      stock: product.stock.toString(),
      description: product.description || '',
      image: null,
      unit: product.unit || '',
      quantityPerUnit: product.quantityPerUnit?.toString() || '',
      canSellByUnit: typeof product.canSellByUnit === 'boolean' ? product.canSellByUnit : false,
      canSellByDose: typeof product.canSellByDose === 'boolean' ? product.canSellByDose : false
    });
    setIsEditDialogOpen(true);
  };

  // Função para salvar as alterações
  const handleEditSave = async () => {
    try {
      let imageUrl = editingProduct?.image || '';
      if (editForm.image) {
        // Função fictícia, substitua pelo seu método real de upload
        imageUrl = await uploadToCloudinary(editForm.image);
      }
      await api.put(`/admin/products/${editingProduct?.id}`, {
        name: editForm.name,
        categoryId: editForm.category,
        price: parseFloat(editForm.price),
        costPrice: parseFloat(editForm.costPrice),
        stock: parseInt(editForm.stock),
        description: editForm.description,
        image: imageUrl,
        unit: editForm.unit,
        quantityPerUnit: parseInt(editForm.quantityPerUnit),
        canSellByUnit: editForm.canSellByUnit,
        canSellByDose: editForm.canSellByDose
      });
      // Atualizar a lista de produtos
      const updatedProducts = products.map(p => 
        p.id === editingProduct?.id 
          ? { 
              ...p, 
              name: editForm.name,
              category: { 
                id: editForm.category, 
                name: categories.find(c => c.id === editForm.category)?.name || '' 
              },
              price: parseFloat(editForm.price),
              stock: parseInt(editForm.stock),
              image: imageUrl,
              unit: editForm.unit,
              quantityPerUnit: parseInt(editForm.quantityPerUnit),
              canSellByUnit: editForm.canSellByUnit,
              canSellByDose: editForm.canSellByDose
            }
          : p
      );
      setProducts(updatedProducts);
      toast({ title: 'Produto atualizado com sucesso!' });
      setIsEditDialogOpen(false);
    } catch (error: any) {
      toast({ 
        title: 'Erro ao atualizar produto.', 
        description: error.response?.data?.error || 'Tente novamente mais tarde.',
        variant: 'destructive' 
      });
    }
  };

  // Função para atualizar status ativo do produto
  const handleToggleActive = async (productId: string, active: boolean) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const payload = {
        name: product.name,
        categoryId: product.category.id,
        price: product.price,
        costPrice: product.costPrice,
        stock: product.stock,
        description: product.description,
        active,
      };

      await api.put(`/admin/products/${productId}`, payload);
      setProducts(products.map(p => p.id === productId ? { ...p, active } : p));
      toast({ title: `Produto ${active ? 'ativado' : 'inativado'} com sucesso!` });
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar status.',
        description: error.response?.data?.error || 'Tente novamente mais tarde.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-element-gray-light flex">
      <AdminSidebar />
      
      <div className="flex-1 p-8 ml-0 lg:ml-64">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-element-blue-dark">Gerenciamento de Estoque</h1>
          <p className="text-element-gray-dark">
            Visualize e atualize o estoque de produtos da Element Adega.
          </p>
        </div>
        
        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-element-gray-dark/60 h-4 w-4" />
              <Input 
                placeholder="Buscar produtos..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" key="all">Todas Categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status Estoque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" key="all">Todos Status</SelectItem>
                  <SelectItem value="low" key="low">Baixo Estoque</SelectItem>
                  <SelectItem value="out" key="out">Esgotado</SelectItem>
                  <SelectItem value="available" key="available">Disponível</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden md:inline">Mais Filtros</span>
              </Button>
            </div>
            
            <Button 
              className="bg-element-blue-dark flex items-center gap-2"
              onClick={() => navigate('/admin-cadastro-produtos')}
            >
              <Plus className="h-4 w-4" />
              <span>Novo Produto</span>
            </Button>
          </div>
        </div>
        
        {/* Stock Alerts */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <div>
              <h3 className="font-medium text-yellow-800">Alertas de Estoque</h3>
              <p className="text-sm text-yellow-600">
                {products.filter(p => p.stockStatus === 'low').length} produtos com estoque baixo | 
                {products.filter(p => p.stockStatus === 'out').length} produtos esgotados
              </p>
            </div>
          </div>
        </div>
        
        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">
                  <Button 
                    variant="ghost" 
                    onClick={() => requestSort('name')}
                    className="flex items-center gap-1 font-medium hover:bg-transparent hover:underline"
                  >
                    Produto
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => requestSort('price')}
                    className="flex items-center gap-1 font-medium hover:bg-transparent hover:underline"
                  >
                    Preço
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => requestSort('stock')}
                    className="flex items-center gap-1 font-medium hover:bg-transparent hover:underline"
                  >
                    Estoque
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Última Atualização</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-element-blue-dark" />
                        {product.name}
                      </div>
                    </TableCell>
                    <TableCell>{product.category?.name || '-'}</TableCell>
                    <TableCell>R$ {product.price.toFixed(2)}</TableCell>
                    <TableCell className="font-medium">
                      {product.unit === 'ml' && product.quantityPerUnit ? (
                        <span>{(product.stock * product.quantityPerUnit).toFixed(1)} ml <span className="text-xs text-gray-500">({product.stock.toFixed(1)} un)</span></span>
                      ) : (
                        <span>{product.stock.toFixed(1)}</span>
                      )}
                    </TableCell>
                    <TableCell>{product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('pt-BR') : '-'}</TableCell>
                    <TableCell>
                      <Switch
                        checked={product.active}
                        onCheckedChange={(checked) => handleToggleActive(product.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <span className="sr-only">Abrir menu</span>
                            <SlidersHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Opções</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openUpdateDialog(product)}>
                            Atualizar estoque
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(product)}>
                            Editar produto
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={async () => {
                            if (window.confirm('Tem certeza que deseja remover este produto?')) {
                              try {
                                await api.delete(`/admin/products/${product.id}`);
                                setProducts(products.filter(p => p.id !== product.id));
                                toast({ title: 'Produto removido com sucesso!' });
                              } catch (error: any) {
                                toast({ 
                                  title: 'Erro ao remover produto.', 
                                  description: error.response?.data?.error || 'Tente novamente mais tarde.',
                                  variant: 'destructive' 
                                });
                              }
                            }
                          }}>
                            Remover produto
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Archive className="h-8 w-8 text-element-gray-dark/50" />
                      <p className="text-element-gray-dark/70">Nenhum produto encontrado</p>
                      <p className="text-element-gray-dark/50 text-sm">Tente ajustar seus filtros</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Stock Update Dialog */}
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Atualizar Estoque</DialogTitle>
              <DialogDescription>
                Adicione ou remova unidades do estoque do produto {selectedProduct?.name}.
                Valores negativos irão reduzir o estoque.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-element-blue-dark" />
                <span className="font-medium">{selectedProduct?.name}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="text-sm">
                  <p>Estoque atual:</p>
                  <p className="font-medium text-lg">{selectedProduct?.stock} unidades</p>
                </div>
                
                <div>
                  <label className="text-sm">Quantidade a adicionar/remover:</label>
                  <Input 
                    type="number"
                    value={stockUpdateAmount.toString()}
                    onChange={(e) => setStockUpdateAmount(parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm flex items-center">
                  <span className="font-medium mr-2">Novo estoque total:</span> 
                  <span className={`font-bold ${
                    (selectedProduct?.stock || 0) + stockUpdateAmount < 0 
                      ? 'text-red-500' 
                      : 'text-element-blue-dark'
                  }`}>
                    {(selectedProduct?.stock || 0) + stockUpdateAmount} unidades
                  </span>
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => handleStockUpdate(selectedProduct?.id || '', (selectedProduct?.stock || 0) + stockUpdateAmount)}
                disabled={(selectedProduct?.stock || 0) + stockUpdateAmount < 0}
                className="bg-element-blue-dark"
              >
                Salvar alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Produto</DialogTitle>
              <DialogDescription>
                Atualize as informações do produto {editingProduct?.name}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome do Produto</label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <Select value={editForm.category} onValueChange={(value) => setEditForm({ ...editForm, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preço de Venda</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preço de Custo</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.costPrice}
                    onChange={(e) => setEditForm({ ...editForm, costPrice: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estoque</label>
                  <Input
                    type="number"
                    value={editForm.stock}
                    onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                  />
                  <span className="text-xs text-gray-500">Digite o estoque usando ponto para decimais. Exemplo: 50.5 para 50 unidades e meia.</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unidade do Produto</label>
                  <Select value={editForm.unit || ''} onValueChange={(value) => setEditForm({ ...editForm, unit: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="unidade">Unidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantidade por Unidade</label>
                  <Input
                    type="number"
                    value={editForm.quantityPerUnit || ''}
                    onChange={(e) => setEditForm({ ...editForm, quantityPerUnit: e.target.value })}
                  />
                  <span className="text-xs text-gray-500">Informe quantos ml tem cada unidade (ex: 900 para 900ml por garrafa).</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição</label>
                <textarea
                  className="w-full min-h-[100px] p-2 border rounded-md"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Imagem do Produto</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setEditForm({ ...editForm, image: file });
                    }
                  }}
                />
              </div>

              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!editForm.canSellByUnit}
                    onChange={e => setEditForm({ ...editForm, canSellByUnit: e.target.checked })}
                  />
                  Permitir venda por unidade
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!editForm.canSellByDose}
                    onChange={e => setEditForm({ ...editForm, canSellByDose: e.target.checked })}
                  />
                  Permitir venda por dose
                </label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditSave} className="bg-element-blue-dark">
                Salvar alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminStock;
