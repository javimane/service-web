import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BranchLocationMap } from "./BranchesSection";

const mocks = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-key";
  return { geocode: vi.fn() };
});

vi.mock("@react-google-maps/api", () => ({
  useJsApiLoader: () => ({ isLoaded: true, loadError: undefined }),
  GoogleMap: ({ onClick }: { onClick: (event: unknown) => void }) => (
    <button onClick={() => onClick({ latLng: { lat: () => -32.9, lng: () => -68.8 } })}>
      Seleccionar punto
    </button>
  ),
  MarkerF: () => null,
}));
vi.mock("@/app/actions/professionals", () => ({ getProfessionalMeAction: vi.fn() }));
vi.mock("@/app/actions/locations", () => ({ getProvincesAction: vi.fn(), getDepartmentsAction: vi.fn() }));
vi.mock("@/services/commerceService", () => ({ commerceService: {} }));
vi.mock("@/utils/auth", () => ({ getAccessToken: vi.fn() }));
vi.mock("@/services/apiClient", () => ({ setApiAccessToken: vi.fn() }));
vi.mock("@/context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("@/context/AlertContext", () => ({ useAlert: vi.fn() }));

const component = (type: string, name: string) => ({
  types: [type], long_name: name, short_name: name,
});
const results = [{
  address_components: [
    component("route", "San Martín"),
    component("street_number", "123"),
    component("administrative_area_level_1", "Mendoza"),
    component("administrative_area_level_2", "Guaymallén"),
  ],
}, {
  address_components: [component("postal_code", "5521")],
}];

describe("Branch map address autofill", () => {
  beforeEach(() => {
    mocks.geocode.mockReset();
    mocks.geocode.mockImplementation((_query, callback) => callback(results, "OK"));
    vi.stubGlobal("google", { maps: {
      Geocoder: class { geocode = mocks.geocode; },
      LatLng: class {
        constructor(private latitude: number, private longitude: number) {}
        lat() { return this.latitude; }
        lng() { return this.longitude; }
      },
    } });
  });

  function setup() {
    const onSelect = vi.fn(() => 7);
    const onAddressResolved = vi.fn();
    render(<BranchLocationMap latitude={-33} longitude={-69} address="Dirección anterior"
      onSelect={onSelect} onAddressResolved={onAddressResolved} onBusyChange={vi.fn()} />);
    return { onSelect, onAddressResolved };
  }

  it("resolves an edited branch's new map point into address fields", () => {
    const { onSelect, onAddressResolved } = setup();
    fireEvent.click(screen.getByText("Seleccionar punto"));
    expect(onSelect).toHaveBeenCalledWith(-32.9, -68.8);
    expect(onAddressResolved).toHaveBeenCalledWith({
      street: "San Martín", number: "123", province: "Mendoza", department: "Guaymallén", zipCode: "5521",
    }, 7);
  });

  it("reverse geocodes the current GPS location through the same address callback", () => {
    const { onSelect, onAddressResolved } = setup();
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: {
      getCurrentPosition: (success: PositionCallback) => success({
        coords: { latitude: -32.91, longitude: -68.81 },
      } as GeolocationPosition),
    } });
    fireEvent.click(screen.getByRole("button", { name: "Usar mi ubicación GPS actual" }));
    expect(onSelect).toHaveBeenCalledWith(-32.91, -68.81);
    expect(onAddressResolved).toHaveBeenCalledWith(expect.objectContaining({
      street: "San Martín", number: "123", zipCode: "5521",
    }), 7);
  });

  it("discards a late geocoder response after choosing a newer point", () => {
    const { onAddressResolved } = setup();
    const callbacks: ((results: unknown, status: string) => void)[] = [];
    mocks.geocode.mockImplementation((_query, callback) => callbacks.push(callback));
    fireEvent.click(screen.getByText("Seleccionar punto"));
    fireEvent.click(screen.getByText("Seleccionar punto"));
    callbacks[1](results, "OK");
    callbacks[0]([{ address_components: [component("route", "Calle anterior")] }], "OK");
    expect(onAddressResolved).toHaveBeenCalledTimes(1);
    expect(onAddressResolved).toHaveBeenCalledWith(expect.objectContaining({ street: "San Martín" }), 7);
  });
});
