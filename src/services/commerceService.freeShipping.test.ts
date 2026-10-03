import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "./apiClient";
import { commerceService } from "./commerceService";

vi.mock("./apiClient", () => ({ apiClient: vi.fn() }));

describe("commerceService.bulkUpdateFreeShipping", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends only the selected category and individual shipping flag", async () => {
    vi.mocked(apiClient).mockResolvedValue({ updatedCount: 1 });

    await commerceService.bulkUpdateFreeShipping(82, {
      free_shipping: true,
      category_id: 45,
    });

    expect(apiClient).toHaveBeenCalledWith(
      expect.stringContaining("/professional/82/free-shipping-bulk"),
      expect.objectContaining({
        method: "PUT",
        body: expect.objectContaining({
          free_shipping: true,
          categoryId: 45,
        }),
      }),
    );
  });
});
