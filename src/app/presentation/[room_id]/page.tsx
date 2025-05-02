"use client"
import {
    RoomProvider,
    useMutation,
    useMyPresence,
    useOthers,
    useStorage,
} from '@/realtime/config';
import { useEffect } from 'react';

// Cursor component to show other users' cursors
function Cursor({ user }) {
    const { x, y } = user.presence.cursor || { x: 0, y: 0 };

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
    const documents = useStorage(root => root?.documents || {});

    // Create a mutation to add a new document
    const addDocument = useMutation(
        ({ storage }, title: string, content: string) => {
            const id = Date.now().toString();
            storage.documents[id] = { title, content };
        },
        []
    );

    // Track mouse movement to update cursor position
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            updateMyPresence({
                cursor: { x: e.clientX, y: e.clientY },
            });
        };

        const handleMouseLeave = () => {
            updateMyPresence({
                cursor: null,
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
                user.presence.cursor && (
                    <Cursor key={user.connectionId} user={user} />
                )
            ))}

            {/* Document list */}
            <div>
                <h2>Documents</h2>
                <button>
                    Add Document
                </button>

                <div>
                    {documents && Object.entries(documents).map(([id, doc]) => (
                        <div key={id}>
                            <h3>{doc.title}</h3>
                            <p>{doc.content}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Wrap with RoomProvider
export function Editor() {
    return (
        <RoomProvider
            id="my-collaborative-room"
            initialPresence={{ cursor: null }}
            initialStorage={{ documents: {} }}
        >
            <EditorContent />
        </RoomProvider>
    );
}

export default Editor;