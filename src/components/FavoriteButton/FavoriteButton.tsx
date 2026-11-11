"use client";

import React, { useMemo } from "react";
import { Heart } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { useAlert } from "@/context/AlertContext";
import { commerceService } from "@/services/commerceService";
import "./FavoriteButton.css";

export interface FavoriteButtonProps {
  type: "professional" | "product" | "service";
  targetId: string | number;
  size?: number;
  showLabel?: boolean;
  label?: string;
  variant?: "icon" | "pill" | "banner";
  className?: string;
  onToggle?: (isFav: boolean) => void;
}

export default function FavoriteButton({
  type,
  targetId,
  size = 18,
  showLabel = false,
  label,
  variant = "icon",
  className = "",
  onToggle,
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const { openAuth } = useAuthModal();
  const { showSuccess, showError } = useAlert();
  const queryClient = useQueryClient();

  const strTargetId = String(targetId ?? "").trim();

  // Fetch favorites cache
  const { data: favoritesData } = useQuery({
    queryKey: ["user-favorites"],
    queryFn: () => commerceService.favorites(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Calculate favorite status and find favorite record ID
  const { isFavorite, favoriteRecordId } = useMemo(() => {
    if (!user || !favoritesData || !strTargetId) {
      return { isFavorite: false, favoriteRecordId: null };
    }

    if (type === "professional") {
      const match = (favoritesData.merchants || []).find(
        (m) =>
          String(m.id) === strTargetId ||
          String(m.professional_id) === strTargetId,
      );
      return { isFavorite: !!match, favoriteRecordId: match?.id || null };
    }

    if (type === "product") {
      const match = (favoritesData.products || []).find(
        (p) =>
          String(p.id) === strTargetId ||
          String(p.product_id) === strTargetId,
      );
      return { isFavorite: !!match, favoriteRecordId: match?.id || null };
    }

    if (type === "service") {
      const match = (favoritesData.services || []).find(
        (s) =>
          String(s.id) === strTargetId ||
          String(s.service_id) === strTargetId,
      );
      return { isFavorite: !!match, favoriteRecordId: match?.id || null };
    }

    return { isFavorite: false, favoriteRecordId: null };
  }, [user, favoritesData, type, strTargetId]);

  // Mutation to toggle favorite
  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        const idToDelete = favoriteRecordId || strTargetId;
        await commerceService.removeFavorite(idToDelete);
        return false;
      } else {
        const payload: {
          professionalId?: number;
          productId?: string;
          serviceId?: string;
        } = {};
        if (type === "professional") payload.professionalId = Number(strTargetId);
        if (type === "product") payload.productId = strTargetId;
        if (type === "service") payload.serviceId = strTargetId;

        await commerceService.addFavorite(payload);
        return true;
      }
    },
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
      if (newStatus) {
        showSuccess("Guardado en favoritos");
      } else {
        showSuccess("Eliminado de favoritos");
      }
      onToggle?.(newStatus);
    },
    onError: () => {
      showError("No se pudo actualizar favoritos");
    },
  });

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      openAuth("login");
      return;
    }

    if (!strTargetId || toggleMutation.isPending) return;

    toggleMutation.mutate();
  };

  const defaultLabel = isFavorite ? "Guardado en Favoritos" : "Guardar en Favoritos";
  const displayLabel = label || defaultLabel;

  return (
    <button
      data-action-tone={isFavorite ? undefined : "add"}
      type="button"
      className={`favorite-btn favorite-btn--${variant} ${
        isFavorite ? "favorite-btn--active" : ""
      } ${toggleMutation.isPending ? "favorite-btn--loading" : ""} ${className}`.trim()}
      onClick={handleClick}
      title={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
      aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
      aria-pressed={isFavorite}
      disabled={toggleMutation.isPending}
    >
      <Heart
        size={size}
        className={`favorite-btn__icon ${
          isFavorite ? "favorite-btn__icon--filled" : ""
        }`}
      />
      {showLabel && <span className="favorite-btn__label">{displayLabel}</span>}
    </button>
  );
}
