"use client";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  MapPin,
  Star,
  MessageCircle,
  User,
  ArrowLeft,
  Loader2,
  Share2,
  CreditCard,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Briefcase,
} from "lucide-react";
import {
  getServiceDetailAction,
  getServicesAction,
  getServicesByProfessionalAction,
} from "../../app/actions/services";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import ServicePaymentModal from "./components/ServicePaymentModal";
import ProductInstallmentsModal from "../Products/components/ProductInstallmentsModal";
import FavoriteButton from "../../components/FavoriteButton/FavoriteButton";
import CommentsCarousel from "../../components/CommentsCarousel/CommentsCarousel";
import ServiceSlider from "../../components/ServiceSlider/ServiceSlider";
import { extractIdFromSlug, getProfilePath } from "../../utils/utils";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../context/AuthContext";
import { commerceService } from "../../services/commerceService";
import { addGuestCartItem } from "../../utils/guestCart";
import { calculateInstallmentFinancing } from "../../utils/installmentFinancing";
import WhatsAppContactButton from "../../components/WhatsAppContactButton/WhatsAppContactButton";
import "./ServiceDetailPage.css";

export default function ServiceDetailPage({
  initialData,
}: { initialData?: any } = {}) {
  const params = useParams<{ seoPath: string | string[] }>();
  const searchParams = useSearchParams();
  const seoPath = params?.seoPath;

  // Try to get ID from query param first, then from slug
  const queryId = searchParams?.get("id");
  const id = queryId || extractIdFromSlug(seoPath);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showSuccess: showSuccessAlert, showError } = useAlert();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isInstallmentsModalOpen, setIsInstallmentsModalOpen] = useState(false);
  const { data: commissionRates = [] } = useQuery({
    queryKey: ["public-marketplace-commissions"],
    queryFn: commerceService.publicCommissions,
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: service,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["service", seoPath, id],
    queryFn: async () => {
      const result = await getServiceDetailAction({ id: id! });
      return result?.data ?? null;
    },
    initialData: initialData ?? undefined,
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30,
  });

  // Safe extraction of service & professional data
  const svc = service as any;
  const professional = svc?.professional || svc?.Professional;
  const profile = professional?.profile || professional?.Profile;
  const company = professional?.companies?.[0] || professional?.Company;
  const professionalName =
    company?.name || profile?.display_name || "Profesional";
  const professionalId = service?.professional_id || professional?.id || "";
  const basePrice = Number(svc?.price ?? svc?.base_price ?? 0);

  const categoryId =
    service?.category_id ||
    svc?.categoryId ||
    svc?.category?.id ||
    svc?.CategoryService?.id ||
    svc?.Category?.id;
  const categoryName =
    svc?.CategoryService?.name ||
    svc?.category?.name ||
    (typeof svc?.category === "string" ? svc.category : undefined);

  // Query: Servicios Similares (misma categoría o recomendados)
  const { data: similarServicesData, isLoading: isLoadingSimilarServices } = useQuery({
    queryKey: ["similar-services", categoryId],
    queryFn: async () => {
      let result = await getServicesAction({
        categoryId: categoryId ? Number(categoryId) : undefined,
        limit: 20,
      });

      let items = Array.isArray(result?.data?.items)
        ? result.data.items
        : Array.isArray(result?.data)
          ? result.data
          : Array.isArray((result?.data as any)?.data)
            ? (result?.data as any).data
            : [];

      // Fallback si la categoría tiene pocos resultados
      if (items.length <= 1) {
        result = await getServicesAction({
          limit: 20,
        });
        items = Array.isArray(result?.data?.items)
          ? result.data.items
          : Array.isArray(result?.data)
            ? result.data
            : Array.isArray((result?.data as any)?.data)
              ? (result?.data as any).data
              : [];
      }

      return items;
    },
    enabled: Boolean(service?.id || id),
    staleTime: 1000 * 60 * 5,
  });

  // Query: Más Servicios del mismo Profesional
  const { data: professionalServicesData, isLoading: isLoadingProfessionalServices } = useQuery({
    queryKey: ["professional-services", professionalId],
    queryFn: async () => {
      if (!professionalId) return [];
      const result = await getServicesByProfessionalAction({
        professionalId: professionalId,
        limit: 20,
      });
      const rawData = result?.data as any;
      const list = Array.isArray(rawData?.data)
        ? rawData.data
        : Array.isArray(rawData?.items)
          ? rawData.items
          : Array.isArray(rawData)
            ? rawData
            : [];
      return list;
    },
    enabled: Boolean(professionalId),
    staleTime: 1000 * 60 * 5,
  });

  const similarServices = useMemo(() => {
    if (!similarServicesData) return [];
    const currentId = String(service?.id || id || "");
    return similarServicesData.filter((s: any) => {
      const sId = String(s.id || s.service_id || "");
      return sId !== currentId;
    });
  }, [similarServicesData, service?.id, id]);

  const professionalServices = useMemo(() => {
    if (!professionalServicesData) return [];
    const currentId = String(service?.id || id || "");
    return professionalServicesData.filter((s: any) => {
      const sId = String(s.id || s.service_id || "");
      return sId !== currentId;
    });
  }, [professionalServicesData, service?.id, id]);

  const similarServicesLink = categoryId
    ? `/servicios?categoryId=${categoryId}`
    : "/servicios";

  const professionalProfileLink = professionalId
    ? getProfilePath(professionalId, professional?.seo_path)
    : undefined;

  const addToCartMutation = useMutation({
    mutationFn: (serviceId: string) => {
      if (!user) {
        return Promise.resolve(
          addGuestCartItem(Number(professionalId) || null, {
            id: `guest-service-${serviceId}`,
            service_id: serviceId,
            quantity: 1,
            subtotal: basePrice,
            service: {
              id: serviceId,
              name: service.name,
              price: basePrice,
              professional: {
                id: Number(professionalId) || 0,
                name: professionalName,
              },
            },
          }),
        );
      }

      return commerceService.addCartItem({
        service_id: serviceId,
        quantity: 1,
      });
    },
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(["user-cart", user?.id ?? "guest"], updatedCart);
      showSuccessAlert("Servicio agregado al carrito.");
    },
    onError: (err: any) => {
      const rawMsg =
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message;
      const msg = Array.isArray(rawMsg)
        ? rawMsg.join(". ")
        : rawMsg || "No se pudo agregar el servicio al carrito.";
      showError(msg);
    },
  });

  const handleShare = async () => {
    if (!service) return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: service.name,
          text: `Mirá este servicio en Sercio: ${service.name}`,
          url: url,
        });
      } catch (e) {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        showSuccessAlert("¡Enlace copiado al portapapeles!");
      } catch (e) {}
    }
  };

  // URL Normalization disabled - using query params approach instead
  // The URL pattern /servicios/{slug}?id={id} is maintained by ServicesPage
  // useEffect(() => {
  //   if (service?.seo_path) {
  //     const currentPath = window.location.pathname;
  //     const targetPath = normalizeSeoPath(service.seo_path, "/servicios", id);
  //
  //     if (currentPath !== targetPath) {
  //       router.replace(targetPath);
  //     }
  //   }
  // }, [service, router, id]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="service-detail-loading">
          <Loader2 className="animate-spin" size={40} />
          <p>Cargando servicio...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !service) {
    return (
      <>
        <Navbar />
        <div className="service-detail-error">
          <h2>Servicio no encontrado</h2>
          <p>El servicio que buscas no existe o no está disponible.</p>
          <button
            onClick={() => router.push("/servicios")}
            className="back-btn"
          >
            <ArrowLeft size={18} />
            Volver al Catálogo
          </button>
        </div>
        <Footer />
      </>
    );
  }

  const avatar =
    profile?.avatar_url ||
    profile?.portfolio_image_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(professionalName)}&background=random`;
  const address = professional?.address?.[0] || professional?.Address;
  const locationName = address?.province?.name || address?.Province?.name;
  const rating = professional?.rating_avg || 0;
  const isVerified =
    company?.companies_arca?.[0]?.is_verified ||
    company?.CompanyArca?.[0]?.is_verified ||
    false;
  const price =
    Number.isFinite(basePrice) && basePrice > 1
      ? `${basePrice.toLocaleString("es-AR")}`
      : "Consultar";

  const installmentsEnabled = Boolean(svc?.installments_enabled);
  const installmentsRestricted = Boolean(svc?.category?.no_installments);
  const maxInstallments = Math.max(1, Number(svc?.max_installments || 1));
  const firstFinancedPlan =
    commissionRates.find((rate) => Number(rate.installments) === 3) ??
    commissionRates.find((rate) => Number(rate.installments) === 2);
  const financedExample = firstFinancedPlan
    ? calculateInstallmentFinancing(
        basePrice,
        Number(firstFinancedPlan.installments),
        commissionRates,
      )
    : null;

  const handleContact = () => {
    const serviceUrl = window.location.href;
    const msg = `Hola, qué tal, pregunto por el servicio: ${service.name} - ${serviceUrl}`;
    const encodedMsg = encodeURIComponent(msg);
    router.push(
      `/mensajes?professionalId=${professionalId}&initialMessage=${encodedMsg}`,
    );
  };

  const handleAddToCart = () => {
    addToCartMutation.mutate(String(service.id || id));
  };

  return (
    <>
      <Navbar />

      <main className="service-detail-page">
        <div className="service-detail__top-nav">
          <button
            onClick={() => router.back()}
            className="service-detail__back-btn"
          >
            <ArrowLeft size={18} />
            Volver
          </button>

          <FavoriteButton
            type="service"
            targetId={service.id}
            size={22}
            className="service-detail__favorite-btn"
          />
        </div>

        <div className="service-detail__layout">
          {/* Professional Card */}
          <div className="service-detail__card">
            <div className="service-detail__professional-hero">
              <img
                src={avatar}
                alt={professionalName}
                className="service-detail__avatar"
              />
              <div className="service-detail__professional-info">
                <p className="service-detail__professional-name">
                  {isVerified && (
                    <CheckCircle
                      size={18}
                      className="service-detail__verified-icon"
                    />
                  )}
                  {professionalName}
                </p>
                <span className="service-detail__location">
                  <MapPin size={16} />
                  {locationName}
                </span>
                {rating > 0 && (
                  <span className="service-detail__rating">
                    <Star
                      size={16}
                      fill="var(--primary-color, #e94823)"
                      color="var(--primary-color, #e94823)"
                    />
                    {Number(rating).toFixed(1)}
                  </span>
                )}
              </div>
            </div>

            <div className="service-detail__body">
              <h1 className="service-detail__title-large">{service.name}</h1>

              <div className="service-detail__section">
                <h2 className="service-detail__section-title">Descripción</h2>
                <p className="service-detail__desc">
                  {service.description || "Sin descripción disponible."}
                </p>
              </div>

              <div className="service-detail__section">
                <h2 className="service-detail__section-title">Precio</h2>
                <p className="service-detail__price-large">{price}</p>

                {basePrice > 1 && (
                  <div className="service-detail__installments-box">
                    {installmentsRestricted ? (
                      <div className="service-detail__installments-pill">
                        <CreditCard size={16} />
                        <span>
                          1 pago de ${basePrice.toLocaleString("es-AR")}
                        </span>
                      </div>
                    ) : installmentsEnabled ? (
                      <>
                        <div className="service-detail__installments-pill service-detail__installments-pill--free">
                          <CreditCard size={16} />
                          <span>
                            Hasta {maxInstallments} cuotas sin interés de $
                            {Math.round(
                              basePrice / maxInstallments,
                            ).toLocaleString("es-AR")}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="service-detail__installments-btn"
                          onClick={() => setIsInstallmentsModalOpen(true)}
                        >
                          Ver medios de pago y cuotas sin interés
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="service-detail__installments-pill">
                          <CreditCard size={16} />
                          <span>Hasta 18 cuotas con tarjeta</span>
                        </div>
                        <button
                          type="button"
                          className="service-detail__installments-btn"
                          onClick={() => setIsInstallmentsModalOpen(true)}
                        >
                          Ver opciones en cuotas fijas
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Purchase Section & Protected Purchase Badge */}
              {basePrice > 1 && (
                <div className="service-detail__purchase-section">
                  <button
                    data-action-tone="add"
                    type="button"
                    className="service-detail__add-cart-btn"
                    onClick={handleAddToCart}
                    disabled={addToCartMutation.isPending}
                  >
                    {addToCartMutation.isPending ? (
                      <Loader2
                        className="animate-spin"
                        size={18}
                        aria-hidden="true"
                      />
                    ) : (
                      <ShoppingCart size={18} aria-hidden="true" />
                    )}
                    <span>Agregar al carrito</span>
                  </button>
                  <button
                    type="button"
                    className="service-detail__buy-btn"
                    onClick={() => setIsPaymentModalOpen(true)}
                  >
                    <CreditCard size={18} />
                    <span>Contratar servicio</span>
                  </button>

                  <div className="service-detail__protected-badge">
                    <ShieldCheck
                      size={18}
                      className="service-detail__protected-badge-icon"
                    />
                    <span className="service-detail__protected-badge-text">
                      Compra protegida o te devolvemos el dinero
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="service-detail__footer">
              <WhatsAppContactButton
                professionalId={professionalId}
                professional={professional}
                profile={profile}
                phone={
                  profile?.phone ||
                  profile?.phone_number ||
                  professional?.phone ||
                  professional?.phone_number ||
                  company?.phone ||
                  company?.phone_number
                }
                message={`Hola, qué tal, te contacto por el servicio: ${service.name} - ${typeof window !== "undefined" ? window.location.href : ""}`}
              />
              <button
                className="service-detail__button service-detail__button--primary"
                onClick={handleContact}
              >
                <MessageCircle size={18} />
                Contactar
              </button>
              <button
                className="service-detail__button service-detail__button--secondary"
                onClick={() =>
                  router.push(
                    getProfilePath(professionalId!, professional?.seo_path),
                  )
                }
              >
                <User size={18} />
                Ver Perfil
              </button>
              <button
                className="service-detail__button service-detail__button--share"
                onClick={handleShare}
              >
                <Share2 size={18} />
                Compartir
              </button>
            </div>
          </div>
        </div>

        <CommentsCarousel
          type="service"
          targetId={String(service.id || id || "")}
          title="Opiniones sobre el Servicio"
        />

        <ServiceSlider
          title="Servicios Similares"
          subtitle={
            categoryName
              ? `Opciones recomendadas en ${categoryName}`
              : "Opciones similares que te pueden interesar"
          }
          badge={{
            icon: <Sparkles size={13} />,
            text: "Recomendados",
          }}
          services={similarServices}
          isLoading={isLoadingSimilarServices}
          viewAllLink={similarServicesLink}
          viewAllText="Ver catálogo"
        />

        <ServiceSlider
          title="Más Servicios del mismo Profesional"
          subtitle={
            professionalName
              ? `Otros servicios ofrecidos por ${professionalName}`
              : "Otros servicios de este profesional"
          }
          badge={{
            icon: <Briefcase size={13} />,
            text: "Profesional",
          }}
          services={professionalServices}
          isLoading={isLoadingProfessionalServices}
          viewAllLink={professionalProfileLink}
          viewAllText="Ver perfil"
        />
      </main>

      {/* Service Payment Modal (No shipping, with shift assignment notice) */}
      <ServicePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        service={service}
        professionalId={professionalId}
        professionalName={professionalName}
        professionalPhone={
          profile?.phone ||
          profile?.phone_number ||
          professional?.phone ||
          professional?.phone_number ||
          company?.phone ||
          company?.phone_number
        }
      />

      {/* Installments Breakdown Modal */}
      <ProductInstallmentsModal
        isOpen={isInstallmentsModalOpen}
        onClose={() => setIsInstallmentsModalOpen(false)}
        price={basePrice}
        installmentsEnabled={installmentsEnabled}
        maxInstallments={maxInstallments}
        productName={service.name}
        itemType="servicio"
      />

      <Footer />
    </>
  );
}
