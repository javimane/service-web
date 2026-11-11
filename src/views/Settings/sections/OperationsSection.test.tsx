import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OperationsSection from "./OperationsSection";
import { getDepartmentsAction } from "@/app/actions/locations";

vi.mock("@/app/actions/locations", () => ({ getDepartmentsAction: vi.fn() }));
vi.mock("@/components/GoogleMapPickerModal/GoogleMapPickerModal", () => ({
  default: ({ onSelectAddress }: any) => <button onClick={() => onSelectAddress({
    street: "San Martín", number: "123", postalCode: "5500", province: "Provincia de Mendoza",
    department: "Capital", lat: -32.89, lng: -68.84,
  })}>Elegir dirección</button>,
}));

describe("OperationsSection Google Maps", () => {
  it("completa la dirección y busca el departamento de la nueva provincia", async () => {
    vi.mocked(getDepartmentsAction).mockResolvedValue({ data: [{ id: 7, name: "Capital" }] } as any);
    const setters = {
      setHasStorefront: vi.fn(), setStoreStreet: vi.fn(), setStoreNumber: vi.fn(),
      setStoreFloor: vi.fn(), setStoreZip: vi.fn(), setStoreProvinceId: vi.fn(),
      setStoreDepartmentId: vi.fn(), setStoreLat: vi.fn(), setStoreLng: vi.fn(),
    };
    render(<OperationsSection {...setters} hasStorefront="si" storeStreet="" storeNumber=""
      storeFloor="2B" storeZip="" storeProvinceId={null} storeDepartmentId={null}
      storeLat={null} storeLng={null} provinceList={[{ id: 13, name: "Mendoza" }]}
      departmentList={[{ id: 99, name: "Capital" }]} />);
    fireEvent.click(screen.getByRole("button", { name: /Buscar dirección en Google Maps/i }));
    fireEvent.click(screen.getByRole("button", { name: "Elegir dirección" }));
    expect(setters.setStoreStreet).toHaveBeenCalledWith("San Martín");
    expect(setters.setStoreNumber).toHaveBeenCalledWith("123");
    expect(setters.setStoreZip).toHaveBeenCalledWith("5500");
    expect(setters.setStoreLat).toHaveBeenCalledWith(-32.89);
    expect(setters.setStoreLng).toHaveBeenCalledWith(-68.84);
    expect(setters.setStoreProvinceId).toHaveBeenCalledWith(13);
    expect(setters.setStoreFloor).toHaveBeenCalledWith("");
    expect(getDepartmentsAction).toHaveBeenCalledWith({ provinceId: 13 });
    await waitFor(() => expect(setters.setStoreDepartmentId).toHaveBeenLastCalledWith(7));
  });
});
