"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StorageDocumentResponse } from '@/types/StorageDocumentResponse';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { PresentationEditor } from './presentation-editor';
import { PresentationViewer } from './shared-presentation';


export default function PresentationPage() {
    const { room_id } = useParams<{ room_id: string }>();

    const { data, isLoading, error } = useQuery<StorageDocumentResponse>({
        queryKey: ['room', room_id, 'storage'],
        queryFn: async () => {
            const response = await fetch(`http://127.0.0.1:9999/api/rooms/${room_id}/storage`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            console.log(response);
            if (!response.ok) throw new Error('Failed to fetch presentation');
            return response.json();
        },
        enabled: !!room_id,
        // error: (err) => {
        //     toast.error('Failed to load presentation');
        //     console.error(err);
        // }
    });


    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Loading presentation...</div>;
    }

    if (error || !data?.data) {
        return <div className="flex justify-center items-center h-screen">Presentation not found</div>;
    }

    return (
        <div className="container mx-auto py-8">
            <Tabs defaultValue="view">
                <TabsList className="mb-8 w-full max-w-md mx-auto">
                    <TabsTrigger value="view" className="flex-1">View Presentation</TabsTrigger>
                    <TabsTrigger value="edit" className="flex-1">Edit Presentation</TabsTrigger>
                </TabsList>

                <TabsContent value="view">
                    <PresentationViewer
                        roomId={room_id as string}
                        initialPresentation={data.data}
                    />
                </TabsContent>

                <TabsContent value="edit">
                    <PresentationEditor
                        roomId={room_id as string}
                        presentation={data.data}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}