// @vitest-environment node
import React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import MapPickerModal from "./MapPickerModal";

describe("MapPickerModal server rendering", () => {
  it.each([false, true])("does not evaluate Leaflet on the server (open: %s)", (isOpen) => {
    expect(typeof window).toBe("undefined");
    expect(() => renderToString(
      <MapPickerModal isOpen={isOpen} onClose={() => {}} onSelect={() => {}} />,
    )).not.toThrow();
  });
});
