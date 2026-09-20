import { Suspense } from "react";
import PrivateRoute from "@/routes/PrivateRoute";
import CartPage from "@/views/Cart/CartPage";

export default function Page() {
  return (
    <PrivateRoute>
      <Suspense fallback={null}>
        <CartPage />
      </Suspense>
    </PrivateRoute>
  );
}
