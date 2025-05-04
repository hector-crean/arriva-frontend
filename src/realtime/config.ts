// src/liveblocks.config.ts
import { Client } from './client';
import { createRoomContext } from './context';
import { CursorPresence } from '@/types/CursorPresence';
import { SharedPresentation } from '@/types/SharedPresentation';
import { ServerMessageType } from '@/types/ServerMessageType';
import { CursorUpdate } from '@/types/CursorUpdate';
const client = new Client({
  apiEndpoint: 'http://localhost:9999/api',
  wsEndpoint: 'ws://localhost:9999/ws/room',
  // authToken: 'your-auth-token', // Optional
});

// Define your types
type Presence = CursorPresence;

type PresenceOperation = CursorUpdate;

type Storage = SharedPresentation;

type StorageOperation = unknown;

type UserMeta = {
  id: string;
  name: string;
  avatar: string;
};

type RoomEvent = ServerMessageType;

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
} = createRoomContext<Presence, PresenceOperation, Storage, StorageOperation, UserMeta, RoomEvent>(client);


export type { Presence, Storage, UserMeta, RoomEvent };