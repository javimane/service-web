"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";
import { useEffect } from "react";
import { ROUTES } from "./paths";

export default function PrivateRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const { openAuth } = useAuthModal();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      openAuth("login");
      router.replace(ROUTES.home);
    }
  }, [loading, user, openAuth, router]);

  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
