'use client'
// src/realtime/context.tsx
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Client, JsonObject, User } from './client';
import { Room, Status, StorageStatus } from './room';

// Context type
type RoomContextType<
    TPresence extends JsonObject,
    TPresenceOperation,
    TStorage extends JsonObject,
    TStorageOperation,
    TUserMeta = any,
    TRoomEvent = any
> = {
    room: Room<TPresence, TPresenceOperation, TStorage, TStorageOperation, TUserMeta, TRoomEvent> | null;
};

// Create context
const RoomContext = createContext<RoomContextType<any, any, any, any> | null>(null);

// Provider props
type RoomProviderProps<
    TPresence extends JsonObject,
    TPresenceOperation,
    TStorage extends JsonObject,
    TStorageOperation,
    TUserMeta = any,
    TClientMessage = any,
    TServerMessage = any
> = {
    children: React.ReactNode;
    id: string;
    initialPresence: TPresence;
    initialStorage?: TStorage;
    autoConnect?: boolean;
};

// Mutation context type
export type MutationContext<
    TPresence extends JsonObject,
    TPresenceOperation,
    TStorage extends JsonObject,
    TStorageOperation,
    TUserMeta = any
> = {
    storage: TStorage;
    self: User<TPresence, TUserMeta>;
    others: readonly User<TPresence, TUserMeta>[];
    setMyPresence: (
        operation: TPresenceOperation,
        options?: { addToHistory: boolean }
    ) => void;
};

// Create a function to create a room context
export function createRoomContext<
    TPresence extends JsonObject,
    TPresenceOperation,
    TStorage extends JsonObject,
    TStorageOperation,
    TUserMeta = any,
    TClientMessage = any,
    TServerMessage = any
>(client: Client) {
    // Create the provider component
    function RoomProvider({
        children,
        id,
        initialPresence,
        initialStorage,
        autoConnect = typeof window !== 'undefined',
    }: RoomProviderProps<TPresence, TPresenceOperation, TStorage, TStorageOperation, TUserMeta, TClientMessage, TServerMessage>) {
        const [room, setRoom] = useState<Room<TPresence, TPresenceOperation, TStorage, TStorageOperation, TUserMeta, TClientMessage, TServerMessage> | null>(null);

        useEffect(() => {
            if (!autoConnect) return;

            const { room, leave } = client.enterRoom<TPresence,TPresenceOperation, TStorage, TStorageOperation,TUserMeta, TClientMessage, TServerMessage>(id, {
                initialPresence,
                initialStorage,
            });

            setRoom(room);

            return () => {
                leave();
                setRoom(null);
            };
        }, [id, autoConnect]);

        return (
            <RoomContext.Provider value={{ room }}>
                {children}
            </RoomContext.Provider>
        );
    }

    // Create hooks
    function useRoom() {
        const context = useContext(RoomContext);
        if (!context) {
            throw new Error('useRoom must be used within a RoomProvider');
        }
        return context.room!;
    }

    function useStatus(): Status {
        const room = useRoom();
        const [status, setStatus] = useState<Status>(room?.getStatus() || 'initial');

        useEffect(() => {
            if (!room) return;

            const unsubscribe = room.subscribe('status', () => {
                setStatus(room.getStatus());
            });

            return unsubscribe;
        }, [room]);

        return status;
    }

    function useMyPresence(): [
        TPresence,
        (operation: TPresenceOperation, options?: { addToHistory: boolean }) => void
    ] {
        const room = useRoom();
        const [presence, setPresence] = useState<TPresence>(room?.getPresence() || {} as TPresence);

        useEffect(() => {
            if (!room) return;

            const unsubscribe = room.subscribe('presence', () => {
                setPresence(room.getPresence());
            });

            return unsubscribe;
        }, [room]);

        const updatePresence = (
            operation: TPresenceOperation,
            options?: { addToHistory: boolean }
        ) => {
            room?.updatePresence(operation, options);
        };

        return [presence, updatePresence];
    }

    function useUpdateMyPresence(): (
        operation: TPresenceOperation,
        options?: { addToHistory: boolean }
    ) => void {
        const room = useRoom();
        return (operation, options) => room?.updatePresence(operation, options);
    }

    function useOthers(): readonly User<TPresence, TUserMeta>[] {
        const room = useRoom();
        const [others, setOthers] = useState<readonly User<TPresence, TUserMeta>[]>(
            room?.getOthers() || []
        );

        useEffect(() => {
            if (!room) return;

            const unsubscribe = room.subscribe('others', () => {
                setOthers(room.getOthers());
            });

            return unsubscribe;
        }, [room]);

        return others;
    }

    function useSelf(): User<TPresence, TUserMeta> | null {
        const room = useRoom();
        const [self, setSelf] = useState<User<TPresence, TUserMeta> | null>(room?.getSelf() || null);

        useEffect(() => {
            if (!room) return;

            const unsubscribe = room.subscribe('self', () => {
                setSelf(room.getSelf());
            });

            return unsubscribe;
        }, [room]);

        return self;
    }

    function useStorage<T>(
        selector: (root: TStorage) => T,
        isEqual: (prev: T | null, curr: T | null) => boolean = (a, b) => a === b
    ): T | null {
        const room = useRoom();
        
        // Ensure client has access to QueryClient (first time only)
     

        // Use TanStack Query for storage, but no need for subscription anymore
        const { data: storage } = useQuery({
            queryKey: ['storage', room?.id],
            queryFn: async (): Promise<TStorage | null> => {
                if (!room?.id) return null;
                try {
                    console.log(`QueryFn: Fetching storage for room ${room.id}`);
                    return await client.fetchStorage<TStorage>(room.id);
                } catch (error) {
                    console.error(`QueryFn: Failed to fetch storage for room ${room.id}:`, error);
                    return null;
                }
            },
            // enabled: !!room,
            // Optional: Add staleTime/cacheTime if needed
        });

        // Apply selector
        const result = storage ? selector(storage) : null;
        
        // No more subscription needed - the client directly invalidates the query
        
        return result;
    }

    function makeMutationContext(
        room: Room<TPresence, TPresenceOperation, TStorage, TStorageOperation, TUserMeta, TClientMessage, TServerMessage>
    ): MutationContext<TPresence, TPresenceOperation, TStorage, TStorageOperation, TUserMeta> {
        const errmsg = "This mutation cannot be used until connected to the room";

        return {
            get storage() {
                const storage = room.getStorageSnapshot();
                if (storage === null) {
                    throw new Error(errmsg);
                }
                return storage;
            },

            get self() {
                const self = room.getSelf();
                if (self === null) {
                    throw new Error(errmsg);
                }
                return self;
            },

            get others() {
                const others = room.getOthers();
                if (room.getSelf() === null) {
                    throw new Error(errmsg);
                }
                return others;
            },

            setMyPresence: (patch, options) => room.updatePresence(patch, options),
        };
    }

    function useMutation<F extends (
        context: MutationContext<TPresence, TPresenceOperation, TStorage, TStorageOperation, TUserMeta>,
        ...args: any[]
    ) => any>(
        callback: F,
        deps: readonly unknown[] = []
    ) {
        const room = useRoom();
        const queryClient = useQueryClient();

        // Create a memoized version of the callback that includes the mutation context
        const memoizedCallback = React.useMemo(() => {
            return (...args: any[]) => {
                return room.batch(() => {
                    const result = callback(makeMutationContext(room), ...args);
                    // Invalidate queries after mutation
                    queryClient.invalidateQueries({ queryKey: ['storage', room.id] });
                    return result;
                });
            };
        }, [room, queryClient, ...deps]);

        // Remove the first argument (context) from the function type
        return memoizedCallback as unknown as Omit<F, 'context'>;
    }

    function useBroadcastMsg() {
        const room = useRoom();
        return (msg: TClientMessage) => room?.broadcastMsg(msg);
    }

  

    // Return all hooks and components
    return {
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
    };
}