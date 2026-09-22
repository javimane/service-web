"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Plus,
  Trash2,
  Star,
  ShieldCheck,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  commerceService,
  UserPaymentMethod,
  CreatePaymentMethodDto,
} from "../../../services/commerceService";
import { useAlert } from "@/context/AlertContext";
import { getAccessToken } from "@/utils/auth";
import { setApiAccessToken } from "@/services/apiClient";
import "./PaymentMethodsSection.css";

// Helper para detectar marca de tarjeta según el BIN
function detectCardBrand(number: string): string {
  const clean = number.replace(/\D/g, "");
  if (/^4/.test(clean)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(clean)) return "mastercard";
  if (/^3[47]/.test(clean)) return "amex";
  if (/^(5896|6042|6043)/.test(clean)) return "cabal";
  if (/^(5031|5895|6011)/.test(clean)) return "naranja";
  return "tarjeta";
}

const COMMON_BANKS = [
  "Santander",
  "Galicia",
  "BBVA",
  "Macro",
  "Banco Nación",
  "Banco Provincia",
  "Mercado Pago",
  "Brubank",
  "Ualá",
  "Banco Ciudad",
  "ICBC",
  "HSBC",
  "Otro Banco",
];

export default function PaymentMethodsSection() {
  const token = getAccessToken();
  setApiAccessToken(token);
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useAlert();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [bankName, setBankName] = useState(COMMON_BANKS[0]);
  const [customBank, setCustomBank] = useState("");
  const [cardType, setCardType] = useState<"credit" | "debit">("credit");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  // Query saved cards
  const {
    data: paymentMethods = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["user-payment-methods"],
    queryFn: async () => {
      return await commerceService.getUserPaymentMethods();
    },
  });

  // Mutation: Crear tarjeta
  const createMutation = useMutation({
    mutationFn: async (dto: CreatePaymentMethodDto) => {
      return await commerceService.createUserPaymentMethod(dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-payment-methods"] });
      showSuccess("Tarjeta guardada exitosamente");
      handleCloseModal();
    },
    onError: (err: any) => {
      showError(err?.message || "Error al guardar la tarjeta");
    },
  });

  // Mutation: Eliminar tarjeta
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await commerceService.deleteUserPaymentMethod(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-payment-methods"] });
      showSuccess("Tarjeta eliminada correctamente");
      setDeleteConfirmId(null);
    },
    onError: (err: any) => {
      showError(err?.message || "Error al eliminar la tarjeta");
    },
  });

  // Mutation: Establecer como predeterminada
  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      return await commerceService.setDefaultPaymentMethod(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-payment-methods"] });
      showSuccess("Tarjeta establecida como predeterminada");
    },
    onError: (err: any) => {
      showError(err?.message || "Error al actualizar la tarjeta");
    },
  });

  const handleOpenModal = () => {
    setCardNumber("");
    setCardHolder("");
    setBankName(COMMON_BANKS[0]);
    setCustomBank("");
    setCardType("credit");
    setExpiry("");
    setCvv("");
    setIsDefault(paymentMethods.length === 0);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Formatear número de tarjeta con espacios
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = val.match(/.{1,4}/g)?.join(" ") || val;
    setCardNumber(formatted);
  };

  // Formatear expiración MM/AA
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length >= 2) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setExpiry(val);
  };

  const handleSubmitCard = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = cardNumber.replace(/\D/g, "");
    if (cleanNum.length < 15) {
      showError("Ingresa un número de tarjeta válido (15 o 16 dígitos)");
      return;
    }
    if (!cardHolder.trim()) {
      showError("Ingresa el nombre del titular como figura en la tarjeta");
      return;
    }
    const [mmStr, yyStr] = expiry.split("/");
    const expMonth = parseInt(mmStr, 10);
    const expYear = parseInt(yyStr, 10);
    if (!expMonth || expMonth < 1 || expMonth > 12 || !expYear) {
      showError("Ingresa una fecha de vencimiento válida (MM/AA)");
      return;
    }
    if (cvv.length < 3) {
      showError("Ingresa el código de seguridad (CVV) de 3 o 4 dígitos");
      return;
    }

    const brand = detectCardBrand(cleanNum);
    const resolvedBank =
      bankName === "Otro Banco" ? customBank.trim() || "Otro" : bankName;

    // En producción se genera con el SDK de Getnet del frontend
    const simulatedToken = `gn_vault_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    createMutation.mutate({
      getnet_card_token: simulatedToken,
      last_four: cleanNum.slice(-4),
      card_brand: brand,
      card_type: cardType,
      bank_name: resolvedBank,
      card_holder_name: cardHolder.trim().toUpperCase(),
      expiry_month: expMonth,
      expiry_year: expYear >= 100 ? expYear : 2000 + expYear,
      is_default: isDefault,
    });
  };

  return (
    <div className="payment-methods">
      {/* Header */}
      <div className="payment-methods__header">
        <div className="payment-methods__title-group">
          <h1 className="payment-methods__title">
            <CreditCard className="payment-methods__title-icon" size={28} />
            Mis Tarjetas y Métodos de Pago
          </h1>
          <p className="payment-methods__subtitle">
            Gestiona tus tarjetas de crédito y débito guardadas para tus compras
            y contrataciones.
          </p>
        </div>
        <button
          type="button"
          className="payment-methods__add-btn"
          onClick={handleOpenModal}
        >
          <Plus size={18} />
          Agregar nueva tarjeta
        </button>
      </div>

      {/* Security Banner */}
      <div className="payment-methods__security-banner">
        <ShieldCheck className="payment-methods__security-icon" size={20} />
        <span>
          Tus datos están protegidos por el estándar internacional de seguridad
          bancaria <strong>PCI-DSS</strong> y tokenizados por{" "}
          <strong>Getnet</strong>. Nunca guardamos los números completos de tu
          tarjeta ni tu código de seguridad (CVV).
        </span>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="payment-methods__state-box">
          <Loader2 className="payment-methods__state-icon" size={36} />
          <p className="payment-methods__state-desc">
            Cargando tus métodos de pago guardados...
          </p>
        </div>
      ) : isError ? (
        <div className="payment-methods__state-box">
          <CreditCard className="payment-methods__state-icon" size={36} />
          <h3 className="payment-methods__state-title">
            No se pudieron cargar tus tarjetas
          </h3>
          <p className="payment-methods__state-desc">
            Ocurrió un inconveniente al consultar tus métodos de pago. Por favor
            intenta de nuevo en unos momentos.
          </p>
        </div>
      ) : paymentMethods.length === 0 ? (
        <div className="payment-methods__state-box">
          <CreditCard className="payment-methods__state-icon" size={48} />
          <h3 className="payment-methods__state-title">
            No tienes tarjetas guardadas
          </h3>
          <p className="payment-methods__state-desc">
            Agrega tus tarjetas de crédito o débito para comprar y contratar
            servicios en 1 clic de forma segura.
          </p>
          <button
            type="button"
            className="payment-methods__add-btn"
            onClick={handleOpenModal}
          >
            <Plus size={18} />
            Agregar mi primera tarjeta
          </button>
        </div>
      ) : (
        <div className="payment-methods__grid">
          {paymentMethods.map((method) => {
            const isDef = method.is_default;
            const brandName = (method.card_brand || "tarjeta").toUpperCase();
            const typeLabel =
              method.card_type === "debit" ? "DÉBITO" : "CRÉDITO";
            const expFormatted =
              method.expiry_month && method.expiry_year
                ? `${String(method.expiry_month).padStart(2, "0")}/${String(method.expiry_year).slice(-2)}`
                : "--/--";

            return (
              <div key={method.id} className="payment-methods__card-wrapper">
                <div
                  className={`payment-methods__card ${
                    isDef ? "payment-methods__card--default" : ""
                  }`}
                >
                  {isDef && (
                    <div className="payment-methods__badge-default">
                      <Star size={12} fill="#ffffff" />
                      Predeterminada
                    </div>
                  )}

                  {/* Card Top */}
                  <div className="payment-methods__card-top">
                    <div className="payment-methods__card-bank-info">
                      <span className="payment-methods__card-bank">
                        {method.bank_name || "BANCO EMISOR"}
                      </span>
                      <span className="payment-methods__card-type-tag">
                        {typeLabel}
                      </span>
                    </div>
                    <span className="payment-methods__card-brand-badge">
                      {brandName}
                    </span>
                  </div>

                  {/* Chip */}
                  <div className="payment-methods__card-chip" />

                  {/* Masked Card Number */}
                  <div className="payment-methods__card-number">
                    •••• •••• •••• {method.last_four}
                  </div>

                  {/* Card Bottom */}
                  <div className="payment-methods__card-bottom">
                    <div className="payment-methods__card-meta">
                      <span className="payment-methods__card-meta-label">
                        Titular
                      </span>
                      <span className="payment-methods__card-meta-val">
                        {method.card_holder_name || "TITULAR DE TARJETA"}
                      </span>
                    </div>
                    <div className="payment-methods__card-meta">
                      <span className="payment-methods__card-meta-label">
                        Vence
                      </span>
                      <span className="payment-methods__card-meta-val">
                        {expFormatted}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions below card */}
                <div className="payment-methods__card-actions">
                  {!isDef ? (
                    <button
                      type="button"
                      className="payment-methods__action-default-btn"
                      onClick={() => setDefaultMutation.mutate(method.id)}
                      disabled={setDefaultMutation.isPending}
                    >
                      <Star size={14} />
                      Establecer predeterminada
                    </button>
                  ) : (
                    <span className="payment-methods__card-type-tag">
                      <CheckCircle2
                        size={14}
                        className="payment-methods__security-icon"
                      />{" "}
                      Tarjeta favorita
                    </span>
                  )}

                  {deleteConfirmId === method.id ? (
                    <button
                      type="button"
                      className="payment-methods__action-delete-btn"
                      onClick={() => deleteMutation.mutate(method.id)}
                      disabled={deleteMutation.isPending}
                    >
                      ¿Confirmar borrado?
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="payment-methods__action-delete-btn"
                      onClick={() => setDeleteConfirmId(method.id)}
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Agregar Tarjeta */}
      {isModalOpen && (
        <div
          className="payment-methods__modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="payment-methods__modal">
            <div className="payment-methods__modal-header">
              <h2 className="payment-methods__modal-title">Agregar Tarjeta</h2>
              <button
                type="button"
                className="payment-methods__modal-close-btn"
                onClick={handleCloseModal}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitCard}>
              <div className="payment-methods__modal-body">
                {/* Número de Tarjeta */}
                <div className="payment-methods__form-group">
                  <label className="payment-methods__label">
                    Número de tarjeta
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="payment-methods__input"
                    required
                  />
                </div>

                {/* Titular */}
                <div className="payment-methods__form-group">
                  <label className="payment-methods__label">
                    Nombre y apellido del titular
                  </label>
                  <input
                    type="text"
                    placeholder="COMO FIGURA EN EL FRENTE"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="payment-methods__input"
                    required
                  />
                </div>

                {/* Banco Emisor */}
                <div className="payment-methods__form-group">
                  <label className="payment-methods__label">Banco emisor</label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="payment-methods__input"
                  >
                    {COMMON_BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                {bankName === "Otro Banco" && (
                  <div className="payment-methods__form-group">
                    <label className="payment-methods__label">
                      Nombre de tu banco o billetera
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Banco Comafi, Naranja X, etc."
                      value={customBank}
                      onChange={(e) => setCustomBank(e.target.value)}
                      className="payment-methods__input"
                      required
                    />
                  </div>
                )}

                {/* Tipo de tarjeta: Crédito o Débito */}
                <div className="payment-methods__form-group">
                  <label className="payment-methods__label">
                    Tipo de tarjeta
                  </label>
                  <div className="payment-methods__form-row">
                    <label className="payment-methods__checkbox-label">
                      <input
                        type="radio"
                        name="card_type"
                        value="credit"
                        checked={cardType === "credit"}
                        onChange={() => setCardType("credit")}
                      />
                      Tarjeta de Crédito
                    </label>
                    <label className="payment-methods__checkbox-label">
                      <input
                        type="radio"
                        name="card_type"
                        value="debit"
                        checked={cardType === "debit"}
                        onChange={() => setCardType("debit")}
                      />
                      Tarjeta de Débito
                    </label>
                  </div>
                </div>

                {/* Expiración y CVV */}
                <div className="payment-methods__form-row">
                  <div className="payment-methods__form-group">
                    <label className="payment-methods__label">
                      Vencimiento (MM/AA)
                    </label>
                    <input
                      type="text"
                      placeholder="11/28"
                      value={expiry}
                      onChange={handleExpiryChange}
                      className="payment-methods__input"
                      maxLength={5}
                      required
                    />
                  </div>
                  <div className="payment-methods__form-group">
                    <label className="payment-methods__label">
                      Código de seguridad (CVV)
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      placeholder="•••"
                      value={cvv}
                      onChange={(e) =>
                        setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                      }
                      className="payment-methods__input"
                      maxLength={4}
                      required
                    />
                  </div>
                </div>

                {/* Checkbox predeterminada */}
                <label className="payment-methods__checkbox-label">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                  />
                  Guardar como tarjeta predeterminada para mis compras
                </label>
              </div>

              <div className="payment-methods__modal-footer">
                <button
                  type="button"
                  className="payment-methods__btn-secondary"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="payment-methods__btn-primary"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending && (
                    <Loader2 size={16} className="spin" />
                  )}
                  Guardar tarjeta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
