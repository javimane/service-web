"use client";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "../../components/DashboardSidebar/DashboardSidebar";
import { useDashboardSidebar } from "../../hooks/useDashboardSidebar";
import BusinessInfoSection from "./sections/BusinessInfoSection";
import CategoriesSection from "./sections/CategoriesSection";
import HeadquartersSection from "./sections/HeadquartersSection";
import OperationsSection from "./sections/OperationsSection";
import PaymentMethodsSection from "./sections/PaymentMethodsSection";
import ArcaVerificationSection from "./sections/ArcaVerificationSection";
import PersonalInfoSection from "./sections/PersonalInfoSection";
import ActionsSection from "./sections/ActionsSection";
import CompanyDisplaySection from "./sections/CompanyDisplaySection";
import { useAuth } from "../../context/AuthContext";
import {
  getProfessionalMeAction,
  updateProfessionalAction,
} from "../../app/actions/professionals";
import {
  createCompanyAction,
  updateCompanyAction,
} from "../../app/actions/companies";
import {
  getServiceCategoriesAction,
  updateProfessionalCategoriesAction,
} from "../../app/actions/categories";
import { getDepartmentsAction } from "../../app/actions/locations";
import { getProvincesAction } from "../../app/actions/provinces";
import { ROUTES } from "../../routes/paths";
import { getAccessToken } from "../../utils/auth";
import "../Dashboard/DashboardPage.css";
import "./SettingsPage.css";

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useDashboardSidebar();
  const { user, sessionStatus } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileSidebarMode, setIsMobileSidebarMode] = useState(false);
  const professionalId =
    sessionStatus?.subscription?.professional_id ??
    sessionStatus?.professional_id;
  const isProfessional = Boolean(professionalId);

  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [hasStorefront, setHasStorefront] = useState("no");
  const [businessType, setBusinessType] = useState("individual");
  const [tradeName, setTradeName] = useState("");
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [addressId, setAddressId] = useState<number | null>(null);

  // Store Address State
  const [storeStreet, setStoreStreet] = useState("");
  const [storeNumber, setStoreNumber] = useState("");
  const [storeFloor, setStoreFloor] = useState("");
  const [storeZip, setStoreZip] = useState("");
  const [storeProvinceId, setStoreProvinceId] = useState<number | null>(null);
  const [storeDepartmentId, setStoreDepartmentId] = useState<number | null>(
    null,
  );
  const [storeLat, setStoreLat] = useState<number | null>(null);
  const [storeLng, setStoreLng] = useState<number | null>(null);
  const [cuit, setCuit] = useState("");

  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [saveMessage, setSaveMessage] = useState("");

  // 1. Fetch Provinces
  const { data: provinceList = [] } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const result = await getProvincesAction();
      return result?.data ?? [];
    },
    staleTime: 1000 * 60 * 60,
  });

  // 2. Fetch Professional Me (Consolidated)
  const {
    data: profMe,
    isLoading: loadingProf,
    refetch: refetchProfMe,
  } = useQuery({
    queryKey: ["professional-me"],
    queryFn: async () => {
      const result = await getProfessionalMeAction({ token: getAccessToken() });
      return result?.data ?? null;
    },
    staleTime: 1000 * 60 * 5,
  });

  const actualCompany = profMe?.companies;
  const loadingCompany = loadingProf;
  const loadingArca = loadingProf;

  const effectiveArcaStatus = useMemo(() => {
    return actualCompany?.companies_arca?.[0] || null;
  }, [actualCompany]);

  // Sync state when data is loaded
  useEffect(() => {
    if (profMe) {
      setBusinessType(profMe.account_type || "individual");
    }

    if (actualCompany) {
      setCompanyId(actualCompany.id);
      setTradeName(actualCompany.name || "");
      setCuit(actualCompany.tax_code || ""); // tax_code instead of cuit based on new response
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
      const mainAddress =
        actualCompany.address ||
        (Array.isArray(profMe?.address)
          ? profMe?.address.find((a: any) => a.is_main_address)
          : profMe?.address);

      if (mainAddress) {
        setAddressId(mainAddress.id);
        setStoreStreet(mainAddress.street_name || "");
        setStoreNumber(mainAddress.street_number || "");
        setStoreFloor(mainAddress.floor_apartment || "");
        setStoreZip(mainAddress.zip_code || "");
        setStoreProvinceId(mainAddress.province_id);
        setStoreDepartmentId(mainAddress.department_id);
        setStoreLat(mainAddress.latitude);
        setStoreLng(mainAddress.longitude);
      }

      // Coverage
      if (actualCompany.company_provinces) {
        const pNames = actualCompany.company_provinces
          .map((cp: any) => cp.Province?.name)
          .filter(Boolean);
        setSelectedProvinces(pNames as string[]);
      }
      if (actualCompany.company_departments) {
        const dNames = actualCompany.company_departments
          .map((cd: any) => cd.Department?.name)
          .filter(Boolean);
        setSelectedDepartments(dNames as string[]);
      }
    }

    if (profMe?.professional_categories) {
      const catIds = profMe.professional_categories.map(
        (pc: any) => pc.category_services_id,
      );
      setSelectedCategories(catIds);
    }
  }, [profMe, actualCompany]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(max-width: 600px)");

    const syncMobileSidebarMode = (event?: MediaQueryListEvent) => {
      const matches = event?.matches ?? mediaQuery.matches;
      setIsMobileSidebarMode(matches);
      setIsMobileSidebarOpen(false);
    };

    syncMobileSidebarMode();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncMobileSidebarMode);
      return () =>
        mediaQuery.removeEventListener("change", syncMobileSidebarMode);
    }

    mediaQuery.addListener(syncMobileSidebarMode);
    return () => mediaQuery.removeListener(syncMobileSidebarMode);
  }, []);

  const handleSidebarToggle = () => {
    if (isMobileSidebarMode) {
      setIsMobileSidebarOpen((current) => !current);
      return;
    }

    setIsSidebarCollapsed((current) => !current);
  };

  // 3. Fetch Departments for selected provinces
  const selectedProvIds = useMemo(() => {
    return provinceList
      .filter((p) => selectedProvinces.includes(p.name))
      .map((p) => p.id);
  }, [selectedProvinces, provinceList]);

  const { data: departmentList = [] } = useQuery({
    queryKey: ["departments-coverage", selectedProvIds],
    queryFn: async () => {
      if (selectedProvIds.length === 0) return [];
      const allDeps = await Promise.all(
        selectedProvIds.map(async (id) => {
          const result = await getDepartmentsAction({ provinceId: id });
          return result?.data ?? [];
        }),
      );
      return allDeps.flat();
    },
    enabled: selectedProvIds.length > 0,
    staleTime: 1000 * 60 * 30,
  });

  // 4. Fetch Departments for store province
  const { data: storeDepartmentList = [] } = useQuery({
    queryKey: ["departments-store", storeProvinceId],
    queryFn: async () => {
      const result = await getDepartmentsAction({
        provinceId: storeProvinceId!,
      });
      return result?.data ?? [];
    },
    enabled: !!storeProvinceId,
    staleTime: 1000 * 60 * 30,
  });

  // 5. Fetch Service Categories
  const { data: serviceCategoryList = [] } = useQuery({
    queryKey: ["service-categories"],
    queryFn: async () => {
      const result = await getServiceCategoriesAction();
      return result?.data ?? [];
    },
    staleTime: 1000 * 60 * 60,
  });

  // 6. Mutation for Saving
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!professionalId) return;

      const profResult = await updateProfessionalAction({
        id: professionalId,
        data: {
          account_type: businessType,
        },
        token: getAccessToken(),
      });
      if (profResult?.serverError) throw new Error(profResult.serverError);

      const companyData: any = {
        professional_id: professionalId,
        name: tradeName,
        tax_code: cuit,
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
          .filter((p) => selectedProvinces.includes(p.name))
          .map((p) => p.id),
        department_ids: departmentList
          .filter((d) => selectedDepartments.includes(d.name))
          .map((d) => d.id),
      };

      if (companyId) {
        const result = await updateCompanyAction({
          id: companyId,
          data: companyData,
          token: getAccessToken(),
        });
        if (result?.serverError) throw new Error(result.serverError);
        await updateProfessionalCategoriesAction({
          categories: selectedCategories,
          token: getAccessToken(),
        });
        return result?.data;
      } else {
        const result = await createCompanyAction({
          ...companyData,
          token: getAccessToken(),
        });
        if (result?.serverError) throw new Error(result.serverError);
        await updateProfessionalCategoriesAction({
          categories: selectedCategories,
          token: getAccessToken(),
        });
        return result?.data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["professional-me"],
      });

      setSaveStatus("success");
      setSaveMessage("Registro guardado correctamente ✨");

      setTimeout(() => {
        setSaveStatus("idle");
        setIsEditingCompany(false);
      }, 2500);
    },
    onError: (error) => {
      console.error("Error saving settings:", error);
      setSaveStatus("error");
      setSaveMessage("Error al guardar los cambios. Reintentá.");

      setTimeout(() => setSaveStatus("idle"), 4000);
    },
  });

  const handleSave = () => saveMutation.mutate();

  const toggleSelection = (setter: any, option: string) => {
    setter((currentValues: string[]) =>
      currentValues.includes(option)
        ? currentValues.filter((item) => item !== option)
        : [...currentValues, option],
    );
  };

  const showCTA = isProfessional && !actualCompany && !isEditingCompany;
  const showSummary = isProfessional && actualCompany && !isEditingCompany;
  const showEditForms = isProfessional && isEditingCompany;

  return (
    <div className="dashboard-page-wrapper">
      <div className="dashboard-page settings-page-layout">
        <DashboardSidebar
          activeItem="settings"
          isCollapsed={isMobileSidebarMode ? false : isSidebarCollapsed}
          isMobile={isMobileSidebarMode}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onToggle={handleSidebarToggle}
          onDashboardClick={() => router.push(ROUTES.dashboard)}
          onMessagesClick={() => router.push(ROUTES.messages)}
          onNotificationsClick={() =>
            router.push(`${ROUTES.dashboard}?view=notifications`)
          }
          onProfileClick={() => router.push(`${ROUTES.dashboard}?view=profile`)}
        />

        <main
          className={`dashboard-main ${isMobileSidebarMode ? "dashboard-main--mobile" : ""}`}
        >
          <div className="dashboard-content settings-content">
            <section className="settings-hero">
              <div className="welcome-copy">
                <h1>Configuración de la cuenta</h1>
                <p>
                  Gestioná tus datos personales{" "}
                  {isProfessional ? "y perfil comercial" : ""} para mejorar tu
                  visibilidad.
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
                  displayName:
                    user?.user_metadata?.full_name || user?.display_name || "",
                  email: user?.email || "",
                }}
              />

              {/* Business Sections */}
              {showSummary && (
                <CompanyDisplaySection
                  prof={{ ...profMe, companies: actualCompany }}
                  onEdit={() => setIsEditingCompany(true)}
                  provinceList={provinceList}
                  departmentList={storeDepartmentList}
                  arcaStatus={effectiveArcaStatus}
                  loadingArca={loadingArca}
                  categoryList={serviceCategoryList}
                />
              )}

              {showEditForms && (
                <>
                  <BusinessInfoSection
                    businessType={businessType}
                    setBusinessType={setBusinessType}
                    tradeName={tradeName}
                    setTradeName={setTradeName}
                    cuit={cuit}
                    setCuit={setCuit}
                  />

                  <CategoriesSection
                    selectedCategories={selectedCategories}
                    onToggleCategory={(id: number) =>
                      setSelectedCategories((curr) =>
                        curr.includes(id)
                          ? curr.filter((c) => c !== id)
                          : [...curr, id],
                      )
                    }
                    categoryList={serviceCategoryList}
                  />

                  <HeadquartersSection
                    selectedProvinces={selectedProvinces}
                    onToggleProvince={(option) =>
                      toggleSelection(setSelectedProvinces, option)
                    }
                    selectedDepartments={selectedDepartments}
                    onToggleDepartment={(option) =>
                      toggleSelection(setSelectedDepartments, option)
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

                  {saveStatus !== "idle" && (
                    <div
                      className={`settings-status-banner settings-status-banner--${saveStatus}`}
                    >
                      {saveMessage}
                    </div>
                  )}

                  <ActionsSection
                    onSave={handleSave}
                    onCancel={() => setIsEditingCompany(false)}
                    isSaving={saveMutation.isPending}
                  />
                </>
              )}

              {showCTA && (
                <div className="register-company-cta">
                  <div className="cta-icon">
                    <Building2 size={40} />
                  </div>
                  <h3>Completar Perfil Comercial</h3>
                  <p>
                    Aún no has registrado los datos de tu comercio o actividad
                    autónoma. Completalos para aparecer en las búsquedas.
                  </p>
                  <button
                    className="cta-register-btn"
                    onClick={() => setIsEditingCompany(true)}
                  >
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
