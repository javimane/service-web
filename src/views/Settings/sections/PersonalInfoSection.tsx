"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User,
  Mail,
  Lock,
  Edit2,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Bell,
} from "lucide-react";
import { authService } from "../../../services/authService";
import { userService } from "../../../services/userService";
import {
  getProfileAction,
  updateProfileAction,
} from "../../../app/actions/profile";
import { getAccessToken } from "../../../utils/auth";
import { getFirebaseMessagingToken } from "../../../services/firebaseMessaging";
import "./PersonalInfoSection.css";

interface PersonalInfoSectionProps {
  userId: string;
  initialData: {
    displayName: string;
    email: string;
  };
}

export default function PersonalInfoSection({
  userId,
  initialData,
}: PersonalInfoSectionProps) {
  const queryClient = useQueryClient();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isEnablingNotifications, setIsEnablingNotifications] = useState(false);

  const notificationPermissionState =
    typeof window === "undefined"
      ? "pending"
      : Notification.permission === "granted"
        ? "allowed"
        : Notification.permission === "denied"
          ? "blocked"
          : "pending";

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // 1. Fetch Profile with Cache
  const { data: profile, isLoading: fetching } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const token = await getAccessToken();
      const result = await getProfileAction({ id: userId, token });
      return result?.data ?? null;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Sync local states when profile is loaded
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
    } else {
      setDisplayName(initialData.displayName);
    }
    setEmail(initialData.email);
  }, [profile, initialData]);

  // Auto-clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // 2. Mutations for Updates
  const updateNameMutation = useMutation({
    mutationFn: async (newName: string) => {
      const result = await updateProfileAction({
        id: userId,
        data: { display_name: newName },
        token: getAccessToken(),
      });
      if (result?.serverError) throw new Error(result.serverError);
      return result?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      setIsEditingName(false);
      setNotification({
        type: "success",
        message: "Nombre de usuario actualizado con éxito.",
      });
    },
    onError: () => {
      setNotification({
        type: "error",
        message: "Error al actualizar el nombre de usuario.",
      });
    },
  });

  const updateEmailMutation = useMutation({
    mutationFn: (newEmail: string) => authService.updateEmail(newEmail),
    onSuccess: () => {
      setIsEditingEmail(false);
      setNotification({
        type: "success",
        message: "Email actualizado. Por favor, verificá tu nueva casilla.",
      });
    },
    onError: () => {
      setNotification({
        type: "error",
        message: "Error al actualizar el email.",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (newPass: string) => authService.updatePassword(newPass),
    onSuccess: () => {
      setIsEditingPassword(false);
      setPassword("");
      setConfirmPassword("");
      setNotification({
        type: "success",
        message: "Contraseña actualizada con éxito.",
      });
    },
    onError: () => {
      setNotification({
        type: "error",
        message: "Error al actualizar la contraseña.",
      });
    },
  });

  const handleUpdateName = () => {
    if (!displayName.trim()) return;
    updateNameMutation.mutate(displayName);
  };

  const handleUpdateEmail = () => {
    if (!email.trim()) return;
    updateEmailMutation.mutate(email);
  };

  const handleUpdatePassword = () => {
    if (password !== confirmPassword) {
      setNotification({
        type: "error",
        message: "Las contraseñas no coinciden.",
      });
      return;
    }
    if (password.length < 6) {
      setNotification({
        type: "error",
        message: "La contraseña debe tener al menos 6 caracteres.",
      });
      return;
    }
    updatePasswordMutation.mutate(password);
  };

  const handleEnableNotifications = async () => {
    if (typeof window === "undefined") return;

    setIsEnablingNotifications(true);
    try {
      const token = await getFirebaseMessagingToken(true);

      if (!token) {
        const permission = Notification.permission;
        if (permission === "denied") {
          setNotification({
            type: "error",
            message:
              "Las notificaciones estan bloqueadas en el navegador. Habilitalas desde la configuracion del sitio.",
          });
        } else {
          setNotification({
            type: "error",
            message:
              "No se pudo obtener el token de notificaciones. Revisá la configuracion de Firebase.",
          });
        }
        return;
      }

      await userService.registerDeviceToken(token, "web");
      localStorage.setItem("firebase_token", token);
      localStorage.setItem("registered_device_token", token);
      setNotification({
        type: "success",
        message: "Notificaciones activadas correctamente en este dispositivo.",
      });
    } catch (error) {
      setNotification({
        type: "error",
        message: "No se pudo activar las notificaciones.",
      });
    } finally {
      setIsEnablingNotifications(false);
    }
  };

  const loading =
    updateNameMutation.isPending ||
    updateEmailMutation.isPending ||
    updatePasswordMutation.isPending;

  return (
    <article className="settings-card settings-card--wide personal-info-section">
      <div className="section-header settings-header-compact">
        <div className="section-title">
          <span className="section-emoji">👤</span>
          <h2>Datos Personales</h2>
        </div>
      </div>

      <div className="personal-fields">
        {fetching ? (
          <div className="personal-fetching">
            <div className="fetching-spinner"></div>
            <span>Cargando datos...</span>
          </div>
        ) : (
          <>
            {/* Notification Banner */}
            {notification && (
              <div
                className={`personal-notification personal-notification--${notification.type}`}
              >
                {notification.type === "success" ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                <span>{notification.message}</span>
                <button
                  className="personal-notification__close"
                  onClick={() => setNotification(null)}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Username Field */}
            <div className="personal-field-row">
              <div className="personal-field-content">
                <span className="personal-field-label">
                  <User size={16} /> Nombre de usuario
                </span>
                {isEditingName ? (
                  <input
                    type="text"
                    className="personal-input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <span className="personal-field-value">
                    {displayName || "Sin definir"}
                  </span>
                )}
              </div>
              <div className="personal-field-actions">
                {isEditingName ? (
                  <>
                    <button
                      className="personal-action-btn personal-action-btn--save"
                      onClick={handleUpdateName}
                      disabled={loading}
                    >
                      <Check size={16} />
                    </button>
                    <button
                      className="personal-action-btn personal-action-btn--cancel"
                      onClick={() => {
                        setIsEditingName(false);
                        setDisplayName(initialData.displayName);
                      }}
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <button
                    className="personal-action-btn"
                    onClick={() => setIsEditingName(true)}
                  >
                    <Edit2 size={16} /> Modificar
                  </button>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="personal-field-row">
              <div className="personal-field-content">
                <span className="personal-field-label">
                  <Mail size={16} /> Email
                </span>
                {isEditingEmail ? (
                  <input
                    type="email"
                    className="personal-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <span className="personal-field-value">{email}</span>
                )}
              </div>
              <div className="personal-field-actions">
                {isEditingEmail ? (
                  <>
                    <button
                      className="personal-action-btn personal-action-btn--save"
                      onClick={handleUpdateEmail}
                      disabled={loading}
                    >
                      <Check size={16} />
                    </button>
                    <button
                      className="personal-action-btn personal-action-btn--cancel"
                      onClick={() => {
                        setIsEditingEmail(false);
                        setEmail(initialData.email);
                      }}
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <button
                    className="personal-action-btn"
                    onClick={() => setIsEditingEmail(true)}
                  >
                    <Edit2 size={16} /> Modificar
                  </button>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div className="personal-field-row personal-field-row--column">
              <div className="personal-field-content">
                <span className="personal-field-label">
                  <Lock size={16} /> Contraseña
                </span>
                {isEditingPassword ? (
                  <div className="personal-password-inputs">
                    <input
                      type="password"
                      className="personal-input"
                      placeholder="Nueva contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <input
                      type="password"
                      className="personal-input"
                      placeholder="Confirmar contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                ) : (
                  <span className="personal-field-value">••••••••••••</span>
                )}
              </div>
              <div className="personal-field-actions">
                {isEditingPassword ? (
                  <div className="personal-password-actions">
                    <button
                      className="personal-action-btn personal-action-btn--save"
                      onClick={handleUpdatePassword}
                      disabled={loading}
                    >
                      <Check size={16} /> Guardar
                    </button>
                    <button
                      className="personal-action-btn personal-action-btn--cancel"
                      onClick={() => setIsEditingPassword(false)}
                    >
                      <X size={16} /> Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    className="personal-action-btn"
                    onClick={() => setIsEditingPassword(true)}
                  >
                    <Edit2 size={16} /> Modificar
                  </button>
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="personal-field-row">
              <div className="personal-field-content">
                <span className="personal-field-label">
                  <Bell size={16} /> Notificaciones push
                </span>
                <span className="personal-field-value">
                  Recibí alertas de mensajes y novedades en tiempo real.
                </span>
                <span
                  className={`personal-notification-state personal-notification-state--${notificationPermissionState}`}
                >
                  {notificationPermissionState === "allowed"
                    ? "Permiso concedido"
                    : notificationPermissionState === "blocked"
                      ? "Bloqueadas en el navegador"
                      : "Permiso pendiente"}
                </span>
              </div>
              <div className="personal-field-actions">
                <button
                  className="personal-action-btn personal-action-btn--save"
                  onClick={handleEnableNotifications}
                  disabled={isEnablingNotifications}
                  type="button"
                >
                  {isEnablingNotifications ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />{" "}
                      Activando...
                    </>
                  ) : (
                    <>
                      <Bell size={16} /> Activar notificaciones
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
