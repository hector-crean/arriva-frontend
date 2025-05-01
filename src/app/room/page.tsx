"use client";
import { useRivaWs } from "@/hooks/socket-io";
import { ServerMessage } from "@/types/ServerMessage";
import { ServerEvent } from "@/types/ServerEvent";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { RoomTable } from "./rooms-table";
import { match } from "ts-pattern";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useStorage } from "@/hooks/use-storage";
import { GetRoomResponse } from "@/types/GetRoomResponse";
import { ListRoomsResponse } from "@/types/ListRoomsResponse";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"


const listRooms = async (): Promise<ListRoomsResponse> => {
  const response = await fetch(`http://localhost:9999/api/rooms`);
  
  
  const data: ListRoomsResponse = await response.json();
  return data;
};




const Page = () => {
  const queryClient = useQueryClient();

  const { data: room } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => listRooms(),
  });

  return (
    <Table>
  <TableCaption>A list of rooms.</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Room ID</TableHead>
      <TableHead>Client Presences</TableHead>
      <TableHead>Client IDs</TableHead>
      <TableHead>Storage</TableHead>
      <TableHead>Subscriber Count</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {room?.rooms.map((room) => (
      <TableRow key={room.room_id}>
        <TableCell>{room.room_id}</TableCell>
        <TableCell>{JSON.stringify(room.client_presences)}</TableCell>
        <TableCell>{room.client_ids}</TableCell>
        <TableCell>{JSON.stringify(room.storage)}</TableCell>
        <TableCell>{room.subscriber_count}</TableCell>

      </TableRow>
    ))}
  </TableBody>
</Table>

  );
  
  // const handleEvent = async (event: ServerMessage<ServerEvent>): Promise<void> => {
  //   console.log("Received event:", event);
  //   match(event.payload)
  //     .with({ type: "PresentationJoined" }, async () => {
  //       console.log('Refetching rooms after PresentationJoined event');
  //       await queryClient.invalidateQueries({ queryKey: ['rooms'] });
  //     })
  //     .with({ type: "PresentationLeft" }, async () => {
  //       console.log('Refetching rooms after PresentationLeft event');
  //       await queryClient.invalidateQueries({ queryKey: ['rooms'] });
  //     })
  //     .with({ type: "SlideChanged" }, () => {
  //       // No refetch needed for slide changes
  //     })
  //     .otherwise((payload) => {
  //       console.warn("Unhandled event type:", payload);
  //     });
  // };

  // const { emitCommand } = useRivaWs(handleEvent);

  // return (
  //   <RoomTable emitCommand={emitCommand} />
  // );


};

export default Page;