"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const Page = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Riva Room Collaboration</h1>
        <p className="text-xl text-gray-600">
          A real-time WebSocket-based collaboration platform
        </p>
      </header>
      <Button asChild size="lg">
        <Link href="/room">Go to Room Dashboard</Link>
      </Button>
      
      <Image src="/architecture.png" alt="Architecture" width={1000} height={1000} />

     

    </div>
  );
};

export default Page;
