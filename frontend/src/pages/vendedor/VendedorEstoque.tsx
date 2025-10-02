import React, { useState, useEffect } from 'react';
import VendedorLayout from '@/components/vendedor/VendedorLayout';
import { 
  Search, 
  Filter, 
  AlertTriangle,
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
  stock: number;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  category: {
    name: string;
  };
  supplier?: {
    name: string;
  };
  image?: string;
}

const VendedorEstoque = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const itemsPerPage = 10;

  // Buscar produtos e categorias
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get('/vendedor/stock', {
            params: {
              page: currentPage,
              limit: itemsPerPage,
              search: searchTerm,
              status: statusFilter
            }
          }),
          api.get('/vendedor/categories')
        ]);

        setProducts(productsRes.data.data.products || []);
        setTotalPages(productsRes.data.data.pagination?.pages || 1);
        setCategories(categoriesRes.data.data || []);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do estoque",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, searchTerm, statusFilter]);

  // Filtrar produtos localmente
  useEffect(() => {
    let filtered = [...products];

    if (categoryFilter) {
      filtered = filtered.filter(p => p.category.name === categoryFilter);
    }

    setFilteredProducts(filtered);
  }, [products, categoryFilter]);

  const getStatusBadge = (status: string, stock: number) => {
    if (status === 'OUT_OF_STOCK' || stock === 0) {
      return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">Esgotado</Badge>;
    } else if (status === 'LOW_STOCK' || stock < 5) {
      return <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">Estoque Baixo</Badge>;
    } else {
      return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Em Estoque</Badge>;
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (value: string) => {
    setCategoryFilter(value);
  };

  if (loading) {
    return (
      <VendedorLayout>
        <div className="min-h-screen bg-element-gray-light flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-element-blue-dark mx-auto mb-4"></div>
            <p className="text-element-gray-dark">Carregando estoque...</p>
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
              Controle de Estoque
            </h1>
            <p className="text-element-gray-dark">
              Visualize e monitore o estoque dos produtos
            </p>
          </div>

          {/* Filtros */}
          <div className="element-card p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-element-gray-dark/50 h-4 w-4" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status do estoque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  <SelectItem value="IN_STOCK">Em estoque</SelectItem>
                  <SelectItem value="LOW_STOCK">Estoque baixo</SelectItem>
                  <SelectItem value="OUT_OF_STOCK">Esgotado</SelectItem>
                </SelectContent>
              </Select>

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
                  setStatusFilter('');
                  setCategoryFilter('');
                  setCurrentPage(1);
                }}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
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
                        <h3 className="font-medium text-element-blue-dark">{product.name}</h3>
                        <p className="text-sm text-element-gray-dark/70">
                          {product.category.name}
                          {product.supplier && ` • ${product.supplier.name}`}
                        </p>
                        {product.description && (
                          <p className="text-xs text-element-gray-dark/60 mt-1">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-element-blue-dark">
                          R$ {product.price.toFixed(2)}
                        </p>
                        <p className="text-sm text-element-gray-dark/70">
                          {product.stock} unidades
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(product.stockStatus, product.stock)}
                        {(product.stockStatus === 'LOW_STOCK' || product.stock < 5) && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
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

export default VendedorEstoque;
