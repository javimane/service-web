import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { refreshMerchantSales } from "./refreshMerchantSales";

describe("refresh merchant sales", () => {
  it("updates the list, open order and claims, and invalidates cached details", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    const activeQueries = [
      { key: ["merchant-orders", 1], old: { items: [{ id: "sale-1", status: "paid", has_active_claim: true }] }, fresh: { items: [{ id: "sale-1", status: "refunded", has_active_claim: false }] } },
      { key: ["merchant-selected-order-detail", "sale-1"], old: { status: "paid" }, fresh: { status: "refunded" } },
      { key: ["order-claims", "sale-1"], old: [{ status: "open" }], fresh: [{ status: "refunded" }] },
    ];
    const observers = activeQueries.map(({ key, old, fresh }) => {
      client.setQueryData(key, old);
      const queryFn = vi.fn().mockResolvedValue(fresh);
      const observer = new QueryObserver(client, { queryKey: key, queryFn });
      return { queryFn, unsubscribe: observer.subscribe(() => {}) };
    });
    client.setQueryData(["merchant-order-detail", "sale-2"], { status: "confirmed" });
    client.setQueryData(["merchant-orders", 2], { items: [] });
    client.setQueryData(["professional-me"], { id: 82 });

    try {
      await refreshMerchantSales(client);
      activeQueries.forEach(({ key, fresh }, index) => {
        expect(client.getQueryData(key)).toEqual(fresh);
        expect(observers[index].queryFn).toHaveBeenCalledOnce();
      });
      expect(client.getQueryState(["merchant-order-detail", "sale-2"])?.isInvalidated).toBe(true);
      expect(client.getQueryState(["merchant-orders", 2])?.isInvalidated).toBe(true);
      expect(client.getQueryState(["professional-me"])?.isInvalidated).toBe(false);
    } finally {
      observers.forEach(({ unsubscribe }) => unsubscribe());
      client.clear();
    }
  });

  it("reports a refresh failure instead of treating stale claims as updated", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    const key = ["order-claims", "sale-1"];
    client.setQueryData(key, [{ status: "open" }]);
    const error = new Error("API unavailable");
    const observer = new QueryObserver(client, { queryKey: key, queryFn: () => Promise.reject(error) });
    const unsubscribe = observer.subscribe(() => {});
    try {
      await expect(refreshMerchantSales(client)).rejects.toThrow("API unavailable");
    } finally {
      unsubscribe();
      client.clear();
    }
  });
});
