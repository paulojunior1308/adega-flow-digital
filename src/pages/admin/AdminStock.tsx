
import React, { useState } from 'react';
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

// Product interface
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  stockStatus: 'low' | 'medium' | 'high' | 'out';
  supplier: string;
  lastUpdated: string;
}

// Sample data for products
const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Cerveja Heineken Lata 350ml',
    category: 'Cervejas',
    price: 5.90,
    stock: 120,
    stockStatus: 'high',
    supplier: 'Distribuidora Sul',
    lastUpdated: '2025-05-10'
  },
  {
    id: '2',
    name: 'Vodka Absolut Original 750ml',
    category: 'Destilados',
    price: 89.90,
    stock: 18,
    stockStatus: 'low',
    supplier: 'Importadora Primavera',
    lastUpdated: '2025-05-08'
  },
  {
    id: '3',
    name: 'Energético Red Bull 250ml',
    category: 'Energéticos',
    price: 9.90,
    stock: 45,
    stockStatus: 'medium',
    supplier: 'Distribuidora Central',
    lastUpdated: '2025-05-12'
  },
  {
    id: '4',
    name: 'Whisky Jack Daniel\'s 1L',
    category: 'Destilados',
    price: 139.90,
    stock: 12,
    stockStatus: 'low',
    supplier: 'Importadora Primavera',
    lastUpdated: '2025-05-05'
  },
  {
    id: '5',
    name: 'Vinho Tinto Salton Intenso 750ml',
    category: 'Vinhos',
    price: 45.90,
    stock: 28,
    stockStatus: 'medium',
    supplier: 'Vinícola Sul',
    lastUpdated: '2025-05-11'
  },
  {
    id: '6',
    name: 'Cerveja Brahma Duplo Malte 350ml',
    category: 'Cervejas',
    price: 3.90,
    stock: 200,
    stockStatus: 'high',
    supplier: 'Distribuidora Sul',
    lastUpdated: '2025-05-09'
  },
  {
    id: '7',
    name: 'Gin Tanqueray 750ml',
    category: 'Destilados',
    price: 129.90,
    stock: 0,
    stockStatus: 'out',
    supplier: 'Importadora Primavera',
    lastUpdated: '2025-05-07'
  },
  {
    id: '8',
    name: 'Essência de Narguilé Menta 50g',
    category: 'Narguilé',
    price: 15.90,
    stock: 8,
    stockStatus: 'low',
    supplier: 'Distribuidora Oriental',
    lastUpdated: '2025-05-10'
  },
  {
    id: '9',
    name: 'Carvão para Narguilé Premium 1kg',
    category: 'Narguilé',
    price: 29.90,
    stock: 25,
    stockStatus: 'medium',
    supplier: 'Distribuidora Oriental',
    lastUpdated: '2025-05-06'
  },
  {
    id: '10',
    name: 'Água Mineral sem Gás 500ml',
    category: 'Água',
    price: 2.50,
    stock: 150,
    stockStatus: 'high',
    supplier: 'Distribuidora Central',
    lastUpdated: '2025-05-12'
  }
];

// Categories from products
const categories = Array.from(new Set(sampleProducts.map(product => product.category)));

// Suppliers from products
const suppliers = Array.from(new Set(sampleProducts.map(product => product.supplier)));

const AdminStock = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockUpdateAmount, setStockUpdateAmount] = useState<number>(0);
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product, direction: 'asc' | 'desc' } | null>(null);
  
  const { toast } = useToast();

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
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
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
  const handleStockUpdate = () => {
    if (!selectedProduct) return;
    
    const updatedProducts = products.map(product => {
      if (product.id === selectedProduct.id) {
        const newStock = product.stock + stockUpdateAmount;
        let newStockStatus: 'low' | 'medium' | 'high' | 'out' = product.stockStatus;
        
        if (newStock <= 0) {
          newStockStatus = 'out';
        } else if (newStock < 20) {
          newStockStatus = 'low';
        } else if (newStock < 50) {
          newStockStatus = 'medium';
        } else {
          newStockStatus = 'high';
        }
        
        return {
          ...product,
          stock: newStock,
          stockStatus: newStockStatus,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      return product;
    });
    
    setProducts(updatedProducts);
    setIsUpdateDialogOpen(false);
    
    toast({
      title: "Estoque atualizado",
      description: `${selectedProduct.name} atualizado em ${stockUpdateAmount > 0 ? '+' : ''}${stockUpdateAmount} unidades.`,
      variant: stockUpdateAmount >= 0 ? "default" : "destructive",
    });
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
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status Estoque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="low">Baixo Estoque</SelectItem>
                  <SelectItem value="out">Esgotado</SelectItem>
                  <SelectItem value="available">Disponível</SelectItem>
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
                <TableHead>Status</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Última Atualização</TableHead>
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
                    <TableCell>{product.category}</TableCell>
                    <TableCell>R$ {product.price.toFixed(2)}</TableCell>
                    <TableCell className="font-medium">
                      {product.stock === 0 ? (
                        <span className="text-red-500">0</span>
                      ) : (
                        product.stock
                      )}
                    </TableCell>
                    <TableCell>{getStockStatusBadge(product.stockStatus)}</TableCell>
                    <TableCell>{product.supplier}</TableCell>
                    <TableCell>{product.lastUpdated}</TableCell>
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
                          <DropdownMenuItem>Editar produto</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            Remover produto
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
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
                onClick={handleStockUpdate}
                disabled={(selectedProduct?.stock || 0) + stockUpdateAmount < 0}
                className="bg-element-blue-dark"
              >
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
