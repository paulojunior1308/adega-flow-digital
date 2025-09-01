import React, { Dispatch, SetStateAction } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Package, 
  Archive, 
  Plus, 
  Menu,
  X,
  DollarSign,
  CreditCard,
  Receipt,
  Users,
  Store,
  Truck,
  Tag,
  TrendingUp,
  LogOut as LogOutIcon,
  FolderOpen,
  Database,
  Clock
} from 'lucide-react';

interface AdminSidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: Dispatch<SetStateAction<boolean>>;
}

const AdminSidebar = ({ isCollapsed, toggleSidebar, isMobileOpen, setIsMobileOpen }: AdminSidebarProps) => {
  const menuItems = [
    { 
      icon: <Home className="h-5 w-5" />, 
      label: 'Dashboard', 
      path: '/admin-dashboard' 
    },
    { 
      icon: <Archive className="h-5 w-5" />, 
      label: 'Estoque', 
      path: '/admin-estoque' 
    },
    { 
      icon: <Plus className="h-5 w-5" />, 
      label: 'Cadastrar Produtos', 
      path: '/admin-cadastro-produtos' 
    },
    { 
      icon: <FolderOpen className="h-5 w-5" />, 
      label: 'Categorias', 
      path: '/admin-categorias' 
    },
    { 
      icon: <Package className="h-5 w-5" />, 
      label: 'Pedidos', 
      path: '/admin-pedidos' 
    },
    { 
      icon: <DollarSign className="h-5 w-5" />, 
      label: 'Controle de Vendas', 
      path: '/admin-vendas' 
    },
    { 
      icon: <TrendingUp className="h-5 w-5" />, 
      label: 'Financeiro', 
      path: '/admin-finance' 
    },
    { 
      icon: <Users className="h-5 w-5" />, 
      label: 'Lista de Clientes', 
      path: '/admin-clientes' 
    },
    { 
      icon: <Users className="h-5 w-5" />, 
      label: 'Usuários', 
      path: '/admin-usuarios' 
    },
    { 
      icon: <Tag className="h-5 w-5" />, 
      label: 'Promoções e Combos', 
      path: '/admin-promocoes-combos' 
    },
    { 
      icon: <Truck className="h-5 w-5" />, 
      label: 'Cadastro de Fornecedores', 
      path: '/admin-fornecedores' 
    },
    { 
      icon: <CreditCard className="h-5 w-5" />, 
      label: 'Meios de Pagamento', 
      path: '/admin-pagamentos' 
    },
    { 
      icon: <Store className="h-5 w-5" />, 
      label: 'Caixa', 
      path: '/admin-pdv' 
    },
    { 
      icon: <Clock className="h-5 w-5" />, 
      label: 'Sessões PDV', 
      path: '/admin-pdv-sessions' 
    },
    { 
      icon: <Database className="h-5 w-5" />, 
      label: 'Backup (Temp)', 
      path: '/admin-backup' 
    }
  ];
  
  return (
    <>
      {/* Mobile Menu Button is handled by AdminLayout now, so it's removed from here */}
      
      {/* Desktop Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-element-blue-dark shadow-lg transition-all duration-300 z-10
        ${isCollapsed ? 'w-20' : 'w-64'}
        hidden lg:block
      `}>
        <div className="flex flex-col h-full">
          <div className={`p-4 flex ${isCollapsed ? 'justify-center' : 'justify-between'} items-center border-b border-element-blue-neon/20`}>
            {!isCollapsed && (
              <div className="bg-white p-1 rounded flex items-center justify-center">
                <img 
                  src="/lovable-uploads/fde6ed06-8df2-4405-b0ed-5e5f59e91ed4.png" 
                  alt="Element Adega Admin" 
                  className="h-8"
                />
              </div>
            )}
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-element-blue-dark/50 text-white"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
          
          <div className="px-3 py-4 flex-1 overflow-y-auto">
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center p-3 rounded-lg transition-colors
                    ${isActive ? 'bg-element-blue-neon text-element-gray-dark' : 'hover:bg-white/10 text-white'}
                  `}
                >
                  <span className="flex items-center justify-center w-5 h-5">{item.icon}</span>
                  {!isCollapsed && <span className="ml-3">{item.label}</span>}
                </NavLink>
              ))}
            </nav>
          </div>
          
          <div className="p-4 border-t border-element-blue-neon/20">
            <NavLink
              to="/login"
              className="flex items-center p-3 rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              <span className="flex items-center justify-center w-5 h-5"><LogOutIcon className="h-5 w-5" /></span>
              {!isCollapsed && <span className="ml-3">Sair</span>}
            </NavLink>
          </div>
        </div>
      </aside>
      
      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)}></div>
          <aside className="absolute left-0 top-0 h-full w-64 bg-element-blue-dark shadow-lg animate-slide-in-right flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-element-blue-neon/20">
              <div className="bg-white p-1 rounded flex items-center justify-center mr-2 mt-2 mb-2 ml-2">
                <img 
                  src="/lovable-uploads/fde6ed06-8df2-4405-b0ed-5e5f59e91ed4.png" 
                  alt="Element Adega Admin" 
                  className="h-8"
                />
              </div>
              <button 
                onClick={() => setIsMobileOpen(false)}
                className="p-2 rounded-md hover:bg-white/10 text-white ml-auto mt-2"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="px-3 py-4 flex-1 overflow-y-auto">
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `
                      flex items-center p-3 rounded-lg transition-colors
                      ${isActive ? 'bg-element-blue-neon text-element-gray-dark' : 'hover:bg-white/10 text-white'}
                    `}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <span className="flex items-center justify-center w-5 h-5">{item.icon}</span>
                    <span className="ml-3">{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
            
            <div className="p-4 border-t border-element-blue-neon/20">
              <NavLink
                to="/login"
                className="flex items-center p-3 rounded-lg text-white hover:bg-white/10 transition-colors"
                onClick={() => setIsMobileOpen(false)}
              >
                <span className="flex items-center justify-center w-5 h-5"><LogOutIcon className="h-5 w-5" /></span>
                <span className="ml-3">Sair</span>
              </NavLink>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
