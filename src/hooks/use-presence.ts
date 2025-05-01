import { useCallback } from 'react';
import { useRoomEvent } from './use-room-event';
import { CursorUpdate } from '@/types/CursorUpdate';

export function usePresence(roomId: string) {
  const { sendMessage } = useRoomEvent({ roomId });

  const updatePresence = useCallback((update: CursorUpdate) => {
    sendMessage({
      type: 'UpdatedPresence',
      data: { presence: update }
    });
  }, [sendMessage]);

  return {
    updatePresence,
  };
} 