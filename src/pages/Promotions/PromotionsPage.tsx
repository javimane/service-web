import React, { useState } from "react";
import {
  Search,
  MapPin,
  Tag,
  Calendar,
  Building2,
  TicketPercent,
  WalletCards,
  Loader2,
  ChevronDown,
  X,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import {
  bankPromotionService,
  bankService,
  Bank,
  BankPromotion,
} from "../../services/bankPromotionService";
import {
  professionalPromotionService,
  ProfessionalPromotion,
} from "../../services/professionalPromotionService";
import { locationService } from "../../services/locationService";
import { ProvinceRow } from "../../types/database.types";
import { ROUTES } from "../../routes/paths";
import PromotionDetailModal from "../../components/Modals/PromotionDetailModal";
import "./PromotionsPage.css";

export default function PromotionsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"bancos" | "promos">("bancos");

  // Queries with caching
  const { data: banks = [], isLoading: loadingBanks } = useQuery({
    queryKey: ["banks"],
    queryFn: () => bankService.findAll(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const { data: provinces = [], isLoading: loadingProvinces } = useQuery({
    queryKey: ["provinces"],
    queryFn: () => locationService.getProvinces(),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  const { data: bankPromotions = [], isLoading: loadingBankPromos } = useQuery({
    queryKey: ["bankPromotions"],
    queryFn: () => bankPromotionService.getAll(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const { data: profPromotions = [], isLoading: loadingProfPromos } = useQuery({
    queryKey: ["profPromotions"],
    queryFn: () => professionalPromotionService.getAll(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const loading =
    loadingBanks || loadingProvinces || loadingBankPromos || loadingProfPromos;

  // Modal state
  const [selectedPromo, setSelectedPromo] = useState<any>(null);

  // Filter state
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedDiscountType, setSelectedDiscountType] = useState("");
  const [selectedDay, setSelectedDay] = useState("");

  const getPromoBankIds = (promo: BankPromotion): number[] => {
    const relationIds = (promo.bank_promotions_banks || [])
      .map((relation) => relation.Bank?.id ?? relation.bank_id)
      .filter((id): id is number => typeof id === "number");

    if (relationIds.length > 0) {
      return Array.from(new Set(relationIds));
    }

    if (typeof promo.bank_id === "number") {
      return [promo.bank_id];
    }

    return [];
  };

  const getPromoBankNames = (promo: BankPromotion): string[] => {
    const relationNames = (promo.bank_promotions_banks || [])
      .map((relation) => relation.Bank?.name)
      .filter((name): name is string => Boolean(name));

    if (relationNames.length > 0) {
      return Array.from(new Set(relationNames));
    }

    if (promo.Bank?.name) {
      return [promo.Bank.name];
    }

    if (typeof promo.bank_id === "number") {
      const fallbackBank = banks.find((bank) => bank.id === promo.bank_id);
      return [fallbackBank?.name || "Banco"];
    }

    return ["Banco"];
  };

  const getDayName = (dayIndex: number) => {
    const days = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    return days[dayIndex];
  };

  const checkPromoDay = (promo: BankPromotion, selectedDayName: string) => {
    if (!selectedDayName) return true;
    const dayMap: Record<string, keyof BankPromotion> = {
      Lunes: "monday",
      Martes: "tuesday",
      Miércoles: "wednesday",
      Jueves: "thursday",
      Viernes: "friday",
      Sábado: "saturday",
      Domingo: "sunday",
    };
    const key = dayMap[selectedDayName];
    return key ? !!promo[key] : false;
  };

  const filteredBankDiscounts = bankPromotions.filter((d) => {
    if (selectedBank) {
      const bankIds = getPromoBankIds(d).map((id) => id.toString());
      if (!bankIds.includes(selectedBank)) return false;
    }
    if (selectedDay && !checkPromoDay(d, selectedDay)) return false;
    return true;
  });

  const filteredPromotions = profPromotions.filter((p) => {
    if (selectedDiscountType && p.discount_type !== selectedDiscountType)
      return false;
    return true;
  });

  const MOCK_DAYS = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];
  const MOCK_DISCOUNT_TYPES = [
    "Percentage",
    "Fixed Amount",
    "2x1",
    "Free Shipping",
  ];

  const handleProfileClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate(`${ROUTES.profile}/${id}`);
  };

  return (
    <div className="promotions-page-wrapper">
      <Navbar />
      <main className="promotions-page container">
        <header className="promotions-header">
          <h1 className="promotions-title">
            Descubrí las mejores oportunidades
          </h1>
          <p className="promotions-subtitle">
            Ahorrá en tus compras de todos los días con descuentos exclusivos
          </p>
        </header>

        <div className="promotions-tabs">
          <button
            className={`promo-tab ${activeTab === "bancos" ? "active" : ""}`}
            onClick={() => setActiveTab("bancos")}
          >
            <WalletCards size={20} />
            Descuentos Bancarios
          </button>
          <button
            className={`promo-tab ${activeTab === "promos" ? "active" : ""}`}
            onClick={() => setActiveTab("promos")}
          >
            <TicketPercent size={20} />
            Otras Promociones
          </button>
        </div>

        <div className="promotions-filters">
          <div className="filter-group">
            <MapPin size={18} />
            <div className="select-wrapper">
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
              >
                <option value="">Todas las Provincias</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-group">
            <Calendar size={18} />
            <div className="select-wrapper">
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
              >
                <option value="">Cualquier Día</option>
                {MOCK_DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeTab === "bancos" ? (
            <div className="filter-group">
              <Building2 size={18} />
              <div className="select-wrapper">
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                >
                  <option value="">Todos los Bancos</option>
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="filter-group">
              <Tag size={18} />
              <div className="select-wrapper">
                <select
                  value={selectedDiscountType}
                  onChange={(e) => setSelectedDiscountType(e.target.value)}
                >
                  <option value="">Tipos de Descuento</option>
                  {MOCK_DISCOUNT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="promo-loading">
            <Loader2 size={40} className="animate-spin" />
            <p>Cargando promociones...</p>
          </div>
        ) : (
          <div className="promotions-grid">
            {activeTab === "bancos" &&
              filteredBankDiscounts.map((discount) => (
                <div
                  key={discount.id}
                  className="promo-card"
                  onClick={() =>
                    setSelectedPromo({ ...discount, type: "bank" })
                  }
                >
                  {(() => {
                    const promoBankNames = getPromoBankNames(discount);
                    const visibleBankNames = promoBankNames.slice(0, 2);
                    const hiddenBanksCount = Math.max(
                      promoBankNames.length - visibleBankNames.length,
                      0,
                    );
                    return (
                      <>
                        <div
                          className="promo-card-image"
                          style={{
                            backgroundImage: `url(https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600)`,
                          }}
                        >
                          <div className="promo-card-offer-badge overlay">
                            <span className="offer-num">
                              {discount.percentaje_discount}
                            </span>
                            <span className="offer-unit">% OFF</span>
                          </div>
                        </div>
                        <div className="promo-card-content">
                          <div className="promo-card-info">
                            <div
                              className="promo-brand-link"
                              onClick={(e) =>
                                handleProfileClick(
                                  e,
                                  String(discount.Professional?.id),
                                )
                              }
                            >
                              {(discount.Professional as any)?.Profile
                                ?.avatar_url ? (
                                <img
                                  src={
                                    (discount.Professional as any).Profile
                                      .avatar_url
                                  }
                                  alt="Avatar"
                                  className="promo-card-avatar"
                                />
                              ) : (
                                <User size={12} />
                              )}
                              <span>
                                {(discount.Professional as any)?.Company?.[0]
                                  ?.name ||
                                  (discount.Professional as any)?.Company
                                    ?.name ||
                                  "Ver Perfil"}
                              </span>
                            </div>
                            <div className="promo-bank-chips">
                              {visibleBankNames.map((bankName) => (
                                <span
                                  key={bankName}
                                  className="promo-bank-chip"
                                >
                                  {bankName}
                                </span>
                              ))}
                              {hiddenBanksCount > 0 && (
                                <span className="promo-bank-chip promo-bank-chip--more">
                                  +{hiddenBanksCount}
                                </span>
                              )}
                            </div>
                            <p className="promo-desc">
                              {discount.description ||
                                `Ahorrá hasta $${discount.refund} en tus compras.`}
                            </p>
                          </div>
                          <div className="promo-meta">
                            <span className="promo-meta-item">
                              <Calendar size={14} />{" "}
                              {[
                                discount.monday && "Lun",
                                discount.tuesday && "Mar",
                                discount.wednesday && "Mié",
                                discount.thursday && "Jue",
                                discount.friday && "Vie",
                                discount.saturday && "Sáb",
                                discount.sunday && "Dom",
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ))}

            {activeTab === "promos" &&
              filteredPromotions.map((promo) => (
                <div
                  key={promo.id}
                  className="promo-card"
                  onClick={() => setSelectedPromo({ ...promo, type: "prof" })}
                >
                  <div
                    className="promo-card-image"
                    style={{
                      backgroundImage: `url(${promo.image_url || "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=600"})`,
                    }}
                  >
                    <div className="promo-card-offer-badge overlay">
                      <span className="offer-num">
                        {promo.discount_type === "2x1"
                          ? "2x1"
                          : promo.discount_value}
                      </span>
                      <span className="offer-unit">
                        {promo.discount_type === "percentage" ||
                        promo.discount_type === "Percentage"
                          ? "% OFF"
                          : promo.discount_type === "fixed" ||
                              promo.discount_type === "Fixed Amount"
                            ? "$ OFF"
                            : ""}
                      </span>
                    </div>
                  </div>
                  <div className="promo-card-content">
                    <div className="promo-card-info">
                      <div
                        className="promo-brand-link"
                        onClick={(e) =>
                          handleProfileClick(
                            e,
                            promo.professional_id.toString(),
                          )
                        }
                      >
                        {promo.Professional?.Profile?.avatar_url ? (
                          <img
                            src={promo.Professional.Profile.avatar_url}
                            alt="Avatar"
                            className="promo-card-avatar"
                          />
                        ) : (
                          <User size={12} />
                        )}
                        <span>
                          {promo.Professional?.Company?.[0]?.name ||
                            promo.Professional?.Company?.name ||
                            "Ver Perfil"}
                        </span>
                      </div>
                      <h3>{promo.title}</h3>
                      <p className="promo-desc">{promo.description}</p>
                    </div>
                  </div>
                </div>
              ))}

            {((activeTab === "bancos" && filteredBankDiscounts.length === 0) ||
              (activeTab === "promos" && filteredPromotions.length === 0)) && (
              <div className="promo-empty-state">
                <Search size={48} />
                <h3>No se encontraron resultados</h3>
                <p>Intentá ajustar los filtros para ver más promociones.</p>
              </div>
            )}
          </div>
        )}

        {/* Reusable Promotion Details Modal */}
        <PromotionDetailModal
          promo={selectedPromo}
          isOpen={!!selectedPromo}
          onClose={() => setSelectedPromo(null)}
          userProvince={
            selectedProvince
              ? provinces.find((p) => p.id.toString() === selectedProvince)
                  ?.name
              : undefined
          }
        />
      </main>
      <Footer />
    </div>
  );
}
