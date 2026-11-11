import { describe, it, expect } from "vitest";
import { extractAddressFromGeocoder } from "./GoogleMapPickerModal";

describe("extractAddressFromGeocoder", () => {
  it("extrae correctamente calle, número, localidad, provincia y código postal de los componentes de Google", () => {
    const mockResults: any[] = [
      {
        formatted_address: "Av. Corrientes 1234, C1043 CABA, Argentina",
        address_components: [
          { long_name: "1234", types: ["street_number"] },
          { long_name: "Avenida Corrientes", types: ["route"] },
          { long_name: "San Nicolás", types: ["sublocality_level_1", "sublocality"] },
          { long_name: "Comuna 1", types: ["administrative_area_level_2"] },
          { long_name: "Ciudad Autónoma de Buenos Aires", types: ["administrative_area_level_1"] },
          { long_name: "C1043", types: ["postal_code"] },
          { long_name: "Argentina", types: ["country"] },
        ],
      },
    ];

    const result = extractAddressFromGeocoder(mockResults, -34.6037, -58.3816);

    expect(result.street).toBe("Avenida Corrientes");
    expect(result.number).toBe("1234");
    expect(result.department).toBe("Comuna 1");
    expect(result.province).toBe("Ciudad Autónoma de Buenos Aires");
    expect(result.postalCode).toBe("C1043");
    expect(result.formattedAddress).toBe("Av. Corrientes 1234, C1043 CABA, Argentina");
    expect(result.lat).toBe(-34.6037);
    expect(result.lng).toBe(-58.3816);
  });

  it("extrae calle y localidad aun si no hay número de calle exacto", () => {
    const mockResults: any[] = [
      {
        formatted_address: "Calle 50, La Plata, Provincia de Buenos Aires, Argentina",
        address_components: [
          { long_name: "Calle 50", types: ["route"] },
          { long_name: "La Plata", types: ["locality", "administrative_area_level_2"] },
          { long_name: "Buenos Aires", types: ["administrative_area_level_1"] },
          { long_name: "1900", types: ["postal_code"] },
        ],
      },
    ];

    const result = extractAddressFromGeocoder(mockResults, -34.9214, -57.9546);

    expect(result.street).toBe("Calle 50");
    expect(result.number).toBe("");
    expect(result.department).toBe("La Plata");
    expect(result.province).toBe("Buenos Aires");
    expect(result.postalCode).toBe("1900");
    expect(result.lat).toBe(-34.9214);
    expect(result.lng).toBe(-57.9546);
  });
});
