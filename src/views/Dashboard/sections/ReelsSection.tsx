"use client";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  Heart,
  Play,
  Sparkles,
  Trash2,
  UploadCloud,
  Video,
  X,
  Plus,
} from "lucide-react";
import { multimediaService } from "../../../services/multimediaService";
import {
  createReelAction,
  deleteReelAction,
  getReelDetailAction,
  getReelsByProfessionalAction,
} from "../../../app/actions/reels";
import { getMultimediaUploadUrlAction } from "../../../app/actions/multimedia";
import { useAuth } from "../../../context/AuthContext";
import { getAccessToken } from "../../../utils/auth";
import "./ReelsSection.css";

type ReelItem = {
  id: string;
  title: string;
  description: string;
  url: string;
  storageKey: string;
  views: number;
  likes: number;
};

const formatCompact = (value: number) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return `${value}`;
};

export default function ReelsSection() {
  const { sessionStatus } = useAuth();
  const professionalId = Number(
    sessionStatus?.subscription?.professional_id ?? 0,
  );
  const queryClient = useQueryClient();

  const { data: reels = [], isLoading } = useQuery({
    queryKey: ["reels", professionalId],
    queryFn: async () => {
      if (!professionalId) return [];
      const result = await getReelsByProfessionalAction({ professionalId });
      const data = result?.data ?? [];
      const filtered = data.filter(
        (r: any) => r.professional_id === professionalId && r.activate === true,
      );

      return filtered.map((r) => ({
        id: r.id.toString(),
        title: r.title || "",
        description: r.description || "",
        url: r.video_url,
        storageKey: "",
        views: r.views_count || 0,
        likes: r.likes || 0,
      }));
    },
    enabled: !!professionalId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [savedMessage, setSavedMessage] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalViews = useMemo(
    () => reels.reduce((sum, reel) => sum + reel.views, 0),
    [reels],
  );

  const totalLikes = useMemo(
    () => reels.reduce((sum, reel) => sum + reel.likes, 0),
    [reels],
  );

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] ?? null);
  };

  // Clear saved message after 5 seconds
  useEffect(() => {
    if (savedMessage) {
      const timer = setTimeout(() => {
        setSavedMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [savedMessage]);

  const handleSubmit = async () => {
    if (!selectedFile || !title.trim() || !professionalId) return;

    try {
      setIsPublishing(true);
      setIsModalOpen(false); // Close modal immediately
      setSavedMessage("Procesando, le notificaremos cuando esté subido."); // Show processing message

      const uploadUrlResult = await getMultimediaUploadUrlAction({
        professionalId,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        type: "REEL",
        token: getAccessToken(),
      });
      if (uploadUrlResult?.serverError)
        throw new Error(uploadUrlResult.serverError);
      const uploadData = uploadUrlResult?.data;
      if (!uploadData?.uploadUrl || !uploadData?.key) {
        throw new Error("No se pudo obtener la URL de subida del reel.");
      }
      const { uploadUrl, key } = uploadData;

      await multimediaService.uploadToPresignedUrl(uploadUrl, selectedFile);

      const createResult = await createReelAction({
        professional_id: professionalId,
        title: title.trim(),
        description: description.trim(),
        video_url: key,
      });
      if (createResult?.serverError) throw new Error(createResult.serverError);
      const newReel = createResult?.data;

      let activatedReel = newReel;
      const MAX_ATTEMPTS = 10;
      const POLL_INTERVAL_MS = 6000;
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        if (activatedReel.activate === true) break;
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        const detailResult = await getReelDetailAction({
          id: activatedReel.id.toString(),
        });
        if (detailResult?.serverError)
          throw new Error(detailResult.serverError);
        activatedReel = detailResult?.data;
      }

      if (activatedReel.activate !== true) {
        setSavedMessage(
          "El reel se subió pero aún está siendo procesado. Revisá más tarde.",
        );
      } else {
        queryClient.setQueryData(
          ["reels", professionalId],
          (current: ReelItem[] = []) => [
            {
              id: activatedReel.id.toString(),
              title: activatedReel.title || "",
              description: activatedReel.description || "",
              url: activatedReel.video_url,
              storageKey: key,
              views: activatedReel.views_count || 0,
              likes: activatedReel.likes || 0,
            },
            ...current,
          ],
        );
        setSavedMessage("El reel se publicó y se guardó correctamente.");
      }

      setTitle("");
      setDescription("");
      setSelectedFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo publicar el reel en este momento.";
      setSavedMessage(errorMessage);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const result = await deleteReelAction({ id });
      if (result?.serverError) throw new Error(result.serverError);
      queryClient.setQueryData(
        ["reels", professionalId],
        (current: ReelItem[] = []) => current.filter((reel) => reel.id !== id),
      );
      setSavedMessage("El reel fue eliminado correctamente.");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el reel en este momento.";
      setSavedMessage(errorMessage);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTitle("");
    setDescription("");
    setSelectedFile(null);
  };

  return (
    <section className="reels-section">
      <div className="reels-section__hero">
        <div>
          <p className="reels-section__eyebrow">Contenido en video</p>
          <h1>Gestioná tus reels desde un solo lugar</h1>
          <p className="reels-section__subtitle">
            Subí nuevos videos, revisá el rendimiento de cada reel y mantené tu
            perfil activo con contenido visual.
          </p>
        </div>

        <div className="reels-section__hero-actions">
          <div className="reels-section__hero-badge">
            <Sparkles size={18} />
            <span>{reels.length} reels activos</span>
          </div>
          <button
            type="button"
            className="reels-section__create-btn"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={18} />
            <span>Crear Reel</span>
          </button>
        </div>
      </div>

      {savedMessage ? (
        <div className="reels-section__notice">{savedMessage}</div>
      ) : null}

      <div className="reels-section__stats">
        <article className="reels-section__stat-card">
          <div className="reels-section__stat-icon reels-section__stat-icon--views">
            <Eye size={20} />
          </div>
          <div>
            <span>Visualizaciones</span>
            <strong>{formatCompact(totalViews)}</strong>
          </div>
        </article>

        <article className="reels-section__stat-card">
          <div className="reels-section__stat-icon reels-section__stat-icon--likes">
            <Heart size={20} />
          </div>
          <div>
            <span>Me gusta</span>
            <strong>{formatCompact(totalLikes)}</strong>
          </div>
        </article>
      </div>

      <div className="reels-section__layout">
        <div className="reels-section__content-card">
          <div className="reels-section__card-header">
            <div>
              <h2>Tus reels creados</h2>
              <p>Una vista rápida del contenido que ya está cargado.</p>
            </div>
          </div>

          <div className="reels-section__grid">
            {reels.map((reel) => (
              <article key={reel.id} className="reels-section__reel-card">
                <div className="reels-section__video-wrap">
                  <video
                    src={reel.url}
                    className="reels-section__video"
                    controls
                    muted
                    preload="metadata"
                  />
                  <div className="reels-section__video-overlay">
                    <Play size={20} fill="currentColor" />
                  </div>
                </div>

                <div className="reels-section__reel-body">
                  <div>
                    <h3>{reel.title}</h3>
                    <p>{reel.description || "Sin descripción por ahora."}</p>
                  </div>

                  <div className="reels-section__reel-meta">
                    <span>
                      <Eye size={14} /> {formatCompact(reel.views)}
                    </span>
                    <span>
                      <Heart size={14} /> {formatCompact(reel.likes)}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="reels-section__remove-btn"
                    onClick={() => handleRemove(reel.id)}
                  >
                    <Trash2 size={16} />
                    <span>Eliminar</span>
                  </button>
                </div>
              </article>
            ))}
            {reels.length === 0 && !isLoading && (
              <div className="reels-section__empty-state">
                <Video size={48} className="reels-section__empty-icon" />
                <h3>No tenés reels todavía</h3>
                <p>Hacé clic en "Crear Reel" para subir tu primer video.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="reels-section__modal-overlay" onClick={closeModal}>
          <aside
            className="reels-section__modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="reels-section__modal-close" onClick={closeModal}>
              <X size={20} />
            </button>
            <div className="reels-section__card-header">
              <div>
                <h2>Subir nuevo reel</h2>
                <p>Cargá un video con título y descripción breve.</p>
              </div>
            </div>

            <div className="reels-section__form">
              <label className="reels-section__field">
                <span>Archivo de video</span>
                <label className="reels-section__upload-field">
                  <UploadCloud size={18} />
                  <span>
                    {selectedFile ? selectedFile.name : "Seleccionar archivo"}
                  </span>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                  />
                </label>
              </label>

              <label className="reels-section__field">
                <span>Título</span>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ej. Resultado final del proyecto"
                />
              </label>

              <label className="reels-section__field">
                <span>Descripción</span>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Contá qué muestra este reel y por qué es importante."
                />
              </label>

              <button
                type="button"
                className="reels-section__submit-btn"
                onClick={handleSubmit}
                disabled={!selectedFile || !title.trim() || isPublishing}
              >
                <Video size={18} />
                <span>{isPublishing ? "Procesando..." : "Crear reel"}</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
