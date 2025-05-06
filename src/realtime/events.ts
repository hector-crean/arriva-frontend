// First, create a separate events module

// Define the event types
export type EventType = 'storage' | 'presence' | 'others' | 'self' | 'status' | 'storageStatus';

// Type-safe event data
export interface EventData {
  storage: void;        // No data
  presence: void;       // No data
  others: void;         // No data
  self: void;           // No data
  status: void;         // No data
  storageStatus: void;  // No data
  // Add more events with their respective data types
}

// Custom events (like room events)
export interface CustomEventData {
  [eventName: string]: any;
}

// Create a type-safe event emitter
export class TypedEventEmitter<
  TEvents extends Record<string, any> = EventData,
  TCustomEvents extends Record<string, any> = CustomEventData
> {
  private listeners = new Map<string, Set<(data: any) => void>>();
  
  // Subscribe to an event with proper typing
  public subscribe<K extends keyof TEvents>(
    event: K,
    callback: (data: TEvents[K]) => void
  ): () => void {
    const key = String(event);
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    this.listeners.get(key)!.add(callback as any);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(key);
      if (listeners) {
        listeners.delete(callback as any);
        if (listeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }
  
  // Subscribe to a custom event
  public subscribeCustom<K extends keyof TCustomEvents>(
    event: K,
    callback: (data: TCustomEvents[K]) => void
  ): () => void {
    return this.subscribe(event as any, callback as any);
  }
  
  // Subscribe to multiple events
  public subscribeMany(
    subscriptions: { [K in keyof TEvents]?: (data: TEvents[K]) => void }
  ): () => void {
    const unsubscribers: Array<() => void> = [];
    
    for (const [event, callback] of Object.entries(subscriptions)) {
      if (callback) {
        unsubscribers.push(this.subscribe(event as any, callback));
      }
    }
    
    // Return a function that unsubscribes from all
    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }
  
  // Emit an event with proper typing
  public emit<K extends keyof TEvents>(event: K, data: TEvents[K]): void {
    const key = String(event);
    const listeners = this.listeners.get(key);
    
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in ${String(event)} event listener:`, error);
        }
      });
    }
  }
  
  // Emit a custom event
  public emitCustom<K extends keyof TCustomEvents>(event: K, data: TCustomEvents[K]): void {
    // Cast both the event and data to avoid type issues
    this.emit(event as unknown as keyof TEvents, data as unknown as TEvents[keyof TEvents]);
  }
  
  // Listen once (auto-unsubscribe after first event)
  public once<K extends keyof TEvents>(
    event: K,
    callback: (data: TEvents[K]) => void
  ): () => void {
    const wrapper = (data: TEvents[K]) => {
      unsubscribe();
      callback(data);
    };
    
    const unsubscribe = this.subscribe(event, wrapper);
    return unsubscribe;
  }
  
  // Check if event has listeners
  public hasListeners(event: keyof TEvents | keyof TCustomEvents): boolean {
    const key = String(event);
    const listeners = this.listeners.get(key);
    return !!listeners && listeners.size > 0;
  }
  
  // Clear all listeners for an event
  public clearListeners(event?: keyof TEvents | keyof TCustomEvents): void {
    if (event) {
      this.listeners.delete(String(event));
    } else {
      this.listeners.clear();
    }
  }
} 