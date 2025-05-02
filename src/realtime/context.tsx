// src/realtime/context.tsx
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Client, JsonObject, User } from './client';
import { Room, Status } from './room';

// Context type
type RoomContextType<
    TPresence extends JsonObject,
    TStorage extends JsonObject,
    TUserMeta = any,
    TRoomEvent = any
> = {
    room: Room<TPresence, TStorage, TUserMeta, TRoomEvent> | null;
};

// Create context
const RoomContext = createContext<RoomContextType<any, any, any, any> | null>(null);

// Provider props
type RoomProviderProps<
    TPresence extends JsonObject,
    TStorage extends JsonObject,
    TUserMeta = any,
    TRoomEvent = any
> = {
    children: React.ReactNode;
    client: Client;
    id: string;
    initialPresence: TPresence;
    initialStorage?: TStorage;
    autoConnect?: boolean;
};

// Mutation context type
export type MutationContext<
    TPresence extends JsonObject,
    TStorage extends JsonObject,
    TUserMeta = any
> = {
    storage: TStorage;
    self: User<TPresence, TUserMeta>;
    others: readonly User<TPresence, TUserMeta>[];
    setMyPresence: (
        patch: Partial<TPresence>,
        options?: { addToHistory: boolean }
    ) => void;
};

// Create a function to create a room context
export function createRoomContext<
    TPresence extends JsonObject,
    TStorage extends JsonObject,
    TUserMeta = any,
    TRoomEvent = any
>(client: Client) {
    // Create the provider component
    function RoomProvider({
        children,
        id,
        initialPresence,
        initialStorage,
        autoConnect = typeof window !== 'undefined',
    }: RoomProviderProps<TPresence, TStorage, TUserMeta, TRoomEvent>) {
        const [room, setRoom] = useState<Room<TPresence, TStorage, TUserMeta, TRoomEvent> | null>(null);

        useEffect(() => {
            if (!autoConnect) return;

            const { room, leave } = client.enterRoom<TPresence, TStorage, TUserMeta, TRoomEvent>(id, {
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
        (patch: Partial<TPresence>, options?: { addToHistory: boolean }) => void
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
            patch: Partial<TPresence>,
            options?: { addToHistory: boolean }
        ) => {
            room?.updatePresence(patch, options);
        };

        return [presence, updatePresence];
    }

    function useUpdateMyPresence(): (
        patch: Partial<TPresence>,
        options?: { addToHistory: boolean }
    ) => void {
        const room = useRoom();
        return (patch, options) => room?.updatePresence(patch, options);
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
        const queryClient = useQueryClient();

        // Use Tanstack Query for storage
        const { data: storage } = useQuery({
            queryKey: ['storage', room?.id],
            queryFn: async () => room?.getStorageSnapshot() || null,
            enabled: !!room,
        });

        const result = storage ? selector(storage) : null;

        useEffect(() => {
            if (!room) return;

            const unsubscribe = room.subscribe('storage', () => {
                queryClient.invalidateQueries({ queryKey: ['storage', room.id] });
            });

            return unsubscribe;
        }, [room, queryClient]);

        return result;
    }

    function makeMutationContext(
        room: Room<TPresence, TStorage, TUserMeta, TRoomEvent>
    ): MutationContext<TPresence, TStorage, TUserMeta> {
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
        context: MutationContext<TPresence, TStorage, TUserMeta>,
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

    function useBroadcastEvent() {
        const room = useRoom();
        return (event: string, data: TRoomEvent) => room?.broadcastEvent(event, data);
    }

    function useEventListener(
        event: string,
        callback: (data: TRoomEvent) => void,
        deps: readonly unknown[] = []
    ) {
        const room = useRoom();

        // Memoize callback to avoid unnecessary re-subscriptions
        const memoizedCallback = React.useCallback(callback, deps);

        useEffect(() => {
            if (!room) return;

            const unsubscribe = room.subscribe('event', event, memoizedCallback);
            return unsubscribe;
        }, [room, event, memoizedCallback]);
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
        useBroadcastEvent,
        useEventListener,
    };
}