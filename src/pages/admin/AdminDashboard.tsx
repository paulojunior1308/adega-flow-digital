
import React from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { 
  TrendingUp, 
  Package, 
  Archive, 
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

// We would normally use recharts for these charts
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

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-element-gray-light">
      <AdminSidebar />
      
      <div className="lg:pl-64 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-element-blue-dark mb-2">Dashboard</h1>
            <p className="text-element-gray-dark">Visão geral do seu negócio</p>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard 
              title="Vendas do Dia"
              value="R$ 1.258,90"
              change="12%"
              changeType="up"
              icon={<TrendingUp className="h-6 w-6 text-element-blue-dark" />}
            />
            <StatCard 
              title="Pedidos Pendentes"
              value="24"
              change="5%"
              changeType="up"
              icon={<Package className="h-6 w-6 text-element-blue-dark" />}
            />
            <StatCard 
              title="Itens em Estoque"
              value="315"
              change="3%"
              changeType="down"
              icon={<Archive className="h-6 w-6 text-element-blue-dark" />}
            />
            <StatCard 
              title="Ticket Médio"
              value="R$ 52,45"
              change="8%"
              changeType="up"
              icon={<ShoppingCart className="h-6 w-6 text-element-blue-dark" />}
            />
          </div>
          
          {/* Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="element-card p-6">
              <h2 className="text-lg font-semibold text-element-blue-dark mb-6">Vendas dos Últimos 7 Dias</h2>
              <div className="h-64 flex items-center justify-center bg-element-gray-light/50 rounded-lg">
                {/* We would normally use recharts here */}
                <p className="text-element-gray-dark text-center">
                  Gráfico de Vendas<br />
                  (Visualização simplificada)
                </p>
              </div>
            </div>
            
            <div className="element-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-element-blue-dark">Últimos Pedidos</h2>
                <Link to="/admin-pedidos" className="element-link text-sm">Ver todos</Link>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-element-gray-light">
                      <th className="py-3 text-left text-sm font-medium text-element-gray-dark/70">ID</th>
                      <th className="py-3 text-left text-sm font-medium text-element-gray-dark/70">Cliente</th>
                      <th className="py-3 text-left text-sm font-medium text-element-gray-dark/70">Valor</th>
                      <th className="py-3 text-left text-sm font-medium text-element-gray-dark/70">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-element-gray-light">
                      <td className="py-3 text-sm">#1234</td>
                      <td className="py-3 text-sm">Carlos Silva</td>
                      <td className="py-3 text-sm">R$ 89,90</td>
                      <td className="py-3 text-sm">
                        <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">
                          Entregue
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-element-gray-light">
                      <td className="py-3 text-sm">#1233</td>
                      <td className="py-3 text-sm">Maria Souza</td>
                      <td className="py-3 text-sm">R$ 145,50</td>
                      <td className="py-3 text-sm">
                        <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs">
                          Em entrega
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-element-gray-light">
                      <td className="py-3 text-sm">#1232</td>
                      <td className="py-3 text-sm">João Santos</td>
                      <td className="py-3 text-sm">R$ 65,00</td>
                      <td className="py-3 text-sm">
                        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">
                          Preparando
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-sm">#1231</td>
                      <td className="py-3 text-sm">Ana Costa</td>
                      <td className="py-3 text-sm">R$ 112,30</td>
                      <td className="py-3 text-sm">
                        <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">
                          Entregue
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="element-card p-6">
              <h2 className="text-lg font-semibold text-element-blue-dark mb-6">Produtos Mais Vendidos</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-element-gray-light rounded-md flex items-center justify-center mr-4">
                    <span className="font-bold text-element-blue-dark">1</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Skol 350ml</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-element-gray-dark/70">258 unidades</p>
                      <p className="text-sm font-medium">R$ 3,49/un</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-element-gray-light rounded-md flex items-center justify-center mr-4">
                    <span className="font-bold text-element-blue-dark">2</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Red Bull 250ml</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-element-gray-dark/70">147 unidades</p>
                      <p className="text-sm font-medium">R$ 9,90/un</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-element-gray-light rounded-md flex items-center justify-center mr-4">
                    <span className="font-bold text-element-blue-dark">3</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Essência Love66</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-element-gray-dark/70">98 unidades</p>
                      <p className="text-sm font-medium">R$ 29,90/un</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-element-gray-light rounded-md flex items-center justify-center mr-4">
                    <span className="font-bold text-element-blue-dark">4</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Vodka Smirnoff</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-element-gray-dark/70">76 unidades</p>
                      <p className="text-sm font-medium">R$ 42,90/un</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="element-card p-6">
              <h2 className="text-lg font-semibold text-element-blue-dark mb-6">Estoque Baixo</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-2 h-10 bg-red-500 rounded-full mr-4"></div>
                  <div className="flex-1">
                    <h4 className="font-medium">Jack Daniel's 1L</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-element-gray-dark/70">2 unidades restantes</p>
                      <Link to="/admin-estoque" className="text-sm text-element-blue-neon font-medium">
                        Repor
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-2 h-10 bg-red-500 rounded-full mr-4"></div>
                  <div className="flex-1">
                    <h4 className="font-medium">Carvão para Narguilé</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-element-gray-dark/70">3 unidades restantes</p>
                      <Link to="/admin-estoque" className="text-sm text-element-blue-neon font-medium">
                        Repor
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-2 h-10 bg-orange-500 rounded-full mr-4"></div>
                  <div className="flex-1">
                    <h4 className="font-medium">Monster Energy 473ml</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-element-gray-dark/70">8 unidades restantes</p>
                      <Link to="/admin-estoque" className="text-sm text-element-blue-neon font-medium">
                        Repor
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-2 h-10 bg-orange-500 rounded-full mr-4"></div>
                  <div className="flex-1">
                    <h4 className="font-medium">Heineken Long Neck</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-element-gray-dark/70">12 unidades restantes</p>
                      <Link to="/admin-estoque" className="text-sm text-element-blue-neon font-medium">
                        Repor
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
