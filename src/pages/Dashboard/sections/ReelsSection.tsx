import { type ChangeEvent, useRef, useState } from "react";
import {
  Clapperboard,
  Eye,
  Heart,
  Play,
  Sparkles,
  Trash2,
  UploadCloud,
  Video,
} from "lucide-react";
import "./ReelsSection.css";

type ReelItem = {
  id: string;
  title: string;
  description: string;
  url: string;
  views: number;
  likes: number;
};

const initialReels: ReelItem[] = [
  {
    id: "reel-1",
    title: "Recorrido del local",
    description: "Mostrá el espacio y la experiencia que vive cada cliente.",
    url: "https://www.w3schools.com/html/mov_bbb.mp4",
    views: 1240,
    likes: 187,
  },
  {
    id: "reel-2",
    title: "Antes y después",
    description:
      "Contenido ideal para destacar resultados reales y generar confianza.",
    url: "https://www.w3schools.com/html/movie.mp4",
    views: 860,
    likes: 94,
  },
];

const createId = () => `reel-${Math.random().toString(36).slice(2, 9)}`;

const formatCompact = (value: number) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return `${value}`;
};

export default function ReelsSection() {
  const [reels, setReels] = useState<ReelItem[]>(initialReels);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [savedMessage, setSavedMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const totalViews = reels.reduce((sum, reel) => sum + reel.views, 0);
  const totalLikes = reels.reduce((sum, reel) => sum + reel.likes, 0);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] ?? null);
  };

  const handleSubmit = () => {
    if (!selectedFile || !title.trim()) return;

    const url = URL.createObjectURL(selectedFile);

    setReels((current) => [
      {
        id: createId(),
        title: title.trim(),
        description: description.trim(),
        url,
        views: 0,
        likes: 0,
      },
      ...current,
    ]);

    setTitle("");
    setDescription("");
    setSelectedFile(null);
    setSavedMessage("El reel se agregó correctamente al panel.");

    if (inputRef.current) {
      inputRef.current.value = "";
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
          <div className="reels-section__stat-icon">
            <Clapperboard size={20} />
          </div>
          <div>
            <span>Reels publicados</span>
            <strong>{reels.length}</strong>
          </div>
        </article>

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
              disabled={!selectedFile || !title.trim()}
            >
              <Video size={18} />
              <span>Publicar reel</span>
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
