import { Suspense } from "react";
import PrivateRoute from "@/routes/PrivateRoute";
import PurchasesPage from "@/views/Purchases/PurchasesPage";

export default function Page() {
  return (
    <PrivateRoute>
      <Suspense fallback={null}>
        <PurchasesPage />
      </Suspense>
    </PrivateRoute>
  );
}
