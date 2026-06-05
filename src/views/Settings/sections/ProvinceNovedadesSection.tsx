"use client";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { MapPin, Check, AlertCircle, Loader2 } from "lucide-react";
import { updateProfileAction } from "../../../app/actions/profile";
import { getAccessToken } from "../../../utils/auth";
import { useAuth } from "../../../context/AuthContext";
import "./ProvinceNovedadesSection.css";

interface Province {
  id: number;
  name: string;
}

interface ProvinceNovedadesSectionProps {
  userId: string;
  provinceList: Province[];
  initialProvinceId: number | null;
}

export default function ProvinceNovedadesSection({
  userId,
  provinceList,
  initialProvinceId,
}: ProvinceNovedadesSectionProps) {
  const { refreshSession } = useAuth();
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(
    null,
  );
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (initialProvinceId !== undefined && initialProvinceId !== null) {
      setSelectedProvinceId(initialProvinceId);
    } else {
      setSelectedProvinceId(null);
    }
  }, [initialProvinceId]);

  const updateProvinceMutation = useMutation({
    mutationFn: async (provinceId: number | null) => {
      const token = await getAccessToken();
      const result = await updateProfileAction({
        id: userId,
        data: { province_id: provinceId },
        token,
      });
      if (result?.serverError) throw new Error(result.serverError);
      return result?.data;
    },
    onSuccess: async () => {
      await refreshSession();
      setNotification({
        type: "success",
        message: "Provincia de novedades actualizada correctamente ✨",
      });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: (error: any) => {
      console.error("Error updating province:", error);
      setNotification({
        type: "error",
        message: "Error al actualizar la provincia. Reintentá.",
      });
      setTimeout(() => setNotification(null), 4000);
    },
  });

  const handleSave = () => {
    const provId = selectedProvinceId ? Number(selectedProvinceId) : null;
    updateProvinceMutation.mutate(provId);
  };

  return (
    <article className="settings-card province-novedades-section">
      <div className="section-header settings-header-compact">
        <div className="section-title">
          <span className="section-emoji">📍</span>
          <h2 className="province-novedades-section__title">
            Novedades por Provincia
          </h2>
        </div>
      </div>

      <div className="province-novedades-section__content">
        <p className="province-novedades-section__description">
          Selecciona la provincia de cual quieres ver las novedades en la
          pantalla principal.
        </p>

        {notification && (
          <div
            className={`province-novedades-section__notification province-novedades-section__notification--${notification.type}`}
          >
            {notification.type === "success" ? (
              <Check size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        <div className="settings-field">
          <div className="select-wrapper">
            <select
              value={selectedProvinceId ?? ""}
              onChange={(e) =>
                setSelectedProvinceId(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              className="province-novedades-section__select"
            >
              <option value="">Seleccionar Provincia</option>
              {provinceList.map((prov) => (
                <option key={prov.id} value={prov.id}>
                  {prov.name}
                </option>
              ))}
            </select>
            <span className="select-arrow">
              <MapPin size={16} />
            </span>
          </div>
        </div>

        <div className="province-novedades-section__actions">
          <button
            type="button"
            className="settings-save-btn province-novedades-section__save-btn"
            onClick={handleSave}
            disabled={updateProvinceMutation.isPending}
          >
            {updateProvinceMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>Guardar Configuración</span>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
