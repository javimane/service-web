"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { AuthModalProvider } from "@/context/AuthModalContext";
import { AlertProvider } from "@/context/AlertContext";
import AuthModal from "@/components/AuthModal/AuthModal";
import SessionTimeoutOverlay from "@/components/SessionTimeoutOverlay/SessionTimeoutOverlay";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "sileo";
import "sileo/styles.css";

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
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "1028741369344-placeholder.apps.googleusercontent.com"}>
        <ThemeProvider>
          <AuthProvider>
            <AuthModalProvider>
              <AlertProvider>
                {children}
                <AuthModal />
                <SessionTimeoutOverlay />
                <Toaster />
              </AlertProvider>
            </AuthModalProvider>
          </AuthProvider>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}
