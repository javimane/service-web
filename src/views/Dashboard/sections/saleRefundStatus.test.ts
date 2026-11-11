import { describe, expect, it } from "vitest";
import { getSaleRefundStatus } from "./saleRefundStatus";

describe("getSaleRefundStatus", () => {
  it("prioritizes an order's completed full refund over its earlier delivery", () => {
    expect(getSaleRefundStatus({
      status: "refunded",
      total_amount: 30000,
      refunded_amount: 30000,
    })).toBe("full");
  });

  it("distinguishes an executed partial refund from an unrefunded delivery", () => {
    expect(getSaleRefundStatus({
      status: "settled",
      total_amount: 30000,
      refunded_amount: 4500,
    })).toBe("partial");
    expect(getSaleRefundStatus({
      status: "settled",
      total_amount: 30000,
      refunded_amount: 0,
    })).toBeNull();
  });
});
