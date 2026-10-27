"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { checkoutLoginUrl } from "@/utils/checkoutAuth";

export default function CheckoutAccess({ returnTo, children }: { returnTo: string; children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace(checkoutLoginUrl(returnTo));
  }, [user, loading, router, returnTo]);

  if (loading || !user) return null;
  return <>{children}</>;
}
