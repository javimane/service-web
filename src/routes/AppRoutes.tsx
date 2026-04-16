import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthModal } from "../context/AuthModalContext";
import PrivateRoute from "./PrivateRoute";
import HomePage from "../pages/Home/HomePage";
import ProfilePage from "../pages/Profile/ProfilePage";
import ServicesPage from "../pages/Services/ServicesPage";
import CategoriesPage from "../pages/Categories/CategoriesPage";
import MapPage from "../pages/Map/MapPage";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import AnalyticsPage from "../pages/Analytics/AnalyticsPage";
import SettingsPage from "../pages/Settings/SettingsPage";
import MessagesPage from "../pages/Messages/MessagesPage";
import ProductsPage from "../pages/Products/ProductsPage";
import PlanPaymentPage from "../pages/PlanPayment/PlanPaymentPage";
import { ROUTES } from "./paths";

function OpenAuthAndRedirect({ mode }) {
  const { openAuth } = useAuthModal();
  useEffect(() => {
    openAuth(mode);
  }, [mode, openAuth]);
  return <Navigate to={ROUTES.home} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path={ROUTES.home} element={<HomePage />} />
      <Route path={ROUTES.categories} element={<CategoriesPage />} />
      <Route path={ROUTES.services} element={<ServicesPage />} />
      <Route path={ROUTES.map} element={<MapPage />} />
      <Route path={ROUTES.products} element={<ProductsPage />} />
      <Route path={ROUTES.planPayment} element={<PlanPaymentPage />} />
      <Route path={ROUTES.profile} element={<ProfilePage />} />
      <Route
        path={ROUTES.login}
        element={<OpenAuthAndRedirect mode="login" />}
      />
      <Route
        path={ROUTES.register}
        element={<OpenAuthAndRedirect mode="register" />}
      />

      {/* Private routes — require authentication */}
      <Route
        path={ROUTES.dashboard}
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />
      <Route
        path={ROUTES.analytics}
        element={
          <PrivateRoute>
            <AnalyticsPage />
          </PrivateRoute>
        }
      />
      <Route
        path={ROUTES.settings}
        element={
          <PrivateRoute>
            <SettingsPage />
          </PrivateRoute>
        }
      />
      <Route
        path={ROUTES.messages}
        element={
          <PrivateRoute>
            <MessagesPage />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
    </Routes>
  );
}
