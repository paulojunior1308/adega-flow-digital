import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import Cadastro from "@/pages/Cadastro";
import ClientDashboard from "@/pages/client/ClientDashboard";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminStock from "@/pages/admin/AdminStock";
import AdminProductRegistration from "@/pages/admin/AdminProductRegistration";
import Promocoes from "@/pages/Promocoes";
import Combos from "@/pages/Combos";
import Narguile from "@/pages/Narguile";
import Bebidas from "@/pages/Bebidas";
import ClientCatalog from "@/pages/client/ClientCatalog";
import ClientSearch from "@/pages/client/ClientSearch";
import ClientCart from "@/pages/client/ClientCart";
import ClientProfile from "@/pages/client/ClientProfile";
import ClientAddresses from "@/pages/client/ClientAddresses";
import ClientOrders from "@/pages/client/ClientOrders";
import AdminSales from "@/pages/admin/AdminSales";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminSuppliers from "@/pages/admin/AdminSuppliers";
import AdminAccounts from "@/pages/admin/AdminAccounts";
import AdminCashRegister from "@/pages/admin/AdminCashRegister";
import AdminPayments from "@/pages/admin/AdminPayments";
import AdminPDV from "@/pages/admin/AdminPDV";
import ContactRedirect from "@/pages/ContactRedirect";
import ProtectedRoute from "@/components/ProtectedRoute";
import MotoboyDashboard from '@/pages/motoboy/MotoboyDashboard';
import UsersList from "@/pages/admin/AdminUsers";
import AdminPromotionsAndCombos from "@/pages/admin/AdminPromotionsAndCombos";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login-admin" element={<Login />} />
          <Route path="/promocoes" element={<Promocoes />} />
          <Route path="/combos" element={<Combos />} />
          <Route path="/narguile" element={<Narguile />} />
          <Route path="/bebidas" element={<Bebidas />} />
          <Route path="/contato" element={<ContactRedirect />} />
          
          {/* Client Routes */}
          <Route path="/cliente-dashboard" element={<ProtectedRoute allowedRoles={['USER']}><ClientDashboard /></ProtectedRoute>} />
          <Route path="/cliente-catalogo" element={<ProtectedRoute allowedRoles={['USER']}><ClientCatalog /></ProtectedRoute>} />
          <Route path="/cliente-buscar" element={<ProtectedRoute allowedRoles={['USER']}><ClientSearch /></ProtectedRoute>} />
          <Route path="/cliente-carrinho" element={<ProtectedRoute allowedRoles={['USER']}><ClientCart /></ProtectedRoute>} />
          <Route path="/cliente-enderecos" element={<ProtectedRoute allowedRoles={['USER']}><ClientAddresses /></ProtectedRoute>} />
          <Route path="/cliente-pedidos" element={<ProtectedRoute allowedRoles={['USER']}><ClientOrders /></ProtectedRoute>} />
          <Route path="/cliente-perfil" element={<ProtectedRoute allowedRoles={['USER']}><ClientProfile /></ProtectedRoute>} />
          <Route path="/payment-success" element={<ClientOrders />} />
          <Route path="/payment-canceled" element={<ClientCart />} />
          <Route path="/cadastro" element={<Cadastro />} />
          
          {/* Admin Routes */}
          <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin-pedidos" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminOrders/></ProtectedRoute>} />
          <Route path="/admin-estoque" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminStock /></ProtectedRoute>} />
          <Route path="/admin-cadastro-produtos" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminProductRegistration /></ProtectedRoute>} />
          <Route path="/admin-pdv" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminPDV /></ProtectedRoute>} />
          <Route path="/admin-vendas" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminSales /></ProtectedRoute>} />
          <Route path="/admin-clientes" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminCustomers /></ProtectedRoute>} />
          <Route path="/admin-fornecedores" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminSuppliers /></ProtectedRoute>} />
          <Route path="/admin-pagamentos" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminPayments /></ProtectedRoute>} />
          <Route path="/admin-contas" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminAccounts /></ProtectedRoute>} />
          <Route path="/motoboy" element={<ProtectedRoute allowedRoles={['MOTOBOY']}><MotoboyDashboard /></ProtectedRoute>} />
          <Route path="/admin-usuarios" element={<ProtectedRoute allowedRoles={['ADMIN']}><UsersList /></ProtectedRoute>} />
          <Route path="/admin-promocoes-combos" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminPromotionsAndCombos /></ProtectedRoute>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
