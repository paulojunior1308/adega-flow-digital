
import React, { useState } from 'react';
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
  PackageCheck,
  Truck,
  FileCheck,
  LogOut as LogOutIcon
} from 'lucide-react';

const AdminSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
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
      icon: <Users className="h-5 w-5" />, 
      label: 'Cadastro de Clientes', 
      path: '/admin-clientes' 
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
      icon: <Receipt className="h-5 w-5" />, 
      label: 'Contas a Pagar', 
      path: '/admin-contas' 
    },
    { 
      icon: <Store className="h-5 w-5" />, 
      label: 'Caixa', 
      path: '/admin-caixa' 
    },
    { 
      icon: <PackageCheck className="h-5 w-5" />, 
      label: 'Inventário', 
      path: '/admin-inventario' 
    },
    { 
      icon: <FileCheck className="h-5 w-5" />, 
      label: 'Relatório de Vendas', 
      path: '/admin-relatorios' 
    }
  ];
  
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };
  
  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        className="lg:hidden fixed z-20 top-4 left-4 p-2 rounded-md bg-element-blue-dark text-white"
        onClick={toggleMobile}
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
      
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
                  {item.icon}
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
              <LogOutIcon className="h-5 w-5" />
              {!isCollapsed && <span className="ml-3">Sair</span>}
            </NavLink>
          </div>
        </div>
      </aside>
      
      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-10 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={toggleMobile}></div>
          <aside className="absolute left-0 top-0 h-full w-64 bg-element-blue-dark shadow-lg animate-slide-in-right">
            <div className="flex flex-col h-full">
              <div className="p-4 flex justify-between items-center border-b border-element-blue-neon/20">
                <div className="bg-white p-1 rounded flex items-center justify-center">
                  <img 
                    src="/lovable-uploads/fde6ed06-8df2-4405-b0ed-5e5f59e91ed4.png" 
                    alt="Element Adega Admin" 
                    className="h-8"
                  />
                </div>
                <button 
                  onClick={toggleMobile}
                  className="p-2 rounded-md hover:bg-white/10 text-white"
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
                      onClick={toggleMobile}
                    >
                      {item.icon}
                      <span className="ml-3">{item.label}</span>
                    </NavLink>
                  ))}
                </nav>
              </div>
              
              <div className="p-4 border-t border-element-blue-neon/20">
                <NavLink
                  to="/login"
                  className="flex items-center p-3 rounded-lg text-white hover:bg-white/10 transition-colors"
                  onClick={toggleMobile}
                >
                  <LogOutIcon className="h-5 w-5" />
                  <span className="ml-3">Sair</span>
                </NavLink>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
