import { describe, expect, it } from "vitest";
import { isServiceAppointmentScheduled } from "./serviceAppointment";

describe("service appointment assignment", () => {
  it.each([undefined, "pending_appointment", "completed"])("does not treat %s as an assigned appointment", (status) => {
    expect(isServiceAppointmentScheduled({ appointment_status: status } as any)).toBe(false);
  });
  it("requires both a scheduled order and a real scheduled appointment", () => {
    expect(isServiceAppointmentScheduled({ appointment_status: "scheduled" })).toBe(false);
    expect(isServiceAppointmentScheduled({ appointment_status: "scheduled", appointment: { status: "cancelled" } } as any)).toBe(false);
    expect(isServiceAppointmentScheduled({ appointment_status: "scheduled", appointment: { status: "scheduled" } } as any)).toBe(true);
  });
});
