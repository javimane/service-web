"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { AuthModalProvider } from "@/context/AuthModalContext";
import AuthModal from "@/components/AuthModal/AuthModal";
import SessionTimeoutOverlay from "@/components/SessionTimeoutOverlay/SessionTimeoutOverlay";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AuthModalProvider>
            {children}
            <AuthModal />
            <SessionTimeoutOverlay />
          </AuthModalProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
