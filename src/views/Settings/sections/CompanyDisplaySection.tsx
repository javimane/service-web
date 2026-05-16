import {
  Edit2,
  MapPin,
  CreditCard,
  Globe,
  Building2,
  Store,
} from "lucide-react";
import "./CompanyDisplaySection.css";
import ArcaVerificationSection from "./ArcaVerificationSection";

interface CompanyDisplaySectionProps {
  prof: any;
  onEdit: () => void;
  provinceList?: any[];
  departmentList?: any[];
  arcaStatus?: any;
  loadingArca?: boolean;
}

export default function CompanyDisplaySection({
  prof,
  onEdit,
  provinceList = [],
  departmentList = [],
  arcaStatus,
  loadingArca,
}: CompanyDisplaySectionProps) {
  // Normalize company: handle if it's an array or object
  let company = prof?.companies || prof?.Company;
  if (Array.isArray(company)) company = company[0];

  if (!company) return null;

  const mainAddress =
    company.address ||
    company.Address ||
    (Array.isArray(prof?.address)
      ? prof?.address.find((a: any) => a.is_main_address)
      : prof?.address);

  const address = Array.isArray(mainAddress)
    ? mainAddress.find((a: any) => a.is_main_address) || mainAddress[0]
    : mainAddress;

  // Robust data extraction with fallbacks
  const streetName =
    address?.street_name || company.street_name || company.streetName;
  const streetNumber =
    address?.street_number || company.street_number || company.streetNumber;
  const floorApartment =
    address?.floor_apartment ||
    company.floor_apartment ||
    company.floorApartment;
  const zipCode = address?.zip_code || company.zip_code || company.zipCode;
  const provinceId =
    address?.province_id || company.province_id || company.provinceId;
  const departmentId =
    address?.department_id || company.department_id || company.departmentId;

  // Resolve address names
  const addressProvinceName =
    address?.Province?.name ||
    provinceList.find((p) => p.id === provinceId)?.name;

  const addressDepartmentName =
    address?.Department?.name ||
    departmentList.find((d) => d.id === departmentId)?.name;

  // Improve coverage name resolution
  const provinceNames =
    (company.company_provinces || company.CompanyProvinces)
      ?.map((p: any) => p.Province?.name || p.name)
      .filter(Boolean) || [];
  const departmentNames =
    (company.company_departments || company.CompanyDepartments)
      ?.map((d: any) => d.Department?.name || d.name)
      .filter(Boolean) || [];

  // Normalize Tax Code / CUIT
  const displayTaxCode = company.tax_code || company.taxCode || company.cuit;

  const payments = [
    company.cash && "Efectivo",
    company.transfer && "Transferencia",
    company.credit && "Crédito",
    company.debit && "Débito",
    company.cheque && "Cheque",
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="company-display-container">
      <div className="company-display-header">
        <div className="company-header-main">
          <div className="company-logo-placeholder">
            <Building2 size={32} />
          </div>
          <div className="company-header-info">
            <h2>{company.name || "Sin nombre comercial"}</h2>
            <span className="company-type-badge">
              {prof.account_type === "company" ? "Empresa" : "Autónomo"}
            </span>
          </div>
        </div>
        <button className="company-edit-trigger" onClick={onEdit}>
          <Edit2 size={16} />
          <span>Editar Datos</span>
        </button>
      </div>

      <ArcaVerificationSection
        professionalId={prof.id}
        companyId={company.id}
        arcaStatus={arcaStatus}
        loadingArca={loadingArca}
      />

      <div className="company-display-grid">
        <div className="display-card">
          <div className="display-card-icon">
            <Store size={20} />
          </div>
          <div className="display-card-content">
            <h3>Punto de Venta</h3>
            {company.public_trade || streetName ? (
              <div className="address-details-stack">
                <div className="address-item">
                  <span className="address-label">Calle y Número</span>
                  <span className="address-value">
                    {streetName} {streetNumber}
                  </span>
                </div>
                {floorApartment && (
                  <div className="address-item">
                    <span className="address-label">Piso / Departamento</span>
                    <span className="address-value">{floorApartment}</span>
                  </div>
                )}
                <div className="address-item">
                  <span className="address-label">Localidad / Provincia</span>
                  <span className="address-value">
                    {addressDepartmentName}, {addressProvinceName}
                  </span>
                </div>
                <div className="address-item">
                  <span className="address-label">Código Postal</span>
                  <span className="address-value">{zipCode}</span>
                </div>
              </div>
            ) : (
              <p className="display-empty-text">Sin atención al público</p>
            )}
          </div>
        </div>

        <div className="display-card">
          <div className="display-card-icon">
            <Globe size={20} />
          </div>
          <div className="display-card-content">
            <h3>Cobertura Geográfica</h3>
            <div className="address-details-stack">
              <div className="address-item">
                <span className="address-label">Provincias</span>
                <span className="address-value">
                  {provinceNames.length > 0
                    ? provinceNames.join(" • ")
                    : "Sin zonas definidas"}
                </span>
              </div>

              {departmentNames.length > 0 && (
                <div className="address-item">
                  <span className="address-label">Localidades Específicas</span>
                  <span className="address-value">
                    {departmentNames.join(" • ")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="display-card">
          <div className="display-card-icon">
            <CreditCard size={20} />
          </div>
          <div className="display-card-content">
            <h3>Información Adicional</h3>
            <div className="address-details-stack">
              <div className="address-item">
                <span className="address-label">
                  Identificación Tributaria (CUIT)
                </span>
                <span className="address-value">
                  {displayTaxCode || "No registrado"}
                </span>
              </div>
              <div className="address-item">
                <span className="address-label">Métodos de Pago Aceptados</span>
                <span className="address-value">
                  {payments || "No definidos"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
