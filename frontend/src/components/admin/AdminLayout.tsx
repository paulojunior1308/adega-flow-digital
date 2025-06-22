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
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <AdminSidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={toggleSidebar}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      
      <div className="flex-1 flex flex-col w-full">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center h-16 px-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 fixed top-0 w-full z-10">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 rounded-md text-gray-700 dark:text-gray-200"
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>

        <main className={`transition-all duration-300 pt-16 lg:pt-0 ${!isSidebarCollapsed ? 'lg:pl-64' : 'lg:pl-20'}`}>
          <div className={noPadding ? '' : "p-4 sm:p-6 lg:p-8"}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 