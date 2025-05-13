
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
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
          
          {/* Client Routes */}
          <Route path="/cliente-dashboard" element={<ClientDashboard />} />
          <Route path="/cliente-catalogo" element={<ClientCatalog />} />
          <Route path="/cliente-buscar" element={<ClientSearch />} />
          <Route path="/cliente-carrinho" element={<ClientCart />} />
          <Route path="/cliente-enderecos" element={<ClientAddresses />} />
          <Route path="/cliente-pedidos" element={<ClientOrders />} />
          <Route path="/cliente-perfil" element={<ClientProfile />} />
          <Route path="/payment-success" element={<ClientOrders />} />
          <Route path="/payment-canceled" element={<ClientCart />} />
          
          {/* Admin Routes */}
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin-pedidos" element={<AdminOrders />} />
          <Route path="/admin-estoque" element={<AdminStock />} />
          <Route path="/admin-cadastro-produtos" element={<AdminProductRegistration />} />
          
          {/* New Financial Management Routes */}
          <Route path="/admin-vendas" element={<AdminSales />} />
          <Route path="/admin-clientes" element={<AdminCustomers />} />
          <Route path="/admin-fornecedores" element={<AdminSuppliers />} />
          <Route path="/admin-pagamentos" element={<AdminDashboard />} />
          <Route path="/admin-contas" element={<AdminAccounts />} />
          <Route path="/admin-caixa" element={<AdminCashRegister />} />
          <Route path="/admin-inventario" element={<AdminStock />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
