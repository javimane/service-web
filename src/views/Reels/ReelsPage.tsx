"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  Play,
  Pause,
  Heart,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Sparkles,
  MapPin,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getReelsAction, updateReelStatsAction, upsertReelLikeAction, getReelDetailAction } from "../../app/actions/reels";
import { getProvincesAction } from "@/app/actions/provinces";
import { getSubscriptionByProfessionalAction } from "@/app/actions/subscriptions";
import type { ProfessionalReelRow } from "../../types/database.types";
import { getProfilePath } from "../../utils/utils";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import SEO from "../../components/SEO/SEO";
import Pagination from "../../components/Pagination/Pagination";
import { useAuth } from "../../context/AuthContext";
import { useAuthModal } from "../../context/AuthModalContext";
import { getAccessToken } from "../../utils/auth";
import "./ReelsPage.css";

import ReelsTheaterModal from "../../components/ReelsTheater/ReelsTheaterModal";
import ReelCard from "../../components/Cards/ReelCard";

export default function ReelsPage() {
  const router = useRouter();
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>("All");
  const [selectedReelIndex, setSelectedReelIndex] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const LIMIT = 12;

  const [initialSeoPath, setInitialSeoPath] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/reels/') && path.length > 7) {
        setInitialSeoPath(path.replace('/reels/', '').split('/')[0]);
      }
    }
  }, []);

  // Fetch provinces
  const { data: provinces = [] } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const result = await getProvincesAction();
      return result?.data ?? [];
    },
    staleTime: 1000 * 60 * 60 * 24,
  });

  // Fetch Reels (paginated)
  const { data: reelsPaginated, isLoading: isLoadingReels } = useQuery({
    queryKey: ["all-reels-view", selectedProvinceId, page],
    queryFn: async () => {
      const provinceId =
        selectedProvinceId === "All" ? undefined : Number(selectedProvinceId);
      const result = await getReelsAction({ provinceId, page, limit: LIMIT });
      const raw = (result?.data as any) ?? result;
      // Support both paginated { items, ... } and plain array responses
      if (raw && raw.items) return raw as { items: ProfessionalReelRow[]; page: number; totalPages: number; hasPrev: boolean; hasNext: boolean; total: number };
      return { items: (raw as ProfessionalReelRow[]) ?? [], page: 1, totalPages: 1, hasPrev: false, hasNext: false, total: 0 };
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: initialReel, isLoading: isLoadingInitialReel } = useQuery({
    queryKey: ["reel-detail", initialSeoPath],
    queryFn: async () => {
      if (!initialSeoPath) return null;
      try {
        const result = await getReelDetailAction({ id: initialSeoPath });
        return (result?.data as ProfessionalReelRow) ?? result;
      } catch (e) {
        return null;
      }
    },
    enabled: !!initialSeoPath,
  });

  const reels = reelsPaginated?.items ?? [];
  const totalPages = reelsPaginated?.totalPages ?? 1;
  const hasPrev = reelsPaginated?.hasPrev ?? false;
  const hasNext = reelsPaginated?.hasNext ?? false;

  // Reset to page 1 when province filter changes
  const handleProvinceChange = (value: string) => {
    setSelectedProvinceId(value);
    setPage(1);
    setSelectedReelIndex(null);
  };

  // Extract unique professional IDs
  const professionalIds = useMemo<number[]>(() => {
    const ids = reels.map((r) => r.professional_id).filter(Boolean);
    if (initialReel?.professional_id) {
      ids.push(initialReel.professional_id);
    }
    return [...new Set(ids)];
  }, [reels, initialReel]);

  // Fetch subscriptions for each professional
  const subscriptionQueries = useQueries({
    queries: professionalIds.map((id) => ({
      queryKey: ["professional-subscription-reels-page", id],
      queryFn: async () => {
        const result = await getSubscriptionByProfessionalAction({
          professionalId: id,
        });
        return result?.data ?? null;
      },
      staleTime: 1000 * 60 * 5,
    })),
  });

  const subscriptionsMap = useMemo(() => {
    const map: Record<string | number, any> = {};
    subscriptionQueries.forEach((query, index) => {
      const professionalId = professionalIds[index];
      if (query.data && professionalId !== undefined) {
        map[professionalId] = (query.data as any).data ?? query.data;
      }
    });
    return map;
  }, [subscriptionQueries, professionalIds]);

  const isLoading =
    isLoadingReels || isLoadingInitialReel || subscriptionQueries.some((q) => q.isLoading);

  // Process and sort: Premium/Featured first
  const processedReels = useMemo(() => {
    return [...reels].sort((a, b) => {
      const aSub = subscriptionsMap[a.professional_id];
      const bSub = subscriptionsMap[b.professional_id];
      const aPremium = aSub?.type === "premium" || aSub?.is_premium ? 1 : 0;
      const bPremium = bSub?.type === "premium" || bSub?.is_premium ? 1 : 0;
      return bPremium - aPremium;
    });
  }, [reels, subscriptionsMap]);

  const finalReels = useMemo(() => {
    let list = [...processedReels];
    if (initialReel) {
      const exists = list.some((r) => String(r.id) === String(initialReel.id));
      if (!exists) {
        list.unshift(initialReel as ProfessionalReelRow);
      }
    }
    return list;
  }, [processedReels, initialReel]);

  // Auto open the initial reel once loaded
  useEffect(() => {
    if (initialSeoPath && !isLoadingReels && !isLoadingInitialReel && finalReels.length > 0) {
      const index = finalReels.findIndex(
        (r) => r.seo_path === initialSeoPath || r.id?.toString() === initialSeoPath
      );
      if (index !== -1) {
        setSelectedReelIndex(index);
        setInitialSeoPath(null); // prevent re-opening on close
      }
    }
  }, [initialSeoPath, isLoadingReels, isLoadingInitialReel, finalReels]);

  return (
    <>
      <SEO
        title="Reels Profesionales - Cercio"
        description="Explorá videos cortos y creativos de profesionales locales en Cercio. Mirá sus trabajos, técnicas y proyectos en acción."
      />
      <Navbar />

      <main className="reels-view-page">
        {/* Hero Section */}
        <section className="reels-hero">
          <div className="reels-container">
            <div className="reels-hero__content">
              <div className="reels-hero__sparkle">
                <Sparkles size={20} className="text-coral reels-hero__sparkle-icon" />
                <span>Sercio Reels</span>
              </div>
              <h1 className="reels-hero__title">
                Inspiración en <span className="text-coral">Movimiento</span>
              </h1>
              <p className="reels-hero__subtitle">
                Descubrí el talento local a través de videos cortos y creativos. Conectá directamente con profesionales en acción y tus comerciantes preferidos.
              </p>

              {/* Province Selector */}
              <div className="reels-hero__filter">
                <div className="reels-filter-box">
                  <MapPin size={18} className="reels-filter-icon" />
                  <select
                    value={selectedProvinceId}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="reels-filter-select"
                  >
                    <option value="All">Todas las provincias</option>
                    {provinces.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="reels-content">
          <div className="reels-container">
            {isLoading ? (
              <div className="reels-page-loading">
                <Loader2 className="animate-spin text-coral" size={48} />
                <p>Cargando reels del talento local...</p>
              </div>
            ) : processedReels.length === 0 ? (
              <div className="reels-page-empty">
                <div className="reels-page-empty__icon-wrapper">
                  <Sparkles size={48} className="text-coral" />
                </div>
                <h2>¿No encontrás reels?</h2>
                <p>Aún no hay videos subidos en la provincia seleccionada. ¡Volvé a consultar pronto!</p>
                <button
                  className="reels-reset-btn"
                  onClick={() => setSelectedProvinceId("All")}
                >
                  Ver todas las provincias
                </button>
              </div>
            ) : (
              <>
                <div className="reels-grid">
                  {finalReels.map((reel, index) => {
                    const sub = subscriptionsMap[reel.professional_id];
                    const isPremium = sub?.type === "premium" || sub?.is_premium;
                    return (
                      <ReelCard
                        key={String(reel.id)}
                        reel={reel}
                        isPremium={!!isPremium}
                        onClick={() => setSelectedReelIndex(index)}
                      />
                    );
                  })}
                </div>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  hasPrev={hasPrev}
                  hasNext={hasNext}
                  onPrev={() => { setPage((p) => p - 1); setSelectedReelIndex(null); }}
                  onNext={() => { setPage((p) => p + 1); setSelectedReelIndex(null); }}
                  onPage={(p) => { setPage(p); setSelectedReelIndex(null); }}
                />
              </>
            )}
          </div>
        </section>

        {/* Full-Screen Theater Modal */}
        {/* Full-Screen Theater Modal */}
        {selectedReelIndex !== null && (
          <ReelsTheaterModal
            reels={finalReels}
            initialIndex={selectedReelIndex}
            onClose={() => setSelectedReelIndex(null)}
            isPremiumMap={Object.fromEntries(
              Object.entries(subscriptionsMap).map(([id, sub]: any) => [
                id,
                sub?.type === "premium" || sub?.is_premium,
              ])
            )}
          />
        )}
      </main>

      <Footer />
    </>
  );
}
