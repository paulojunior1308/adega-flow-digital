import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { Menu } from 'lucide-react';

const AdminLayout = ({ children, noPadding = false }: { children: React.ReactNode, noPadding?: boolean }) => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-element-gray-light">
      <AdminSidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={toggleSidebar}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-20 flex items-center justify-between h-16 px-4 bg-white shadow-sm">
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-md text-element-gray-dark"
          aria-label="Abrir menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        {/* Futuramente, podemos adicionar o título da página aqui */}
      </header>

      <main className={`transition-all duration-300 lg:pl-${isSidebarCollapsed ? '20' : '64'} pt-16 lg:pt-0`}>
        <div className={noPadding ? '' : "p-4 sm:p-6 lg:p-8"}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout; 