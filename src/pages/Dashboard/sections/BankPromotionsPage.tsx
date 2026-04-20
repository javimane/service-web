import { useState } from "react";
import {
  Plus,
  Landmark,
  CreditCard,
  CalendarDays,
  Percent,
  Trash2,
  Edit2,
  X,
  Save,
  Wallet,
  Building2,
} from "lucide-react";
import "./BankPromotionsPage.css";

const MOCK_BANK_PROMOS = [
  {
    id: "1",
    bankName: "Santander",
    type: "bank",
    discountPercent: 20,
    cartera: "General",
    reintegro: "Alta",
    tope: 5000,
    days: ["1", "4"], // Mon, Thu
    status: "active",
  },
  {
    id: "2",
    bankName: "Galicia",
    type: "bank",
    discountPercent: 15,
    cartera: "Éminent",
    reintegro: "Alta",
    tope: 8000,
    days: ["3", "5"], // Wed, Fri
    status: "active",
  },
];

const DAYS_OF_WEEK = [
  { id: "1", label: "L" },
  { id: "2", label: "M" },
  { id: "3", label: "X" },
  { id: "4", label: "J" },
  { id: "5", label: "V" },
  { id: "6", label: "S" },
  { id: "0", label: "D" },
];

export default function BankPromotionsPage() {
  const [promos, setPromos] = useState(MOCK_BANK_PROMOS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any>(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    bankName: "",
    type: "bank", // 'bank' | 'wallet'
    discountPercent: 0,
    cartera: "General",
    tope: 0,
    days: [] as string[],
  });

  const handleOpenModal = (promo: any = null) => {
    if (promo) {
      setEditingPromo(promo);
      setForm({
        bankName: promo.bankName,
        type: promo.type ?? "bank",
        discountPercent: promo.discountPercent,
        cartera: promo.cartera,
        tope: promo.tope,
        days: [...promo.days],
      });
    } else {
      setEditingPromo(null);
      setForm({
        bankName: "",
        type: "bank",
        discountPercent: 0,
        cartera: "General",
        tope: 0,
        days: [],
      });
    }
    setError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError("");
  };

  const handleDayToggle = (dayId: string) => {
    setForm((prev) => {
      if (prev.days.includes(dayId)) {
        return { ...prev, days: prev.days.filter((d) => d !== dayId) };
      }
      return { ...prev, days: [...prev.days, dayId] };
    });
  };

  const handleSave = () => {
    if (!form.bankName.trim()) {
      setError("El nombre de la entidad / banco no puede estar vacío.");
      return;
    }
    if (!form.discountPercent || form.discountPercent <= 0) {
      setError("El porcentaje de descuento debe ser mayor a 0.");
      return;
    }
    if (!form.tope || form.tope <= 0) {
      setError("El tope de reintegro debe ser mayor a 0.");
      return;
    }
    if (!form.cartera.trim()) {
      setError("La cartera o nivel de tarjeta no puede estar vacío.");
      return;
    }
    if (form.days.length === 0) {
      setError("Debe seleccionar al menos un día de aplicación.");
      return;
    }

    setError("");

    if (editingPromo) {
      setPromos((prev) =>
        prev.map((p) =>
          p.id === editingPromo.id ? { ...p, ...form, id: editingPromo.id } : p,
        ),
      );
    } else {
      setPromos((prev) => [
        ...prev,
        {
          ...form,
          id: Math.random().toString(),
          reintegro: "Alta",
          status: "active",
        },
      ]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setPromos((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="bank-promos">
      <div className="bank-promos__header">
        <div>
          <span className="bank-promos__label">FINANZAS</span>
          <h1 className="bank-promos__title">Promociones Bancarias</h1>
        </div>
        <button
          type="button"
          className="bank-promos__create-btn"
          onClick={() => handleOpenModal()}
        >
          <Plus size={18} />
          Nueva Promoción
        </button>
      </div>

      <div className="bank-promos__grid">
        {promos.map((promo) => (
          <div key={promo.id} className="bank-promo-card">
            <div className="bank-promo-card__header">
              <div className="bank-promo-card__bank">
                <div className="bank-promo-card__icon">
                  {promo.type === "wallet" ? (
                    <Wallet size={24} />
                  ) : (
                    <Building2 size={24} />
                  )}
                </div>
                <div className="bank-promo-card__bank-info">
                  <h3>{promo.bankName}</h3>
                  <p>Cartera {promo.cartera}</p>
                </div>
              </div>
              <div className="bank-promo-card__actions">
                <button
                  type="button"
                  className="bank-promo-card__action"
                  onClick={() => handleOpenModal(promo)}
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  type="button"
                  className="bank-promo-card__action bank-promo-card__action--danger"
                  onClick={() => handleDelete(promo.id)}
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="bank-promo-card__details">
              <div className="bank-promo-card__detail-row">
                <span className="bank-promo-card__detail-label">
                  <Percent size={14} /> Descuento
                </span>
                <span className="bank-promo-card__detail-value bank-promo-card__detail-value--highlight">
                  {promo.discountPercent}% OFF
                </span>
              </div>
              <div className="bank-promo-card__detail-row">
                <span className="bank-promo-card__detail-label">
                  <CreditCard size={14} /> Tope de reintegro
                </span>
                <span className="bank-promo-card__detail-value">
                  ${promo.tope.toLocaleString()}
                </span>
              </div>
              <div
                className="bank-promo-card__detail-row"
                style={{
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "8px",
                }}
              >
                <span className="bank-promo-card__detail-label">
                  <CalendarDays size={14} /> Días de vigencia
                </span>
                <div className="bank-promo-card__days">
                  {DAYS_OF_WEEK.map((day) => (
                    <span
                      key={day.id}
                      className={`bank-promo-card__day ${promo.days.includes(day.id) ? "active" : ""}`}
                    >
                      {day.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
        {promos.length === 0 && (
          <div className="bank-promos__empty">
            <div className="empty-icon-container">
              <Landmark size={48} />
            </div>
            <h3>Sin promociones activas</h3>
            <p>
              Configura las promociones de bancos y billeteras virtuales para
              tus clientes.
            </p>
            <button
              className="bank-promo-btn bank-promo-btn--primary"
              onClick={() => handleOpenModal()}
            >
              <Plus size={18} /> Crear Primera Promoción
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="bank-promo-modal-overlay">
          <div className="bank-promo-modal">
            <div className="bank-promo-modal__header">
              <h2>
                {editingPromo ? "Editar Promoción" : "Nueva Promoción Bancaria"}
              </h2>
              <button
                type="button"
                className="bank-promo-modal__close"
                onClick={handleCloseModal}
              >
                <X size={20} />
              </button>
            </div>
            <div className="bank-promo-modal__body">
              {error && <div className="bank-promo-error-message">{error}</div>}
              <div className="bank-promo-form-grid">
                <div className="bank-promo-field bank-promo-field--full">
                  <label>Banco o Entidad</label>
                  <div className="bank-promo-input-wrapper">
                    <Landmark size={18} className="field-icon" />
                    <select
                      value={form.bankName}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          bankName: e.target.value,
                        }))
                      }
                    >
                      <option value="" disabled>
                        Selecciona un banco o billetera...
                      </option>
                      <optgroup label="Bancos">
                        <option value="Santander">Santander</option>
                        <option value="Galicia">Galicia</option>
                        <option value="BBVA">BBVA</option>
                        <option value="Macro">Macro</option>
                        <option value="Brubank">Brubank</option>
                        <option value="ICBC">ICBC</option>
                        <option value="Patagonia">Patagonia</option>
                      </optgroup>
                      <optgroup label="Billeteras Virtuales">
                        <option value="Modo">Modo</option>
                        <option value="Mercado Pago">Mercado Pago</option>
                        <option value="Personal Pay">Personal Pay</option>
                        <option value="Naranja X">Naranja X</option>
                        <option value="Ualá">Ualá</option>
                      </optgroup>
                      <option value="Otro">Otro / General</option>
                    </select>
                  </div>
                </div>
                <div className="bank-promo-field">
                  <label>Descuento (%)</label>
                  <div className="bank-promo-input-wrapper">
                    <Percent size={18} className="field-icon" />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Ej. 20"
                      value={form.discountPercent || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          discountPercent: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="bank-promo-field">
                  <label>Tope de Reintegro ($)</label>
                  <div className="bank-promo-input-wrapper">
                    <Save size={18} className="field-icon" />
                    <input
                      type="number"
                      min="0"
                      placeholder="Ej. 5000"
                      value={form.tope || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          tope: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="bank-promo-field">
                  <label>Tipo de Entidad</label>
                  <div className="bank-promo-input-wrapper">
                    <Building2 size={18} className="field-icon" />
                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, type: e.target.value }))
                      }
                    >
                      <option value="bank">Banco</option>
                      <option value="wallet">Billetera Virtual</option>
                    </select>
                  </div>
                </div>
                <div className="bank-promo-field">
                  <label>Cartera / Nivel</label>
                  <div className="bank-promo-input-wrapper">
                    <CreditCard size={18} className="field-icon" />
                    <select
                      value={form.cartera}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          cartera: e.target.value,
                        }))
                      }
                    >
                      <option value="General">General</option>
                      <option value="Éminent">Éminent / Premium</option>
                      <option value="Select">Select</option>
                      <option value="Black / Signature">
                        Black / Signature
                      </option>
                    </select>
                  </div>
                </div>
                <div className="bank-promo-field bank-promo-field--full">
                  <label>Días de Aplicación</label>
                  <div className="bank-promo-days-selector">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.id}
                        type="button"
                        className={`bank-promo-day-btn ${form.days.includes(day.id) ? "selected" : ""}`}
                        onClick={() => handleDayToggle(day.id)}
                      >
                        <span className="bank-promo-day-label">
                          {day.label}
                        </span>
                        {form.days.includes(day.id) && (
                          <X size={12} className="day-remove-icon" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="bank-promo-modal__footer">
              <button
                type="button"
                className="bank-promo-btn bank-promo-btn--danger"
                onClick={handleCloseModal}
              >
                <X size={16} /> Cancelar
              </button>
              <button
                type="button"
                className="bank-promo-btn bank-promo-btn--primary"
                onClick={handleSave}
              >
                <Save size={16} />{" "}
                {editingPromo ? "Guardar Cambios" : "Crear Promoción"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
