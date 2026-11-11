export function subscriptionCheckoutUrl(data?: { initPoint?: string; link?: string } | null): string | null {
  const url = data?.initPoint || data?.link;
  return typeof url === "string" && url.trim() ? url : null;
}

export function redirectToSubscriptionCheckout(url: string): void {
  window.location.assign(url);
}
