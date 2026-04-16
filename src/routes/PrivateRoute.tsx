import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";
import { useEffect } from "react";
import { ROUTES } from "./paths";

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const { openAuth } = useAuthModal();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      openAuth("login");
    }
  }, [loading, user, openAuth]);

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to={ROUTES.home} state={{ from: location }} replace />;
  }

  return children;
}
