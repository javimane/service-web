import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardSidebar from "../../components/DashboardSidebar/DashboardSidebar";
import { useDashboardSidebar } from "../../hooks/useDashboardSidebar";
import BusinessInfoSection from "./sections/BusinessInfoSection";
import HeadquartersSection from "./sections/HeadquartersSection";
import OperationsSection from "./sections/OperationsSection";
import PaymentMethodsSection from "./sections/PaymentMethodsSection";
import ArcaVerificationSection from "./sections/ArcaVerificationSection";
import PersonalInfoSection from "./sections/PersonalInfoSection";
import ActionsSection from "./sections/ActionsSection";
import { useAuth } from "../../context/AuthContext";
import { professionalService } from "../../services/professionalService";
import { companyService } from "../../services/companyService";
import { locationService } from "../../services/locationService";
import "../Dashboard/DashboardPage.css";
import "./SettingsPage.css";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useDashboardSidebar();
  const { user, sessionStatus } = useAuth();
  const professionalId = sessionStatus?.subscription?.professional_id ?? sessionStatus?.professional_id;
  const isProfessional = Boolean(professionalId);
  
  const [hasStorefront, setHasStorefront] = useState("no");
  const [businessType, setBusinessType] = useState("autonomo");
  const [tradeName, setTradeName] = useState("");
  const [isRegistered, setIsRegistered] = useState("no");
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [addressId, setAddressId] = useState<number | null>(null);

  // Store Address State
  const [storeStreet, setStoreStreet] = useState("");
  const [storeNumber, setStoreNumber] = useState("");
  const [storeFloor, setStoreFloor] = useState("");
  const [storeZip, setStoreZip] = useState("");
  const [storeProvinceId, setStoreProvinceId] = useState<number | null>(null);
  const [storeDepartmentId, setStoreDepartmentId] = useState<number | null>(null);
  const [storeLat, setStoreLat] = useState<number | null>(null);
  const [storeLng, setStoreLng] = useState<number | null>(null);

  // 1. Fetch Provinces (Static-ish data)
  const { data: provinceList = [] } = useQuery({
    queryKey: ["provinces"],
    queryFn: locationService.getProvinces,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // 2. Fetch Professional Detail (Main data)
  const { data: prof, isLoading: loadingProf } = useQuery({
    queryKey: ["professional-detail", professionalId],
    queryFn: () => professionalService.getDetail(professionalId!),
    enabled: !!professionalId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Sync state when professional data is loaded
  useEffect(() => {
    if (prof) {
      setBusinessType(prof.account_type || "autonomo");
      setIsRegistered(prof.is_matriculate ? "si" : "no");
      
      if (prof.Company) {
        const comp = prof.Company;
        setCompanyId(comp.id);
        setTradeName(comp.name || "");
        setHasStorefront(comp.public_trade ? "si" : "no");
        
        // Payments
        const payments: string[] = [];
        if (comp.cash) payments.push("Efectivo");
        if (comp.transfer) payments.push("Transferencias");
        if (comp.credit) payments.push("Crédito");
        if (comp.debit) payments.push("Débito");
        if (comp.cheque) payments.push("Cheque");
        setSelectedPayments(payments);

        // Address
        if (comp.Address) {
          const addr = comp.Address;
          setAddressId(addr.id);
          setStoreStreet(addr.street_name || "");
          setStoreNumber(addr.street_number || "");
          setStoreFloor(addr.floor_apartment || "");
          setStoreZip(addr.zip_code || "");
          setStoreProvinceId(addr.province_id);
          setStoreDepartmentId(addr.department_id);
          setStoreLat(addr.latitude);
          setStoreLng(addr.longitude);
        }

        // Coverage
        if (comp.CompanyProvinces) {
          const pNames = comp.CompanyProvinces.map(cp => cp.Province?.name).filter(Boolean);
          setSelectedProvinces(pNames as string[]);
        }
        if (comp.CompanyDepartments) {
          const dNames = comp.CompanyDepartments.map(cd => cd.Department?.name).filter(Boolean);
          setSelectedDepartments(dNames as string[]);
        }
      }
    }
  }, [prof]);

  // 3. Fetch Departments for selected provinces (Coverage)
  const selectedProvIds = useMemo(() => {
    return provinceList
      .filter(p => selectedProvinces.includes(p.name))
      .map(p => p.id);
  }, [selectedProvinces, provinceList]);

  const { data: departmentList = [] } = useQuery({
    queryKey: ["departments-coverage", selectedProvIds],
    queryFn: async () => {
      if (selectedProvIds.length === 0) return [];
      const allDeps = await Promise.all(selectedProvIds.map(id => locationService.getDepartments(id)));
      return allDeps.flat();
    },
    enabled: selectedProvIds.length > 0,
    staleTime: 1000 * 60 * 30, // 30 mins
  });

  // 4. Fetch Departments for store province
  const { data: storeDepartmentList = [] } = useQuery({
    queryKey: ["departments-store", storeProvinceId],
    queryFn: () => locationService.getDepartments(storeProvinceId!),
    enabled: !!storeProvinceId,
    staleTime: 1000 * 60 * 30, // 30 mins
  });

  const provinceOptions = provinceList.map(p => p.name);
  const departmentOptions = departmentList.map(d => d.name);

  // 5. Mutation for Saving
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!professionalId) return;

      // Update Professional
      await professionalService.update(professionalId, {
        account_type: businessType,
        is_matriculate: isRegistered === "si",
      });

      // Integrated Company Data
      const companyData: any = {
        professional_id: professionalId,
        name: tradeName,
        business_type: businessType,
        public_trade: hasStorefront === "si",
        address_id: addressId,
        street_name: storeStreet,
        street_number: storeNumber,
        floor_apartment: storeFloor,
        zip_code: storeZip,
        province_id: storeProvinceId,
        department_id: storeDepartmentId,
        latitude: storeLat,
        longitude: storeLng,
        is_main_address: true,
        cash: selectedPayments.includes("Efectivo"),
        transfer: selectedPayments.includes("Transferencias"),
        credit: selectedPayments.includes("Crédito"),
        debit: selectedPayments.includes("Débito"),
        cheque: selectedPayments.includes("Cheque"),
        province_ids: provinceList
          .filter(p => selectedProvinces.includes(p.name))
          .map(p => p.id),
        department_ids: departmentList
          .filter(d => selectedDepartments.includes(d.name))
          .map(d => d.id)
      };

      if (companyId) {
        return companyService.update(companyId, companyData);
      } else {
        return companyService.create(companyData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-detail", professionalId] });
      alert("Cambios guardados con éxito");
    },
    onError: (error) => {
      console.error("Error saving settings:", error);
      alert("Error al guardar los cambios");
    }
  });

  const handleSave = () => saveMutation.mutate();

  const toggleSelection = (setter, option) => {
    setter((currentValues) =>
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
                  Gestioná tus datos personales {isProfessional ? "y perfil comercial" : ""} para mejorar tu visibilidad.
                </p>
              </div>
              <div className="settings-hero-badge">
                {isProfessional ? "Perfil comercial" : "Cuenta personal"}
              </div>
            </section>

            <section className="settings-grid">
              {/* Always show personal info */}
              <PersonalInfoSection 
                userId={user?.id}
                initialData={{
                  displayName: user?.user_metadata?.full_name || user?.display_name || "",
                  email: user?.email || ""
                }}
              />

              {/* Show business info only if professional */}
              {isProfessional && (
                <>
                  <BusinessInfoSection
                    businessType={businessType}
                    setBusinessType={setBusinessType}
                    tradeName={tradeName}
                    setTradeName={setTradeName}
                  />

                  <HeadquartersSection
                    selectedProvinces={selectedProvinces}
                    onToggleProvince={(option) =>
                      toggleSelection(
                        setSelectedProvinces,
                        option,
                      )
                    }
                    selectedDepartments={selectedDepartments}
                    onToggleDepartment={(option) =>
                      toggleSelection(
                        setSelectedDepartments,
                        option,
                      )
                    }
                    provinceList={provinceList}
                    departmentList={departmentList}
                  />

                  <OperationsSection 
                    hasStorefront={hasStorefront}
                    setHasStorefront={setHasStorefront}
                    provinceList={provinceList}
                    departmentList={storeDepartmentList}
                    storeStreet={storeStreet}
                    setStoreStreet={setStoreStreet}
                    storeNumber={storeNumber}
                    setStoreNumber={setStoreNumber}
                    storeFloor={storeFloor}
                    setStoreFloor={setStoreFloor}
                    storeZip={storeZip}
                    setStoreZip={setStoreZip}
                    storeProvinceId={storeProvinceId}
                    setStoreProvinceId={setStoreProvinceId}
                    storeDepartmentId={storeDepartmentId}
                    setStoreDepartmentId={setStoreDepartmentId}
                    storeLat={storeLat}
                    setStoreLat={setStoreLat}
                    storeLng={storeLng}
                    setStoreLng={setStoreLng}
                  />

                  <PaymentMethodsSection
                    selectedPayments={selectedPayments}
                    onTogglePayment={(option) =>
                      toggleSelection(setSelectedPayments, option)
                    }
                  />

                  <ArcaVerificationSection />
                </>
              )}
            </section>

            {isProfessional && <ActionsSection onSave={handleSave} />}
          </div>
        </main>
      </div>
    </div>
  );
}
