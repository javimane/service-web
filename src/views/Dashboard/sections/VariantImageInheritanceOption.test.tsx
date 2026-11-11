import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { VariantImageInheritanceOption } from "./VariantImageInheritanceOption";
import { variantParentImageUrls } from "./variant-image-selection";
describe("Variant image inheritance", () => {
  it("uses the complete ordered parent gallery and removes duplicate URLs", () => {
    expect(
      variantParentImageUrls({ images: ["first", "second", "first"] }),
    ).toEqual(["first", "second"]);
    expect(
      variantParentImageUrls({
        Images: [
          { image_url: "second", display_order: 2 },
          { image_url: "first", display_order: 1 },
        ],
      }),
    ).toEqual(["first", "second"]);
    expect(variantParentImageUrls({ images: [], image_url: "legacy" })).toEqual(
      ["legacy"],
    );
  });
  it("lets the merchant turn inheritance off and hides the inherited preview", () => {
    const change = vi.fn();
    const { rerender } = render(
      <VariantImageInheritanceOption
        checked
        images={["first", "second"]}
        onChange={change}
      />,
    );
    expect(screen.getAllByRole("img")).toHaveLength(2);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(change).toHaveBeenCalledWith(false);
    rerender(
      <VariantImageInheritanceOption
        checked={false}
        images={["first", "second"]}
        onChange={change}
      />,
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
  it("does not offer inheritance when the parent has no images", () => {
    render(
      <VariantImageInheritanceOption
        checked={false}
        images={[]}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("checkbox")).toBeDisabled();
    expect(screen.getByText(/todavía no tiene imágenes/)).toBeInTheDocument();
  });
});
