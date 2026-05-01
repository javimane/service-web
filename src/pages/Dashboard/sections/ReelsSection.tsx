import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Eye,
  Heart,
  Play,
  Sparkles,
  Trash2,
  UploadCloud,
  Video,
} from "lucide-react";
import { multimediaService } from "../../../services/multimediaService";
import { reelsService } from "../../../services/reelsService";
import { useAuth } from "../../../context/AuthContext";
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

const createId = () => `reel-${Math.random().toString(36).slice(2, 9)}`;

const formatCompact = (value: number) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return `${value}`;
};

export default function ReelsSection() {
  const { sessionStatus } = useAuth();
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [savedMessage, setSavedMessage] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const professionalId = sessionStatus?.subscription?.professional_id;
  
  const totalViews = useMemo(
    () => reels.reduce((sum, reel) => sum + reel.views, 0),
    [reels]
  );

  const totalLikes = useMemo(
    () => reels.reduce((sum, reel) => sum + reel.likes, 0),
    [reels]
  );

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] ?? null);
  };

  const fetchReels = async () => {
    if (!professionalId) return;
    try {
      setIsLoading(true);
      // For now, using list and filtering locally or if the API supports it,
      // but let's assume we might need a specific endpoint later.
      // The current list endpoint in reelsService doesn't support professionalId yet,
      // so we might just show what we have or the user might add it.
      const data = await reelsService.list();
      const filtered = data.filter(r => r.professional_id === professionalId);
      
      setReels(filtered.map(r => ({
        id: r.id.toString(),
        title: r.title || "",
        description: r.description || "",
        url: r.video_url,
        storageKey: "", // Not returned by API usually
        views: r.views_count || 0,
        likes: r.likes || 0,
      })));
    } catch (error) {
      console.error("Error fetching reels:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, [professionalId]);

  const handleSubmit = async () => {
    if (!selectedFile || !title.trim() || !professionalId) return;

    try {
      setIsPublishing(true);
      setSavedMessage("");

      const { uploadUrl, key } = await multimediaService.getUploadUrl(
        selectedFile.name,
        selectedFile.type,
        "REEL"
      );

      await multimediaService.uploadToPresignedUrl(uploadUrl, selectedFile);

      // Now create the reel in the database
      const newReel = await reelsService.create({
        professional_id: professionalId,
        title: title.trim(),
        description: description.trim(),
        video_url: key, // Sending the key as the URL, backend might handle it
      });

      setReels((current) => [
        {
          id: newReel.id.toString(),
          title: newReel.title || "",
          description: newReel.description || "",
          url: newReel.video_url,
          storageKey: key,
          views: newReel.views_count || 0,
          likes: newReel.likes || 0,
        },
        ...current,
      ]);

      setTitle("");
      setDescription("");
      setSelectedFile(null);
      setSavedMessage("El reel se publicó y se guardó en AWS correctamente.");

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

  const handleRemove = (id: string) => {
    setReels((current) => current.filter((reel) => reel.id !== id));
    setSavedMessage("El reel fue eliminado del panel.");
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

        <div className="reels-section__hero-badge">
          <Sparkles size={18} />
          <span>{reels.length} reels activos</span>
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
          </div>
        </div>

        <aside className="reels-section__content-card reels-section__content-card--form">
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
              <span>{isPublishing ? "Publicando..." : "Publicar reel"}</span>
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
