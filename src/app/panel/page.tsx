import PrivateRoute from "@/routes/PrivateRoute";
import DashboardPage from "@/views/Dashboard/DashboardPage";

export default function Page() {
  return (
    <PrivateRoute>
      <DashboardPage />
    </PrivateRoute>
  );
}
