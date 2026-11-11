import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CommentsCarousel from "./CommentsCarousel";

vi.mock("../../app/actions/comments", () => ({
  getProductCommentsAction: vi.fn().mockResolvedValue({
    data: {
      items: [
        {
          id: "c-1",
          user_name: "Juan Perez",
          rating: 5,
          text: "Excelente producto, muy recomendado!",
          created_at: "2026-03-10T12:00:00Z",
          image_url: "https://example.com/comment-pic.jpg",
        },
      ],
      total: 1,
    },
  }),
  getServiceCommentsAction: vi.fn().mockResolvedValue({
    data: {
      items: [],
      total: 0,
    },
  }),
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("CommentsCarousel", () => {
  it("abre el modal del comentario al hacer click en la card y permite ampliar la imagen", async () => {
    renderWithClient(
      <CommentsCarousel type="product" targetId="prod-123" />,
    );

    // Wait for the comment card to be rendered
    const author = await screen.findByText("Juan Perez");
    expect(author).toBeInTheDocument();

    const commentCard = screen.getByRole("button", {
      name: /Ver opinión de Juan Perez/i,
    });

    // Clicking the card opens the modal
    fireEvent.click(commentCard);

    // The modal should display the community review title and full text
    expect(screen.getByText("Opinión de la comunidad")).toBeInTheDocument();
    expect(
      screen.getAllByText("Excelente producto, muy recomendado!"),
    ).toHaveLength(2);

    // Clicking the attached image opens the enlarged lightbox
    const viewLargerBtn = screen.getByRole("button", {
      name: /Ver imagen ampliada/i,
    });
    fireEvent.click(viewLargerBtn);

    const enlargedImg = screen.getByAltText("Foto adjunta en tamaño grande");
    expect(enlargedImg).toBeInTheDocument();
    expect(enlargedImg).toHaveAttribute("src", "https://example.com/comment-pic.jpg");

    // Closing the lightbox
    const closeLightboxBtn = screen.getByRole("button", {
      name: /Cerrar imagen/i,
    });
    fireEvent.click(closeLightboxBtn);
    expect(screen.queryByAltText("Foto adjunta en tamaño grande")).not.toBeInTheDocument();
  });
});
