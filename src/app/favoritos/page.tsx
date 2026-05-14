import PrivateRoute from "@/routes/PrivateRoute";
import FavoritesPage from "@/views/Favorites/FavoritesPage";

export default function Page() {
  return (
    <PrivateRoute>
      <FavoritesPage />
    </PrivateRoute>
  );
}
