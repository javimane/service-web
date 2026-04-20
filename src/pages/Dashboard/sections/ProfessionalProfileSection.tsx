import { type ChangeEvent, useRef, useState } from "react";
import {
  Camera,
  ImagePlus,
  Save,
  Trash2,
  UserRound,
  Video,
} from "lucide-react";
import { showcasedSpecialist } from "../../../data/specialists";
import Modal from "../../../components/Modal/Modal";
import "./ProfessionalProfileSection.css";

type GalleryImage = {
  id: string;
  url: string;
};

type VideoItem = {
  id: string;
  title: string;
  url: string;
  description: string;
};

const initialImages: GalleryImage[] = showcasedSpecialist.portfolio
  .slice(0, 4)
  .map((url, index) => ({
    id: `img-${index + 1}`,
    url,
  }));

const initialVideos: VideoItem[] = [
  {
    id: "video-1",
    title: "Presentación del negocio",
    url: "https://example.com/video-presentacion.mp4",
    description: "Mostrá tu forma de trabajar y los servicios destacados.",
  },
  {
    id: "video-2",
    title: "Antes y después",
    url: "https://example.com/video-portafolio.mp4",
    description: "Compartí resultados reales para generar confianza.",
  },
];

const createId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

export default function ProfessionalProfileSection() {
  const [profilePhoto, setProfilePhoto] = useState(showcasedSpecialist.avatar);
  const [commercialName, setCommercialName] = useState("Sercio Studio");
  const [displayName, setDisplayName] = useState(showcasedSpecialist.name);
  const [description, setDescription] = useState(showcasedSpecialist.bio);
  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [videos, setVideos] = useState<VideoItem[]>(initialVideos);
  const [savedMessage, setSavedMessage] = useState("");

  // Modales para imagen y video
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Estado para imagen temporal
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const newImageInputRef = useRef<HTMLInputElement>(null);

  // Estado para video temporal
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoDescription, setNewVideoDescription] = useState("");
  const newVideoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setProfilePhoto(previewUrl);
    setSavedMessage("Foto de perfil actualizada.");
  };

  // No se edita más la imagen, solo se elimina
  const removeImage = (id: string) => {
    setImages((current) => current.filter((image) => image.id !== id));
  };

  const openImageModal = () => {
    setNewImageFile(null);
    setIsImageModalOpen(true);
    if (newImageInputRef.current) newImageInputRef.current.value = "";
  };

  const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setNewImageFile(file);
  };

  const handleAddImage = () => {
    if (!newImageFile) return;
    const url = URL.createObjectURL(newImageFile);
    setImages((current) => [...current, { id: createId("img"), url }]);
    setIsImageModalOpen(false);
    setNewImageFile(null);
  };

  // Video: solo se edita título y descripción, no el archivo
  const removeVideo = (id: string) => {
    setVideos((current) => current.filter((video) => video.id !== id));
  };

  const openVideoModal = () => {
    setNewVideoFile(null);
    setNewVideoTitle("");
    setNewVideoDescription("");
    setIsVideoModalOpen(true);
    if (newVideoInputRef.current) newVideoInputRef.current.value = "";
  };

  const handleVideoFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setNewVideoFile(file);
  };

  const handleAddVideo = () => {
    if (!newVideoFile || !newVideoTitle.trim()) return;
    const url = URL.createObjectURL(newVideoFile);
    setVideos((current) => [
      ...current,
      {
        id: createId("video"),
        title: newVideoTitle,
        url,
        description: newVideoDescription,
      },
    ]);
    setIsVideoModalOpen(false);
    setNewVideoFile(null);
    setNewVideoTitle("");
    setNewVideoDescription("");
  };

  const handleSave = () => {
    setSavedMessage("Los cambios del perfil se guardaron correctamente.");
  };

  return (
    <section className="professional-profile">
      <div className="professional-profile__hero">
        <div>
          <p className="professional-profile__eyebrow">Perfil profesional</p>
          <h1>Personalizá tu perfil público</h1>
          <p className="professional-profile__subtitle">
            Editá tu foto, nombre comercial, descripción y el contenido visual
            que verán tus clientes.
          </p>
        </div>

        <button
          type="button"
          className="professional-profile__save-btn"
          onClick={handleSave}
        >
          <Save size={18} /> Guardar cambios
        </button>
      </div>

      {savedMessage ? (
        <div className="professional-profile__notice">{savedMessage}</div>
      ) : null}

      <div className="professional-profile__layout">
        <aside className="professional-profile__preview-card">
          <div className="professional-profile__avatar-wrap">
            <img src={profilePhoto} alt={displayName} />
          </div>
          <h2>{commercialName || "Tu nombre comercial"}</h2>
          <p className="professional-profile__preview-name">
            {displayName || "Nombre del profesional"}
          </p>
          <p className="professional-profile__preview-description">
            {description ||
              "Agregá una descripción para mostrar tu propuesta de valor."}
          </p>

          <div className="professional-profile__metrics">
            <div>
              <strong>{images.length}</strong>
              <span>Imágenes</span>
            </div>
            <div>
              <strong>{videos.length}</strong>
              <span>Videos</span>
            </div>
          </div>
        </aside>

        <div className="professional-profile__editor">
          <div className="professional-profile__card">
            <div className="professional-profile__card-header">
              <UserRound size={18} />
              <h3>Datos principales</h3>
            </div>

            <div className="professional-profile__field-grid">
              <label className="professional-profile__field professional-profile__field--full">
                <span>Foto de perfil</span>
                <div className="professional-profile__photo-upload">
                  <label className="professional-profile__upload-btn">
                    <Camera size={16} /> Subir nueva foto
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                    />
                  </label>
                </div>
              </label>

              <label className="professional-profile__field">
                <span>Nombre comercial</span>
                <input
                  type="text"
                  value={commercialName}
                  onChange={(event) => setCommercialName(event.target.value)}
                  placeholder="Ej. Estudio Norte"
                />
              </label>

              <label className="professional-profile__field">
                <span>Nombre de pila / profesional</span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Ej. Juan Pérez"
                />
              </label>

              <label className="professional-profile__field professional-profile__field--full">
                <span>Descripción</span>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Contá qué hacés, tu experiencia y qué te diferencia."
                />
              </label>
            </div>
          </div>

          <div className="professional-profile__card">
            <div className="professional-profile__card-header professional-profile__card-header--between">
              <div className="professional-profile__card-title">
                <ImagePlus size={18} />
                <h3>Imágenes del perfil</h3>
              </div>
              <button
                type="button"
                className="professional-profile__add-btn"
                onClick={openImageModal}
              >
                Agregar imagen
              </button>
            </div>

            <div className="professional-profile__media-grid">
              {images.map((image) => (
                <article
                  key={image.id}
                  className="professional-profile__media-card"
                >
                  <div className="professional-profile__image-preview">
                    {image.url ? (
                      <img src={image.url} alt="Imagen del perfil" />
                    ) : (
                      <div className="professional-profile__placeholder">
                        Sin vista previa
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="professional-profile__remove-btn"
                    onClick={() => removeImage(image.id)}
                  >
                    <Trash2 size={16} /> Eliminar
                  </button>
                </article>
              ))}
            </div>
          </div>

          <div className="professional-profile__card">
            <div className="professional-profile__card-header professional-profile__card-header--between">
              <div className="professional-profile__card-title">
                <Video size={18} />
                <h3>Videos destacados</h3>
              </div>
              <button
                type="button"
                className="professional-profile__add-btn"
                onClick={openVideoModal}
              >
                Agregar video
              </button>
            </div>

            <div className="professional-profile__video-list">
              {videos.map((video) => (
                <article
                  key={video.id}
                  className="professional-profile__video-card"
                >
                  <div className="professional-profile__video-preview">
                    <Video size={22} />
                    <span>{video.title || "Video sin título"}</span>
                  </div>

                  <div className="professional-profile__field-grid professional-profile__field-grid--stacked">
                    <label className="professional-profile__field">
                      <span>Título</span>
                      <input
                        type="text"
                        value={video.title}
                        readOnly
                        placeholder="Ej. Recorrido del local"
                      />
                    </label>

                    <label className="professional-profile__field">
                      <span>URL del video</span>
                      <input
                        type="text"
                        value={video.url}
                        readOnly
                        placeholder="https://..."
                      />
                    </label>

                    <label className="professional-profile__field professional-profile__field--full">
                      <span>Descripción del video</span>
                      <textarea
                        rows={3}
                        value={video.description}
                        readOnly
                        placeholder="Contá de qué se trata este video."
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    className="professional-profile__remove-btn"
                    onClick={() => removeVideo(video.id)}
                  >
                    <Trash2 size={16} /> Eliminar
                  </button>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para subir imagen */}
      <Modal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        title="Subir imagen de perfil"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddImage();
          }}
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          <input
            type="file"
            accept="image/*"
            ref={newImageInputRef}
            onChange={handleImageFileChange}
            required
          />
          {newImageFile && (
            <img
              src={URL.createObjectURL(newImageFile)}
              alt="Vista previa"
              style={{
                maxWidth: 320,
                maxHeight: 180,
                borderRadius: 12,
                alignSelf: "center",
              }}
            />
          )}
          <button
            type="submit"
            className="professional-profile__save-btn"
            disabled={!newImageFile}
          >
            Subir imagen
          </button>
        </form>
      </Modal>

      {/* Modal para subir video */}
      <Modal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        title="Subir video destacado"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddVideo();
          }}
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          <input
            type="file"
            accept="video/*"
            ref={newVideoInputRef}
            onChange={handleVideoFileChange}
            required
          />
          {newVideoFile && (
            <video
              src={URL.createObjectURL(newVideoFile)}
              controls
              style={{
                maxWidth: 320,
                maxHeight: 180,
                borderRadius: 12,
                alignSelf: "center",
              }}
            />
          )}
          <input
            type="text"
            placeholder="Título del video"
            value={newVideoTitle}
            onChange={(e) => setNewVideoTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Descripción del video"
            value={newVideoDescription}
            onChange={(e) => setNewVideoDescription(e.target.value)}
            rows={3}
          />
          <button
            type="submit"
            className="professional-profile__save-btn"
            disabled={!newVideoFile || !newVideoTitle.trim()}
          >
            Subir video
          </button>
        </form>
      </Modal>
    </section>
  );
}
