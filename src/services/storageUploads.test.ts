import { afterEach, describe, expect, it, vi } from "vitest";
import { compressDocumentImage } from "./storageUploads";

const originalCreateObjectURL = Object.getOwnPropertyDescriptor(URL, "createObjectURL");
const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(URL, "revokeObjectURL");

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  for (const [key, descriptor] of [
    ["createObjectURL", originalCreateObjectURL],
    ["revokeObjectURL", originalRevokeObjectURL],
  ] as const) {
    if (descriptor) Object.defineProperty(URL, key, descriptor);
    else Reflect.deleteProperty(URL, key);
  }
});

describe("compressDocumentImage", () => {
  it("leaves PDFs unchanged", async () => {
    const pdf = new File(["document"], "cedula.pdf", { type: "application/pdf" });
    expect(await compressDocumentImage(pdf)).toBe(pdf);
  });

  it.each([
    { outputSize: 25, expectedWebP: true },
    { outputSize: 200, expectedWebP: false },
  ])("uses the WebP file only when it is smaller", async ({
    outputSize,
    expectedWebP,
  }) => {
    class LoadedImage {
      width = 1200;
      height = 800;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal("Image", LoadedImage);
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:test"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => {
      callback(new Blob([new Uint8Array(outputSize)], { type: "image/webp" }));
    });

    const original = new File([new Uint8Array(100)], "licencia.jpg", {
      type: "image/jpeg",
    });
    const result = await compressDocumentImage(original);
    if (expectedWebP) {
      expect(result).not.toBe(original);
      expect(result.name).toBe("licencia.webp");
      expect(result.type).toBe("image/webp");
      expect(result.size).toBe(outputSize);
    } else {
      expect(result).toBe(original);
    }
  });
});
