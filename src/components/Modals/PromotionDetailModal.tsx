"use client";
import React, { useRef, useState } from "react";
import {
  Download,
  Calendar,
  MapPin,
  CheckCircle,
  X,
  Sparkles,
  WalletCards,
  TicketPercent,
  Building2,
  FileText,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ROUTES } from "../../routes/paths";
import Modal from "../Modal/Modal";
import { toJpeg } from "html-to-image";
import "./PromotionDetailModal.css";

interface PromotionDetailModalProps {
  promo: any;
  isOpen: boolean;
  onClose: () => void;
  userProvince?: string;
}

export default function PromotionDetailModal({
  promo,
  isOpen,
  onClose,
  userProvince,
}: PromotionDetailModalProps) {
  const router = useRouter();
  const couponRef = useRef<HTMLDivElement>(null);
  const [showTerms, setShowTerms] = useState(false);

  if (!promo) return null;

  // Normalize data between BankPromotion and ProfessionalPromotion
  const relationBankNames = (promo.bank_promotions_banks || [])
    .map((relation: any) => relation?.Bank?.name)
    .filter(Boolean);
  const bankNames =
    relationBankNames.length > 0
      ? Array.from(new Set(relationBankNames))
      : [promo.Bank?.name || promo.bank?.name].filter(Boolean);

  const isBank = promo.type === "bank" || bankNames.length > 0 || !!promo.Bank;
  const bankName = bankNames.length > 0 ? bankNames.join(", ") : undefined;

  const companyName =
    promo.professionalName ||
    promo.Professional?.Company?.[0]?.name ||
    promo.Professional?.Company?.name ||
    "Profesional";

  const title = isBank
    ? `${promo.percentaje_discount}% de descuento`
    : promo.title;
  const description =
    promo.description ||
    (isBank ? `Ahorrá hasta $${promo.refund} en tus compras.` : "");
  const offer = isBank
    ? `${promo.percentaje_discount}%`
    : promo.offer ||
      (promo.discount_type === "percentage" ||
      promo.discount_type === "Percentage"
        ? `${promo.discount_value}% OFF`
        : promo.discount_type === "fixed" ||
            promo.discount_type === "Fixed Amount"
          ? `$${promo.discount_value} OFF`
          : promo.discount_type === "2x1"
            ? "2x1"
            : "GRATIS");

  const avatarUrl = promo.Professional?.Profile?.avatar_url;
  const professionalId = promo.professional_id || promo.professionalId;

  const validFrom =
    promo.validFrom ||
    (promo.from_date ? new Date(promo.from_date).toLocaleDateString() : "N/A");
  const validTo =
    promo.validTo ||
    (promo.expires_at
      ? new Date(promo.expires_at).toLocaleDateString()
      : "Indefinido");

  const image =
    promo.image ||
    (isBank
      ? "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800"
      : promo.image_url ||
        "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=800");

  const handleDownload = async () => {
    if (!couponRef.current) return;
    try {
      const dataUrl = await toJpeg(couponRef.current, {
        quality: 0.95,
        backgroundColor: "#fff",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `cupon-${title.toLowerCase().replace(/\s+/g, "-")}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error downloading coupon:", err);
      alert("No se pudo descargar el cupón en este momento.");
    }
  };

  const handleProfileClick = () => {
    if (professionalId) {
      router.push(`${ROUTES.profile}/${professionalId}`);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} noPadding maxWidth="500px">
      <div className="promo-detail-modal">
        {/* Actions outside the ref area */}
        <button className="promo-detail-modal__close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="promo-detail-modal__coupon-wrapper" ref={couponRef}>
          <div className="promo-detail-modal__top-banner">
            <div
              className="promo-detail-modal__professional-mini"
              onClick={handleProfileClick}
              style={{ cursor: professionalId ? "pointer" : "default" }}
            >
              <div className="avatar-container">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="prof-avatar" />
                ) : isBank ? (
                  <Building2 size={24} className="bank-icon" />
                ) : (
                  <Sparkles size={16} />
                )}
              </div>
              <div className="prof-info">
                <span className="prof-name">{companyName}</span>
                <span className="prof-label">
                  {isBank
                    ? `BENEFICIO: ${bankName || "Banco"}`
                    : "PROFESIONAL VERIFICADO"}
                </span>
              </div>
            </div>
            <span className="promo-detail-modal__offer-badge">
              {isBank ? <WalletCards size={16} /> : <TicketPercent size={16} />}
              {offer}
            </span>
          </div>

          <div className="promo-detail-modal__image-wrapper">
            <img
              src={image}
              alt={title}
              className="promo-detail-modal__image"
            />
          </div>

          <div className="promo-detail-modal__body">
            <h3 className="promo-detail-modal__title">{title}</h3>
            <p className="promo-detail-modal__description">{description}</p>

            <div className="promo-detail-modal__details">
              <div className="promo-detail-modal__detail-item">
                <Calendar size={16} />
                <span>
                  <strong>Validez:</strong> {validFrom} al {validTo}
                </span>
              </div>

              {isBank && promo.refund && (
                <div className="promo-detail-modal__detail-item">
                  <WalletCards size={16} />
                  <span>
                    <strong>Tope de reintegro:</strong> ${promo.refund}
                  </span>
                </div>
              )}

              {isBank && promo.minimum_amount && (
                <div className="promo-detail-modal__detail-item">
                  <WalletCards size={16} />
                  <span>
                    <strong>Compra mínima:</strong> ${promo.minimum_amount}
                  </span>
                </div>
              )}

              {isBank && (
                <div className="promo-detail-modal__detail-item">
                  <Calendar size={16} />
                  <span>
                    <strong>Días:</strong>{" "}
                    {[
                      promo.monday && "Lun",
                      promo.tuesday && "Mar",
                      promo.wednesday && "Mié",
                      promo.thursday && "Jue",
                      promo.friday && "Vie",
                      promo.saturday && "Sáb",
                      promo.sunday && "Dom",
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
              )}

              {isBank &&
                promo.payment_method &&
                JSON.parse(promo.payment_method).length > 0 && (
                  <div className="promo-detail-modal__detail-item promo-detail-modal__detail-item--column">
                    <div className="detail-item-header">
                      <WalletCards size={16} />
                      <strong>Métodos de pago aceptados:</strong>
                    </div>
                    <div className="payment-methods-tags">
                      {JSON.parse(promo.payment_method).map((m: string) => (
                        <span key={m} className="payment-method-tag">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {isBank && promo.terms_conditions && (
                <div className="promo-detail-modal__detail-item promo-detail-modal__detail-item--column">
                  <button
                    type="button"
                    className="promo-detail-modal__terms-toggle"
                    onClick={() => setShowTerms((prev) => !prev)}
                    aria-expanded={showTerms}
                  >
                    <span className="detail-item-header">
                      <FileText size={16} />
                      <strong>Términos y condiciones</strong>
                    </span>
                    <span className="promo-detail-modal__terms-toggle-indicator">
                      <span className="promo-detail-modal__terms-toggle-text">
                        {showTerms ? "Ocultar" : "Ver"}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`promo-detail-modal__terms-chevron ${showTerms ? "is-open" : ""}`}
                      />
                    </span>
                  </button>
                </div>
              )}

              {userProvince && (
                <div className="promo-detail-modal__detail-item">
                  <MapPin size={16} />
                  <span>
                    <strong>Ubicación:</strong> {userProvince}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {isBank && promo.terms_conditions && (
          <div
            className={`promo-detail-modal__terms-panel ${showTerms ? "is-open" : "is-closed"}`}
            aria-hidden={!showTerms}
          >
            <button
              type="button"
              className="promo-detail-modal__terms-panel-header"
              onClick={() => setShowTerms(false)}
            >
              <h4 className="promo-detail-modal__terms-title">
                <FileText size={15} /> Términos y condiciones
              </h4>
              <span className="promo-detail-modal__terms-panel-close">
                Cerrar
              </span>
            </button>
            <div className="promo-detail-modal__terms-panel-body">
              <p className="terms-text">{promo.terms_conditions}</p>
            </div>
          </div>
        )}

        {/* Action button outside the ref area */}
        <div className="promo-detail-modal__actions">
          <button
            className="promo-detail-modal__download-btn"
            type="button"
            onClick={handleDownload}
          >
            <Download size={20} />
            Descargar Cupón JPG
          </button>

          <p className="promo-detail-modal__footer-text">
            <CheckCircle size={12} /> Presenta este cupón al momento del
            servicio
          </p>
        </div>
      </div>
    </Modal>
  );
}
