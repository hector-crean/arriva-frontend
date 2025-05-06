"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StorageDocumentResponse } from "@/types/StorageDocumentResponse";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { PresentationEditor } from "./presentation-editor";
import { PresentationViewer } from "./shared-presentation";
import {
  Presence,
  RoomProvider,
  Storage,
  useMutation,
  useMyPresence,
  useOthers,
  useRoom,
  useStorage,
} from "@/realtime/config";
import { useEffect } from "react";
import { User } from "@/realtime/client";


const Presentation = ({ roomId }: { roomId: string }) => {


//   const room = useRoom();
//   const queryClient = useQueryClient();

  const storage = useStorage(
    (root) => root,
    (prev, curr) => prev?.data.version === curr?.data.current_slide_index
  );





  if (!storage) {
    return (
      <div className="flex justify-center items-center h-screen">
        Presentation not found
      </div>
    );
  }


  return (
    <div className="container mx-auto py-8 relative">
      
      <Tabs defaultValue="view">
        <TabsList className="mb-8 w-full max-w-md mx-auto">
          <TabsTrigger value="view" className="flex-1">
            View Presentation
          </TabsTrigger>
          <TabsTrigger value="edit" className="flex-1">
            Edit Presentation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="view">
          <PresentationViewer roomId={roomId} presentation={storage.data} />
        </TabsContent>

        <TabsContent value="edit">
          <PresentationEditor roomId={roomId} presentation={storage.data} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Page = () => {
  const { room_id } = useParams<{ room_id: string }>();

  return (
    <RoomProvider
      id={room_id}
      initialPresence={{
        cursor: { position: null, color: "#000000", is_dragging: false },
        user: { name: "Anonymous", avatar_url: null, is_typing: false },
      }}
      initialStorage={{
        data: { slides: [], current_slide_index: 0, version: BigInt(0) },
        version: BigInt(0),
      }}
    >
      <Presentation roomId={room_id as string} />
    </RoomProvider>
  );
};

export default Page;
