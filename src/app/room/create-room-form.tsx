"use client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { BASE_URL } from '@/const';
import { CreateRoomRequest } from '@/types/CreateRoomRequest';
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";


const RoomTypeSchema = z.enum(["presentation"]);
type RoomType = z.infer<typeof RoomTypeSchema>;





const formSchema = z.object({
  room_id: z.string().min(1),
  capacity: z.coerce.number().min(1),
});

// Function to create a room
const createRoom = async (data: z.infer<typeof formSchema>) => {

  const createRoomRequest: CreateRoomRequest = {
    capacity: data.capacity,
  }
  const response = await fetch(`${BASE_URL}/rooms/${data.room_id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createRoomRequest),
  });

  if (!response.ok) {
    throw new Error('Failed to create room');
  }

  return response.json();
};

export function CreateRoomForm({ onRoomCreated }: { onRoomCreated: () => void }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      room_id: 'r42',
      capacity: 100,
    },
  });

  const mutation = useMutation({
    mutationFn: createRoom,
    onSuccess: (data) => {
      toast.success("Room created successfully!");
      console.log(data);
      form.reset();
      onRoomCreated();
    },
    onError: (error) => {
      console.error("Form submission error", error);
      toast.error("Failed to create room. Please try again.");
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 max-w-3xl mx-auto py-10"
      >
        <FormField
          control={form.control}
          name='room_id'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Room ID</FormLabel>
              <FormControl>
                <Input placeholder="r42" type="" {...field} />
              </FormControl>
              <FormDescription>Room ID</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='capacity'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacity</FormLabel>
              <FormControl>
                <Input placeholder="100" type="number" {...field} />
              </FormControl>
              <FormDescription>Capacity</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />



        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
