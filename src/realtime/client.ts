// src/realtime/client.ts
// import { WebSocket } from 'websocket';
import { Room } from './room';
import { ServerMessageType } from '@/types/ServerMessageType';


export type JsonObject = Record<string, any>;
export type User<TPresence extends JsonObject, TUserMeta = any> = {
  connectionId: number;
  presence: TPresence;
  info?: TUserMeta;
};

export type ClientOptions = {
  apiEndpoint: string;
  wsEndpoint: string;
  authToken?: string;
};

export class Client {
  private options: ClientOptions;
  private socket: WebSocket | null = null;
  private rooms: Map<string, Room<any, any, any, any, any, any>> = new Map();
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(options: ClientOptions) {
    this.options = options;
  }

  public getRoom<TPresence extends JsonObject, TPresenceOperation, TStorage extends JsonObject, TStorageOperation, TUserMeta = any, TRoomEvent = any>(
    roomId: string
  ): Room<TPresence, TPresenceOperation, TStorage, TStorageOperation, TUserMeta, TRoomEvent> | null {
    return this.rooms.get(roomId) as Room<TPresence, TPresenceOperation, TStorage, TStorageOperation, TUserMeta, TRoomEvent> | null;
  }

  public enterRoom<
    TPresence extends JsonObject,
    TPresenceOperation,
    TStorage extends JsonObject,
    TStorageOperation,
    TUserMeta = any,
    TRoomEvent = any
  >(
    roomId: string,
    options: {
      initialPresence: TPresence;
      initialStorage?: TStorage;
    }
  ): { room: Room<TPresence, TPresenceOperation, TStorage, TStorageOperation, TUserMeta, TRoomEvent>; leave: () => void } {
    // Create a new room or return existing one
    let room = this.getRoom<TPresence, TPresenceOperation, TStorage, TStorageOperation, TUserMeta, TRoomEvent>(roomId);
    
    if (!room) {
      room = new Room<TPresence, TPresenceOperation, TStorage, TStorageOperation, TUserMeta, TRoomEvent>(
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
    
    socket.onmessage = (event: MessageEvent<ServerMessageType>) => {
      this.handleWebSocketMessage(roomId, event.data);
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
        room.handleStorageUpdate(data.data);
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

  public async updateStorage<T>(roomId: string, patch: Partial<T>): Promise<T> {
    const response = await fetch(`${this.options.apiEndpoint}/rooms/${roomId}/storage`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(patch),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update storage: ${response.statusText}`);
    }
    
    return response.json();
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.options.authToken) {
      headers['Authorization'] = `Bearer ${this.options.authToken}`;
    }
    
    return headers;
  }
}