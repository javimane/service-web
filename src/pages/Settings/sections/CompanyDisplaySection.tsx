import { Edit2, MapPin, CreditCard, Globe, Building2, Store } from "lucide-react";
import "./CompanyDisplaySection.css";

interface CompanyDisplaySectionProps {
  prof: any;
  onEdit: () => void;
  provinceList?: any[];
  departmentList?: any[];
}

export default function CompanyDisplaySection({ 
  prof, 
  onEdit, 
  provinceList = [], 
  departmentList = [] 
}: CompanyDisplaySectionProps) {
  const company = prof?.Company;
  if (!company) return null;

  const address = company.Address;
  
  // Resolve address names from lists if objects are missing
  const addressProvinceName = address?.Province?.name || 
    provinceList.find(p => p.id === address?.province_id)?.name;
    
  const addressDepartmentName = address?.Department?.name || 
    departmentList.find(d => d.id === address?.department_id)?.name;

  const provinces = company.CompanyProvinces?.map((p: any) => p.Province?.name).filter(Boolean).join(", ");
  
  const payments = [
    company.cash && "Efectivo",
    company.transfer && "Transferencia",
    company.credit && "Crédito",
    company.debit && "Débito",
    company.cheque && "Cheque",
  ].filter(Boolean).join(" • ");

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
          <span>Editar Perfil</span>
        </button>
      </div>

      <div className="company-display-grid">
        <div className="display-card">
          <div className="display-card-icon">
            <Store size={20} />
          </div>
          <div className="display-card-content">
            <h3>Punto de Venta</h3>
            {company.public_trade ? (
              <div className="address-details">
                <p className="address-main">{address?.street_name} {address?.street_number}</p>
                <p className="address-sub">
                  {address?.floor_apartment && `${address.floor_apartment} • `} 
                  CP {address?.zip_code}
                </p>
                <p className="address-geo">
                  {addressDepartmentName}{addressProvinceName ? `, ${addressProvinceName}` : ""}
                </p>
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
            <p className="display-text">{provinces || "Sin zonas definidas"}</p>
            {company.CompanyDepartments?.length > 0 && (
                <small className="display-subtext">
                    {company.CompanyDepartments.length} departamentos en total
                </small>
            )}
          </div>
        </div>

        <div className="display-card">
          <div className="display-card-icon">
            <CreditCard size={20} />
          </div>
          <div className="display-card-content">
            <h3>Métodos de Pago</h3>
            <p className="display-text">{payments || "No definidos"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
