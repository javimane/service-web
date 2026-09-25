"use client";

import Navbar from "@/components/Navbar/Navbar";
import DashboardSidebar from "@/components/DashboardSidebar/DashboardSidebar";
import CartSection from "@/views/Dashboard/sections/CartSection";
import { useAuth } from "@/context/AuthContext";
import { useDashboardSidebar } from "@/hooks/useDashboardSidebar";
import "./CartPage.css";

export default function CartPage() {
  const { user, loading } = useAuth();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useDashboardSidebar();
  const showSidebar = !loading && Boolean(user);

  return (
    <div className="cart-page-wrapper">
      <Navbar />
      <div className="cart-page__layout">
        {showSidebar ? (
          <DashboardSidebar
            activeItem="cart"
            isCollapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed((current) => !current)}
          />
        ) : null}
        <main
          className={`cart-page-main ${
            showSidebar ? "cart-page-main--with-sidebar" : ""
          } ${
            showSidebar && isSidebarCollapsed
              ? "cart-page-main--sidebar-collapsed"
              : ""
          }`}
        >
          <CartSection />
        </main>
      </div>
    </div>
  );
}
