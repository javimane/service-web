"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Heart,
  Store,
  Package,
  Briefcase,
  Trash2,
  ExternalLink,
  ShoppingCart,
  Clock,
  AlertCircle,
} from "lucide-react";
import { commerceService } from "@/services/commerceService";
import { useAlert } from "@/context/AlertContext";
import { ROUTES } from "@/routes/paths";
import "./FavoritesSection.css";

export default function FavoritesSection() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useAlert();

  const [activeTab, setActiveTab] = useState<"merchants" | "products" | "services">("merchants");

  const {
    data: favoritesData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["user-favorites"],
    queryFn: () => commerceService.favorites(),
  });

  const merchants = favoritesData?.merchants ?? [];
  const products = favoritesData?.products ?? [];
  const services = favoritesData?.services ?? [];

  const removeFavoriteMutation = useMutation({
    mutationFn: (id: string) => commerceService.removeFavorite(id),
    onSuccess: () => {
      showSuccess("Eliminado de favoritos.");
      queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
    },
    onError: () => showError("No se pudo quitar de favoritos."),
  });

  const addToCartMutation = useMutation({
    mutationFn: (productId: string) =>
      commerceService.addCartItem({
        product_id: productId,
        quantity: 1,
      }),
    onSuccess: () => {
      showSuccess("Producto agregado al carrito.");
      router.push(`${ROUTES.dashboard}?view=cart`);
    },
    onError: () => showError("No se pudo agregar al carrito."),
  });

  return (
    <div className="favorites-section">
      <header className="favorites-section__header">
        <div>
          <span className="favorites-section__subtitle">Colección Personal</span>
          <h1 className="favorites-section__title">Mis Favoritos</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="favorites-tabs">
        <button
          type="button"
          className={`favorites-tab ${activeTab === "merchants" ? "favorites-tab--active" : ""}`}
          onClick={() => setActiveTab("merchants")}
        >
          <Store size={16} />
          <span>Comercios ({merchants.length})</span>
        </button>
        <button
          type="button"
          className={`favorites-tab ${activeTab === "products" ? "favorites-tab--active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          <Package size={16} />
          <span>Productos ({products.length})</span>
        </button>
        <button
          type="button"
          className={`favorites-tab ${activeTab === "services" ? "favorites-tab--active" : ""}`}
          onClick={() => setActiveTab("services")}
        >
          <Briefcase size={16} />
          <span>Servicios ({services.length})</span>
        </button>
      </div>

      {isLoading ? (
        <div className="favorites-state favorites-state--loading">
          <Clock className="favorites-state__spinner" size={32} />
          <p>Cargando favoritos...</p>
        </div>
      ) : isError ? (
        <div className="favorites-state favorites-state--error">
          <AlertCircle size={32} />
          <p>Error al cargar favoritos.</p>
          <button type="button" className="btn-primary" onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      ) : (
        <div className="favorites-content">
          {/* Tab 1: Merchants */}
          {activeTab === "merchants" && (
            merchants.length === 0 ? (
              <div className="favorites-state favorites-state--empty">
                <Store size={48} />
                <h3>No tenés comercios favoritos</h3>
                <p>Guardá tus tiendas y negocios preferidos para visitarlos rápidamente.</p>
              </div>
            ) : (
              <div className="favorites-grid">
                {merchants.map((m) => (
                  <div key={m.id} className="favorite-card">
                    <div className="favorite-card__top">
                      <div className="favorite-avatar">
                        {m.image_url || m.avatar_url ? (
                          <img src={m.image_url || m.avatar_url} alt={m.name} />
                        ) : (
                          <Store size={24} />
                        )}
                      </div>
                      <button
                        type="button"
                        className="favorite-remove-btn"
                        title="Quitar de favoritos"
                        onClick={() => removeFavoriteMutation.mutate(m.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="favorite-card__info">
                      <h3 className="favorite-card__name">{m.commercial_name || m.name}</h3>
                      <span className="favorite-card__cat">{m.category || "Comercio"}</span>
                    </div>

                    <div className="favorite-card__footer">
                      <button
                        type="button"
                        className="btn-primary favorite-action-btn"
                        onClick={() => {
                          const target = m.seo_path ? `/perfil${m.seo_path}` : `/perfil/${m.professional_id || m.id}`;
                          router.push(target);
                        }}
                      >
                        <span>Visitar tienda</span>
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Tab 2: Products */}
          {activeTab === "products" && (
            products.length === 0 ? (
              <div className="favorites-state favorites-state--empty">
                <Package size={48} />
                <h3>No tenés productos guardados</h3>
                <p>Marcá como favoritos los artículos que querés comprar más adelante.</p>
              </div>
            ) : (
              <div className="favorites-grid">
                {products.map((p) => (
                  <div key={p.id} className="favorite-card">
                    <div className="favorite-card__thumb-wrap">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="favorite-card__thumb" />
                      ) : (
                        <div className="favorite-card__no-img">
                          <Package size={28} />
                        </div>
                      )}
                      <button
                        type="button"
                        className="favorite-remove-btn favorite-remove-btn--overlay"
                        title="Quitar de favoritos"
                        onClick={() => removeFavoriteMutation.mutate(p.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="favorite-card__info">
                      <h3 className="favorite-card__name">{p.name}</h3>
                      <span className="favorite-card__price">
                        {p.price > 1 ? `$${Number(p.price).toLocaleString("es-AR")}` : "Consultar"}
                      </span>
                    </div>

                    <div className="favorite-card__footer">
                      <button
                        type="button"
                        className="btn-primary favorite-action-btn"
                        onClick={() => {
                          const target = p.seo_path ? `/productos${p.seo_path}` : `/productos/${p.product_id || p.id}`;
                          router.push(target);
                        }}
                      >
                        <ExternalLink size={14} />
                        <span>Ver producto</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Tab 3: Services */}
          {activeTab === "services" && (
            services.length === 0 ? (
              <div className="favorites-state favorites-state--empty">
                <Briefcase size={48} />
                <h3>No tenés servicios guardados</h3>
                <p>Guardá profesionales y servicios técnicos para contactarlos cuando los necesites.</p>
              </div>
            ) : (
              <div className="favorites-grid">
                {services.map((s) => (
                  <div key={s.id} className="favorite-card">
                    <div className="favorite-card__top">
                      <div className="favorite-avatar favorite-avatar--service">
                        <Briefcase size={22} />
                      </div>
                      <button
                        type="button"
                        className="favorite-remove-btn"
                        title="Quitar de favoritos"
                        onClick={() => removeFavoriteMutation.mutate(s.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="favorite-card__info">
                      <h3 className="favorite-card__name">{s.name}</h3>
                      <span className="favorite-card__price">
                        {s.price > 1 ? `$${Number(s.price).toLocaleString("es-AR")}` : "Consultar"}
                      </span>
                    </div>

                    <div className="favorite-card__footer">
                      <button
                        type="button"
                        className="btn-primary favorite-action-btn"
                        onClick={() => {
                          const target = s.seo_path ? `/servicios${s.seo_path}` : `/servicios/${s.service_id || s.id}`;
                          router.push(target);
                        }}
                      >
                        <span>Ver servicio</span>
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
