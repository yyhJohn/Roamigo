import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';

export function useTripRealtimeSync(tripId: string | undefined) {
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);

  useEffect(() => {
    if (!tripId) return;

    const socket = io({
      path: '/socket.io',
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    const joinRoom = () => {
      setConnected(true);
      socket.emit('join-trip', tripId);
    };

    socket.on('connect', joinRoom);
    socket.on('disconnect', () => setConnected(false));
    socket.on('presence:update', (payload: { onlineCount?: number }) => {
      if (typeof payload?.onlineCount === 'number') {
        setOnlineCount(Math.max(1, payload.onlineCount));
      }
    });
    socket.on('trip:changed', (payload: { tripId?: string }) => {
      if (!payload?.tripId || payload.tripId === tripId) {
        void qc.invalidateQueries({ queryKey: ['trips', 'detail', tripId] });
        void qc.invalidateQueries({ queryKey: ['trips', 'list'] });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [tripId, qc]);

  return { connected, onlineCount };
}
