import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../context/AuthContext";
import { professionalPromotionService } from "../../../services/professionalPromotionService";
import {
  Plus,
  Search,
  Filter,
  Ticket,
  Calendar,
  MoreVertical,
  Trash2,
  Copy,
  Loader2,
  X,
  Clock,
  Sparkles,
  Download,
  Edit2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toJpeg } from "html-to-image";
import { formatDateDisplay } from "../../../utils/utils";
import "./AllPromotionsPage.css";

const STATUS_LABELS = {
  active: "Activa",
  expired: "Expirada",
  draft: "Borrador",
};

export default function AllPromotionsPage({ onCreateNew }) {
  const { sessionStatus } = useAuth();
  const professionalId = sessionStatus?.subscription?.professional_id ?? sessionStatus?.professional_id;

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedPromo, setSelectedPromo] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ["professional-promotions", professionalId],
    queryFn: () => professionalPromotionService.getByProfessional(professionalId),
    enabled: !!professionalId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => professionalPromotionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-promotions"] });
    },
    onError: (err: any) => {
      alert("Error al eliminar: " + err.message);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (promo: any) => {
      // Find the original promotion data to get all fields
      const original = promotions.find(p => p.id === promo.id);
      if (!original) throw new Error("Promoción no encontrada");

      const { id, created_at, updated_at, Professional, ...rest } = original;
      return professionalPromotionService.create({
        ...rest,
        title: `${rest.title} (Copia)`,
        state: 'draft',
        discount_percentage: rest.discount_type === 'percentage' ? Number(rest.discount_value) : 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-promotions"] });
      alert("Promoción duplicada con éxito como borrador");
    },
    onError: (err: any) => {
      alert("Error al duplicar: " + err.message);
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta promoción?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDuplicate = (promo: any) => {
    duplicateMutation.mutate(promo);
  };

  const handleView = (promoId: string) => {
    const promo = promotions.find(p => p.id === promoId);
    setSelectedPromo(promo);
  };

  const handleDownloadImage = (url: string, title: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `promocion-${title}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadCoupon = async (title: string) => {
    if (!couponRef.current) return;

    try {
      const dataUrl = await toJpeg(couponRef.current, {
        quality: 0.95,
        backgroundColor: "#fff",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `cupón-${title || "promo"}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error al generar imagen:", err);
      alert("No se pudo generar el archivo del cupón.");
    }
  };

  const promosList = useMemo(() => {
    return promotions.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      offer: p.discount_type === 'percentage' ? `${p.discount_value}% OFF` : 
             p.discount_type === 'fixed' ? `$${p.discount_value}` :
             p.discount_type === 'bogo' ? '2x1' : 'GRATIS',
      unlimitedStock: p.unlimited_stock || false,
      applicableTo: p.applicable_to || "",       
      status: p.state || 'active',
      validFrom: formatDateDisplay(p.from_date || ""),
      validTo: formatDateDisplay(p.expires_at || ""),
      image: p.image_url || "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80",
    }));
  }, [promotions]);

  const filtered = useMemo(() => {
    return promosList.filter((p) => {
      const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all" || p.status === filter;
      return matchSearch && matchFilter;
    });
  }, [promosList, search, filter]);

  return (
    <div className="all-promos">
      {/* Header */}
      <div className="all-promos__header">
        <div>
          <span className="all-promos__label">CAMPAIGN MANAGER</span>
          <h1 className="all-promos__title">Todas las Promociones</h1>
        </div>
        <button
          type="button"
          className="all-promos__create-btn"
          onClick={onCreateNew}
        >
          <Plus size={18} />
          Nueva Promoción
        </button>
      </div>

      {/* Filters Bar */}
      <div className="all-promos__toolbar">
        <div className="all-promos__search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar promoción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="all-promos__filters">
          <Filter size={14} />
          {["all", "active", "expired", "draft"].map((f) => (
            <button
              key={f}
              type="button"
              className={`all-promos__filter-chip ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Todas" : STATUS_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="all-promos__stats">
        <div className="promo-stat-card">
          <span className="promo-stat-card__value">
            {promosList.length}
          </span>
          <span className="promo-stat-card__label">Total</span>
        </div>
        <div className="promo-stat-card promo-stat-card--active">
          <span className="promo-stat-card__value">
            {promosList.filter((p) => p.status === "active").length}
          </span>
          <span className="promo-stat-card__label">Activas</span>
        </div>
        <div className="promo-stat-card promo-stat-card--expired">
          <span className="promo-stat-card__value">
            {promosList.filter((p) => p.status === "expired").length}
          </span>
          <span className="promo-stat-card__label">Expiradas</span>
        </div>
        <div className="promo-stat-card promo-stat-card--draft">
          <span className="promo-stat-card__value">
            {promosList.filter((p) => p.status === "draft").length}
          </span>
          <span className="promo-stat-card__label">Borradores</span>
        </div>
      </div>

      {/* Promotions Grid */}
      <div className="all-promos__grid">
        {isLoading ? (
          <div className="all-promos__loading">
            <Loader2 className="animate-spin" size={32} />
            <p>Cargando promociones...</p>
          </div>
        ) : filtered.map((promo) => (
          <article 
            key={promo.id} 
            className="promo-list-card promo-list-card--clickable"
            onClick={() => handleView(promo.id)}
          >
            <div className="promo-list-card__image">
              <img src={promo.image} alt={promo.title} loading="lazy" />
              <span
                className={`promo-list-card__status promo-list-card__status--${promo.status}`}
              >
                {STATUS_LABELS[promo.status]}
              </span>
              <span className="promo-list-card__offer-badge">
                <Ticket size={12} />
                {promo.offer}
              </span>
            </div>

            <div className="promo-list-card__body">
              <h3 className="promo-list-card__title">{promo.title}</h3>
              <p className="promo-list-card__desc">{promo.description}</p>

              <div className="promo-list-card__meta">
                <span className="promo-list-card__dates">
                  <Calendar size={12} />
                  {promo.validFrom} — {promo.validTo}
                </span>
                <code className="promo-list-card__code">PROMO-{promo.id.slice(0, 4).toUpperCase()}</code>
              </div>
            </div>

            <div className="promo-list-card__actions" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                className="promo-list-card__action"
                title="Modificar"
                onClick={() => handleDuplicate(promo)}
                disabled={duplicateMutation.isPending}
              >
                <Edit2 size={16} />
              </button>
              <button
                type="button"
                className="promo-list-card__action"
                title="Descargar Imagen"
                onClick={() => handleDownloadImage(promo.image, promo.title)}
              >
                <Download size={16} />
              </button>
              <button
                type="button"
                className="promo-list-card__action promo-list-card__action--danger"
                title="Eliminar"
                onClick={() => handleDelete(promo.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && deleteMutation.variables === promo.id ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            </div>
          </article>
        ))}

        {filtered.length === 0 && (
          <div className="all-promos__empty">
            <Ticket size={48} />
            <p>No se encontraron promociones</p>
          </div>
        )}
      </div>

      {/* View Modal (Coupon Design) */}
      {selectedPromo && (
        <div className="coupon-modal-overlay" onClick={() => setSelectedPromo(null)}>
          <div className="coupon-modal-content" onClick={e => e.stopPropagation()}>
            <button className="coupon-modal__close" onClick={() => setSelectedPromo(null)}>
              <X size={24} />
            </button>
            
            <div className="coupon-card-container">
              <div className="coupon-card" ref={couponRef}>
                <div className="coupon-card__header">
                  <Ticket size={28} className="coupon-ticket-icon" />
                  <div className="coupon-card__discount">
                    {selectedPromo.discount_type === 'percentage' ? `${selectedPromo.discount_value}% OFF` : 
                     selectedPromo.discount_type === 'fixed' ? `$${selectedPromo.discount_value} OFF` :
                     selectedPromo.discount_type === 'bogo' ? '2x1' : 'GRATIS'}
                  </div>
                </div>
                <div className="coupon-card__image">
                  <img src={selectedPromo.image_url} alt="Promo" />
                </div>
                <div className="coupon-card__body">
                  <h2 className="coupon-card__title">{selectedPromo.title}</h2>
                  <p className="coupon-card__description">{selectedPromo.description}</p>

                  <div className="coupon-card__info-box">
                    <div className="coupon-card__info-item">
                      <Ticket size={16} />
                      <span>
                        <strong>Estado:</strong> {STATUS_LABELS[selectedPromo.state || 'active']}
                      </span>
                    </div>
                    <div className="coupon-card__info-item">
                      <Calendar size={16} />
                      <span>
                        <strong>Validez:</strong> {formatDateDisplay(selectedPromo.from_date)} al {formatDateDisplay(selectedPromo.expires_at)}
                      </span>
                    </div>
                    <div className="coupon-card__info-item">
                      <Sparkles size={16} />
                      <span>
                        <strong>Aplicable a:</strong> {selectedPromo.applicable_to || "Todo el catálogo"}
                      </span>
                    </div>
                    <div className="coupon-card__info-item">
                      <Edit2 size={16} />
                      <span>
                        <strong>Profesional:</strong> {user?.display_name || "Tu Studio"}
                      </span>
                    </div>
                  </div>

                  <button
                    className="coupon-card__download-btn coupon-card__download-btn--success"
                    onClick={() => handleDownloadCoupon(selectedPromo.title)}
                  >
                    <Download size={18} />
                    Descargar Cupón (JPG)
                  </button>

                  <div className="coupon-card__footer">
                    <CheckCircle2 size={14} />
                    <span>Presenta este cupón al momento del servicio</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
