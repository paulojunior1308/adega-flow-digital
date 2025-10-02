import React, { useState, useEffect } from 'react';
import VendedorLayout from '@/components/vendedor/VendedorLayout';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Package,
  Eye,
  EyeOff
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  barcode?: string;
  sku?: string;
  active: boolean;
  category: {
    id: string;
    name: string;
  };
  supplier?: {
    id: string;
    name: string;
  };
  image?: string;
}

const VendedorProdutos = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showInactive, setShowInactive] = useState(false);
  const { toast } = useToast();

  const itemsPerPage = 10;

  // Buscar dados
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes, suppliersRes] = await Promise.all([
          api.get('/vendedor/products', {
            params: {
              page: currentPage,
              limit: itemsPerPage,
              search: searchTerm,
              category: categoryFilter
            }
          }),
          api.get('/vendedor/categories'),
          api.get('/admin/suppliers') // Assumindo que vendedores podem ver fornecedores
        ]);

        setProducts(productsRes.data.data.products || []);
        setTotalPages(productsRes.data.data.pagination?.pages || 1);
        setCategories(categoriesRes.data.data || []);
        setSuppliers(suppliersRes.data.data || []);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados dos produtos",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, searchTerm, categoryFilter]);

  // Filtrar produtos localmente
  useEffect(() => {
    let filtered = [...products];

    if (!showInactive) {
      filtered = filtered.filter(p => p.active);
    }

    setFilteredProducts(filtered);
  }, [products, showInactive]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/admin/products/${productId}`, {
        active: !currentStatus
      });

      setProducts(prev => 
        prev.map(p => 
          p.id === productId ? { ...p, active: !currentStatus } : p
        )
      );

      toast({
        title: "Status atualizado",
        description: `Produto ${currentStatus ? 'desativado' : 'ativado'} com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do produto",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <VendedorLayout>
        <div className="min-h-screen bg-element-gray-light flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-element-blue-dark mx-auto mb-4"></div>
            <p className="text-element-gray-dark">Carregando produtos...</p>
          </div>
        </div>
      </VendedorLayout>
    );
  }

  return (
    <VendedorLayout>
      <div className="lg:pl-64 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-element-blue-dark mb-2">
              Cadastro de Produtos
            </h1>
            <p className="text-element-gray-dark">
              Gerencie o catálogo de produtos
            </p>
          </div>

          {/* Ações e Filtros */}
          <div className="element-card p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center space-x-4">
                <Button className="bg-element-blue-dark hover:bg-element-blue-dark/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Produto
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowInactive(!showInactive)}
                >
                  {showInactive ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {showInactive ? 'Ocultar Inativos' : 'Mostrar Inativos'}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-element-gray-dark/50 h-4 w-4" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('');
                  setCurrentPage(1);
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>

          {/* Lista de Produtos */}
          <div className="element-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-element-blue-dark">
                Produtos ({filteredProducts.length})
              </h2>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-element-gray-dark/50 mx-auto mb-4" />
                <p className="text-element-gray-dark">Nenhum produto encontrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 bg-element-gray-light/30 rounded-lg hover:bg-element-gray-light/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-element-gray-light rounded-lg flex items-center justify-center">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-element-gray-dark/50" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-element-blue-dark">{product.name}</h3>
                          <Badge variant={product.active ? "default" : "secondary"}>
                            {product.active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <p className="text-sm text-element-gray-dark/70">
                          {product.category.name}
                          {product.supplier && ` • ${product.supplier.name}`}
                        </p>
                        {product.description && (
                          <p className="text-xs text-element-gray-dark/60 mt-1">
                            {product.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-element-gray-dark/60">
                            SKU: {product.sku || 'N/A'}
                          </span>
                          <span className="text-xs text-element-gray-dark/60">
                            Código: {product.barcode || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-element-blue-dark">
                          R$ {product.price.toFixed(2)}
                        </p>
                        <p className="text-sm text-element-gray-dark/70">
                          Estoque: {product.stock}
                        </p>
                        <p className="text-xs text-element-gray-dark/60">
                          Custo: R$ {product.costPrice.toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {/* Implementar edição */}}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleProductStatus(product.id, product.active)}
                        >
                          {product.active ? 'Desativar' : 'Ativar'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-element-gray-dark/70">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </VendedorLayout>
  );
};

export default VendedorProdutos;
