import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import socket from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';

export interface ComandaItem {
  id: string;
  productId: string;
  code: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  choosableSelections?: Record<string, Record<string, number>>;
  isDoseItem?: boolean;
  isFractioned?: boolean;
  discountBy?: 'volume' | 'unit';
}

export interface Comanda {
  id: string;
  number: number;
  customerName: string;
  tableNumber?: string;
  items: ComandaItem[];
  total: number;
  createdAt: Date;
  updatedAt: Date;
  isOpen: boolean;
  user?: {
    name: string;
  };
}

export function useComandas() {
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Carregar comandas da API
  const loadComandas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/comandas');
      const comandasWithDates = response.data.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt)
      }));
      setComandas(comandasWithDates);
    } catch (error) {
      console.error('Erro ao carregar comandas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as comandas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // WebSocket para sincronização em tempo real
  useEffect(() => {
    // Carregar comandas iniciais
    loadComandas();

    // Ouvir eventos de comandas
    const handleComandaCreated = (data: { comanda: Comanda }) => {
      const comandaWithDates = {
        ...data.comanda,
        createdAt: new Date(data.comanda.createdAt),
        updatedAt: new Date(data.comanda.updatedAt)
      };
      setComandas(prev => {
        const exists = prev.some(c => c.id === comandaWithDates.id);
        if (!exists) {
          return [comandaWithDates, ...prev];
        }
        return prev;
      });
    };

    const handleComandaUpdated = (data: { comanda: Comanda }) => {
      const comandaWithDates = {
        ...data.comanda,
        createdAt: new Date(data.comanda.createdAt),
        updatedAt: new Date(data.comanda.updatedAt)
      };
      setComandas(prev => prev.map(c => 
        c.id === comandaWithDates.id ? comandaWithDates : c
      ));
    };

    const handleComandaClosed = (data: { comanda: Comanda }) => {
      const comandaWithDates = {
        ...data.comanda,
        createdAt: new Date(data.comanda.createdAt),
        updatedAt: new Date(data.comanda.updatedAt)
      };
      setComandas(prev => prev.map(c => 
        c.id === comandaWithDates.id ? comandaWithDates : c
      ));
    };

    const handleComandaReopened = (data: { comanda: Comanda }) => {
      const comandaWithDates = {
        ...data.comanda,
        createdAt: new Date(data.comanda.createdAt),
        updatedAt: new Date(data.comanda.updatedAt)
      };
      setComandas(prev => prev.map(c => 
        c.id === comandaWithDates.id ? comandaWithDates : c
      ));
    };

    const handleComandaDeleted = (data: { comandaId: string }) => {
      setComandas(prev => prev.filter(c => c.id !== data.comandaId));
    };

    socket.on('comanda-created', handleComandaCreated);
    socket.on('comanda-updated', handleComandaUpdated);
    socket.on('comanda-closed', handleComandaClosed);
    socket.on('comanda-reopened', handleComandaReopened);
    socket.on('comanda-deleted', handleComandaDeleted);

    return () => {
      socket.off('comanda-created', handleComandaCreated);
      socket.off('comanda-updated', handleComandaUpdated);
      socket.off('comanda-closed', handleComandaClosed);
      socket.off('comanda-reopened', handleComandaReopened);
      socket.off('comanda-deleted', handleComandaDeleted);
    };
  }, []);

  // Funções para manipular comandas
  const createComanda = async (customerName: string, tableNumber?: string) => {
    try {
      const response = await api.post('/admin/comandas', {
        customerName: customerName.trim(),
        tableNumber: tableNumber?.trim() || null
      });

      const newComanda = {
        ...response.data,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt)
      };

      return newComanda;
    } catch (error) {
      console.error('Erro ao criar comanda:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a comanda.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const closeComanda = async (comandaId: string) => {
    try {
      await api.put(`/admin/comandas/${comandaId}/close`);
      toast({
        title: "Comanda fechada",
        description: "A comanda foi fechada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao fechar comanda:', error);
      toast({
        title: "Erro",
        description: "Não foi possível fechar a comanda.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const addItemToComanda = async (comandaId: string, itemData: any) => {
    try {
      await api.post(`/admin/comandas/${comandaId}/items`, itemData);
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o item à comanda.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateItemQuantity = async (comandaId: string, itemId: string, quantity: number) => {
    try {
      await api.put(`/admin/comandas/${comandaId}/items/${itemId}`, {
        quantity
      });
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a quantidade.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeItem = async (comandaId: string, itemId: string) => {
    try {
      await api.delete(`/admin/comandas/${comandaId}/items/${itemId}`);
    } catch (error) {
      console.error('Erro ao remover item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o item.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getOpenComandas = () => comandas.filter(c => c.isOpen);
  const getClosedComandas = () => comandas.filter(c => !c.isOpen);

  return {
    comandas,
    loading,
    loadComandas,
    createComanda,
    closeComanda,
    addItemToComanda,
    updateItemQuantity,
    removeItem,
    getOpenComandas,
    getClosedComandas
  };
} 