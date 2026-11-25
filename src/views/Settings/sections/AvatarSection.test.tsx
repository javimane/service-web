import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AvatarSection from "./AvatarSection";

const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  update: vi.fn(),
  profile: vi.fn(),
}));

vi.mock("@/services/storageUploads", () => ({ uploadProfileImage: mocks.upload }));
vi.mock("@/app/actions/profile", () => ({
  getProfileAction: mocks.profile,
  updateProfileAction: mocks.update,
}));
vi.mock("@/utils/auth", () => ({ getAccessToken: () => "token" }));

describe("Automatic profile photo saving", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.profile.mockResolvedValue({ data: { avatar_url: "https://example.com/old.jpg" } });
    mocks.update.mockResolvedValue({ data: {} });
    vi.stubGlobal("URL", Object.assign(URL, {
      createObjectURL: vi.fn(() => "blob:photo-preview"),
      revokeObjectURL: vi.fn(),
    }));
  });

  async function setup() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const result = render(<QueryClientProvider client={client}><AvatarSection userId="user-1" /></QueryClientProvider>);
    await screen.findByRole("img", { name: "Foto de perfil" });
    const input = result.container.querySelector('input[type="file"]') as HTMLInputElement;
    return { input };
  }

  it("uploads and saves immediately after selecting a photo, with a pending indicator", async () => {
    let finishUpload!: (value: { publicUrl: string }) => void;
    mocks.upload.mockImplementation(() => new Promise((resolve) => { finishUpload = resolve; }));
    const { input } = await setup();
    const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(await screen.findByRole("button", { name: "Guardando foto…" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Guardar foto" })).not.toBeInTheDocument();
    await waitFor(() => expect(mocks.upload).toHaveBeenCalledWith({ file }));
    finishUpload({ publicUrl: "https://example.com/new.jpg" });
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith({
      id: "user-1", data: { avatar_url: "https://example.com/new.jpg" }, token: "token",
    }));
    expect(await screen.findByText("Foto de perfil actualizada correctamente.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cambiar foto" })).toBeEnabled();
  });

  it("restores the saved image if the profile update fails", async () => {
    mocks.upload.mockResolvedValue({ publicUrl: "https://example.com/new.jpg" });
    mocks.update.mockResolvedValue({ serverError: "Update failed" });
    const { input } = await setup();
    fireEvent.change(input, { target: { files: [new File(["photo"], "photo.jpg", { type: "image/jpeg" })] } });
    expect(await screen.findByText("Error al subir la imagen. Intentá de nuevo.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Foto de perfil" })).toHaveAttribute("src", "https://example.com/old.jpg");
    expect(screen.getByRole("button", { name: "Cambiar foto" })).toBeEnabled();
  });
});
