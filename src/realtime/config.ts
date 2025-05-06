'use client'
// src/liveblocks.config.ts
import { Client } from './client';
import { createRoomContext } from './context';
import { SharedPresentation } from '@/types/SharedPresentation';
import { ServerMessageType } from '@/types/ServerMessageType';
import { PresentationPresence } from '@/types/PresentationPresence';
import { PresentationOperation } from '@/types/PresentationOperation';
import { PresentationPresenceUpdate } from '@/types/PresentationPresenceUpdate';
import { ClientMessageType } from '@/types/ClientMessageType';
import { StorageDocumentResponse } from '@/types/StorageDocumentResponse';
import { QueryClient } from '@tanstack/react-query';

// Create a QueryClient to share with the Client
export const queryClient = new QueryClient();

const client = new Client({
  apiEndpoint: 'http://localhost:9999/api',
  wsEndpoint: 'ws://localhost:9999/ws/room',
  // Add QueryClient to the options
  queryClient: queryClient,
  // authToken: 'your-auth-token', // Optional
});

// Define your types
type Presence = PresentationPresence;

type PresenceOperation = PresentationPresenceUpdate;

type Storage = StorageDocumentResponse;

type StorageOperation = unknown;

type UserMeta = {
  id: string;
  name: string;
  avatar: string;
};

type ServerMessage = ServerMessageType;

type ClientMessage = ClientMessageType;

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
  useBroadcastMsg,
  useEventListener,
} = createRoomContext<Presence, PresenceOperation, Storage, StorageOperation, UserMeta, ClientMessage, ServerMessage>(client);


export type { Presence, Storage, UserMeta, ClientMessage, ServerMessage };