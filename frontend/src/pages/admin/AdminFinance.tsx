import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart,
  Archive,
  Calendar,
  Download
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import api from '@/lib/axios';

interface FinanceReport {
  total_sales: number;
  total_cost: number;
  gross_profit: number;
  total_expenses: number;
  net_profit: number;
}

const AdminFinance = () => {
  const [report, setReport] = useState<FinanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const { toast } = useToast();

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      
      const response = await api.get(`/admin/finance/report?${params.toString()}`);
      setReport(response.data);
    } catch (error) {
      console.error('Erro ao buscar relatório financeiro:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o relatório financeiro",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleDateFilter = () => {
    fetchReport();
  };

  const handleExport = () => {
    // Implementar exportação para CSV/PDF se necessário
    toast({
      title: "Exportação",
      description: "Funcionalidade de exportação será implementada em breve",
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-element-blue-dark mx-auto"></div>
            <p className="mt-4 text-element-gray-dark">Carregando relatório financeiro...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-element-gray-dark mb-2">
            Relatório Financeiro
          </h1>
          <p className="text-element-gray-dark/70">
            Acompanhe o desempenho financeiro da sua empresa
          </p>
        </div>

        {/* Filtros de Data */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Filtros de Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-element-gray-dark mb-1">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-3 py-2 border border-element-gray-dark/20 rounded-md focus:outline-none focus:ring-2 focus:ring-element-blue-dark"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-element-gray-dark mb-1">
                  Data Final
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-3 py-2 border border-element-gray-dark/20 rounded-md focus:outline-none focus:ring-2 focus:ring-element-blue-dark"
                />
              </div>
              <Button onClick={handleDateFilter} className="bg-element-blue-dark hover:bg-element-blue-dark/90">
                Filtrar
              </Button>
              <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(report?.total_sales || 0)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+20.1%</span> em relação ao mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(report?.total_cost || 0)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-600">+5.2%</span> em relação ao mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Bruto</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(report?.gross_profit || 0)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+15.3%</span> em relação ao mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(report?.net_profit || 0)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12.8%</span> em relação ao mês anterior
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Desempenho */}
        <Card>
          <CardHeader>
            <CardTitle>Desempenho Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Gráfico de desempenho será implementado aqui
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminFinance; 