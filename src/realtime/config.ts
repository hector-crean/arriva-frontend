// src/liveblocks.config.ts
import { Client } from './client';
import { createRoomContext } from './context';

const client = new Client({
  apiEndpoint: 'http://localhost:9999/api',
  wsEndpoint: 'ws://localhost:9999/ws/room',
  // authToken: 'your-auth-token', // Optional
});

// Define your types
type Presence = {
  cursor: { x: number; y: number } | null;
  // Add other presence properties
};

type Storage = {
  documents: {
    [id: string]: {
      title: string;
      content: string;
    }
  };
  // Add other storage properties
};

type UserMeta = {
  id: string;
  name: string;
  avatar: string;
};

type RoomEvent = {
  type: string;
  data: any;
};

// Create and export your hooks
export const {
  RoomProvider,
  useRoom,
  useStatus,
  useMyPresence,
  useUpdateMyPresence,
  useOthers,
  useSelf,
  useStorage,
  useMutation,
  useBroadcastEvent,
  useEventListener,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);