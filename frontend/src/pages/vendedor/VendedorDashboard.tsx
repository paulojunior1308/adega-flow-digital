import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Package, 
  Archive, 
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Truck,
  Clock,
  MapPin,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import api from '@/lib/axios';
import { useAuth } from '@/hooks/useAuth';

// Componente para cards de estatísticas
const StatCard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon 
}: { 
  title: string; 
  value: string; 
  change?: string; 
  changeType?: 'up' | 'down'; 
  icon: React.ReactNode 
}) => {
  return (
    <div className="element-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="bg-element-gray-light rounded-lg p-3">
          {icon}
        </div>
        {change && (
          <div className={`flex items-center ${changeType === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {changeType === 'up' ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
            {change}
          </div>
        )}
      </div>
      <h3 className="text-element-gray-dark/70 text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-element-blue-dark">{value}</p>
    </div>
  );
};

// Interface para vendas
interface Sale {
  id: string;
  client?: {
    name: string;
  };
  total: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  paymentMethod?: {
    name: string;
  };
  items: {
    product: {
      name: string;
    };
    quantity: number;
    price: number;
  }[];
}

const VendedorDashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Buscar dados do dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashboardRes, salesRes, stockRes] = await Promise.all([
          api.get('/vendedor/dashboard'),
          api.get('/vendedor/sales'),
          api.get('/vendedor/stock')
        ]);

        setDashboardData(dashboardRes.data.data);
        setSales(salesRes.data.data.sales || []);
        setProducts(stockRes.data.data.products || []);
        setLowStockProducts(products.filter(p => p.stockStatus === 'LOW_STOCK' || p.stock < 5));
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do dashboard",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Atualizar lista de produtos com estoque baixo quando products mudar
  useEffect(() => {
    setLowStockProducts(products.filter(p => p.stockStatus === 'LOW_STOCK' || p.stock < 5));
  }, [products]);

  if (loading) {
    return (
      <div className="min-h-screen bg-element-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-element-blue-dark mx-auto mb-4"></div>
          <p className="text-element-gray-dark">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-element-gray-light">
      <div className="lg:pl-64 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-element-blue-dark mb-2">
              Dashboard do Vendedor
            </h1>
            <p className="text-element-gray-dark">
              Bem-vindo, {user?.name}! Acompanhe suas vendas e estoque
            </p>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard 
              title="Total de Produtos"
              value={dashboardData?.totalProducts?.toString() || '0'}
              icon={<Package className="h-6 w-6 text-element-blue-dark" />} 
            />
            <StatCard 
              title="Produtos com Estoque Baixo"
              value={dashboardData?.lowStockProducts?.toString() || '0'}
              change={dashboardData?.lowStockProducts > 0 ? "Atenção necessária" : "Tudo em ordem"}
              changeType={dashboardData?.lowStockProducts > 0 ? "down" : "up"}
              icon={<AlertTriangle className="h-6 w-6 text-orange-500" />} 
            />
            <StatCard 
              title="Categorias Ativas"
              value={dashboardData?.totalCategories?.toString() || '0'}
              icon={<Archive className="h-6 w-6 text-element-blue-dark" />} 
            />
            <StatCard 
              title="Vendas (7 dias)"
              value={dashboardData?.recentSales?.toString() || '0'}
              icon={<TrendingUp className="h-6 w-6 text-green-500" />} 
            />
          </div>

          {/* Ações Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link to="/vendedor/estoque" className="element-card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <Archive className="h-8 w-8 text-element-blue-dark mr-3" />
                <h3 className="text-lg font-semibold text-element-blue-dark">Consultar Estoque</h3>
              </div>
              <p className="text-element-gray-dark/70 text-sm">
                Visualize produtos, quantidades e status do estoque
              </p>
            </Link>

            <Link to="/vendedor/produtos" className="element-card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <Package className="h-8 w-8 text-element-blue-dark mr-3" />
                <h3 className="text-lg font-semibold text-element-blue-dark">Cadastrar Produtos</h3>
              </div>
              <p className="text-element-gray-dark/70 text-sm">
                Adicione novos produtos ao catálogo
              </p>
            </Link>

            <Link to="/vendedor/pdv" className="element-card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <ShoppingCart className="h-8 w-8 text-element-blue-dark mr-3" />
                <h3 className="text-lg font-semibold text-element-blue-dark">PDV</h3>
              </div>
              <p className="text-element-gray-dark/70 text-sm">
                Sistema de ponto de venda para vendas presenciais
              </p>
            </Link>
          </div>

          {/* Produtos com Estoque Baixo */}
          <div className="element-card p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-element-blue-dark">Produtos com Estoque Baixo</h2>
              <Link to="/vendedor/estoque" className="element-link text-sm">Ver todos</Link>
            </div>
            <div className="space-y-4">
              {lowStockProducts.length === 0 ? (
                <p className="text-element-gray-dark text-center py-8">
                  Nenhum produto com estoque baixo
                </p>
              ) : (
                lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-element-gray-light/50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${product.stock < 2 ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                      <div>
                        <h4 className="font-medium text-element-blue-dark">{product.name}</h4>
                        <p className="text-sm text-element-gray-dark/70">
                          {product.stock} unidades restantes
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={product.stock < 2 ? 'border-red-200 text-red-700' : 'border-orange-200 text-orange-700'}>
                      {product.stock < 2 ? 'Crítico' : 'Baixo'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Vendas Recentes */}
          <div className="element-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-element-blue-dark">Vendas Recentes</h2>
              <Link to="/vendedor/vendas" className="element-link text-sm">Ver todas</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-element-gray-light">
                    <th className="py-3 text-left text-sm font-medium text-element-gray-dark/70">ID</th>
                    <th className="py-3 text-left text-sm font-medium text-element-gray-dark/70">Cliente</th>
                    <th className="py-3 text-left text-sm font-medium text-element-gray-dark/70">Valor</th>
                    <th className="py-3 text-left text-sm font-medium text-element-gray-dark/70">Status</th>
                    <th className="py-3 text-left text-sm font-medium text-element-gray-dark/70">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.slice(0, 5).map((sale) => (
                    <tr key={sale.id} className="border-b border-element-gray-light">
                      <td className="py-3 text-sm">{sale.id.slice(0, 8)}...</td>
                      <td className="py-3 text-sm">{sale.client?.name || 'Cliente não informado'}</td>
                      <td className="py-3 text-sm">R$ {sale.total.toFixed(2)}</td>
                      <td className="py-3 text-sm">
                        <Badge 
                          variant="outline" 
                          className={
                            sale.status === 'COMPLETED' 
                              ? 'bg-green-100 text-green-700 border-green-200' 
                              : sale.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                              : 'bg-red-100 text-red-700 border-red-200'
                          }
                        >
                          {sale.status === 'COMPLETED' ? 'Concluída' : 
                           sale.status === 'PENDING' ? 'Pendente' : 'Cancelada'}
                        </Badge>
                      </td>
                      <td className="py-3 text-sm">
                        {new Date(sale.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sales.length === 0 && (
                <p className="text-element-gray-dark text-center py-8">
                  Nenhuma venda encontrada
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendedorDashboard;
