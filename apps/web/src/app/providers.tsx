"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { SocketProvider } from "@/providers/SocketProvider";
import { ConfirmProvider } from "@/components/ui/ConfirmProvider";
import { ChatbotWidget } from "@/components/chatbot/ChatbotWidget";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const pathname = usePathname();
  const rootSegment = pathname?.split("/")[1] || "";
  const fetchAll = useAuthStore((s) => s.fetchAll);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootSegment]);

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <ConfirmProvider>
          {children}
          <ChatbotWidget />
        </ConfirmProvider>
      </SocketProvider>

      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: { fontFamily: "inherit" },
        }}
      />
    </QueryClientProvider>
  );
}