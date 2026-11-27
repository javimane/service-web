import { beforeEach, describe, expect, it, vi } from "vitest";
import { buyerNeedsOnboarding } from "./buyerOnboarding";

const mocks = vi.hoisted(() => ({ profile: vi.fn(), addresses: vi.fn() }));
vi.mock("@/app/actions/profile", () => ({ getProfileAction: mocks.profile }));
vi.mock("@/services/commerceService", () => ({ commerceService: { getUserAddresses: mocks.addresses } }));

describe("Buyer onboarding without local browser flags", () => {
  beforeEach(() => {
    mocks.profile.mockResolvedValue({ data: { first_name: "Ana", last_name: "Pérez", dni: "12345678", phone: "2615555555" } });
    mocks.addresses.mockResolvedValue([{ id: "address-1" }]);
  });

  it("recognizes a completed buyer account", async () => {
    expect(await buyerNeedsOnboarding("user-1")).toBe(false);
  });

  it("resumes steps if the address is missing", async () => {
    mocks.addresses.mockResolvedValue([]);
    expect(await buyerNeedsOnboarding("user-1")).toBe(true);
  });

  it("resumes steps if the phone or DNI has not been entered", async () => {
    mocks.profile.mockResolvedValue({ data: { first_name: "Ana", last_name: "Pérez" } });
    expect(await buyerNeedsOnboarding("user-1")).toBe(true);
  });
});
