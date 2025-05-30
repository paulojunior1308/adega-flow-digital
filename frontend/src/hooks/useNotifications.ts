import { useEffect, useState, useCallback } from 'react';
import socket from '@/lib/socket';
import api from '@/lib/axios';

export interface Notification {
  id: string;
  userId: string;
  orderId?: string;
  message: string;
  read: boolean;
  createdAt: string;
  order?: any;
}

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar notificações na API
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Notification[]>('/notifications');
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  }, []);

  // Marcar como lida
  const markAsRead = useCallback(async (id: string) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  // Conectar ao socket e ouvir notificações em tempo real
  useEffect(() => {
    if (!userId) return;
    socket.emit('join', userId);
    fetchNotifications();
    const onNotification = (payload: { notification: Notification }) => {
      setNotifications((prev) => [payload.notification, ...prev]);
    };
    socket.on('order-notification', onNotification);
    return () => {
      socket.off('order-notification', onNotification);
    };
  }, [userId, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    fetchNotifications,
  };
} 