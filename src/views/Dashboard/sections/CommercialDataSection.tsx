"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Building2,
  CreditCard,
  Store,
  Clock,
  Eye,
  EyeOff,
  Edit2,
  ShieldCheck,
  Save,
  X,
} from "lucide-react";
import { commerceService, UserDataBank } from "@/services/commerceService";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import Modal from "@/components/Modal/Modal";
import { ROUTES } from "@/routes/paths";
import { getAccessToken } from "@/utils/auth";
import {
  getProfessionalMeAction,
  updateProfessionalAction,
} from "@/app/actions/professionals";
import {
  createCompanyAction,
  updateCompanyAction,
} from "@/app/actions/companies";
import {
  getServiceCategoriesAction,
  updateProfessionalCategoriesAction,
} from "@/app/actions/categories";
import { getProvincesAction } from "@/app/actions/provinces";
import { getDepartmentsAction } from "@/app/actions/locations";

// Modular settings sections
import BusinessInfoSection from "@/views/Settings/sections/BusinessInfoSection";
import CategoriesSection from "@/views/Settings/sections/CategoriesSection";
import HeadquartersSection from "@/views/Settings/sections/HeadquartersSection";
import OperationsSection from "@/views/Settings/sections/OperationsSection";
import PaymentMethodsSection from "@/views/Settings/sections/PaymentMethodsSection";
import ArcaVerificationSection from "@/views/Settings/sections/ArcaVerificationSection";
import CompanyDisplaySection from "@/views/Settings/sections/CompanyDisplaySection";

import "@/views/Settings/SettingsPage.css";
import "./CommercialDataSection.css";

export default function CommercialDataSection() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { sessionStatus, refreshSession } = useAuth();
  const { showSuccess, showError } = useAlert();

  const [activeTab, setActiveTab] = useState<
    "company" | "banking" | "branches"
  >("company");
  const [showMaskedCbu, setShowMaskedCbu] = useState(true);
  const [editBankModalOpen, setEditBankModalOpen] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);

  // Commercial form state
  const [businessType, setBusinessType] = useState("individual");
  const [tradeName, setTradeName] = useState("");
  const [cuit, setCuit] = useState("");
  const [hasStorefront, setHasStorefront] = useState("no");
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [addressId, setAddressId] = useState<number | null>(null);

  // Store address fields
  const [storeStreet, setStoreStreet] = useState("");
  const [storeNumber, setStoreNumber] = useState("");
  const [storeFloor, setStoreFloor] = useState("");
  const [storeZip, setStoreZip] = useState("");
  const [storeProvinceId, setStoreProvinceId] = useState<number | null>(null);
  const [storeDepartmentId, setStoreDepartmentId] = useState<number | null>(
    null,
  );
  const [storeLat, setStoreLat] = useState<number | null>(-34.6037);
  const [storeLng, setStoreLng] = useState<number | null>(-58.3816);

  // Bank form state
  const [cbuInput, setCbuInput] = useState("");
  const [aliasInput, setAliasInput] = useState("");
  const [bankNameInput, setBankNameInput] = useState("");
  const [holderInput, setHolderInput] = useState("");
  const [holderCuitInput, setHolderCuitInput] = useState("");

  const professionalId =
    sessionStatus?.subscription?.professional_id ??
    sessionStatus?.professional_id;

  // 1. Fetch Professional Me
  const { data: profMe, isLoading: loadingProf } = useQuery({
    queryKey: ["professional-me", professionalId],
    queryFn: async () => {
      const token = await getAccessToken();
      const result = await getProfessionalMeAction({ token });
      return result?.data ?? null;
    },
    staleTime: 1000 * 60 * 5,
  });

  // 2. Fetch Provinces
  const { data: provinceList = [] } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const result = await getProvincesAction();
      return result?.data ?? [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const selectedProvIds = useMemo(() => {
    return provinceList
      .filter((p: any) => selectedProvinces.includes(p.name))
      .map((p: any) => p.id);
  }, [provinceList, selectedProvinces]);

  // 3. Fetch Departments for Coverage
  const { data: departmentList = [] } = useQuery({
    queryKey: ["departments-coverage", selectedProvIds],
    queryFn: async () => {
      if (selectedProvIds.length === 0) return [];
      const allDeps = await Promise.all(
        selectedProvIds.map(async (id: number) => {
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

  // 4. Fetch Categories
  const { data: categoryList = [] } = useQuery({
    queryKey: ["service-categories"],
    queryFn: async () => {
      const result = await getServiceCategoriesAction();
      return result?.data ?? [];
    },
    staleTime: 1000 * 60 * 60,
  });

  // 5. Fetch Bank Data
  const { data: bankData, isLoading: isLoadingBank } =
    useQuery<UserDataBank | null>({
      queryKey: ["user-bank-data"],
      queryFn: () => commerceService.getUserBankData(),
    });

  // Extract company
  let actualCompany = profMe?.companies || profMe?.Company;
  if (Array.isArray(actualCompany)) actualCompany = actualCompany[0];

  const effectiveArcaStatus = useMemo(() => {
    return (
      actualCompany?.companies_arca?.[0] ||
      actualCompany?.CompanyArca?.[0] ||
      null
    );
  }, [actualCompany]);

  // Sync state with backend data
  useEffect(() => {
    if (profMe) {
      setBusinessType(profMe.account_type || "individual");
    }

    if (actualCompany) {
      setCompanyId(actualCompany.id);
      setTradeName(actualCompany.name || "");
      setCuit(actualCompany.tax_code || "");
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
        actualCompany.Address ||
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
        setStoreLat(mainAddress.latitude ?? -34.6037);
        setStoreLng(mainAddress.longitude ?? -58.3816);
      }

      // Coverage
      if (actualCompany.company_provinces) {
        const pNames = actualCompany.company_provinces
          .map((cp: any) => cp.Province?.name || cp.name)
          .filter(Boolean);
        setSelectedProvinces(pNames as string[]);
      }
      if (actualCompany.company_departments) {
        const dNames = actualCompany.company_departments
          .map((cd: any) => cd.Department?.name || cd.name)
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

  // Mutations
  const saveCompanyMutation = useMutation({
    mutationFn: async () => {
      if (!professionalId) throw new Error("No se encontró ID de profesional.");

      const token = await getAccessToken();

      const profResult = await updateProfessionalAction({
        id: professionalId,
        data: {
          account_type: businessType,
        },
        token,
      });
      if (profResult?.serverError) throw new Error(profResult.serverError);

      const companyData: any = {
        professional_id: professionalId,
        name: tradeName.trim(),
        tax_code: cuit.trim(),
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
          .filter((p: any) => selectedProvinces.includes(p.name))
          .map((p: any) => p.id),
        department_ids: departmentList
          .filter((d: any) => selectedDepartments.includes(d.name))
          .map((d: any) => d.id),
      };

      if (companyId) {
        const result = await updateCompanyAction({
          id: companyId,
          data: companyData,
          token,
        });
        if (result?.serverError) throw new Error(result.serverError);
        await updateProfessionalCategoriesAction({
          categories: selectedCategories,
          token,
        });
        return result?.data;
      } else {
        const result = await createCompanyAction({
          ...companyData,
          token,
        });
        if (result?.serverError) throw new Error(result.serverError);
        await updateProfessionalCategoriesAction({
          categories: selectedCategories,
          token,
        });
        return result?.data;
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["professional-me"] });
      await refreshSession();
      showSuccess("Datos comerciales guardados correctamente ✨");
      setIsEditingCompany(false);
    },
    onError: (error: any) => {
      console.error("Error saving commercial data:", error);
      showError(error?.message || "Error al guardar los cambios. Reintentá.");
    },
  });

  const saveBankMutation = useMutation({
    mutationFn: (data: UserDataBank) => commerceService.saveUserBankData(data),
    onSuccess: () => {
      showSuccess("Datos de cobro bancario actualizados correctamente.");
      queryClient.invalidateQueries({ queryKey: ["user-bank-data"] });
      setEditBankModalOpen(false);
    },
    onError: () => showError("No se pudo guardar la información bancaria."),
  });

  // Handlers
  const handleToggleCategory = (id: number) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((catId) => catId !== id) : [...prev, id],
    );
  };

  const handleToggleProvince = (name: string) => {
    setSelectedProvinces((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name],
    );
  };

  const handleToggleDepartment = (name: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(name) ? prev.filter((d) => d !== name) : [...prev, name],
    );
  };

  const handleTogglePayment = (option: string) => {
    setSelectedPayments((prev) =>
      prev.includes(option)
        ? prev.filter((p) => p !== option)
        : [...prev, option],
    );
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradeName || tradeName.trim() === "") {
      showError(
        "Por favor, ingresá el nombre de la empresa o comercio (Campo obligatorio).",
      );
      return;
    }
    const cleanCuit = cuit.replace(/\D/g, "");
    if (!cleanCuit || cleanCuit.length !== 11) {
      showError("Por favor, ingresá un CUIT / CUIL válido de 11 dígitos.");
      return;
    }
    if (selectedCategories.length === 0) {
      showError(
        "Debés seleccionar al menos una categoría de servicio (Campo obligatorio).",
      );
      return;
    }
    if (selectedProvinces.length === 0) {
      showError(
        "Debés indicar tu cobertura geográfica seleccionando al menos una provincia.",
      );
      return;
    }
    if (
      hasStorefront === "si" &&
      (storeLat === null ||
        storeLng === null ||
        storeLat === undefined ||
        storeLng === undefined ||
        isNaN(Number(storeLat)) ||
        isNaN(Number(storeLng)))
    ) {
      showError(
        "Es obligatorio seleccionar en el mapa la ubicación de tu comercio al público.",
      );
      return;
    }

    saveCompanyMutation.mutate();
  };

  const openBankModal = () => {
    setCbuInput(bankData?.cbu_cvu || "");
    setAliasInput(bankData?.alias || "");
    setBankNameInput(bankData?.bank_name || "");
    setHolderInput(bankData?.account_holder || "");
    setHolderCuitInput(bankData?.cuit_cuil || "");
    setEditBankModalOpen(true);
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cbuInput || cbuInput.length < 22) {
      showError("El CBU/CVU debe tener 22 dígitos numéricos.");
      return;
    }
    saveBankMutation.mutate({
      cbu_cvu: cbuInput.trim(),
      alias: aliasInput.trim() || undefined,
      bank_name: bankNameInput.trim() || undefined,
      account_holder: holderInput.trim() || undefined,
      cuit_cuil: holderCuitInput.trim() || undefined,
    });
  };

  const maskCbu = (cbu?: string) => {
    if (!cbu) return "No informado";
    if (!showMaskedCbu) return cbu;
    if (cbu.length < 8) return "••••••••";
    return `${cbu.slice(0, 4)} •••• •••• •••• ${cbu.slice(-4)}`;
  };

  return (
    <div className="commercial-data-section">
      <header className="commercial-data-section__header">
        <div>
          <span className="commercial-data-section__subtitle">
            Configuración Comercial
          </span>
          <h1 className="commercial-data-section__title">Datos Comerciales</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="commercial-tabs">
        <button
          type="button"
          className={`commercial-tab ${activeTab === "company" ? "commercial-tab--active" : ""}`}
          onClick={() => setActiveTab("company")}
        >
          <Building2 size={16} />
          <span>Datos Fiscales y Empresa</span>
        </button>
        <button
          type="button"
          className={`commercial-tab ${activeTab === "banking" ? "commercial-tab--active" : ""}`}
          onClick={() => setActiveTab("banking")}
        >
          <CreditCard size={16} />
          <span>Datos de Cobro (CBU / Alias)</span>
        </button>
        <button
          type="button"
          className={`commercial-tab ${activeTab === "branches" ? "commercial-tab--active" : ""}`}
          onClick={() => router.push(`${ROUTES.dashboard}?view=branches`)}
        >
          <Store size={16} />
          <span>Sucursales</span>
        </button>
      </div>

      {/* Tab 1: Commercial & Fiscal Data */}
      {activeTab === "company" && (
        <>
          {loadingProf ? (
            <div className="branches-state branches-state--loading">
              <Clock className="branches-state__spinner" size={32} />
              <p>Cargando perfil comercial...</p>
            </div>
          ) : !isEditingCompany && actualCompany ? (
            <div className="commercial-summary-view">
              <CompanyDisplaySection
                prof={profMe}
                onEdit={() => setIsEditingCompany(true)}
                provinceList={provinceList}
                departmentList={departmentList}
                arcaStatus={effectiveArcaStatus}
                loadingArca={loadingProf}
                categoryList={categoryList}
              />
            </div>
          ) : (
            <div className="commercial-edit-container">
              <div className="commercial-edit-header">
                <div>
                  <h2>
                    {actualCompany
                      ? "Editar Datos Comerciales"
                      : "Crear Perfil Comercial"}
                  </h2>
                  <p>
                    Completá los datos de tu comercio, actividad, categorías,
                    cobertura y ubicación física.
                  </p>
                </div>
                {actualCompany && (
                  <button data-action-tone="cancel"
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsEditingCompany(false)}
                  >
                    <X size={16} />
                    <span>Cancelar edición</span>
                  </button>
                )}
              </div>

              {/* ARCA Verification Form / Badge */}
              <ArcaVerificationSection
                professionalId={professionalId}
                companyId={companyId || actualCompany?.id}
                arcaStatus={effectiveArcaStatus}
                loadingArca={loadingProf}
              />

              <form
                onSubmit={handleSaveCompany}
                className="commercial-edit-form"
              >
                {/* 1. Activity type, trade name, editable CUIT */}
                <BusinessInfoSection
                  businessType={businessType}
                  setBusinessType={setBusinessType}
                  tradeName={tradeName}
                  setTradeName={setTradeName}
                  cuit={cuit}
                  setCuit={setCuit}
                />

                {/* 2. Categories selection */}
                <CategoriesSection
                  selectedCategories={selectedCategories}
                  onToggleCategory={handleToggleCategory}
                  categoryList={categoryList}
                />

                {/* 3. Geographic Coverage (provinces & departments) */}
                <HeadquartersSection
                  selectedProvinces={selectedProvinces}
                  onToggleProvince={handleToggleProvince}
                  selectedDepartments={selectedDepartments}
                  onToggleDepartment={handleToggleDepartment}
                  provinceList={provinceList}
                  departmentList={departmentList}
                />

                {/* 4. Storefront / Physical Location & GPS Map */}
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

                {/* 5. Payment Methods accepted in store */}
                <PaymentMethodsSection
                  selectedPayments={selectedPayments}
                  onTogglePayment={handleTogglePayment}
                />

                {/* Action buttons */}
                <div className="commercial-form-actions">
                  {actualCompany && (
                    <button data-action-tone="cancel"
                      type="button"
                      className="btn-secondary"
                      onClick={() => setIsEditingCompany(false)}
                      disabled={saveCompanyMutation.isPending}
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    className="branches-section__add-btn"
                    disabled={saveCompanyMutation.isPending}
                  >
                    <Save size={16} />
                    <span>
                      {saveCompanyMutation.isPending
                        ? "Guardando cambios..."
                        : actualCompany
                          ? "Guardar datos comerciales"
                          : "Crear empresa comercial"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* Tab 2: Bank / Cobros */}
      {activeTab === "banking" && (
        <div className="commercial-card">
          <div className="commercial-card__header">
            <div>
              <h3 className="commercial-card__title">
                Cuenta Bancaria para Liquidaciones
              </h3>
              <p className="commercial-card__subtitle">
                Acá se acreditarán los fondos liberados de tus ventas
                automáticamente.
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={openBankModal}
            >
              <Edit2 size={16} />
              <span>Editar cuenta</span>
            </button>
          </div>

          {isLoadingBank ? (
            <p className="commercial-loading">Cargando datos bancarios...</p>
          ) : (
            <div className="commercial-fields-grid">
              <div className="commercial-field">
                <label className="commercial-label">CBU / CVU</label>
                <div className="cbu-display-row">
                  <span className="commercial-value commercial-value--mono">
                    {maskCbu(bankData?.cbu_cvu)}
                  </span>
                  {bankData?.cbu_cvu && (
                    <button
                      type="button"
                      className="cbu-reveal-btn"
                      onClick={() => setShowMaskedCbu((prev) => !prev)}
                      title={showMaskedCbu ? "Revelar CBU" : "Ocultar CBU"}
                    >
                      {showMaskedCbu ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="commercial-field">
                <label className="commercial-label">Alias</label>
                <div className="commercial-value commercial-value--mono">
                  {bankData?.alias || "No informado"}
                </div>
              </div>

              <div className="commercial-field">
                <label className="commercial-label">Banco / Billetera</label>
                <div className="commercial-value">
                  {bankData?.bank_name || "No informado"}
                </div>
              </div>

              <div className="commercial-field">
                <label className="commercial-label">Titular de la cuenta</label>
                <div className="commercial-value">
                  {bankData?.account_holder || "No informado"}
                </div>
              </div>

              <div className="commercial-field">
                <label className="commercial-label">
                  CUIT / CUIL del titular
                </label>
                <div className="commercial-value">
                  {bankData?.cuit_cuil || "No informado"}
                </div>
              </div>
            </div>
          )}

          <div className="commercial-notice">
            <ShieldCheck size={20} className="commercial-notice__icon" />
            <p>
              Los pagos de liquidaciones se procesan únicamente a cuentas
              verificadas cuyo CUIT coincida con la titularidad de la cuenta
              comercial registrada.
            </p>
          </div>
        </div>
      )}

      {/* Edit Bank Account Modal */}
      {editBankModalOpen && (
        <Modal
          isOpen={editBankModalOpen}
          onClose={() => setEditBankModalOpen(false)}
          title="Editar Cuenta Bancaria"
        >
          <form onSubmit={handleSaveBank} className="bank-edit-form">
            <div className="bank-form-group">
              <label className="commercial-label">
                CBU / CVU (22 dígitos obligatorios)
              </label>
              <input
                type="text"
                maxLength={22}
                placeholder="0000003100010000000000"
                value={cbuInput}
                onChange={(e) => setCbuInput(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>

            <div className="bank-form-group">
              <label className="commercial-label">Alias (opcional)</label>
              <input
                type="text"
                placeholder="mi.negocio.mp"
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
              />
            </div>

            <div className="bank-form-group">
              <label className="commercial-label">
                Nombre del Banco o Entidad
              </label>
              <input
                type="text"
                placeholder="Banco Santander / Mercado Pago"
                value={bankNameInput}
                onChange={(e) => setBankNameInput(e.target.value)}
              />
            </div>

            <div className="bank-form-group">
              <label className="commercial-label">Titular de la Cuenta</label>
              <input
                type="text"
                placeholder="Nombre y Apellido o Razón Social"
                value={holderInput}
                onChange={(e) => setHolderInput(e.target.value)}
              />
            </div>

            <div className="bank-form-group">
              <label className="commercial-label">
                CUIT / CUIL del Titular
              </label>
              <input
                type="text"
                placeholder="30712345679"
                value={holderCuitInput}
                onChange={(e) =>
                  setHolderCuitInput(e.target.value.replace(/\D/g, ""))
                }
              />
            </div>

            <div className="modal-actions-row">
              <button data-action-tone="cancel"
                type="button"
                className="btn-secondary"
                onClick={() => setEditBankModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="branches-section__add-btn"
                disabled={saveBankMutation.isPending}
              >
                {saveBankMutation.isPending ? "Guardando..." : "Guardar cuenta"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
