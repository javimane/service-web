import PrivateRoute from "@/routes/PrivateRoute";
import SettingsPage from "@/views/Settings/SettingsPage";

export default function Page() {
  return (
    <PrivateRoute>
      <SettingsPage />
    </PrivateRoute>
  );
}
