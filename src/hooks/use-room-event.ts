import { ServerMessageType } from '@/types/ServerMessageType';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import useWebSocket from 'react-use-websocket';

interface RoomOptions {
  roomId: string;
  onError?: (error: Error) => void;
  onMessage?: (message: ServerMessageType) => void;
  heartbeatInterval?: number; // in milliseconds
  heartbeatTimeout?: number; // in milliseconds
}

export function useRoomEvent({ 
  roomId, 
  onError, 
  onMessage,
  heartbeatInterval = 30000, // 30 seconds default
  heartbeatTimeout = 60000,  // 60 seconds default
}: RoomOptions) {

  const WS_URL = `ws://localhost:9999/ws/room/${roomId}`;

  const queryClient = useQueryClient();

  const { sendJsonMessage: sendMessage, lastJsonMessage: message, readyState } = useWebSocket<ServerMessageType>(
    WS_URL,
    {
      share: false,
      shouldReconnect: () => true,
    },
  )


  useEffect(() => {
    if (message) {
      onMessage?.(message);

      console.log(message);
      
      
      // Check if lastMessage has a type property before using it in the switch
      if (message.type) {
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
      }
    }
  }, [message, onMessage]);




  return {
    readyState,
    sendMessage,
    message,
  };
}