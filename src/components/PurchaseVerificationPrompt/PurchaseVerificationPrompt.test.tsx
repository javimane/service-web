import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PurchaseVerificationPrompt from "./PurchaseVerificationPrompt";
import { requestIdentityVerification } from "@/utils/identityVerification";

const { refreshSession, auth } = vi.hoisted(() => ({
  refreshSession: vi.fn(),
  auth: { user: { id: "buyer-1" }, isAgeVerified: false },
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ ...auth, refreshSession }),
}));

vi.mock("@/components/Modal/Modal", () => ({
  default: ({ isOpen, title, children }: { isOpen: boolean; title: string; children: React.ReactNode }) =>
    isOpen ? <div role="dialog" aria-label={title}>{children}</div> : null,
}));

describe("PurchaseVerificationPrompt", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    refreshSession.mockReset();
    auth.isAgeVerified = false;
  });

  it("keeps the floating prompt after closing the instructions and checks the refreshed session", async () => {
    refreshSession.mockResolvedValue({ is_age_verified: true });
    render(<PurchaseVerificationPrompt />);

    act(() => requestIdentityVerification());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Entendido" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("¿Verificaste la cuenta?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sí" }));
    await waitFor(() => expect(refreshSession).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.queryByText("¿Verificaste la cuenta?")).not.toBeInTheDocument());
    expect(window.sessionStorage.getItem("identity-verification-pending:buyer-1")).toBeNull();
  });

  it("restores the prompt while verification is pending", () => {
    window.sessionStorage.setItem("identity-verification-pending:buyer-1", "true");
    render(<PurchaseVerificationPrompt />);
    expect(screen.getByText("¿Verificaste la cuenta?")).toBeInTheDocument();
  });
});
