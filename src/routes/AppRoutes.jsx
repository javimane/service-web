import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "../pages/Home/HomePage";
import LoginPage from "../pages/Login/LoginPage";
import RegisterPage from "../pages/Register/RegisterPage";
import ProfilePage from "../pages/Profile/ProfilePage";
import ServicesPage from "../pages/Services/ServicesPage";
import CategoriesPage from "../pages/Categories/CategoriesPage";
import MapPage from "../pages/Map/MapPage";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import AnalyticsPage from "../pages/Analytics/AnalyticsPage";
import SettingsPage from "../pages/Settings/SettingsPage";
import { ROUTES } from "./paths";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.home} element={<HomePage />} />
      <Route path={ROUTES.categories} element={<CategoriesPage />} />
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.register} element={<RegisterPage />} />
      <Route path={ROUTES.profile} element={<ProfilePage />} />
      <Route path={ROUTES.services} element={<ServicesPage />} />
      <Route path={ROUTES.map} element={<MapPage />} />
      <Route path={ROUTES.dashboard} element={<DashboardPage />} />
      <Route path={ROUTES.analytics} element={<AnalyticsPage />} />
      <Route path={ROUTES.settings} element={<SettingsPage />} />
      <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
    </Routes>
  );
}
