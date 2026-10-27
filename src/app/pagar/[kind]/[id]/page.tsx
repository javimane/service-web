import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { API_ENDPOINTS } from "@/services/api.config";
import { fetchWithApiKey } from "@/lib/serverFetch";
import CheckoutPage from "@/views/Checkout/CheckoutPage";
import CheckoutAccess from "@/views/Checkout/CheckoutAccess";
import { apiCookieHeader } from "@/utils/apiAuth";
import { checkoutLoginUrl } from "@/utils/checkoutAuth";
import { isUuid } from "@/utils/utils";

export const metadata: Metadata = {
  title: "Finalizar compra",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ kind: string; id: string }>;
  searchParams: Promise<{ quantity?: string }>;
};

export default async function Page({ params, searchParams }: Props) {
  const { kind, id } = await params;
  const { quantity } = await searchParams;
  if (!isUuid(id) ||
      (kind !== "producto" && kind !== "servicio")) notFound();

  const requestedQuantity = Number(quantity);
  const initialQuantity = Number.isSafeInteger(requestedQuantity) && requestedQuantity > 0
    ? Math.min(requestedQuantity, 99) : 1;
  const returnTo = `/pagar/${kind}/${id}${quantity !== undefined ? `?quantity=${initialQuantity}` : ""}`;
  // Cookie-less guests go straight to login. CheckoutAccess waits for AuthProvider
  // to validate or refresh cookie-backed sessions before mounting any payment form.
  if (!apiCookieHeader((await cookies()).getAll())) redirect(checkoutLoginUrl(returnTo));

  const url = kind === "producto"
    ? API_ENDPOINTS.products.detail(id)
    : API_ENDPOINTS.services.detail(id);
  const response = await fetchWithApiKey(url, { cache: "no-store" });
  if (!response.ok) notFound();
  const payload = await response.json();
  const item = payload?.data ?? payload;
  if (!item?.id) notFound();

  return <CheckoutAccess returnTo={returnTo}><CheckoutPage
    kind={kind}
    item={item}
    initialQuantity={initialQuantity}
  /></CheckoutAccess>;
}
