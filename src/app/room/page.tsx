"use client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BASE_URL } from "@/const";
import { ListRoomsResponse } from "@/types/ListRoomsResponse";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateRoomForm } from "./create-room-form";


const listRooms = async (): Promise<ListRoomsResponse> => {
  const response = await fetch(`${BASE_URL}/rooms`);

  const data: ListRoomsResponse = await response.json();
  return data;
};




const Page = () => {
  const queryClient = useQueryClient();

  const { data: room } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => listRooms(),
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    staleTime: 1000,
  });

  const deleteRoom = useMutation({
    mutationFn: async (room_id: string) => {
      const response = await fetch(`${BASE_URL}/rooms/${room_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete room');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: (error) => {
      console.error('Error deleting room:', error);
    },
  })


  return (
    <main>
      <Table>
        <TableCaption>A list of rooms.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Room ID</TableHead>
            <TableHead>Client Presences</TableHead>
            <TableHead>Client IDs</TableHead>
            <TableHead>Storage</TableHead>
            <TableHead>Subscriber Count</TableHead>
            <TableHead>Delete</TableHead>
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
              <TableCell><Button onClick={() => {
                deleteRoom.mutate(room.room_id);
              }}>Delete</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <CreateRoomForm onRoomCreated={() => {
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
      }} />

    </main>)



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