import { useEffect } from 'react';
import socket from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';

export function useAdminSocket() {
  const { toast } = useToast();

  useEffect(() => {
    function handleNewOrder(data: any) {
      toast({
        title: 'Novo pedido recebido!',
        description: `Pedido #${data.order.id} de ${data.order.address.title}`,
      });
    }
    socket.on('new-order', handleNewOrder);
    return () => {
      socket.off('new-order', handleNewOrder);
    };
  }, [toast]);
} 