// src/realtime/room.ts
import { ServerMessageType } from '@/types/ServerMessageType';
import { Client, JsonObject, User } from './client';
import { TypedEventEmitter, EventData, CustomEventData } from './events';

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
  private events = new TypedEventEmitter<EventData, CustomEventData>();

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
    
    this.notify('self', undefined);
    
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
    this.notify('status', undefined);
  }

  public getStatus(): Status {
    return this.status;
  }

  public updateStorageStatus(status: StorageStatus) {
    this.storageStatus = status;
    this.notify('storageStatus', undefined);
  }

  public getStorageStatus(): StorageStatus {
    return this.storageStatus;
  }

  // Presence management
  public updatePresence(operation: TPresenceOperation, options?: { addToHistory: boolean }) {
    // this.presence = { ...this.presence, ...patch };
    
    if (this.self) {
      this.self.presence = this.presence;
      this.notify('self', undefined);
    }
    
    this.notify('presence', undefined);
    
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
      this.notify('storage', undefined);
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

    
    this.events.emit('others', undefined);
  }


  public handleRoomMsg(data: any) {
    // Use the TypedEventEmitter emitCustom method instead
    if (data && data.event) {
      this.events.emitCustom(data.event, data.data);
    }
  }

  public broadcastMsg(msg: TClientMessage) {
    if (this.status === 'connected' && this.socket) {
      this.socket.send(JSON.stringify(msg));
    }
  }

  // Event subscription
  public subscribe<K extends keyof EventData>(
    event: K,
    callback: (data: EventData[K]) => void
  ): () => void {
    return this.events.subscribe(event, callback);
  }

  // For custom events (like room events)
  public subscribeCustom(event: string, callback: (data: any) => void): () => void {
    return this.events.subscribeCustom(event, callback);
  }

  // Simplified notification method
  private notify<K extends keyof EventData>(event: K, data: EventData[K]): void {
    this.events.emit(event, data);
  }
}