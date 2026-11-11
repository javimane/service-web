import { describe, expect, it } from "vitest";
import { getDeliveryCoverage } from "./deliveryCoverage";

describe("getDeliveryCoverage", () => {
  const branch = { latitude: -34.6, longitude: -58.4, delivery_radius_km: 10 };

  it("allows a destination within the selected branch radius", () => {
    expect(getDeliveryCoverage(branch, { latitude: -34.62, longitude: -58.4 }).status)
      .toBe("inside");
  });

  it("blocks home delivery outside the selected branch radius", () => {
    expect(getDeliveryCoverage(branch, { latitude: -35, longitude: -58.4 }).status)
      .toBe("outside");
  });

  it("does not assume coverage without coordinates or a configured radius", () => {
    expect(getDeliveryCoverage(branch, null).status).toBe("unknown");
    expect(getDeliveryCoverage({ ...branch, delivery_radius_km: null }, branch).status)
      .toBe("outside");
  });
});
