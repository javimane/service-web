import { Suspense } from "react";
import CartPage from "@/views/Cart/CartPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CartPage />
    </Suspense>
  );
}
