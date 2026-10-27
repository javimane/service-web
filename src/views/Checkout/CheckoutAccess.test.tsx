import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CheckoutAccess from "./CheckoutAccess";
import { checkoutLoginUrl } from "@/utils/checkoutAuth";

const mocks = vi.hoisted(() => ({ replace: vi.fn(), auth: { user: null, loading: false } as any, mounted: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => mocks.auth }));
const returnTo = "/pagar/producto/042fcecf-8fda-42ce-8ff9-04d729c6f843?quantity=2";
function PaymentForm() { mocks.mounted(); return <button>Confirmar pago</button>; }

describe("checkout access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth = { user: null, loading: false };
  });
  it("redirects guests without mounting a payment form", () => {
    render(<CheckoutAccess returnTo={returnTo}><PaymentForm /></CheckoutAccess>);
    expect(mocks.replace).toHaveBeenCalledWith(checkoutLoginUrl(returnTo));
    expect(mocks.mounted).not.toHaveBeenCalled();
  });
  it("waits for authentication, including session refresh, before showing the form", () => {
    mocks.auth = { user: null, loading: true };
    const { rerender } = render(<CheckoutAccess returnTo={returnTo}><PaymentForm /></CheckoutAccess>);
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.mounted).not.toHaveBeenCalled();
    mocks.auth = { user: { id: "buyer-1" }, loading: false };
    rerender(<CheckoutAccess returnTo={returnTo}><PaymentForm /></CheckoutAccess>);
    expect(screen.getByRole("button", { name: "Confirmar pago" })).toBeInTheDocument();
  });
  it("removes the payment form when the session ends", () => {
    mocks.auth = { user: { id: "buyer-1" }, loading: false };
    const { rerender } = render(<CheckoutAccess returnTo={returnTo}><PaymentForm /></CheckoutAccess>);
    mocks.auth = { user: null, loading: false };
    rerender(<CheckoutAccess returnTo={returnTo}><PaymentForm /></CheckoutAccess>);
    expect(screen.queryByRole("button", { name: "Confirmar pago" })).not.toBeInTheDocument();
    expect(mocks.replace).toHaveBeenCalledWith(checkoutLoginUrl(returnTo));
  });
});
