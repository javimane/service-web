import { type ChangeEvent, useRef, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  ImagePlus,
  Save,
  Trash2,
  UserRound,
  Video,
  Loader2,
} from "lucide-react";
import Modal from "../../../components/Modal/Modal";
import {
  uploadProfileImage,
  uploadProfileWorkImage,
} from "../../../services/storageUploads";
import { multimediaService } from "../../../services/multimediaService";
import { videosService } from "../../../services/videosService";
import { professionalImagesService } from "../../../services/professionalImagesService";
import { profileService } from "../../../services/profileService";
import { useAuth } from "../../../context/AuthContext";
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

const createId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80";

export default function ProfessionalProfileSection() {
  const { sessionStatus } = useAuth();
  const userId = sessionStatus?.user?.id;
  const professionalId = sessionStatus?.subscription?.professional_id;
  const queryClient = useQueryClient();

  // Profile Query
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => profileService.getProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Videos Query
  const { data: videos = [], isLoading: isVideosLoading } = useQuery({
    queryKey: ["videos", professionalId],
    queryFn: async () => {
      if (!professionalId) return [];
      const data = await videosService.list();
      const filtered = data.filter(
        (v) => v.professional_id === professionalId && v.activate === true,
      );
      return filtered.map((v) => ({
        id: v.id.toString(),
        title: v.title || "",
        url: v.video_url,
        description: v.description || "",
      }));
    },
    enabled: !!professionalId,
    staleTime: 5 * 60 * 1000,
  });

  // Images Query
  const { data: images = [], isLoading: isImagesLoading } = useQuery({
    queryKey: ["professionalImages", professionalId],
    queryFn: async () => {
      if (!professionalId) return [];
      const data = await professionalImagesService.findAllByProfessionalId(professionalId);
      return data.map((img) => ({
        id: img.id.toString(),
        url: img.image_url,
      }));
    },
    enabled: !!professionalId,
    staleTime: 5 * 60 * 1000,
  });

  const [profilePhoto, setProfilePhoto] = useState("");
  const [commercialName, setCommercialName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [isPublishingVideo, setIsPublishingVideo] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      if (profile.avatar_url) setProfilePhoto(profile.avatar_url);
      if (profile.portfolio_image_url) {
        // optionally handle initialImages vs DB images here
      }
    }
  }, [profile]);

  useEffect(() => {
    if (savedMessage) {
      const timer = setTimeout(() => {
        setSavedMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [savedMessage]);

  // Modales para imagen y video
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Estado para imagen temporal
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const newImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!newImageFile) {
      setImagePreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(newImageFile);
    setImagePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [newImageFile]);

  // Estado para video temporal
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoDescription, setNewVideoDescription] = useState("");
  const newVideoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    const objectUrl = URL.createObjectURL(file);
    setProfilePhoto(objectUrl);

    try {
      const uploaded = await uploadProfileImage({
        file,
        entityId: displayName || "profile",
        fileName: file.name,
      });
      setProfilePhoto(uploaded.publicUrl);
      
      // Update profile with the new image
      await profileService.updateProfile(userId, { portfolio_image_url: uploaded.publicUrl });
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });

      setSavedMessage("Foto de perfil actualizada.");
    } catch {
      setSavedMessage("No se pudo subir la foto de perfil.");
    }
  };

  const handleAddImage = async () => {
    if (!newImageFile || !userId || !professionalId) return;

    try {
      const uploaded = await uploadProfileWorkImage({
        file: newImageFile,
        entityId: displayName || "profile-work",
        fileName: newImageFile.name,
      });
      
      const newImage = await professionalImagesService.create({
        image_url: uploaded.publicUrl,
      });
      
      // Once the image is uploaded to imagePortfolio, update profile's portfolio_image_url
      await profileService.updateProfile(userId, { portfolio_image_url: uploaded.publicUrl });
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });

      queryClient.setQueryData(["professionalImages", professionalId], (current: GalleryImage[] = []) => [
        ...current,
        { id: newImage.id.toString(), url: newImage.image_url },
      ]);
      
      setIsImageModalOpen(false);
      setNewImageFile(null);
      setSavedMessage("Imagen del perfil subida correctamente.");
    } catch {
      setSavedMessage("No se pudo subir la imagen del perfil.");
    }
  };

  // No se edita más la imagen, solo se elimina
  const removeImage = async (id: string) => {
    try {
      await professionalImagesService.delete(id);
      queryClient.setQueryData(["professionalImages", professionalId], (current: GalleryImage[] = []) => 
        current.filter((image) => image.id !== id)
      );
    } catch {
      setSavedMessage("No se pudo eliminar la imagen.");
    }
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

  // Video: solo se edita título y descripción, no el archivo
  const removeVideo = async (id: string) => {
    try {
      await videosService.delete(id);
      queryClient.setQueryData(["videos", professionalId], (current: VideoItem[] = []) => 
        current.filter((video) => video.id !== id)
      );
    } catch {
      setSavedMessage("No se pudo eliminar el video.");
    }
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

  const handleAddVideo = async () => {
    if (!newVideoFile || !newVideoTitle.trim() || !professionalId) return;

    try {
      setIsPublishingVideo(true);
      setIsVideoModalOpen(false); // Close immediately
      setSavedMessage("Procesando, le notificaremos cuando esté disponible el video."); // Cartel de aviso

      const { uploadUrl, key } = await multimediaService.getUploadUrl(
        professionalId,
        newVideoFile.name,
        newVideoFile.type,
        "PROFILE", // O "REEL", pero usamos PROFILE para videos del portfolio
      );

      await multimediaService.uploadToPresignedUrl(uploadUrl, newVideoFile);

      const newVideo = await videosService.create({
        professional_id: professionalId,
        title: newVideoTitle.trim(),
        description: newVideoDescription.trim(),
        video_url: key,
      });

      // Poll until activated (like ReelsSection)
      let activatedVideo = newVideo;
      const MAX_ATTEMPTS = 10;
      const POLL_INTERVAL_MS = 6000;
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        if (activatedVideo.activate === true) break;
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        activatedVideo = await videosService.getById(activatedVideo.id.toString());
      }

      if (activatedVideo.activate !== true) {
        setSavedMessage(
          "El video se subió pero aún está siendo procesado. Revisá más tarde.",
        );
      } else {
        queryClient.setQueryData(["videos", professionalId], (current: VideoItem[] = []) => [
          {
            id: activatedVideo.id.toString(),
            title: activatedVideo.title || "",
            url: activatedVideo.video_url,
            description: activatedVideo.description || "",
          },
          ...current,
        ]);
        setSavedMessage("El video se publicó y se guardó correctamente.");
      }

      setNewVideoFile(null);
      setNewVideoTitle("");
      setNewVideoDescription("");

      if (newVideoInputRef.current) {
        newVideoInputRef.current.value = "";
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo publicar el video en este momento.";
      setSavedMessage(errorMessage);
    } finally {
      setIsPublishingVideo(false);
    }
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
            <img src={imagePreviewUrl || profilePhoto || DEFAULT_AVATAR} alt={displayName || "Tu nombre"} />
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
          {newImageFile && imagePreviewUrl && (
            <img
              src={imagePreviewUrl}
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
            disabled={!newVideoFile || !newVideoTitle.trim() || isPublishingVideo}
          >
            {isPublishingVideo ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Procesando...
              </>
            ) : (
              "Subir video"
            )}
          </button>
        </form>
      </Modal>
    </section>
  );
}
