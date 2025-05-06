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
  useEventListener,
  useMutation,
  useMyPresence,
  useOthers,
  useRoom,
  useStorage,
} from "@/realtime/config";
import { useEffect } from "react";
import { User } from "@/realtime/client";

function Cursor({ user }: { user: User<Presence> }) {
  const { x, y } = user.presence.cursor.position || { x: 0, y: 0 };

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 20,
        height: 20,
        borderRadius: "50%",
        backgroundColor: "red",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 1000,
      }}
    />
  );
}

const Presentation = ({ roomId }: { roomId: string }) => {
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();

//   const room = useRoom();
//   const queryClient = useQueryClient();

  const storage = useStorage(
    (root) => root,
    (prev, curr) => prev?.data.version === curr?.data.current_slide_index
  );

  console.log(storage);





  // Track mouse movement to update cursor position
//   useEffect(() => {
//     const handleMouseMove = (e: MouseEvent) => {
//       updateMyPresence({
//         Move: { x: e.clientX, y: e.clientY },
//       });
//     };

//     const handleMouseLeave = () => {
//       updateMyPresence("Hide");
//     };

//     window.addEventListener("mousemove", handleMouseMove);
//     window.addEventListener("mouseleave", handleMouseLeave);

//     return () => {
//       window.removeEventListener("mousemove", handleMouseMove);
//       window.removeEventListener("mouseleave", handleMouseLeave);
//     };
//   }, [updateMyPresence]);

  // if (isLoading) {
  //     return <div className="flex justify-center items-center h-screen">Loading presentation...</div>;
  // }

  if (!storage) {
    return (
      <div className="flex justify-center items-center h-screen">
        Presentation not found
      </div>
    );
  }

  console.log(storage);

  return (
    <div className="container mx-auto py-8 relative">
      {others.map(
        (user) =>
          user.presence.cursor.position && (
            <Cursor key={user.connectionId} user={user} />
          )
      )}
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
