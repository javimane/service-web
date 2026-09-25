import { useEffect, useState } from "react";

export function useDashboardSidebar() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;

    const savedState = window.localStorage.getItem(
      "dashboard-sidebar-collapsed",
    );

    if (savedState !== null) {
      return savedState === "true";
    }

    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "dashboard-sidebar-collapsed",
        String(isSidebarCollapsed),
      );
    }
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { isSidebarCollapsed, setIsSidebarCollapsed };
}
