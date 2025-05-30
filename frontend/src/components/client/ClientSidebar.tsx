import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Home, 
  ShoppingCart, 
  Map, 
  Truck, 
  User, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

const ClientSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  
  const menuItems = [
    { 
      icon: <Home className="h-5 w-5" />, 
      label: 'Início', 
      path: '/cliente-dashboard' 
    },
    { 
      icon: <BookOpen className="h-5 w-5" />, 
      label: 'Catálogo', 
      path: '/cliente-catalogo' 
    },
    { 
      icon: <ShoppingCart className="h-5 w-5" />, 
      label: 'Carrinho', 
      path: '/cliente-carrinho' 
    },
    { 
      icon: <Map className="h-5 w-5" />, 
      label: 'Endereços', 
      path: '/cliente-enderecos' 
    },
    { 
      icon: <Truck className="h-5 w-5" />, 
      label: 'Meus Pedidos', 
      path: '/cliente-pedidos' 
    },
    { 
      icon: <User className="h-5 w-5" />, 
      label: 'Perfil', 
      path: '/cliente-perfil' 
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
        className="lg:hidden fixed z-40 top-4 left-4 p-3 rounded-md bg-element-blue-neon text-element-gray-dark shadow-md"
        style={{ marginTop: 'env(safe-area-inset-top, 1rem)' }}
        onClick={toggleMobile}
        aria-label="Abrir menu"
      >
        <Menu className="h-6 w-6" />
      </button>
      
      {/* Desktop Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-white shadow-lg transition-all duration-300 z-10
        ${isCollapsed ? 'w-20' : 'w-64'}
        hidden lg:block
      `}>
        <div className="flex flex-col h-full">
          <div className={`p-4 flex ${isCollapsed ? 'justify-center' : 'justify-between'} items-center`}>
            {!isCollapsed && (
              <img 
                src="/lovable-uploads/fde6ed06-8df2-4405-b0ed-5e5f59e91ed4.png" 
                alt="Element Adega" 
                className="h-10"
              />
            )}
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-element-gray-light text-element-blue-dark"
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
                    ${isActive ? 'bg-element-blue-neon text-element-gray-dark' : 'hover:bg-element-gray-light text-element-gray-dark'}
                  `}
                >
                  {item.icon}
                  {!isCollapsed && <span className="ml-3">{item.label}</span>}
                </NavLink>
              ))}
            </nav>
          </div>
          
          <div className="p-4 border-t">
            <NavLink
              to="/login"
              className="flex items-center p-3 rounded-lg text-element-gray-dark hover:bg-element-gray-light transition-colors"
            >
              <LogOut className="h-5 w-5" />
              {!isCollapsed && <span className="ml-3">Sair</span>}
            </NavLink>
          </div>
        </div>
      </aside>
      
      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={toggleMobile}></div>
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-lg animate-slide-in-right flex flex-col">
            <div className="flex items-center justify-between p-4 border-b pt-6">
              <img 
                src="/lovable-uploads/fde6ed06-8df2-4405-b0ed-5e5f59e91ed4.png" 
                alt="Element Adega" 
                className="h-10 ml-2 my-2"
              />
              <button 
                onClick={toggleMobile}
                className="p-2 rounded-md hover:bg-element-gray-light text-element-blue-dark ml-auto mt-2"
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
                      ${isActive ? 'bg-element-blue-neon text-element-gray-dark' : 'hover:bg-element-gray-light text-element-gray-dark'}
                    `}
                    onClick={toggleMobile}
                  >
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
            
            <div className="p-4 border-t">
              <NavLink
                to="/login"
                className="flex items-center p-3 rounded-lg text-element-gray-dark hover:bg-element-gray-light transition-colors"
                onClick={toggleMobile}
              >
                <LogOut className="h-5 w-5" />
                <span className="ml-3">Sair</span>
              </NavLink>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default ClientSidebar;
