"use client";
import { useState, useRef, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { extractIdFromSlug, getProfilePath } from "../../utils/utils";
import { useAuth } from "../../context/AuthContext";
import { useAlert } from "../../context/AlertContext";
import { supabase } from "../../services/supabaseClient";
import {
  Star,
  MessageCircle,
  Phone,
  ArrowUpRight,
  Loader2,
  Play,
  Heart,
  Eye,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  ShoppingBag,
  MapPin,
  Clock,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ROUTES } from "../../routes/paths";
import {
  getProfessionalDetailAction,
  getCompanyLocationsAction,
} from "../../app/actions/professionals";
import { getServicesByProfessionalAction } from "../../app/actions/services";
import { getAvailabilityByProfessionalAction } from "../../app/actions/availability";
import {
  getImagesByProfessionalAction,
  getVideosByProfessionalAction,
  upsertVideoLikeAction,
  incrementVideoViewsAction,
} from "../../app/actions/multimedia";
import { getReelsAction, updateReelStatsAction } from "../../app/actions/reels";
import { getProvincesAction } from "../../app/actions/provinces";
import { getProfessionalReviewsAction } from "../../app/actions/reviews";
import ReviewModal from "./sections/ReviewModal";
import { useAuthModal } from "../../context/AuthModalContext";
import { getAccessToken } from "../../utils/auth";
import { getPromotionsByProfessionalAction } from "../../app/actions/professionalPromotions";
import { getBankPromotionsAction } from "../../app/actions/bankPromotions";
import { getProductsByProfessionalAction } from "../../app/actions/products";
import TestimonialCard from "./sections/TestimonialCard";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import Modal from "../../components/Modal/Modal";
import PaymentMethodsCard from "../../components/Cards/PaymentMethodsCard";
import BankPromosCard from "../../components/Cards/BankPromosCard";
import SEO from "../../components/SEO/SEO";
import "./ProfilePage.css";
import ProductCard from "../../components/Cards/ProductCard";
import PromotionDetailModal from "../../components/Modals/PromotionDetailModal";
import ProfileServiceDetailModal from "./sections/ProfileServiceDetailModal";
import { ChevronLeft, ChevronRight } from "lucide-react";

import ReelCard from "../../components/Cards/ReelCard";
import ReelsTheaterModal from "../../components/ReelsTheater/ReelsTheaterModal";
import { Share2 } from "lucide-react";

// Custom hook for drag-to-scroll
function useDraggableScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const onMouseDown = (e) => {
    if (!ref.current) return;
    setIsDragging(true);
    setStartX(e.pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
  };

  const onMouseLeave = () => setIsDragging(false);
  const onMouseUp = () => setIsDragging(false);

  const onMouseMove = (e) => {
    if (!isDragging || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX) * 2;
    ref.current.scrollLeft = scrollLeft - walk;
  };

  return {
    ref,
    isDragging,
    events: {
      onMouseDown,
      onMouseLeave,
      onMouseUp,
      onMouseMove,
    },
  };
}

function ProfileVideoCard({
  video,
  onSelect,
  onLike,
}: {
  video: any;
  onSelect: (v: any) => void;
  onLike?: (video: any, e: React.MouseEvent) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike?.(video, e);
  };

  const professional = video.professional || video.Professional;
  const profile = professional?.Profile || professional?.profile;
  const companies = professional?.companies || professional?.Companies || [];
  const company = Array.isArray(companies) ? companies[0] : companies;
  const companyName = company?.name;
  const displayName = companyName || profile?.display_name || "Profesional";
  const avatar = profile?.avatar_url || `/foto-perfil.png`;
  const professionalId = video.professional_id || professional?.id;

  const router = useRouter();
  const { showSuccess } = useAlert();

  const handleProfessionalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(getProfilePath(professionalId, professional?.seo_path));
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const seoPath = professional?.seo_path || video.seo_path;
    const cleanSeo = seoPath
      ? seoPath.startsWith("/")
        ? seoPath
        : `/${seoPath}`
      : `/perfil/${professionalId}`;
    const basePath = cleanSeo.startsWith("/perfil")
      ? cleanSeo
      : `/perfil${cleanSeo}`;
    const shareUrl = `${window.location.origin}${basePath}?video=${video.id}`;

    if (navigator.share) {
      navigator
        .share({
          title: video.title || "Video de Sercio",
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showSuccess("¡Enlace de compartir copiado al portapapeles!");
      });
    }
  };

  return (
    <div className="instagram-video-card">
      <div
        className="video-card__professional-header"
        onClick={handleProfessionalClick}
      >
        <img
          src={avatar}
          alt={displayName}
          className="video-card__professional-avatar"
        />
        <span className="video-card__professional-name">{displayName}</span>
      </div>
      <div
        className="video-wrapper"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => {
          incrementVideoViewsAction({ id: video.id });
          onSelect(video);
        }}
      >
        <video
          ref={videoRef}
          src={video.video_url}
          className="video-element"
          poster={video.thumbnail_url}
          playsInline
          loop
          muted
        />
        <div className="video-stats-overlay">
          <div className="stat" onClick={handleLike}>
            <Heart size={14} fill="white" />
            <span>{video.likes_count || 0}</span>
          </div>
          <div className="stat">
            <Eye size={14} fill="white" />
            <span>{video.views_count || 0}</span>
          </div>
        </div>
        <div className="play-hint-overlay">
          <Play size={32} fill="white" />
        </div>
      </div>

      <div className="video-content">
        <h3 className="video-title">{video.title}</h3>

        <button
          className="description-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>Descripción</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <div className={`video-description ${isExpanded ? "is-expanded" : ""}`}>
          <p>{video.description || "Sin descripción disponible."}</p>
        </div>

        <button
          type="button"
          className="video-card__share-btn"
          onClick={handleShare}
        >
          <Share2 size={14} /> Compartir
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const params = useParams<{ seoPath: string | string[] }>();
  // [...seoPath] catch-all returns an array, e.g. ["bodega-sa", "9"]
  const seoPathRaw = params?.seoPath;
  const seoPath = Array.isArray(seoPathRaw)
    ? seoPathRaw.join("/")
    : ((seoPathRaw as string) ?? "");
  // The professional ID is the last segment (numeric)
  const id = Array.isArray(seoPathRaw)
    ? seoPathRaw[seoPathRaw.length - 1]
    : extractIdFromSlug(seoPath);
  const rawId = id;
  const router = useRouter();
  const { showSuccess: showSuccessAlert } = useAlert();
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [isBankPromosModalOpen, setIsBankPromosModalOpen] = useState(false);
  const [isPromosModalOpen, setIsPromosModalOpen] = useState(false);
  const [selectedPromoForDetail, setSelectedPromoForDetail] =
    useState<any>(null);
  const [selectedServiceForDetail, setSelectedServiceForDetail] =
    useState<any>(null);
  const [selectedProductForDetail, setSelectedProductForDetail] =
    useState<any>(null);
  const [selectedReelIndex, setSelectedReelIndex] = useState<number | null>(
    null,
  );
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isReelsModalOpen, setIsReelsModalOpen] = useState(false);
  const [showScope, setShowScope] = useState(false);

  const { user } = useAuth();
  const { openAuth } = useAuthModal();
  const accessToken =
    typeof window !== "undefined"
      ? (localStorage.getItem("access_token") ?? undefined)
      : undefined;

  const handleVideoLike = async (video: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openAuth("login");
      return;
    }
    const token = getAccessToken();
    await upsertVideoLikeAction({ id: video.id, is_like: true, token });
  };

  const servicesScroll = useDraggableScroll();
  const videosScroll = useDraggableScroll();
  const reelsScroll = useDraggableScroll();
  const productsScroll = useDraggableScroll();
  const [showAllReels, setShowAllReels] = useState(false);
  const [showAllVideos, setShowAllVideos] = useState(false);

  const scrollContainer = (ref: any, direction: "left" | "right") => {
    if (ref.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      ref.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const { data: professional, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["professional-detail", id],
    queryFn: async () => {
      const result = await getProfessionalDetailAction({ id: id! });
      return result?.data ?? null;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["professional-services", id],
    queryFn: async () => {
      const result = await getServicesByProfessionalAction({
        professionalId: id!,
      });
      return result?.data ?? [];
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30,
  });

  const { data: images = [] } = useQuery({
    queryKey: ["professional-images", id],
    queryFn: async () => {
      const result = await getImagesByProfessionalAction({
        professionalId: Number(id),
      });
      return result?.data ?? [];
    },
    enabled: !!id && !isNaN(Number(id)),
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30,
  });

  const { data: videos = [] } = useQuery({
    queryKey: ["professional-videos", id],
    queryFn: async () => {
      const result = await getVideosByProfessionalAction({
        professionalId: Number(id),
      });
      return result?.data ?? [];
    },
    enabled: !!id && !isNaN(Number(id)),
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30,
  });

  const { data: profReels = [] } = useQuery({
    queryKey: ["professional-reels", id],
    queryFn: async () => {
      const result = await getReelsAction({ professionalId: Number(id) });
      const raw = (result?.data as any) ?? result;
      if (raw && raw.items) return raw.items;
      return (raw as any[]) ?? [];
    },
    enabled: !!id && !isNaN(Number(id)),
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 15,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["professional-reviews", id],
    queryFn: async () => {
      const result = await getProfessionalReviewsAction({
        professionalId: id!,
      });
      return result?.data ?? [];
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 15,
  });

  const { data: profPromotions = [] } = useQuery({
    queryKey: ["professional-promotions", id],
    queryFn: async () => {
      const result = await getPromotionsByProfessionalAction({
        professionalId: id!,
      });
      const raw = (result?.data as any) ?? result;
      if (raw && Array.isArray(raw.items)) return raw.items;
      if (Array.isArray(raw)) return raw;
      return [];
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30,
  });

  const { data: allBankPromos = [] } = useQuery({
    queryKey: ["all-bank-promotions", id],
    queryFn: async () => {
      const result = await getBankPromotionsAction({
        professionalId: Number(id),
      });
      const raw = (result?.data as any) ?? result;
      if (raw && Array.isArray(raw.items)) return raw.items;
      if (Array.isArray(raw)) return raw;
      return [];
    },
    enabled: !!id && !isNaN(Number(id)),
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["professional-products", id],
    queryFn: async () => {
      const result = await getProductsByProfessionalAction({
        professionalId: Number(id),
      });
      return result?.data ?? [];
    },
    enabled: !!id && !isNaN(Number(id)),
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30,
  });

  // Check if the authenticated user has ever chatted with this professional
  const { data: hasChattedWithProfessional = false } = useQuery({
    queryKey: ["has-chatted", user?.id, id],
    queryFn: async () => {
      if (!user?.id || !id) return false;
      // The professional's user_id is stored in professional.user_id
      const professionalUserId = professional?.user_id;
      if (!professionalUserId) return false;
      const { data, error } = await supabase
        .from("messages")
        .select("id")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${professionalUserId}),and(sender_id.eq.${professionalUserId},receiver_id.eq.${user.id})`,
        )
        .limit(1);
      if (error) return false;
      return (data?.length ?? 0) > 0;
    },
    enabled: !!user?.id && !!id && !!professional,
    staleTime: 1000 * 60 * 5,
  });

  const { data: provinces = [] } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const result = await getProvincesAction();
      return result?.data ?? [];
    },
    staleTime: 1000 * 60 * 60 * 24,
  });

  const { data: companyLocations } = useQuery({
    queryKey: ["company-locations", id],
    queryFn: async () => {
      const result = await getCompanyLocationsAction({ id: id! });
      return result?.data ?? null;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 60, // 1 hora
  });

  const { data: availability = [] } = useQuery({
    queryKey: ["professional-availability", id],
    queryFn: async () => {
      const result = await getAvailabilityByProfessionalAction({
        professionalId: Number(id),
      });
      return result?.data ?? [];
    },
    enabled: !!id && !isNaN(Number(id)),
    staleTime: 1000 * 60 * 60, // 1 hora
  });

  useEffect(() => {
    if (professional?.seo_path) {
      const currentPath = window.location.pathname;
      // seo_path from API is e.g. "/bodega-sa/9" — prefix with "/perfil"
      const rawSeo = professional.seo_path.startsWith("/")
        ? professional.seo_path
        : `/${professional.seo_path}`;
      const targetPath = `/perfil${rawSeo}`;

      if (
        currentPath !== targetPath &&
        !currentPath.includes(targetPath + "/")
      ) {
        router.replace(targetPath);
      }
    }
  }, [professional, router]);

  // Modal Deep Linking: Sync URL with modal state
  useEffect(() => {
    if (isLoadingProfile) return;
    if (typeof window === "undefined") return;

    const currentPath = window.location.pathname;
    const normalizePath = (path: string | null | undefined) => {
      if (!path) return "";
      const cleanPath = path.startsWith("/") ? path : `/${path}`;
      return `/perfil${cleanPath}`;
    };

    const basePath = professional?.seo_path
      ? normalizePath(professional.seo_path)
      : `/perfil/${rawId}`;

    if (currentPath === basePath) {
      setSelectedProductForDetail(null);
      setSelectedServiceForDetail(null);
      setSelectedPromoForDetail(null);
      return;
    }

    // Check products
    const matchedProduct = products.find((p) => {
      const pSeo = p.Product?.seo_path;
      return normalizePath(pSeo) === currentPath;
    });
    if (matchedProduct) {
      setSelectedProductForDetail(matchedProduct);
      return;
    }

    // Check services
    const matchedService = services.find(
      (s) => normalizePath(s.seo_path) === currentPath,
    );
    if (matchedService) {
      setSelectedServiceForDetail(matchedService);
      return;
    }

    // Check promotions
    const matchedPromo = profPromotions.find(
      (p: any) => normalizePath(p.seo_path) === currentPath,
    );
    if (matchedPromo) {
      setSelectedPromoForDetail({ ...matchedPromo, type: "prof" });
      return;
    }

    // Check videos
    const searchParams = new URLSearchParams(window.location.search);
    const videoId = searchParams.get("video");
    if (videoId && videos.length > 0) {
      const matchedVideo = videos.find((v) => v.id.toString() === videoId);
      if (matchedVideo) {
        setSelectedVideo(matchedVideo);
        return;
      }
    }
  }, [
    typeof window !== "undefined" ? window.location.pathname : "",
    typeof window !== "undefined" ? window.location.search : "",
    products,
    services,
    profPromotions,
    videos,
    isLoadingProfile,
    professional,
    rawId,
  ]);

  // Sync URL when a video is selected or closed
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (selectedVideo) {
        url.searchParams.set("video", selectedVideo.id.toString());
        window.history.replaceState(null, "", url.toString());
      } else if (url.searchParams.has("video")) {
        url.searchParams.delete("video");
        window.history.replaceState(null, "", url.toString());
      }
    }
  }, [selectedVideo]);

  const handleCloseModal = () => {
    const rawSeo = professional?.seo_path
      ? professional.seo_path.startsWith("/")
        ? professional.seo_path
        : `/${professional.seo_path}`
      : `/${rawId}`;
    router.push(`/perfil${rawSeo}`);
  };

  const getBankNames = (promo: any) => {
    const relationNames = (promo.bank_promotions_banks || [])
      .map((r: any) => r.Bank?.name)
      .filter(Boolean);
    if (relationNames.length > 0) return Array.from(new Set(relationNames));
    if (promo.Bank?.name) return [promo.Bank.name];
    return ["Banco"];
  };

  const profile = professional?.Profile;
  const company = professional?.Companies?.[0] || professional?.Company;
  const name = company?.name || profile?.display_name || "Profesional";
  const avatar =
    profile?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
  const isVerified =
    company?.companies_arca?.[0]?.is_verified || professional?.is_verified;
  const hasReels = profReels.length > 0;

  const addresses = Array.isArray(professional?.address)
    ? professional.address
    : Array.isArray(professional?.Address)
      ? professional.Address
      : company?.Address
        ? [company.Address]
        : [];

  const mainAddress =
    addresses.find((a: any) => a?.is_main_address) || addresses[0];
  const provinceName =
    provinces.find((p: any) => p.id === mainAddress?.province_id)?.name || "";

  const paymentMethods = useMemo(() => {
    if (!company) return [];
    const methods: Array<{ id: string; type: string; label: string }> = [];
    if (company.cash)
      methods.push({ id: "cash", type: "cash", label: "Efectivo" });
    if (company.credit)
      methods.push({ id: "credit", type: "credit", label: "Crédito" });
    if (company.debit)
      methods.push({ id: "debit", type: "credit", label: "Débito" });
    if (company.transfer)
      methods.push({ id: "transfer", type: "bank", label: "Transferencia" });
    if (company.cheque)
      methods.push({ id: "cheque", type: "bank", label: "Cheque" });
    return methods;
  }, [company]);

  const professionalSchema = useMemo(() => {
    if (!professional) return null;
    return {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      name: name,
      description: professional.bio || "Servicios profesionales",
      image: avatar,
      address: {
        "@type": "PostalAddress",
        addressLocality: company?.Address?.city,
        addressRegion: company?.Address?.Province?.name,
        addressCountry: "AR",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: professional.rating_avg || "5.0",
        reviewCount: reviews.length || "1",
      },
    };
  }, [professional, name, avatar, company, reviews]);

  if (isLoadingProfile) {
    return (
      <div className="profile-loading">
        <Loader2 className="animate-spin" size={48} />
        <p>Cargando perfil profesional...</p>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="profile-error">
        <h2>No se encontró el profesional</h2>
        <button onClick={() => window.history.back()}>Volver</button>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <SEO
        title={`${name} - ${professional.bio?.slice(0, 50) || "Profesional"}`}
        description={
          professional.bio ||
          `Conocé el perfil de ${name}, sus servicios, productos y opiniones de clientes.`
        }
        image={avatar}
        url={
          typeof window !== "undefined"
            ? window.location.href
            : professional.seo_path
              ? `/perfil${professional.seo_path.startsWith("/") ? professional.seo_path : `/${professional.seo_path}`}`
              : `/perfil/${rawId}`
        }
        schema={professionalSchema}
      />
      <Navbar />

      <main className="profile-page__layout container">
        {/* Left Sidebar */}
        <aside className="profile-sidebar">
          <div className="profile-sidebar__avatar-container">
            <div
              className={`avatar-frame ${hasReels ? "pulse-reel" : ""} ${isVerified ? "verified-ring" : ""}`}
              onClick={() => hasReels && setSelectedReelIndex(0)}
            >
              <img src={avatar} alt={name} className="avatar-image" />
              {isVerified && (
                <div className="verified-badge-premium">
                  <CheckCircle size={16} />
                </div>
              )}
              {hasReels && (
                <div className="reel-indicator">
                  <Play size={12} fill="currentColor" />
                </div>
              )}
            </div>
          </div>

          <div className="profile-sidebar__info">
            <h1 className="name">{name}</h1>
            <p className="title">
              {professional.specialty?.slice(0, 50) ||
                "Servicios Profesionales"}
            </p>
            {professional.professional_categories &&
              professional.professional_categories.length > 0 && (
                <div className="profile-sidebar__categories">
                  {professional.professional_categories.map((pc: any) => (
                    <span
                      key={pc.Category?.id}
                      className="profile-category-pill"
                    >
                      {pc.Category?.name}
                    </span>
                  ))}
                </div>
              )}
          </div>

          {mainAddress && (
            <div className="profile-sidebar__address-card">
              <h3 className="address-card__title">Ubicación</h3>
              <p className="address-card__text">
                {mainAddress.street_name} {mainAddress.street_number}
                {mainAddress.floor_apartment &&
                  `, Depto: ${mainAddress.floor_apartment}`}
              </p>
              <p className="address-card__subtext">{provinceName}</p>
              {mainAddress.latitude && mainAddress.longitude && (
                <button
                  type="button"
                  className="address-card__map-btn"
                  onClick={() =>
                    router.push(
                      `/mapa?lat=${mainAddress.latitude}&lng=${mainAddress.longitude}`,
                    )
                  }
                >
                  <MapPin size={14} /> Ver en el mapa
                </button>
              )}
            </div>
          )}

          <div
            className="profile-sidebar__availability-wrapper"
            style={{
              padding: "0 0 var(--space-4) 0",
              display: "flex",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <button
              type="button"
              className="address-card__map-btn"
              style={{
                width: "100%",
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-color)",
              }}
              onClick={() => setIsAvailabilityModalOpen(true)}
            >
              <Clock size={14} /> Ver horarios de atención
            </button>
          </div>

          <div className="profile-sidebar__stats">
            <div className="stat-item">
              <div className="stat-content">
                <Star size={14} className="stat-icon" />
                <span className="stat-value">
                  {professional.rating_avg || "5.0"}
                </span>
              </div>
              <span className="stat-label">CALIFICACIÓN</span>
            </div>
            <div className="stat-item">
              <div className="stat-content">
                <MessageCircle size={14} className="stat-icon" />
                <span className="stat-value">
                  {professional.completed_jobs || "0"}
                </span>
              </div>
              <span className="stat-label">TRABAJOS</span>
            </div>
            <div className="stat-item">
              <div className="stat-content">
                <span className="stat-value">
                  {professional.years_experience || "1"}a
                </span>
              </div>
              <span className="stat-label">EXP.</span>
            </div>
          </div>

          {profile?.website && (
            <div className="profile-sidebar__social">
              <a
                href={profile.website}
                target="_blank"
                rel="noreferrer"
                className="website-link"
              >
                Página Web <ArrowUpRight size={14} />
              </a>
            </div>
          )}

          <PaymentMethodsCard methods={paymentMethods} />

          <BankPromosCard
            promotions={allBankPromos}
            onOpenPromos={() => setIsBankPromosModalOpen(true)}
          />

          {profPromotions.length > 0 && (
            <button
              className="cta-button promos-btn"
              onClick={() => setIsPromosModalOpen(true)}
            >
              VER PROMOCIONES SEMANALES <Star size={18} />
            </button>
          )}

          <button
            className="cta-button message-btn"
            onClick={() => {
              const msg = `Hola, te contacto desde tu perfil profesional.`;
              const encodedMsg = encodeURIComponent(msg);
              router.push(`/mensajes?to=${rawId}&initialMessage=${encodedMsg}`);
            }}
          >
            ENVIAR MENSAJE <MessageCircle size={18} />
          </button>

          {/* Review Button — only for authenticated users who've chatted with this professional */}
          {user && hasChattedWithProfessional && (
            <button
              id="leave-review-btn"
              className="cta-button review-btn"
              onClick={() => setIsReviewModalOpen(true)}
            >
              DEJAR UNA OPINIÓN <Star size={18} />
            </button>
          )}

          {products.length > 0 && (
            <button
              className="cta-button store-btn"
              onClick={() => {
                const seo = professional?.seo_path
                  ? professional.seo_path.startsWith("/")
                    ? professional.seo_path
                    : `/${professional.seo_path}`
                  : `/${rawId}`;
                router.push(`/perfil${seo}/tienda`);
              }}
            >
              INGRESAR A LA TIENDA <ShoppingBag size={18} />
            </button>
          )}
        </aside>

        {/* Right Content */}
        <section className="profile-content">
          <header className="profile-content__header">
            <div className="location-info">
              <span>Descripción</span>
            </div>
            <p className="bio">
              {professional.bio || "Sin biografía disponible."}
            </p>

            {companyLocations && (
              <div className="scope-of-work">
                <button
                  type="button"
                  className="scope-toggle-btn"
                  onClick={() => setShowScope(!showScope)}
                >
                  <MapPin size={16} />
                  <span>
                    {showScope
                      ? "Ocultar alcance de cobertura"
                      : "Ver alcance de cobertura"}
                  </span>
                </button>
                {showScope && (
                  <div className="scope-grid mt-4">
                    {companyLocations.provinces?.map((p: any) => {
                      const provinceId = p.Province?.id;
                      const provinceDepartments =
                        companyLocations.departments?.filter(
                          (d: any) => d.Department?.province_id === provinceId,
                        );

                      return (
                        <div key={provinceId} className="scope-province">
                          <div className="province-header">
                            <MapPin size={14} />
                            <strong>{p.Province?.name}</strong>
                          </div>
                          <div className="departments-list">
                            {provinceDepartments &&
                            provinceDepartments.length > 0 ? (
                              provinceDepartments.map((d: any) => (
                                <span
                                  key={d.Department?.id}
                                  className="dept-tag"
                                >
                                  {d.Department?.name}
                                </span>
                              ))
                            ) : (
                              <span className="all-province">
                                Toda la provincia
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </header>

          <div className="profile-section">
            <div className="section-header">
              <h2>PORTAFOLIO</h2>
              <button
                onClick={() => setIsPortfolioModalOpen(true)}
                className="ver-todo"
              >
                VER TODO
              </button>
            </div>
            <div className="portfolio-grid">
              {images.slice(0, 8).map((img, idx) => (
                <div key={img.id} className="portfolio-item">
                  <img src={img.image_url} alt={img.caption || `Work ${idx}`} />
                </div>
              ))}
              {images.length === 0 && (
                <p className="empty-msg">No hay imágenes en el portafolio.</p>
              )}
            </div>
          </div>

          {/* Promociones y Promos Bancarias se movieron a Modals para experiencia flotante */}

          <div className="profile-section">
            <div className="section-header">
              <h2>SERVICIOS</h2>
              <div className="section-header__actions">
                <div className="carousel-nav">
                  <button
                    onClick={() => scrollContainer(servicesScroll.ref, "left")}
                    className="nav-btn"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => scrollContainer(servicesScroll.ref, "right")}
                    className="nav-btn"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                <button
                  onClick={() => setIsServicesModalOpen(true)}
                  className="ver-todo"
                >
                  VER TODO
                </button>
              </div>
            </div>
            <div
              className={`services-scroll-container ${servicesScroll.isDragging ? "dragging" : ""}`}
              ref={servicesScroll.ref}
              {...servicesScroll.events}
            >
              <div className="services-scroll">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="service-card-mini"
                    onClick={() => {
                      if (!servicesScroll.isDragging) {
                        const slug = service.name
                          ? service.name
                              .trim()
                              .toLowerCase()
                              .replace(/\s+/g, "-")
                          : `service-${service.id}`;
                        router.push(`/servicios/${slug}?id=${service.id}`);
                      }
                    }}
                  >
                    <div className="service-card-mini__header">
                      <h3>{service.name}</h3>
                      <span className="price">
                        ${service.base_price?.toLocaleString()}
                      </span>
                    </div>
                    <p>{service.description}</p>
                  </div>
                ))}
                {services.length === 0 && (
                  <p className="empty-msg">No hay servicios disponibles.</p>
                )}
              </div>
            </div>
          </div>

          {videos.length > 0 && (
            <div className="profile-section">
              <div className="section-header">
                <h2>VIDEOS PROFESIONALES</h2>
                <button
                  className="ver-todo"
                  onClick={() => setShowAllVideos(!showAllVideos)}
                >
                  {showAllVideos ? "VER MENOS" : "VER TODOS"}
                </button>
              </div>
              <div
                className={`profile-videos-carousel ${videosScroll.isDragging ? "dragging" : ""}`}
                ref={videosScroll.ref}
                {...videosScroll.events}
              >
                {(showAllVideos ? videos : videos.slice(0, 6)).map((video) => (
                  <div key={video.id} className="profile-video-carousel-item">
                    <ProfileVideoCard
                      video={video}
                      onSelect={setSelectedVideo}
                      onLike={handleVideoLike}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="profile-section">
            <div className="section-header">
              <h2>OPINIONES</h2>
            </div>
            <div className="testimonials-grid">
              {reviews.map((review) => (
                <TestimonialCard
                  key={review.id}
                  name={review.Profile?.display_name || "Usuario"}
                  photo={review.Profile?.avatar_url}
                  text={review.comment}
                  rating={review.rating}
                  commentPhoto={review.image_url}
                />
              ))}
              {reviews.length === 0 && (
                <div className="empty-reviews">
                  <p>Todavía este profesional/comercio no tiene opiniones.</p>
                </div>
              )}
            </div>
          </div>

          {products.length > 0 && (
            <div className="profile-section">
              <div className="section-header">
                <h2>CATÁLOGO DE PRODUCTOS</h2>
                <button
                  className="ver-todo"
                  onClick={() => {
                    const seo = professional?.seo_path
                      ? professional.seo_path.startsWith("/")
                        ? professional.seo_path
                        : `/${professional.seo_path}`
                      : `/${rawId}`;
                    router.push(`/perfil${seo}/tienda`);
                  }}
                >
                  VER TODOS
                </button>
              </div>
              <div
                className={`products-scroll-container ${productsScroll.isDragging ? "dragging" : ""}`}
                ref={productsScroll.ref}
                {...productsScroll.events}
              >
                <div className="products-scroll">
                  {products.slice(0, 20).map((product) => (
                    <div
                      key={product.id}
                      className="product-card-carousel-item"
                    >
                      <ProductCard
                        product={product}
                        onOpenDetail={(p) => {
                          const pSeo =
                            p.seo_path || (p.Product && p.Product.seo_path);
                          if (pSeo) {
                            const target = `/productos${pSeo}`;
                            router.push(target);
                          } else {
                            setSelectedProductForDetail(p);
                          }
                        }}
                        variant="small"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Modals */}
      <Modal
        isOpen={isPortfolioModalOpen}
        onClose={() => setIsPortfolioModalOpen(false)}
        title="Galería Completa"
      >
        <div className="modal-portfolio-grid">
          {images.map((img) => (
            <img
              key={img.id}
              src={img.image_url}
              alt={img.caption || "Portafolio"}
              className="modal-image"
            />
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={isServicesModalOpen}
        onClose={() => setIsServicesModalOpen(false)}
        title="Todos los Servicios"
      >
        <div className="modal-services-list">
          {services.map((service) => (
            <div key={service.id} className="service-card-compact">
              <div className="service-info">
                <h3>{service.name}</h3>
                <p>{service.description}</p>
              </div>
              <span className="service-price">
                ${service.base_price?.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={isBankPromosModalOpen}
        onClose={() => setIsBankPromosModalOpen(false)}
        title="Promociones Bancarias"
      >
        <div className="modal-bank-promos-grid">
          {allBankPromos.map((promo) => {
            const bankNames = getBankNames(promo);
            return (
              <div
                key={promo.id}
                className="bank-promo-card-premium"
                onClick={() => {
                  const path = promo.seo_path
                    ? promo.seo_path.replace(/^\/+/, "")
                    : "promo";
                  router.push(`/promociones-bancarias/${path}`);
                }}
              >
                <div className="bank-promo-header">
                  <div className="bank-names-stack">
                    {bankNames.map((bn: any) => (
                      <span key={bn} className="bank-name-badge">
                        {bn}
                      </span>
                    ))}
                  </div>
                  <span className="discount-circle">
                    {promo.percentaje_discount}%
                  </span>
                </div>
                <p className="description">{promo.description}</p>
                <div className="bank-promo-footer">
                  <span>Reintegro: ${promo.refund || "Sin tope"}</span>
                  <span className="days">
                    {[
                      promo.monday && "L",
                      promo.tuesday && "M",
                      promo.wednesday && "M",
                      promo.thursday && "J",
                      promo.friday && "V",
                      promo.saturday && "S",
                      promo.sunday && "D",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </span>
                </div>
              </div>
            );
          })}
          {allBankPromos.length === 0 && (
            <p className="empty-msg">No hay promociones bancarias vigentes.</p>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isPromosModalOpen}
        onClose={() => setIsPromosModalOpen(false)}
        title="Ofertas Especiales"
      >
        <div className="modal-promotions-grid">
          {profPromotions.map((promo) => (
            <div
              key={promo.id}
              className="promo-card-premium"
              onClick={() => {
                if (promo.seo_path) {
                  router.push(`/promociones${promo.seo_path}`);
                } else {
                  router.push(`/promociones/promo?id=${promo.id}`);
                }
              }}
            >
              {promo.image_url && (
                <img
                  src={promo.image_url}
                  alt={promo.title}
                  className="promo-img"
                />
              )}
              <div className="promo-info">
                <span className="promo-badge">
                  {promo.discount_type === "percentage"
                    ? `${promo.discount_value}% OFF`
                    : `$${promo.discount_value} OFF`}
                </span>
                <h3>{promo.title}</h3>
                <p>{promo.description}</p>
                {promo.expires_at && (
                  <span className="expires">
                    Expira: {new Date(promo.expires_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
          {profPromotions.length === 0 && (
            <p className="empty-msg">
              No hay promociones vigentes en este momento.
            </p>
          )}
        </div>
      </Modal>

      {/* Reels Modal */}
      <Modal
        isOpen={isReelsModalOpen}
        onClose={() => setIsReelsModalOpen(false)}
        title="Reels del Profesional"
      >
        <div className="modal-reels-grid">
          {profReels.map((reel, index) => (
            <ReelCard
              key={reel.id}
              reel={reel}
              isPremium={isVerified}
              onClick={() => {
                setSelectedReelIndex(index);
                setIsReelsModalOpen(false);
              }}
            />
          ))}
        </div>
      </Modal>

      {/* Unified Promotion Detail Modal */}
      <PromotionDetailModal
        promo={selectedPromoForDetail}
        isOpen={!!selectedPromoForDetail}
        onClose={handleCloseModal}
      />

      {/* Reel Modal Overlay */}
      {selectedReelIndex !== null && (
        <ReelsTheaterModal
          reels={profReels.map((r: any) => ({
            ...r,
            professional: r.professional || professional,
          }))}
          initialIndex={selectedReelIndex}
          onClose={() => setSelectedReelIndex(null)}
        />
      )}

      {/* Video Modal Overlay */}
      {selectedVideo && (
        <div className="reel-overlay" onClick={() => setSelectedVideo(null)}>
          <div
            className="reel-modal-container video-expanded"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={selectedVideo.video_url}
              autoPlay
              controls
              className="reel-video-full"
            />
            <div className="video-expanded__info">
              <div className="video-expanded__header">
                <h3>{selectedVideo.title}</h3>
                <div
                  style={{ display: "flex", gap: "12px", alignItems: "center" }}
                >
                  <button
                    className="video-like-btn"
                    title="Compartir"
                    onClick={(e) => {
                      e.stopPropagation();
                      const professionalId =
                        selectedVideo.professional_id || id;
                      const basePath = window.location.pathname.includes(
                        "/perfil/",
                      )
                        ? window.location.pathname
                        : `/perfil/${seoPath}/${professionalId}`;
                      const shareUrl = `${window.location.origin}${basePath}?video=${selectedVideo.id}`;

                      if (navigator.share) {
                        navigator
                          .share({
                            title: selectedVideo.title || "Video de Sercio",
                            url: shareUrl,
                          })
                          .catch(() => {});
                      } else {
                        navigator.clipboard.writeText(shareUrl);
                        showSuccessAlert("Enlace copiado al portapapeles");
                      }
                    }}
                  >
                    <Share2 size={20} />
                  </button>
                  <button
                    className="video-like-btn"
                    title="Me gusta"
                    onClick={(e) => handleVideoLike(selectedVideo, e)}
                  >
                    <Heart size={20} />
                  </button>
                </div>
              </div>
              <p>{selectedVideo.description}</p>
            </div>
            <button
              className="reel-close"
              onClick={() => setSelectedVideo(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Service Detail Modal */}
      <ProfileServiceDetailModal
        service={selectedServiceForDetail}
        isOpen={!!selectedServiceForDetail}
        onClose={handleCloseModal}
        professionalId={id}
      />

      {/* Product Detail Modal */}
      {selectedProductForDetail && (
        <Modal
          isOpen={!!selectedProductForDetail}
          onClose={handleCloseModal}
          title="Detalle del Producto"
          maxWidth="500px"
        >
          <div className="profile-product-detail">
            <div className="product-detail-image-main">
              <img
                src={
                  selectedProductForDetail.images?.[0]?.image_url ||
                  selectedProductForDetail.image_url ||
                  "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80"
                }
                alt={selectedProductForDetail.name}
              />
            </div>
            <div className="product-detail-info">
              <h2 className="product-detail-title">
                {selectedProductForDetail.name}
              </h2>
              <div className="product-detail-pricing">
                {selectedProductForDetail.original_price && (
                  <span className="original-price">
                    ${selectedProductForDetail.original_price.toLocaleString()}
                  </span>
                )}
                <div className="current-price-row">
                  <span className="current-price">
                    ${selectedProductForDetail.price?.toLocaleString()}
                  </span>
                  {selectedProductForDetail.discount_percentage > 0 && (
                    <span className="discount-badge">
                      -{selectedProductForDetail.discount_percentage}% OFF
                    </span>
                  )}
                </div>
              </div>
              <div className="product-detail-description">
                <h4>Descripción</h4>
                <p>
                  {selectedProductForDetail.description ||
                    "Sin descripción disponible."}
                </p>
              </div>
              <button
                className="contact-professional-btn"
                onClick={() => {
                  router.push(`/messages?to=${rawId}`);
                  setSelectedProductForDetail(null);
                }}
              >
                <MessageCircle size={18} /> CONSULTAR AL PROFESIONAL
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Review Modal */}
      {user && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          professionalId={Number(id)}
          userId={user.id}
          token={accessToken}
          onSuccess={() => {
            // Invalidate reviews cache so the new one shows immediately
            setIsReviewModalOpen(false);
          }}
        />
      )}

      {/* Availability Modal */}
      <Modal
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
        title="Horarios de Atención"
        maxWidth="400px"
      >
        <div style={{ padding: "var(--space-4)" }}>
          {availability.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>
              El profesional no ha definido sus horarios de atención.
            </p>
          ) : (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)",
              }}
            >
              {availability
                .sort((a: any, b: any) => a.day_of_week - b.day_of_week)
                .map((slot: any) => {
                  const daysMap: Record<number, string> = {
                    1: "Lunes",
                    2: "Martes",
                    3: "Miércoles",
                    4: "Jueves",
                    5: "Viernes",
                    6: "Sábado",
                    7: "Domingo",
                  };
                  return (
                    <li
                      key={slot.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "12px",
                        background: "var(--bg-card)",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: "var(--weight-semibold)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {daysMap[slot.day_of_week] || `Día ${slot.day_of_week}`}
                      </span>
                      <span style={{ color: "var(--text-secondary)" }}>
                        {slot.start_time.slice(0, 5)} -{" "}
                        {slot.end_time.slice(0, 5)}
                      </span>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>
      </Modal>

      <Footer />
    </div>
  );
}
