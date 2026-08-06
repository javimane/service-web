import { Suspense } from "react";
import PrivateRoute from "@/routes/PrivateRoute";
import DashboardPage from "@/views/Dashboard/DashboardPage";

export default function Page() {
  return (
    <PrivateRoute>
      <Suspense fallback={null}>
        <DashboardPage />
      </Suspense>
    </PrivateRoute>
  );
}
