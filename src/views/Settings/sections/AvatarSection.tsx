"use client";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Check, AlertCircle, CheckCircle2, Loader2, X, User } from "lucide-react";
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
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const result = await getProfileAction({ id: userId });
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
      return publicUrl;
    },
    onSuccess: (publicUrl) => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      setPreviewUrl(null);
      setPendingFile(null);
      setNotification({
        type: "success",
        message: "Foto de perfil actualizada correctamente.",
      });
      setTimeout(() => setNotification(null), 5000);
    },
    onError: () => {
      setNotification({
        type: "error",
        message: "Error al subir la imagen. Intentá de nuevo.",
      });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleConfirm = () => {
    if (pendingFile) uploadMutation.mutate(pendingFile);
  };

  const handleCancel = () => {
    setPendingFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
              className={`avatar-preview-img ${pendingFile ? "avatar-preview-img--pending" : ""}`}
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
            disabled={isUploading}
            aria-label="Cambiar foto de perfil"
          >
            <Camera size={18} />
          </button>

          {pendingFile && !isUploading && (
            <span className="avatar-pending-badge">Nuevo</span>
          )}
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
          />

          {pendingFile ? (
            <div className="avatar-confirm-row">
              <button
                type="button"
                className="avatar-confirm-btn avatar-confirm-btn--save"
                onClick={handleConfirm}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 size={15} className="avatar-spinner" /> Subiendo...
                  </>
                ) : (
                  <>
                    <Check size={15} /> Guardar foto
                  </>
                )}
              </button>
              <button
                type="button"
                className="avatar-confirm-btn avatar-confirm-btn--cancel"
                onClick={handleCancel}
                disabled={isUploading}
              >
                <X size={15} /> Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="avatar-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Camera size={16} />
              Cambiar foto
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
