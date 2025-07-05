import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Database, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

const AdminBackup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const { toast } = useToast();

  const handleBackup = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/backup', {
        responseType: 'blob'
      });

      // Criar link para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup-completo-${new Date().toISOString().split('T')[0]}.sql`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setLastBackup(new Date().toISOString());
      
      toast({
        title: "Backup realizado com sucesso!",
        description: "O arquivo de backup foi baixado automaticamente.",
        variant: "default",
      });
    } catch (error) {
      console.error('Erro ao gerar backup:', error);
      toast({
        title: "Erro ao gerar backup",
        description: "Ocorreu um erro ao gerar o backup do banco de dados.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchema = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/schema', {
        responseType: 'blob'
      });

      // Criar link para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `schema-completo-${new Date().toISOString().split('T')[0]}.sql`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Schema gerado com sucesso!",
        description: "O arquivo de schema foi baixado automaticamente.",
        variant: "default",
      });
    } catch (error) {
      console.error('Erro ao gerar schema:', error);
      toast({
        title: "Erro ao gerar schema",
        description: "Ocorreu um erro ao gerar o schema do banco de dados.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-element-gray-dark">Backup do Banco de Dados</h1>
          <p className="text-element-gray-dark/70 mt-2">
            Gere um backup SQL completo dos dados do sistema para importar diretamente no Supabase
          </p>
        </div>

        <div className="grid gap-6">
          {/* Card Principal */}
          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-5 w-5" />
                Backup Temporário - Migração Supabase
              </CardTitle>
              <CardDescription className="text-orange-700">
                Esta funcionalidade foi criada temporariamente para facilitar a migração do banco de dados.
                Após a migração, esta página será removida.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert className="border-orange-200 bg-orange-100">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-orange-800">
                    <strong>Importante:</strong> Este backup gera um arquivo SQL completo que pode ser importado diretamente no Supabase. 
                    Inclui a estrutura das tabelas (CREATE TABLE) e todos os dados (INSERT) do sistema incluindo usuários, produtos, pedidos, estoque, combos, promoções e configurações. 
                    Guarde este arquivo em local seguro.
                  </AlertDescription>
                </Alert>

                                <div className="flex items-center gap-4 flex-wrap">
                  <Button 
                    onClick={handleBackup}
                    disabled={isLoading}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Gerando backup completo...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Gerar Backup Completo (Estrutura + Dados)
                      </>
                    )}
                  </Button>

                  <Button 
                    onClick={handleSchema}
                    disabled={isLoading}
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Gerando schema...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        Apenas Schema das Tabelas
                      </>
                    )}
                  </Button>

                  {lastBackup && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">
                        Último backup: {new Date(lastBackup).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                O que está incluído no backup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-element-gray-dark">Dados de Usuários</h4>
                  <ul className="text-sm text-element-gray-dark/70 space-y-1">
                    <li>• Perfis de usuários</li>
                    <li>• Endereços cadastrados</li>
                    <li>• Histórico de pedidos</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-element-gray-dark">Dados de Produtos</h4>
                  <ul className="text-sm text-element-gray-dark/70 space-y-1">
                    <li>• Catálogo completo</li>
                    <li>• Categorias</li>
                    <li>• Preços e estoque</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-element-gray-dark">Dados de Vendas</h4>
                  <ul className="text-sm text-element-gray-dark/70 space-y-1">
                    <li>• Histórico de pedidos online</li>
                    <li>• Vendas do PDV</li>
                    <li>• Itens das vendas</li>
                    <li>• Métodos de pagamento</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-element-gray-dark">Configurações</h4>
                  <ul className="text-sm text-element-gray-dark/70 space-y-1">
                    <li>• Combos e promoções</li>
                    <li>• Fornecedores</li>
                    <li>• Movimentações de estoque</li>
                    <li>• Fluxo de caixa</li>
                    <li>• Contas a pagar</li>
                    <li>• Clientes cadastrados</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instruções */}
          <Card>
            <CardHeader>
              <CardTitle>Instruções para Migração</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                                 <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                   <h4 className="font-semibold text-blue-800 mb-2">1. Gere o Backup SQL</h4>
                   <p className="text-blue-700 text-sm">
                     Clique no botão "Gerar Backup SQL" acima para baixar o arquivo SQL com todos os dados do sistema.
                   </p>
                 </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">2. Configure o Supabase</h4>
                  <p className="text-green-700 text-sm">
                    Configure o novo banco no Supabase com o mesmo schema do Prisma atual.
                  </p>
                </div>
                
                                 <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                   <h4 className="font-semibold text-purple-800 mb-2">3. Importe o SQL no Supabase</h4>
                   <p className="text-purple-700 text-sm">
                     Copie e cole o conteúdo do arquivo SQL no editor SQL do Supabase para importar todos os dados.
                   </p>
                 </div>
                
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-orange-800 mb-2">4. Atualize as Configurações</h4>
                  <p className="text-orange-700 text-sm">
                    Atualize as variáveis de ambiente para apontar para o novo banco Supabase.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBackup; 