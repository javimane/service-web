type ClaimState = { status?: string | null };
type OrderClaimState = {
  claim_requested?: boolean;
  withdrawal_requested?: boolean;
  has_active_claim?: boolean;
  has_claim_history?: boolean;
  withdrawal_claims?: ClaimState[] | null;
};

export function hasOrderClaimHistory(
  order?: OrderClaimState | null,
  claims: ClaimState[] = [],
): boolean {
  return Boolean(order?.has_claim_history || hasActiveOrderClaim(order, claims) ||
    order?.withdrawal_claims?.length || claims.length);
}

export function hasActiveOrderClaim(
  order?: OrderClaimState | null,
  claims: ClaimState[] = [],
): boolean {
  return Boolean(order?.claim_requested || order?.withdrawal_requested || order?.has_active_claim ||
    [...(order?.withdrawal_claims ?? []), ...claims].some((claim) =>
      ["open", "in_review", "received"].includes(claim.status ?? "")));
}
