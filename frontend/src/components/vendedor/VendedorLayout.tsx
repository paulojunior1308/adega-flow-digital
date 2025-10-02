import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Package, 
  Archive, 
  ShoppingCart,
  Menu,
  X,
  LogOut as LogOutIcon
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface VendedorLayoutProps {
  children: React.ReactNode;
}

const VendedorLayout = ({ children }: VendedorLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { 
      icon: <Home className="h-5 w-5" />, 
      label: 'Dashboard', 
      path: '/vendedor/dashboard' 
    },
    { 
      icon: <Archive className="h-5 w-5" />, 
      label: 'Estoque', 
      path: '/vendedor/estoque' 
    },
    { 
      icon: <Package className="h-5 w-5" />, 
      label: 'Cadastrar Produtos', 
      path: '/vendedor/produtos' 
    },
    { 
      icon: <ShoppingCart className="h-5 w-5" />, 
      label: 'PDV', 
      path: '/vendedor/pdv' 
    }
  ];

  return (
    <div className="min-h-screen bg-element-gray-light">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-element-blue-dark text-white rounded-md shadow-lg"
      >
        <Menu className="h-6 w-6" />
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
                  alt="Element Adega Vendedor" 
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
            <div className="flex items-center p-3 rounded-lg text-white mb-2">
              <div className="w-8 h-8 bg-element-blue-neon rounded-full flex items-center justify-center mr-3">
                <span className="text-element-gray-dark font-semibold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              {!isCollapsed && (
                <div>
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-white/70">Vendedor</p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center p-3 rounded-lg text-white hover:bg-white/10 transition-colors w-full"
            >
              <span className="flex items-center justify-center w-5 h-5"><LogOutIcon className="h-5 w-5" /></span>
              {!isCollapsed && <span className="ml-3">Sair</span>}
            </button>
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
                  alt="Element Adega Vendedor" 
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
              <div className="flex items-center p-3 rounded-lg text-white mb-2">
                <div className="w-8 h-8 bg-element-blue-neon rounded-full flex items-center justify-center mr-3">
                  <span className="text-element-gray-dark font-semibold text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-white/70">Vendedor</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center p-3 rounded-lg text-white hover:bg-white/10 transition-colors w-full"
              >
                <span className="flex items-center justify-center w-5 h-5"><LogOutIcon className="h-5 w-5" /></span>
                <span className="ml-3">Sair</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      {children}
    </div>
  );
};

export default VendedorLayout;
