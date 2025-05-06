// src/realtime/room.ts
import { ServerMessageType } from '@/types/ServerMessageType';
import { Client, JsonObject, User } from './client';

export type Status = 'initial' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
export type StorageStatus = 'loading' | 'synchronizing' | 'synchronized';

export class Room<
  TPresence extends JsonObject,
  TPresenceOperation,
  TStorage extends JsonObject,
  TStorageOperation,
  TUserMeta = any,
  TClientMessage = any,
  TServerMessage = any
> {
  private client: Client;
  public id: string;
  private presence: TPresence;
  private storage: TStorage | null = null;
  private status: Status = 'initial';
  private storageStatus: StorageStatus = 'loading';
  private self: User<TPresence, TUserMeta> | null = null;
  private others: User<TPresence, TUserMeta>[] = [];
  private socket: WebSocket | null = null;
  private events = {
    presence: new Set<() => void>(),
    storage: new Set<() => void>(),
    others: new Set<() => void>(),
    self: new Set<() => void>(),
    status: new Set<() => void>(),
    storageStatus: new Set<() => void>(),
    event: new Map<string, Set<(data: any) => void>>(),
  };

  constructor(
    client: Client,
    roomId: string,
    initialPresence: TPresence,
    initialStorage?: TStorage
  ) {
    this.client = client;
    this.id = roomId;
    this.presence = initialPresence;
    if (initialStorage) {
      this.storage = initialStorage;
    }
  }

  // Connection management
  public connect() {
    if (this.status !== 'initial' && this.status !== 'disconnected') {
      return;
    }

    this.updateStatus('connecting');
    this.socket = this.client.connectWebSocket(this.id);
    
    // Initialize self user
    this.self = {
      connectionId: Date.now(), // This would come from the server in a real implementation
      presence: this.presence,
    };
    
    this.notifyListeners('self');
    
    // Simulate connection success
    setTimeout(() => {
      this.updateStatus('connected');
      // Load storage
      this.loadStorage();
    }, 500);
  }

  public disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.updateStatus('disconnected');
  }

  public reconnect() {
    this.disconnect();
    this.connect();
  }

  // Status management
  public updateStatus(status: Status) {
    this.status = status;
    this.notifyListeners('status');
  }

  public getStatus(): Status {
    return this.status;
  }

  public updateStorageStatus(status: StorageStatus) {
    this.storageStatus = status;
    this.notifyListeners('storageStatus');
  }

  public getStorageStatus(): StorageStatus {
    return this.storageStatus;
  }

  // Presence management
  public updatePresence(operation: TPresenceOperation, options?: { addToHistory: boolean }) {
    // this.presence = { ...this.presence, ...patch };
    
    if (this.self) {
      this.self.presence = this.presence;
      this.notifyListeners('self');
    }
    
    this.notifyListeners('presence');
    
    // Send update to server if connected
    if (this.status === 'connected' && this.socket) {

      
      this.socket.send(JSON.stringify({
        type: 'UpdatePresence',
        data: {
          presence: operation,
        },
      }));
      
    }
  }

  public getPresence(): TPresence {
    return this.presence;
  }

  // Storage management
  private async loadStorage() {
    this.updateStorageStatus('loading');
    
    try {
      const storage = await this.client.fetchStorage<TStorage>(this.id);
      this.storage = storage;
      this.updateStorageStatus('synchronized');
      this.notifyListeners('storage');
    } catch (error) {
      console.error('Failed to load storage:', error);
      this.updateStorageStatus('synchronized'); // Fallback to synchronized
    }
  }

  public getStorageSnapshot(): TStorage | null {
    return this.storage;
  }

  public batch<T>(callback: () => T): T {
    // In a real implementation, this would batch multiple updates together
    return callback();
  }

  // User management
  public getSelf(): User<TPresence, TUserMeta> | null {
    return this.self;
  }

  public getOthers(): readonly User<TPresence, TUserMeta>[] {
    return this.others;
  }

  // Event handling
  public handlePresenceUpdate(data: TPresence) {
    // Update others' presence
    const otherIndex = this.others.findIndex(user => user.connectionId === data.connectionId);
    
    if (otherIndex >= 0) {
      this.others[otherIndex].presence = {
        ...this.others[otherIndex].presence,
        ...data.presence,
      };
    } else {
      this.others.push({
        connectionId: data.connectionId,
        presence: data.presence,
        info: data.info,
      });
    }
    
    this.notifyListeners('others');
  }


  public handleRoomMsg(data: any) {
    const eventListeners = this.events.event.get(data.event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener(data.data));
    }
  }

  public broadcastMsg(msg: TClientMessage) {
    if (this.status === 'connected' && this.socket) {
      this.socket.send(JSON.stringify(msg));
    }
  }

  // Event subscription
  public subscribe(type: 'storage', callback: () => void): () => void;
  public subscribe(type: 'presence', callback: () => void): () => void;
  public subscribe(type: 'others', callback: () => void): () => void;
  public subscribe(type: 'self', callback: () => void): () => void;
  public subscribe(type: 'status', callback: () => void): () => void;
  public subscribe(type: 'storageStatus', callback: () => void): () => void;
  public subscribe(type: 'event', event: string, callback: (data: any) => void): () => void;
  public subscribe(type: string, eventOrCallback: string | (() => void), maybeCallback?: (data: any) => void): () => void {
    if (type === 'event' && typeof eventOrCallback === 'string' && maybeCallback) {
      const event = eventOrCallback;
      const callback = maybeCallback;
      
      if (!this.events.event.has(event)) {
        this.events.event.set(event, new Set());
      }
      
      this.events.event.get(event)!.add(callback);
      
      return () => {
        const listeners = this.events.event.get(event);
        if (listeners) {
          listeners.delete(callback);
          if (listeners.size === 0) {
            this.events.event.delete(event);
          }
        }
      };
    } else if (typeof eventOrCallback === 'function') {
      const callback = eventOrCallback;
      
      if (type in this.events && type !== 'event') {
        (this.events as any)[type].add(callback);
        
        return () => {
          (this.events as any)[type].delete(callback);
        };
      }
    }
    
    return () => {}; // Default no-op unsubscribe
  }

  private notifyListeners(type: keyof typeof this.events) {
    if (type === 'event') return; // Skip event type as it's handled differently
    
    const listeners = (this.events as any)[type];
    listeners.forEach((listener: () => void) => listener());
  }
}