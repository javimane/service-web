import { describe, expect, it } from "vitest";
import { checkoutLoginUrl, checkoutReturnPath } from "./checkoutAuth";

const id = "042fcecf-8fda-42ce-8ff9-04d729c6f843";
describe("checkout authentication destination", () => {
  it.each(["producto", "servicio"])("preserves the %s and quantity when returning from login", (kind) => {
    const target = `/pagar/${kind}/${id}?quantity=3`;
    const login = checkoutLoginUrl(target);
    expect(checkoutReturnPath(login.slice(login.indexOf("?")))).toBe(target);
  });
  it.each(["https://example.com", "//example.com", "/\\example.com", "/login", "/pagar/producto/no-es-id", "/pagar/otro/" + id])("rejects an unsafe or unrelated redirect: %s", (target) => {
    expect(checkoutReturnPath(`?redirect=${encodeURIComponent(target)}`)).toBeNull();
  });
});
