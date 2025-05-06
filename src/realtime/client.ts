// src/realtime/client.ts
// import { WebSocket } from 'websocket';
import { Room } from './room';
import { ServerMessageType } from '@/types/ServerMessageType';
import { QueryClient } from '@tanstack/react-query';

export type JsonObject = Record<string, any>;
export type User<TPresence extends JsonObject, TUserMeta = any> = {
  connectionId: number;
  presence: TPresence;
  info?: TUserMeta;
};

export type ClientOptions = {
  apiEndpoint: string;
  wsEndpoint: string;
  queryClient: QueryClient;
};

export class Client {
  private options: ClientOptions;
  private socket: WebSocket | null = null;
  private rooms: Map<string, Room<any, any, any, any, any, any>> = new Map();
  private queryClient: QueryClient;

  constructor(options: ClientOptions) {
    this.options = options;
    this.queryClient = options.queryClient;
  }

  public getRoom<TPresence extends JsonObject, TPresenceOperation, TStorage extends JsonObject, TStorageOperation, TUserMeta = any, TClientMessage = any, TServerMessage = any>(
    roomId: string
  ): Room<TPresence, TPresenceOperation, TStorage, TStorageOperation, TUserMeta, TClientMessage, TServerMessage> | null {
    return this.rooms.get(roomId) as Room<TPresence, TPresenceOperation, TStorage, TStorageOperation, TUserMeta, TClientMessage, TServerMessage> | null;
  }

  public enterRoom<
    TPresence extends JsonObject,
    TPresenceOperation,
    TStorage extends JsonObject,
    TStorageOperation,
    TUserMeta = any,
    TClientMessage = any,
    TServerMessage = any
  >(
    roomId: string,
    options: {
      initialPresence: TPresence;
      initialStorage?: TStorage;
    }
  ): { room: Room<TPresence, TPresenceOperation, TStorage, TStorageOperation, TUserMeta, TClientMessage, TServerMessage>; leave: () => void } {
    // Create a new room or return existing one
    let room = this.getRoom<TPresence, TPresenceOperation, TStorage, TStorageOperation, TUserMeta, TClientMessage, TServerMessage>(roomId);
    
    if (!room) {
      room = new Room<TPresence, TPresenceOperation, TStorage, TStorageOperation, TUserMeta, TClientMessage, TServerMessage>(
        this,
        roomId,
        options.initialPresence,
        options.initialStorage
      );
      this.rooms.set(roomId, room);
    }

    // Connect to the room
    room.connect();

    const leave = () => {
      room?.disconnect();
      this.rooms.delete(roomId);
    };

    return { room, leave };
  }

  // WebSocket connection management
  public connectWebSocket(roomId: string): WebSocket {
    const socket = new WebSocket(`${this.options.wsEndpoint}/${roomId}`);

    
    socket.onmessage = (event: MessageEvent<string>) => {
      try {
        const parsedData = JSON.parse(event.data) as ServerMessageType;
        this.handleWebSocketMessage(roomId, parsedData);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onclose = () => {
      // Handle reconnection logic
      const room = this.getRoom(roomId);
      if (room) {
        room.updateStatus('disconnected');
      }
    };

    return socket;
  }

  private handleWebSocketMessage(roomId: string, data: ServerMessageType) {
    const room = this.getRoom(roomId);
    if (!room) return;

    console.log(`WebSocket message received for room ${roomId}:`, data);

    switch (data.type) {
      case 'RoomCreated':
        // room.handleRoomCreated(data.data);
        break;
      case 'RoomDeleted':
        // room.handleRoomDeleted(data.data);
        break;
      case 'RoomJoined':
        // room.handleRoomJoined(data.data);
        break;
      case 'RoomLeft':
        // room.handleRoomLeft(data.data);
        break;
      case 'StorageUpdated':
        console.log('StorageUpdated received:', data.data);
        
        // DEBUG: Invalidate ALL queries instead of just the storage query
        if (this.queryClient) {
          // console.log('⚠️ DEBUG: INVALIDATING ALL QUERIES');
          // this.queryClient.invalidateQueries(); // No filters - invalidates everything
          
          // You can also force refetch all queries
          // this.queryClient.refetchQueries({
          //   type: 'all', // Refetch active and inactive queries 
          // });

          this.queryClient.invalidateQueries({
            queryKey: ['storage', roomId],
          });

          this.queryClient.refetchQueries({
            queryKey: ['storage', roomId],
          });

        } else {
          console.error('❌ QueryClient is null or undefined!');
        }
        break;
      case 'PresenceUpdated':
        room.handlePresenceUpdate(data.data);
        break;
      // ...other cases
      default:
        // console.warn('Unknown message type:', data.type, data.data);
    }
  }

  // HTTP API methods
  public async fetchStorage<T>(roomId: string): Promise<T> {
    const response = await fetch(`${this.options.apiEndpoint}/rooms/${roomId}/storage`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch storage: ${response.statusText}`);
    }
    
    return response.json();
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    
    
    return headers;
  }

  public setQueryClient(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }
}