import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ClientMessageType } from '@/types/ClientMessageType';
import { ServerMessageType } from '@/types/ServerMessageType';
interface RoomOptions {
  roomId: string;
  onError?: (error: Error) => void;
}

export function useRoomEvent({ roomId, onError }: RoomOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket(`ws://localhost:9999/ws/room/${roomId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (event) => {
      const error = new Error('WebSocket error');
      setError(error);
      onError?.(error);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ServerMessageType;
        
        // Handle different message types
        switch (message.type) {
          case 'StorageUpdated':
            // Invalidate storage queries
            queryClient.invalidateQueries({ queryKey: ['room', roomId, 'storage'] });
            break;
          case 'PresenceUpdated':
            // Invalidate presence queries
            queryClient.invalidateQueries({ queryKey: ['room', roomId, 'presence'] });
            break;
          // Add other message type handlers as needed
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };
  }, [roomId, onError, queryClient]);

  const sendMessage = useCallback((message: ClientMessageType) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      throw new Error('WebSocket is not connected');
    }
  }, []);

  const joinRoom = useCallback(() => {
    sendMessage({ type: 'JoinRoom', data: { room_id: roomId } });
  }, [roomId, sendMessage]);

  const leaveRoom = useCallback(() => {
    sendMessage({ type: 'LeaveRoom' });
  }, [sendMessage]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  return {
    isConnected,
    error,
    sendMessage,
    joinRoom,
    leaveRoom,
  };
} 