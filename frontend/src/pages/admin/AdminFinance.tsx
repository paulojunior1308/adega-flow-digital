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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-dark mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando relatório financeiro...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Relatório Financeiro
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe o desempenho financeiro da sua empresa
          </p>
        </div>

        {/* Filtros de Período */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Filtros de Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 md:items-end">
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <div className='flex-1'>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-dark bg-white dark:bg-gray-800"
                  />
                </div>
                <div className='flex-1'>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-dark bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button onClick={handleDateFilter} className="flex-1 md:flex-auto bg-primary hover:bg-primary/90">
                  Filtrar
                </Button>
                <Button onClick={handleExport} variant="outline" className="flex-1 md:flex-auto items-center gap-2">
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
              <ShoppingCart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {report ? formatCurrency(report.total_sales) : 'R$ 0,00'}
              </div>
              <p className="text-xs text-muted-foreground">
                Receita total do período
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
              <Archive className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {report ? formatCurrency(report.total_cost) : 'R$ 0,00'}
              </div>
              <p className="text-xs text-muted-foreground">
                Custo dos produtos vendidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Bruto</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {report ? formatCurrency(report.gross_profit) : 'R$ 0,00'}
              </div>
              <p className="text-xs text-muted-foreground">
                Vendas - Custos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {report ? formatCurrency(report.total_expenses) : 'R$ 0,00'}
              </div>
              <p className="text-xs text-muted-foreground">
                Despesas operacionais
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Resultado Final */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Resultado Final
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Lucro Líquido</h3>
                <p className="text-sm text-muted-foreground">
                  Lucro bruto - Despesas
                </p>
              </div>
              <div className="text-left sm:text-right">
                <div className={`text-3xl font-bold ${
                  report && report.net_profit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {report ? formatCurrency(report.net_profit) : 'R$ 0,00'}
                </div>
                <Badge variant={report && report.net_profit >= 0 ? "default" : "destructive"}>
                  {report && report.net_profit >= 0 ? 'Lucro' : 'Prejuízo'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Detalhado */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo Detalhado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-element-gray-dark/10">
                <span className="font-medium">Total de Vendas:</span>
                <span className="font-semibold">{report ? formatCurrency(report.total_sales) : 'R$ 0,00'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-element-gray-dark/10">
                <span className="font-medium">Custo dos Produtos:</span>
                <span className="font-semibold text-red-600">- {report ? formatCurrency(report.total_cost) : 'R$ 0,00'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-element-gray-dark/10">
                <span className="font-medium">Lucro Bruto:</span>
                <span className="font-semibold text-green-600">{report ? formatCurrency(report.gross_profit) : 'R$ 0,00'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-element-gray-dark/10">
                <span className="font-medium">Despesas Operacionais:</span>
                <span className="font-semibold text-orange-600">- {report ? formatCurrency(report.total_expenses) : 'R$ 0,00'}</span>
              </div>
              <div className="flex justify-between items-center py-2 pt-4 border-t-2 border-element-gray-dark/20">
                <span className="font-bold text-lg">Resultado Final:</span>
                <span className={`font-bold text-lg ${
                  report && report.net_profit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {report ? formatCurrency(report.net_profit) : 'R$ 0,00'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminFinance; 