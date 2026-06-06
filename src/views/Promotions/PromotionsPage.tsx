"use client";
import React, { useState, useEffect, useRef } from "react";
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
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import PromotionDetailPage from "./PromotionDetailPage";
import { Bank, BankPromotion } from "../../services/bankPromotionService";
import { ProfessionalPromotion } from "../../services/professionalPromotionService";
import { ProvinceRow } from "../../types/database.types";
import { ROUTES } from "../../routes/paths";
import SEO from "../../components/SEO/SEO";
import { getProfilePath, normalizeSeoPath } from "../../utils/utils";
import "./PromotionsPage.css";
import {
  getBanksAction,
  getBankPromotionsAction,
} from "@/app/actions/bankPromotions";
import { getProfessionalPromotionsAction } from "@/app/actions/professionalPromotions";
import { getProvincesAction } from "@/app/actions/provinces";

export default function PromotionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const promoId = searchParams?.get("id");

  const [activeTab, setActiveTab] = useState<"bancos" | "promos">("bancos");

  // Filter state
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedDiscountType, setSelectedDiscountType] = useState("");
  const [selectedDay, setSelectedDay] = useState("");

  if (promoId) {
    return <PromotionDetailPage />;
  }

  // Queries with caching
  const { data: banks = [], isLoading: loadingBanks } = useQuery({
    queryKey: ["banks"],
    queryFn: async () => {
      const result = await getBanksAction();
      return result?.data ?? [];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const { data: provinces = [], isLoading: loadingProvinces } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const result = await getProvincesAction();
      return result?.data ?? [];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  // Infinite Queries
  const {
    data: bankPromosData,
    fetchNextPage: fetchNextBankPromos,
    hasNextPage: hasNextBankPromos,
    isFetchingNextPage: isFetchingNextBankPromos,
    isLoading: loadingBankPromos,
  } = useInfiniteQuery({
    queryKey: ["bankPromotions", selectedProvince, selectedBank, selectedDay],
    queryFn: async ({ pageParam = 0 }) => {
      const dayMap: Record<string, string> = {
        Lunes: "monday",
        Martes: "tuesday",
        Miércoles: "wednesday",
        Jueves: "thursday",
        Viernes: "friday",
        Sábado: "saturday",
        Domingo: "sunday",
      };
      const result = await getBankPromotionsAction({
        ...(selectedProvince ? { provinceId: selectedProvince } : {}),
        ...(selectedBank ? { bankId: selectedBank } : {}),
        ...(selectedDay ? { day: dayMap[selectedDay] } : {}),
        limit: 20,
        offset: pageParam,
      });
      const raw = (result?.data as any) ?? result;
      if (raw && Array.isArray(raw.items)) return raw.items;
      if (Array.isArray(raw)) return raw;
      return [];
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 20 ? allPages.length * 20 : undefined;
    },
    initialPageParam: 0,
    staleTime: 1000 * 60 * 10,
  });

  const {
    data: profPromosData,
    fetchNextPage: fetchNextProfPromos,
    hasNextPage: hasNextProfPromos,
    isFetchingNextPage: isFetchingNextProfPromos,
    isLoading: loadingProfPromos,
  } = useInfiniteQuery({
    queryKey: ["profPromotions", selectedProvince, selectedDiscountType],
    queryFn: async ({ pageParam = 0 }) => {
      const result = await getProfessionalPromotionsAction({
        ...(selectedProvince ? { provinceId: selectedProvince } : {}),
        limit: 20,
        offset: pageParam,
      });
      const raw = (result?.data as any) ?? result;
      if (raw && Array.isArray(raw.items)) return raw.items;
      if (Array.isArray(raw)) return raw;
      return [];
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 20 ? allPages.length * 20 : undefined;
    },
    initialPageParam: 0,
    staleTime: 1000 * 60 * 10,
  });

  const loading =
    loadingBanks || loadingProvinces || loadingBankPromos || loadingProfPromos;

  // Infinite scroll observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (
            activeTab === "bancos" &&
            hasNextBankPromos &&
            !isFetchingNextBankPromos
          ) {
            fetchNextBankPromos();
          } else if (
            activeTab === "promos" &&
            hasNextProfPromos &&
            !isFetchingNextProfPromos
          ) {
            fetchNextProfPromos();
          }
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [
    activeTab,
    hasNextBankPromos,
    isFetchingNextBankPromos,
    fetchNextBankPromos,
    hasNextProfPromos,
    isFetchingNextProfPromos,
    fetchNextProfPromos,
  ]);

  // Flattened data
  const bankPromotions = bankPromosData?.pages.flat() || [];
  const profPromotions = profPromosData?.pages.flat() || [];

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

  const clearFilters = () => {
    setSelectedProvince("");
    setSelectedBank("");
    setSelectedDiscountType("");
    setSelectedDay("");
  };

  const filteredBankDiscounts = bankPromotions.filter((d) => {
    if (selectedProvince) {
      const provId = Number(selectedProvince);
      const matchesDirect = d.province_id === provId;
      const matchesCompany = d.Professional?.Company?.some(
        (c: any) =>
          c.company_provinces?.some((cp: any) => cp.province_id === provId) ||
          c.CompanyProvinces?.some((cp: any) => cp.province_id === provId),
      );
      const matchesAddress = d.Professional?.address?.some(
        (a: any) => a.province_id === provId,
      );
      if (!matchesDirect && !matchesCompany && !matchesAddress) return false;
    }
    if (selectedBank) {
      const bankIds = getPromoBankIds(d).map((id) => id.toString());
      if (!bankIds.includes(selectedBank)) return false;
    }
    if (selectedDay && !checkPromoDay(d, selectedDay)) return false;
    return true;
  });

  const filteredPromotions = profPromotions.filter((p) => {
    if (selectedProvince) {
      const provId = Number(selectedProvince);
      // Check if it matches the direct province_id or any of the company's provinces
      const matchesDirect = (p as any).province_id === provId;
      const matchesCompany = (p.Professional as any)?.Company?.some(
        (c: any) =>
          c.company_provinces?.some((cp: any) => cp.province_id === provId) ||
          c.CompanyProvinces?.some((cp: any) => cp.province_id === provId),
      );
      const matchesAddress = (p.Professional as any)?.address?.some(
        (a: any) => a.province_id === provId,
      );

      if (!matchesDirect && !matchesCompany && !matchesAddress) return false;
    }
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

  const handleProfileClick = (
    e: React.MouseEvent,
    id: string,
    seoPath?: string | null,
  ) => {
    e.stopPropagation();
    router.push(getProfilePath(id, seoPath));
  };

  return (
    <div className="promotions-page-wrapper">
      <SEO
        title="Promociones y Descuentos Exclusivos"
        description="Ahorrá con los mejores descuentos bancarios y promociones de profesionales. Beneficios exclusivos en todos los rubros."
      />
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

          {activeTab === "bancos" && (
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
          )}

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

          <button className="clear-filters-btn" onClick={clearFilters}>
            <X size={18} />
            <span>Limpiar Filtros</span>
          </button>
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
                  onClick={() => {
                    const slug = discount.description
                      ? discount.description
                          .trim()
                          .toLowerCase()
                          .replace(/\s+/g, "-")
                      : `promocion-bancaria-${discount.id}`;
                    router.push(
                      `/promociones-bancarias/${slug}?id=${discount.id}`,
                    );
                  }}
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
                            "--promo-bg": `url(${
                              discount.Professional?.Profile?.portfolio_image_url ||
                              "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600"
                            })`
                          } as React.CSSProperties}
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
                                  (discount.Professional as any)?.seo_path,
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
                                {discount.Professional?.Company?.[0]?.name ||
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
                            {discount.installments != null && discount.installments > 0 && (
                              <div className="promo-installments-badge">
                                <span className="promo-installments-num">
                                  {discount.installments} cuotas
                                </span>
                                <span className={`promo-interest-label ${discount.with_interest === false ? 'no-interest' : 'with-interest'}`}>
                                  {discount.with_interest === false ? 'sin interés' : 'con interés'}
                                </span>
                              </div>
                            )}
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
                  onClick={() => {
                    const slug = promo.title
                      ? promo.title.trim().toLowerCase().replace(/\s+/g, "-")
                      : `promo-${promo.id}`;
                    router.push(`/promociones/${slug}?id=${promo.id}`);
                  }}
                >
                  <div
                    className="promo-card-image"
                    style={{ '--promo-bg': `url(${promo.image_url || "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=600"})` } as React.CSSProperties}
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
                            (promo.Professional as any)?.seo_path,
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

            {/* sentinel for infinite scroll */}
            <div ref={loadMoreRef} className="promo-sentinel">
              {(isFetchingNextBankPromos || isFetchingNextProfPromos) && (
                <div className="promo-fetching-next">
                  <Loader2 size={24} className="animate-spin" />
                  <span>Cargando m&#225;s...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
