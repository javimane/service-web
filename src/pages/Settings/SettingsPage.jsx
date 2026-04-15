import { useState } from "react";
import Footer from "../../components/Footer/Footer";
import DashboardSidebar from "../../components/DashboardSidebar/DashboardSidebar";
import { useDashboardSidebar } from "../../hooks/useDashboardSidebar";
import BusinessInfoSection from "./sections/BusinessInfoSection";
import RegistrationStatusSection from "./sections/RegistrationStatusSection";
import HeadquartersSection from "./sections/HeadquartersSection";
import OperationsSection from "./sections/OperationsSection";
import PaymentMethodsSection from "./sections/PaymentMethodsSection";
import ContactSection from "./sections/ContactSection";
import ArcaVerificationSection from "./sections/ArcaVerificationSection";
import ActionsSection from "./sections/ActionsSection";
import "../Dashboard/DashboardPage.css";
import "./SettingsPage.css";

const provinceOptions = [
  "Buenos Aires",
  "Córdoba",
  "Santa Fe",
  "Mendoza",
  "Entre Ríos",
  "Tucumán",
];

const departmentOptions = [
  "Capital",
  "Centro",
  "Norte",
  "Sur",
  "Oeste",
  "Costa",
];

export default function SettingsPage() {
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useDashboardSidebar();
  const [hasStorefront, setHasStorefront] = useState("no");
  const [businessType, setBusinessType] = useState("empresa");
  const [isRegistered, setIsRegistered] = useState("si");
  const [selectedProvinces, setSelectedProvinces] = useState(["Buenos Aires"]);
  const [selectedDepartments, setSelectedDepartments] = useState([
    "Capital",
    "Centro",
  ]);
  const [selectedPayments, setSelectedPayments] = useState([
    "Transferencias",
    "Crédito",
  ]);

  const toggleSelection = (setter, currentValues, option) => {
    setter(
      currentValues.includes(option)
        ? currentValues.filter((item) => item !== option)
        : [...currentValues, option],
    );
  };

  return (
    <div className="dashboard-page-wrapper">
      <div className="dashboard-page settings-page-layout">
        <DashboardSidebar
          activeItem="settings"
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed((current) => !current)}
        />

        <main className="dashboard-main">
          <div className="dashboard-content settings-content">
            <section className="settings-hero">
              <div className="welcome-copy">
                <h1>Configuración de la cuenta</h1>
                <p>
                  Completá tu perfil comercial para mejorar tu visibilidad y la
                  verificación del servicio.
                </p>
              </div>
              <div className="settings-hero-badge">Perfil comercial</div>
            </section>

            <section className="settings-grid">
              <BusinessInfoSection
                businessType={businessType}
                setBusinessType={setBusinessType}
                isRegistered={isRegistered}
                setIsRegistered={setIsRegistered}
              />

              <RegistrationStatusSection
                businessType={businessType}
                hasStorefront={hasStorefront}
                isRegistered={isRegistered}
              />

              <HeadquartersSection
                selectedProvinces={selectedProvinces}
                onToggleProvince={(option) =>
                  toggleSelection(
                    setSelectedProvinces,
                    selectedProvinces,
                    option,
                  )
                }
                selectedDepartments={selectedDepartments}
                onToggleDepartment={(option) =>
                  toggleSelection(
                    setSelectedDepartments,
                    selectedDepartments,
                    option,
                  )
                }
                provinceOptions={provinceOptions}
                departmentOptions={departmentOptions}
              />

              <OperationsSection
                hasStorefront={hasStorefront}
                setHasStorefront={setHasStorefront}
                provinceOptions={provinceOptions}
                departmentOptions={departmentOptions}
              />

              <PaymentMethodsSection
                selectedPayments={selectedPayments}
                onTogglePayment={(option) =>
                  toggleSelection(setSelectedPayments, selectedPayments, option)
                }
              />

              <ContactSection />

              <ArcaVerificationSection />
            </section>

            <ActionsSection />
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
