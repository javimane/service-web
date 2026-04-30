import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Building2 } from "lucide-react";
import DashboardSidebar from "../../components/DashboardSidebar/DashboardSidebar";
import { useDashboardSidebar } from "../../hooks/useDashboardSidebar";
import BusinessInfoSection from "./sections/BusinessInfoSection";
import HeadquartersSection from "./sections/HeadquartersSection";
import OperationsSection from "./sections/OperationsSection";
import PaymentMethodsSection from "./sections/PaymentMethodsSection";
import ArcaVerificationSection from "./sections/ArcaVerificationSection";
import PersonalInfoSection from "./sections/PersonalInfoSection";
import ActionsSection from "./sections/ActionsSection";
import CompanyDisplaySection from "./sections/CompanyDisplaySection";
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
  
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [hasStorefront, setHasStorefront] = useState("no");
  const [businessType, setBusinessType] = useState("individual");
  const [tradeName, setTradeName] = useState("");
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

  // 1. Fetch Provinces
  const { data: provinceList = [] } = useQuery({
    queryKey: ["provinces"],
    queryFn: locationService.getProvinces,
    staleTime: 1000 * 60 * 60,
  });

  // 2. Fetch Professional Detail
  const { data: prof, isLoading: loadingProf } = useQuery({
    queryKey: ["professional-detail", professionalId],
    queryFn: () => professionalService.getDetail(professionalId!),
    enabled: !!professionalId,
    staleTime: 1000 * 60 * 5,
  });

  // 2.1 Fetch Company Detail (Dedicated endpoint for better reliability)
  const { data: company, isLoading: loadingCompany } = useQuery({
    queryKey: ["company-detail", professionalId],
    queryFn: () => companyService.getByProfessional(professionalId!),
    enabled: !!professionalId,
    staleTime: 1000 * 60 * 5,
  });

  // Sync state when data is loaded
  useEffect(() => {
    if (prof) {
      setBusinessType(prof.account_type || "individual");
    }
    
    // Handle both single object and array responses
    const actualCompany = Array.isArray(company) ? company[0] : company;

    if (actualCompany) {
      setCompanyId(actualCompany.id);
      setTradeName(actualCompany.name || "");
      setHasStorefront(actualCompany.public_trade ? "si" : "no");
      
      // Payments
      const payments: string[] = [];
      if (actualCompany.cash) payments.push("Efectivo");
      if (actualCompany.transfer) payments.push("Transferencias");
      if (actualCompany.credit) payments.push("Crédito");
      if (actualCompany.debit) payments.push("Débito");
      if (actualCompany.cheque) payments.push("Cheque");
      setSelectedPayments(payments);

      // Address
      if (actualCompany.Address) {
        const addr = actualCompany.Address;
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
      if (actualCompany.CompanyProvinces) {
        const pNames = actualCompany.CompanyProvinces.map((cp: any) => cp.Province?.name).filter(Boolean);
        setSelectedProvinces(pNames as string[]);
      }
      if (actualCompany.CompanyDepartments) {
        const dNames = actualCompany.CompanyDepartments.map((cd: any) => cd.Department?.name).filter(Boolean);
        setSelectedDepartments(dNames as string[]);
      }
    }
  }, [prof, company]);

  // 3. Fetch Departments for selected provinces
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
    staleTime: 1000 * 60 * 30,
  });

  // 4. Fetch Departments for store province
  const { data: storeDepartmentList = [] } = useQuery({
    queryKey: ["departments-store", storeProvinceId],
    queryFn: () => locationService.getDepartments(storeProvinceId!),
    enabled: !!storeProvinceId,
    staleTime: 1000 * 60 * 30,
  });

  // 5. Mutation for Saving
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!professionalId) return;

      await professionalService.update(professionalId, {
        account_type: businessType,
      });

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
      queryClient.invalidateQueries({ queryKey: ["company-detail", professionalId] });
      setIsEditingCompany(false);
      alert("Cambios guardados con éxito");
    },
    onError: (error) => {
      console.error("Error saving settings:", error);
      alert("Error al guardar los cambios");
    }
  });

  const handleSave = () => saveMutation.mutate();

  const toggleSelection = (setter: any, option: string) => {
    setter((currentValues: string[]) =>
      currentValues.includes(option)
        ? currentValues.filter((item) => item !== option)
        : [...currentValues, option],
    );
  };

  const showCTA = isProfessional && !company && !isEditingCompany;
  const actualCompany = Array.isArray(company) ? company[0] : company;
  const showSummary = isProfessional && actualCompany && !isEditingCompany;
  const showEditForms = isProfessional && isEditingCompany;

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

              {/* Business Sections */}
              {showSummary && (
                <CompanyDisplaySection 
                  prof={{ ...prof, Company: actualCompany }} 
                  onEdit={() => setIsEditingCompany(true)} 
                  provinceList={provinceList}
                  departmentList={storeDepartmentList}
                />
              )}

              {showEditForms && (
                <>
                  <BusinessInfoSection
                    businessType={businessType}
                    setBusinessType={setBusinessType}
                    tradeName={tradeName}
                    setTradeName={setTradeName}
                  />

                  <HeadquartersSection
                    selectedProvinces={selectedProvinces}
                    onToggleProvince={(option) => toggleSelection(setSelectedProvinces, option)}
                    selectedDepartments={selectedDepartments}
                    onToggleDepartment={(option) => toggleSelection(setSelectedDepartments, option)}
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
                    onTogglePayment={(option) => toggleSelection(setSelectedPayments, option)}
                  />

                  <ArcaVerificationSection />
                  
                  <ActionsSection 
                    onSave={handleSave} 
                    onCancel={() => setIsEditingCompany(false)} 
                  />
                </>
              )}

              {showCTA && (
                <div className="register-company-cta">
                    <div className="cta-icon">
                        <Building2 size={40} />
                    </div>
                    <h3>Completar Perfil Comercial</h3>
                    <p>Aún no has registrado los datos de tu comercio o actividad autónoma. Completalos para aparecer en las búsquedas.</p>
                    <button className="cta-register-btn" onClick={() => setIsEditingCompany(true)}>
                        <PlusCircle size={18} />
                        Comenzar Registro
                    </button>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
