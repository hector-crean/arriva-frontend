import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRoomEvent } from './use-room-event';
import { Operation } from '@/types/Operation';

interface StorageOptions {
  roomId: string;
  initialValue?: string;
}

export function useStorage({ roomId, initialValue }: StorageOptions) {
  const { sendMessage } = useRoomEvent({ roomId });
  const queryClient = useQueryClient();

  const { data: storage } = useQuery({
    queryKey: ['room', roomId, 'storage'],
    queryFn: async () => {
      const response = await fetch(`http://localhost:9999/api/rooms/${roomId}/storage`);
      if (!response.ok) {
        throw new Error('Failed to fetch storage');
      }
      const data = await response.json();
      return data.data;
    },
    initialData: initialValue,
  });

  const updateStorage = useCallback((operations: Operation<string>[]) => {
    sendMessage({
      type: 'UpdatedStorage',
      data: { operations }
    });
  }, [sendMessage]);

  return {
    storage,
    updateStorage,
  };
} 