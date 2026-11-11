import { describe, expect, it } from "vitest";
import { hasActiveOrderClaim, hasOrderClaimHistory } from "./orderClaimState";

describe("active order claims", () => {
  it.each(["open", "in_review", "received"])("blocks a new return for a %s claim", (status) => {
    expect(hasActiveOrderClaim({}, [{ status }])).toBe(true);
    expect(hasActiveOrderClaim({ withdrawal_claims: [{ status }] })).toBe(true);
  });
  it("respects server flags while detailed claims are unavailable", () => {
    expect(hasActiveOrderClaim({ has_active_claim: true })).toBe(true);
    expect(hasActiveOrderClaim({ claim_requested: true })).toBe(true);
    expect(hasActiveOrderClaim({ withdrawal_requested: true })).toBe(true);
  });
  it("does not treat closed historical claims as an active request", () => {
    expect(hasActiveOrderClaim({}, ["resolved", "rejected", "refunded"].map((status) => ({ status })))).toBe(false);
  });
  it.each(["open", "in_review", "received", "resolved", "rejected", "refunded"])("keeps a separate return hidden after a %s claim", (status) => {
    expect(hasOrderClaimHistory({}, [{ status }])).toBe(true);
    expect(hasOrderClaimHistory({ withdrawal_claims: [{ status }] })).toBe(true);
  });
  it("keeps returns hidden with the history flag even before fetching claim details", () => {
    expect(hasOrderClaimHistory({ has_claim_history: true })).toBe(true);
    expect(hasOrderClaimHistory({}, [])).toBe(false);
  });
});
