
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
import Promocoes from "@/pages/Promocoes";
import Combos from "@/pages/Combos";

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
          
          {/* Client Routes */}
          <Route path="/cliente-dashboard" element={<ClientDashboard />} />
          <Route path="/cliente-catalogo" element={<ClientDashboard />} />
          <Route path="/cliente-buscar" element={<ClientDashboard />} />
          <Route path="/cliente-carrinho" element={<ClientDashboard />} />
          <Route path="/cliente-enderecos" element={<ClientDashboard />} />
          <Route path="/cliente-pedidos" element={<ClientDashboard />} />
          <Route path="/cliente-perfil" element={<ClientDashboard />} />
          
          {/* Admin Routes */}
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin-estoque" element={<AdminDashboard />} />
          <Route path="/admin-cadastro-produtos" element={<AdminDashboard />} />
          <Route path="/admin-pedidos" element={<AdminDashboard />} />
          <Route path="/admin-relatorios" element={<AdminDashboard />} />
          <Route path="/admin-configuracoes" element={<AdminDashboard />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
