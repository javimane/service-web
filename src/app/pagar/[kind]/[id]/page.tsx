import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { API_ENDPOINTS } from "@/services/api.config";
import { fetchWithApiKey } from "@/lib/serverFetch";
import CheckoutPage from "@/views/Checkout/CheckoutPage";
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

  const url = kind === "producto"
    ? API_ENDPOINTS.products.detail(id)
    : API_ENDPOINTS.services.detail(id);
  const response = await fetchWithApiKey(url, { cache: "no-store" });
  if (!response.ok) notFound();
  const payload = await response.json();
  const item = payload?.data ?? payload;
  if (!item?.id) notFound();

  const requestedQuantity = Number(quantity);
  return <CheckoutPage
    kind={kind}
    item={item}
    initialQuantity={Number.isSafeInteger(requestedQuantity) && requestedQuantity > 0
      ? Math.min(requestedQuantity, 99) : 1}
  />;
}
