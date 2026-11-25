"use client";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, AlertCircle, CheckCircle2, Loader2, X, User } from "lucide-react";
import { uploadProfileImage } from "../../../services/storageUploads";
import { getProfileAction, updateProfileAction } from "../../../app/actions/profile";
import { getAccessToken } from "../../../utils/auth";
import "./AvatarSection.css";

interface AvatarSectionProps {
  userId: string;
}

export default function AvatarSection({ userId }: AvatarSectionProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const token = await getAccessToken();
      const result = await getProfileAction({ id: userId, token });
      return result?.data ?? null;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const currentAvatar = previewUrl || profile?.avatar_url || null;

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { publicUrl } = await uploadProfileImage({ file });
      const result = await updateProfileAction({
        id: userId,
        data: { avatar_url: publicUrl },
        token: getAccessToken(),
      });
      if (result?.serverError) throw new Error(result.serverError);
      if (result?.validationErrors) throw new Error("No se pudo guardar la foto.");
      return publicUrl;
    },
    onSuccess: (publicUrl) => {
      queryClient.setQueryData(["profile", userId], (current: typeof profile) =>
        current ? { ...current, avatar_url: publicUrl } : current,
      );
      void queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      setPreviewUrl(null);
      setNotification({
        type: "success",
        message: "Foto de perfil actualizada correctamente.",
      });
      setTimeout(() => setNotification(null), 5000);
    },
    onError: () => {
      setPreviewUrl(null);
      setNotification({
        type: "error",
        message: "Error al subir la imagen. Intentá de nuevo.",
      });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || uploadMutation.isPending) return;
    setNotification(null);
    setPreviewUrl(URL.createObjectURL(file));
    uploadMutation.mutate(file);
  };

  const isUploading = uploadMutation.isPending;

  return (
    <article className="settings-card avatar-section">
      <div className="section-header settings-header-compact">
        <div className="section-title">
          <span className="section-emoji">📸</span>
          <h2>Foto de Perfil</h2>
        </div>
      </div>

      {notification && (
        <div className={`avatar-notification avatar-notification--${notification.type}`}>
          {notification.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{notification.message}</span>
          <button
            className="avatar-notification__close"
            onClick={() => setNotification(null)}
          >
            <X size={13} />
          </button>
        </div>
      )}

      <div className="avatar-body">
        {/* Avatar preview */}
        <div className="avatar-preview-wrapper">
          {isLoading ? (
            <div className="avatar-skeleton" />
          ) : currentAvatar ? (
            <img
              src={currentAvatar}
              alt="Foto de perfil"
              className="avatar-preview-img"
            />
          ) : (
            <div className="avatar-placeholder">
              <User size={40} />
            </div>
          )}

          {/* Camera overlay trigger */}
          <button
            type="button"
            className="avatar-camera-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isLoading}
            aria-label="Cambiar foto de perfil"
          >
            <Camera size={18} />
          </button>

          {isUploading && <div className="avatar-saving-overlay" role="status" aria-label="Guardando foto de perfil">
            <Loader2 size={28} className="btn-spinner" aria-hidden="true" />
          </div>}
        </div>

        {/* Right side info & actions */}
        <div className="avatar-info">
          <p className="avatar-hint">
            Subí una foto cuadrada de al menos 200×200 px. Formatos aceptados: JPG, PNG, WEBP.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="avatar-file-input"
            disabled={isUploading || isLoading}
          />

          <button
            type="button"
            data-action-tone="upload"
            className="avatar-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isLoading}
          >
            {isUploading ? <Loader2 size={16} className="btn-spinner" aria-hidden="true" /> : <Camera size={16} />}
            {isUploading ? "Guardando foto…" : "Cambiar foto"}
          </button>
          <p className="avatar-hint">La foto se guarda automáticamente al seleccionarla.</p>
        </div>
      </div>
    </article>
  );
}
