import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";
import api from '@/lib/axios';
import { Calendar, Clock, DollarSign, User, FileText } from 'lucide-react';

interface PDVSession {
  id: string;
  openedAt: string;
  closedAt?: string;
  openedBy: string;
  closedBy?: string;
  initialCash: number;
  finalCash?: number;
  totalSales: number;
  isActive: boolean;
  notes?: string;
  user: {
    id: string;
    name: string;
  };
  closedByUser?: {
    id: string;
    name: string;
  };
}

const AdminPDVSessions = () => {
  const [sessions, setSessions] = useState<PDVSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<PDVSession | null>(null);
  const [sessionDetailsOpen, setSessionDetailsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/pdv/history');
      setSessions(response.data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar histórico de sessões',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (openedAt: string, closedAt?: string) => {
    const start = new Date(openedAt);
    const end = closedAt ? new Date(closedAt) : new Date();
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}min`;
  };

  const getStatusBadge = (session: PDVSession) => {
    if (session.isActive) {
      return <Badge className="bg-green-100 text-green-800">Ativa</Badge>;
    }
    return <Badge variant="secondary">Fechada</Badge>;
  };

  const openSessionDetails = (session: PDVSession) => {
    setSelectedSession(session);
    setSessionDetailsOpen(true);
  };

  const renderSessionDetails = () => {
    if (!selectedSession) return null;

    return (
      <Dialog open={sessionDetailsOpen} onOpenChange={setSessionDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Sessão</DialogTitle>
            <DialogDescription>
              Informações completas da sessão do PDV
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-gray-500">Status</h4>
                <div className="mt-1">{getStatusBadge(selectedSession)}</div>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-500">Duração</h4>
                <p className="mt-1">{calculateDuration(selectedSession.openedAt, selectedSession.closedAt)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-gray-500">Aberta em</h4>
                <p className="mt-1">{formatDateTime(selectedSession.openedAt)}</p>
              </div>
              {selectedSession.closedAt && (
                <div>
                  <h4 className="font-medium text-sm text-gray-500">Fechada em</h4>
                  <p className="mt-1">{formatDateTime(selectedSession.closedAt)}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-gray-500">Aberta por</h4>
                <p className="mt-1">{selectedSession.user.name}</p>
              </div>
              {selectedSession.closedByUser && (
                <div>
                  <h4 className="font-medium text-sm text-gray-500">Fechada por</h4>
                  <p className="mt-1">{selectedSession.closedByUser.name}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-gray-500">Caixa Inicial</h4>
                <p className="mt-1 font-medium">{formatCurrency(selectedSession.initialCash)}</p>
              </div>
              {selectedSession.finalCash !== undefined && (
                <div>
                  <h4 className="font-medium text-sm text-gray-500">Caixa Final</h4>
                  <p className="mt-1 font-medium">{formatCurrency(selectedSession.finalCash)}</p>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium text-sm text-gray-500">Total de Vendas</h4>
              <p className="mt-1 text-lg font-bold text-green-600">
                {formatCurrency(selectedSession.totalSales)}
              </p>
            </div>

            {selectedSession.notes && (
              <div>
                <h4 className="font-medium text-sm text-gray-500">Observações</h4>
                <p className="mt-1 text-sm bg-gray-50 p-3 rounded-md">
                  {selectedSession.notes}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSessionDetailsOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="lg:pl-64 min-h-screen">
          <div className="p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-element-blue-dark mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando sessões...</p>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="lg:pl-64 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-element-blue-dark mb-2">
              Histórico de Sessões do PDV
            </h1>
            <p className="text-element-gray-dark">
              Visualize todas as sessões de abertura e fechamento do PDV
            </p>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Total de Sessões
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{sessions.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Sessões Ativas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {sessions.filter(s => s.isActive).length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Geral
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(sessions.reduce((sum, s) => sum + s.totalSales, 0))}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Sessões */}
          <Card>
            <CardHeader>
              <CardTitle>Sessões do PDV</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Caixa Inicial</TableHead>
                      <TableHead>Total Vendas</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Nenhuma sessão encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      sessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>{getStatusBadge(session)}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{formatDate(session.openedAt)}</div>
                              <div className="text-sm text-gray-500">{formatTime(session.openedAt)}</div>
                            </div>
                          </TableCell>
                          <TableCell>{calculateDuration(session.openedAt, session.closedAt)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              {session.user.name}
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(session.initialCash)}</TableCell>
                          <TableCell className="font-medium text-green-600">
                            {formatCurrency(session.totalSales)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openSessionDetails(session)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {renderSessionDetails()}
    </AdminLayout>
  );
};

export default AdminPDVSessions; 