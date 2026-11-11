export const IDENTITY_VERIFICATION_REQUIRED_EVENT = "identity-verification-required";

export function requestIdentityVerification(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(IDENTITY_VERIFICATION_REQUIRED_EVENT));
  }
}
