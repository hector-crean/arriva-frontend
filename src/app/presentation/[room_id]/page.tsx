"use client"
import { User } from '@/realtime/client';
import {
    Presence,
    RoomProvider,
    Storage,
    useMutation,
    useMyPresence,
    useOthers,
    useStorage,
} from '@/realtime/config';
import { useEffect } from 'react';

// Cursor component to show other users' cursors
function Cursor({ user }: { user: User<Presence, Storage> }) {
    const { x, y } = user.presence.position || { x: 0, y: 0 };

    return (
        <div
            style={{
                position: 'absolute',
                left: x,
                top: y,
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: 'red',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
            }}
        />
    );
}

// Main editor component
function EditorContent() {
    const [myPresence, updateMyPresence] = useMyPresence();
    const others = useOthers();

    // Get documents from storage

    console.log(others);


    // Track mouse movement to update cursor position
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            updateMyPresence({
                Move: { x: e.clientX, y: e.clientY }, 
            });
        };

        const handleMouseLeave = () => {
            updateMyPresence({
               Hide: {},
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [updateMyPresence]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
            {/* Render other users' cursors */}
            {others.map(user => (
                user.presence.position && (
                    <Cursor key={user.connectionId} user={user} />
                )
            ))}

         
        </div>
    );
}

// Wrap with RoomProvider
export function Editor() {
    return (
        <RoomProvider
            id="my-collaborative-room"
            initialPresence={{ position: null }}
            initialStorage={{ slides: [], current_slide_index: 0, version: BigInt(0) }}
        >
            <EditorContent />
        </RoomProvider>
    );
}

export default Editor;