"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./realtime/config";



const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export default Providers;