"use client";


import { BASE_URL } from "@/const";
import { GetRoomResponse } from "@/types/GetRoomResponse";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";



const getRoom = async (room_id: string): Promise<GetRoomResponse> => {
    const response = await fetch(`${BASE_URL}/rooms/${room_id}`);

    if (!response.ok) {
        throw new Error(`Failed to fetch room: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
};



type Params = {
    room_id: string;
}

const Page = () => {

    const { room_id } = useParams<Params>();

    const {
        data: roomPayload,
        isLoading,
        isError,
        error
    } = useQuery({
        queryKey: ['room', room_id],
        queryFn: () => getRoom(room_id),
        retry: 1,
        refetchOnWindowFocus: false,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-lg">Loading room information...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen">
                <h1 className="text-2xl text-red-600 mb-4">Error Loading Room</h1>
                <p className="text-gray-700">{error instanceof Error ? error.message : "An unknown error occurred"}</p>
                <button
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => window.location.reload()}
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Room {room_id}</h1>
            {roomPayload ? (
                <div className="bg-white p-4 rounded shadow">
                    <p>{JSON.stringify(roomPayload)}</p>
                    {/* Add more room details as needed */}
                </div>
            ) : (
                <p className="text-yellow-600">Room information not available</p>
            )}
        </div>
    );
};

export default Page;