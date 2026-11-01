import type { QueryClient } from "@tanstack/react-query";

const salesQueryKeys = new Set([
  "merchant-orders",
  "merchant-order-detail",
  "merchant-selected-order-detail",
  "order-claims",
]);

export async function refreshMerchantSales(queryClient: QueryClient) {
  const filters = {
    predicate: (query: { queryKey: readonly unknown[] }) =>
      salesQueryKeys.has(String(query.queryKey[0])),
  };
  // Discard requests started before refresh so they cannot restore an older status.
  await queryClient.cancelQueries(filters);
  // Refresh mounted views and mark cached pages/details stale for their next opening.
  await queryClient.invalidateQueries(
    { ...filters, refetchType: "active" },
    { throwOnError: true },
  );
}
