import { afterEach, describe, expect, it } from "vitest";
import { localDateInputValue, localDateNextDayUtc, localDateStartUtc } from "./localDateRange";

const originalTimeZone = process.env.TZ;

afterEach(() => { process.env.TZ = originalTimeZone; });

describe("local date filters", () => {
  it("converts a local calendar day to UTC bounds in the user's time zone", () => {
    process.env.TZ = "America/Argentina/Buenos_Aires";
    expect(localDateStartUtc("2026-09-23")).toBe("2026-09-23T03:00:00.000Z");
    expect(localDateNextDayUtc("2026-09-23")).toBe("2026-09-24T03:00:00.000Z");
  });

  it("uses next local midnight across daylight-saving changes", () => {
    process.env.TZ = "America/New_York";
    expect(localDateStartUtc("2026-03-08")).toBe("2026-03-08T05:00:00.000Z");
    expect(localDateNextDayUtc("2026-03-08")).toBe("2026-03-09T04:00:00.000Z");
  });

  it("formats today's input value from local components", () => {
    process.env.TZ = "America/Argentina/Buenos_Aires";
    expect(localDateInputValue(new Date("2026-09-24T02:30:00.000Z"))).toBe("2026-09-23");
  });
});
