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
  X,
  Upload,
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
import { professionalService } from "../../../services/professionalService";
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

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80";

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

  // Professional Query
  const { data: professional, isLoading: isProfessionalLoading } = useQuery({
    queryKey: ["professional-detail", professionalId],
    queryFn: () => professionalService.getDetail(professionalId!),
    enabled: !!professionalId,
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
      const data =
        await professionalImagesService.findAllByProfessionalId(professionalId);
      return data.map((img) => ({
        id: img.id.toString(),
        url: img.image_url,
      }));
    },
    enabled: !!professionalId,
    staleTime: 5 * 60 * 1000,
  });

  const [profilePhoto, setProfilePhoto] = useState("");
  const [profilePhotoFileName, setProfilePhotoFileName] = useState("");
  const [commercialName, setCommercialName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [isMatriculate, setIsMatriculate] = useState(false);
  const [attendsEmergency, setAttendsEmergency] = useState(false);
  const [webUrl, setWebUrl] = useState("");
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
    if (professional) {
      setDescription(professional.bio || "");
      setIsMatriculate(Boolean(professional.is_matriculate));
      setAttendsEmergency(Boolean(professional.emergency));
      setWebUrl(professional.web_url || "");
    }
  }, [professional]);

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
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const profilePhotoObjectUrlRef = useRef<string | null>(null);
  const newImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (newImageFiles.length === 0) {
      setImagePreviewUrls([]);
      return;
    }
    const urls = newImageFiles.map((f) => URL.createObjectURL(f));
    setImagePreviewUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [newImageFiles]);

  useEffect(() => {
    return () => {
      if (profilePhotoObjectUrlRef.current) {
        URL.revokeObjectURL(profilePhotoObjectUrlRef.current);
      }
    };
  }, []);

  // Estado para video temporal
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoDescription, setNewVideoDescription] = useState("");
  const newVideoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Actualizar nombre y preview de forma inmediata, sin esperar el upload
    setProfilePhotoFileName(file.name);

    if (profilePhotoObjectUrlRef.current) {
      URL.revokeObjectURL(profilePhotoObjectUrlRef.current);
      profilePhotoObjectUrlRef.current = null;
    }

    const objectUrl = URL.createObjectURL(file);
    profilePhotoObjectUrlRef.current = objectUrl;
    setProfilePhoto(objectUrl);

    if (!userId) return;

    try {
      const uploaded = await uploadProfileImage({
        file,
        entityId: displayName || "profile",
        fileName: file.name,
      });

      if (profilePhotoObjectUrlRef.current) {
        URL.revokeObjectURL(profilePhotoObjectUrlRef.current);
        profilePhotoObjectUrlRef.current = null;
      }

      setProfilePhoto(uploaded.publicUrl);

      await profileService.updateProfile(userId, {
        portfolio_image_url: uploaded.publicUrl,
      });
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });

      setSavedMessage("Foto de perfil actualizada.");
    } catch {
      setSavedMessage("No se pudo subir la foto de perfil.");
    }
  };

  const handleAddImage = async () => {
    if (newImageFiles.length === 0 || !userId || !professionalId) return;

    try {
      const uploadedImages = await Promise.all(
        newImageFiles.map(async (file) => {
          const uploaded = await uploadProfileWorkImage({
            file,
            entityId: displayName || "profile-work",
            fileName: file.name,
          });
          const newImage = await professionalImagesService.create({
            image_url: uploaded.publicUrl,
          });
          return { id: newImage.id.toString(), url: newImage.image_url };
        }),
      );

      const lastUrl = uploadedImages[uploadedImages.length - 1].url;
      await profileService.updateProfile(userId, {
        portfolio_image_url: lastUrl,
      });
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });

      queryClient.setQueryData(
        ["professionalImages", professionalId],
        (current: GalleryImage[] = []) => [...current, ...uploadedImages],
      );

      setIsImageModalOpen(false);
      setNewImageFiles([]);
      setSavedMessage(
        `${uploadedImages.length} imagen${uploadedImages.length > 1 ? "es" : ""} subida${uploadedImages.length > 1 ? "s" : ""} correctamente.`,
      );
    } catch {
      setSavedMessage("No se pudo subir alguna de las imágenes.");
    }
  };

  // No se edita más la imagen, solo se elimina
  const removeImage = async (id: string) => {
    try {
      await professionalImagesService.delete(id);
      queryClient.setQueryData(
        ["professionalImages", professionalId],
        (current: GalleryImage[] = []) =>
          current.filter((image) => image.id !== id),
      );
    } catch {
      setSavedMessage("No se pudo eliminar la imagen.");
    }
  };

  const openImageModal = () => {
    setNewImageFiles([]);
    setIsImageModalOpen(true);
    if (newImageInputRef.current) newImageInputRef.current.value = "";
  };

  const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewImageFiles((prev) => [...prev, ...files]);
  };

  const removeImageFromPreview = (index: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Video: solo se edita título y descripción, no el archivo
  const removeVideo = async (id: string) => {
    try {
      await videosService.delete(id);
      queryClient.setQueryData(
        ["videos", professionalId],
        (current: VideoItem[] = []) =>
          current.filter((video) => video.id !== id),
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
      setSavedMessage(
        "Procesando, le notificaremos cuando esté disponible el video.",
      ); // Cartel de aviso

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
        activatedVideo = await videosService.getById(
          activatedVideo.id.toString(),
        );
      }

      if (activatedVideo.activate !== true) {
        setSavedMessage(
          "El video se subió pero aún está siendo procesado. Revisá más tarde.",
        );
      } else {
        queryClient.setQueryData(
          ["videos", professionalId],
          (current: VideoItem[] = []) => [
            {
              id: activatedVideo.id.toString(),
              title: activatedVideo.title || "",
              url: activatedVideo.video_url,
              description: activatedVideo.description || "",
            },
            ...current,
          ],
        );
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;

      await profileService.updateProfile(userId, {
        display_name: displayName || null,
      });

      if (professionalId) {
        await professionalService.update(professionalId, {
          bio: description || null,
          is_matriculate: isMatriculate,
          emergency: attendsEmergency,
          web_url: webUrl || null,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      queryClient.invalidateQueries({
        queryKey: ["professional-detail", professionalId],
      });
      setSavedMessage("Los cambios del perfil se guardaron correctamente.");
    },
    onError: () => {
      setSavedMessage("No se pudieron guardar los cambios del perfil.");
    },
  });

  const handleSave = () => {
    saveMutation.mutate();
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
          disabled={
            saveMutation.isPending || isProfileLoading || isProfessionalLoading
          }
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 size={18} className="professional-profile__spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save size={18} /> Guardar cambios
            </>
          )}
        </button>
      </div>

      {savedMessage ? (
        <div className="professional-profile__notice">{savedMessage}</div>
      ) : null}

      <div className="professional-profile__layout">
        <aside className="professional-profile__preview-card">
          <div className="professional-profile__avatar-wrap">
            <img
              src={profilePhoto || DEFAULT_AVATAR}
              alt={displayName || "Tu nombre"}
            />
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
                  <span className="professional-profile__file-name">
                    {profilePhotoFileName || "Ningún archivo seleccionado"}
                  </span>
                </div>
                {profilePhoto ? (
                  <div className="professional-profile__photo-preview">
                    <img src={profilePhoto} alt="Vista previa foto de perfil" />
                  </div>
                ) : null}
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

              <label className="professional-profile__field professional-profile__field--full">
                <span>Sitio Web / Portfolio (URL)</span>
                <input
                  type="url"
                  value={webUrl}
                  onChange={(e) => setWebUrl(e.target.value)}
                  placeholder="https://tusitio.com"
                />
              </label>

              <label className="professional-profile__field">
                <span>¿Sos matriculado?</span>
                <select
                  value={isMatriculate ? "si" : "no"}
                  onChange={(event) =>
                    setIsMatriculate(event.target.value === "si")
                  }
                >
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </label>

              <label className="professional-profile__field">
                <span>¿Atendés urgencias?</span>
                <select
                  value={attendsEmergency ? "si" : "no"}
                  onChange={(event) =>
                    setAttendsEmergency(event.target.value === "si")
                  }
                >
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </label>
            </div>
          </div>

          <div className="professional-profile__card">
            <div className="professional-profile__card-header professional-profile__card-header--between">
              <div className="professional-profile__card-title">
                <ImagePlus size={18} />
                <h3>Imágenes de presentación</h3>
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
                      <img src={image.url} alt="Imagen de presentación" />
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
                <h3>Videos de presentación</h3>
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
                    <span>
                      {video.title || "Video de presentación sin título"}
                    </span>
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
                        placeholder="Contá de qué se trata este video de presentación."
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
        title="Subir imágenes de presentación"
      >
        <div className="professional-profile__modal-content">
          <label className="professional-profile__dropzone">
            <input
              type="file"
              accept="image/*"
              multiple
              ref={newImageInputRef}
              onChange={handleImageFileChange}
              style={{ display: "none" }}
            />
            <div className="professional-profile__dropzone-inner">
              <div className="professional-profile__dropzone-icon">
                <Upload size={32} />
              </div>
              <div className="professional-profile__dropzone-text">
                <p>Haz clic para seleccionar imágenes</p>
                <span>Podés subir varias fotos al mismo tiempo</span>
              </div>
            </div>
          </label>

          {imagePreviewUrls.length > 0 && (
            <div className="professional-profile__modal-preview-container">
              <p className="professional-profile__preview-count">
                {imagePreviewUrls.length}{" "}
                {imagePreviewUrls.length === 1 ? "imagen seleccionada" : "imágenes seleccionadas"}
              </p>
              <div className="professional-profile__modal-preview-grid">
                {imagePreviewUrls.map((url, i) => (
                  <div key={`${url}-${i}`} className="professional-profile__modal-preview-item">
                    <img
                      src={url}
                      alt={`Vista previa ${i + 1}`}
                      className="professional-profile__modal-preview-img"
                    />
                    <button
                      type="button"
                      className="professional-profile__modal-preview-remove"
                      onClick={() => removeImageFromPreview(i)}
                      title="Quitar imagen"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="professional-profile__modal-actions">
            <button
              type="button"
              className="professional-profile__cancel-btn"
              onClick={() => setIsImageModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="professional-profile__save-btn"
              onClick={handleAddImage}
              disabled={newImageFiles.length === 0}
            >
              {newImageFiles.length > 1
                ? `Subir ${newImageFiles.length} imágenes`
                : "Subir imagen"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal para subir video */}
      <Modal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        title="Subir video de presentación"
      >
        <div className="professional-profile__modal-content">
          {!newVideoFile ? (
            <label className="professional-profile__dropzone">
              <input
                type="file"
                accept="video/*"
                ref={newVideoInputRef}
                onChange={handleVideoFileChange}
                style={{ display: "none" }}
              />
              <div className="professional-profile__dropzone-inner">
                <div className="professional-profile__dropzone-icon">
                  <Upload size={32} />
                </div>
                <div className="professional-profile__dropzone-text">
                  <p>Haz clic para seleccionar un video</p>
                  <span>Formatos recomendados: MP4, MOV (Máx. 50MB)</span>
                </div>
              </div>
            </label>
          ) : (
            <div className="professional-profile__video-preview-container">
              <div className="professional-profile__video-preview-wrapper">
                <video
                  src={URL.createObjectURL(newVideoFile)}
                  controls
                  className="professional-profile__video-preview-element"
                />
                <button
                  type="button"
                  className="professional-profile__video-remove"
                  onClick={() => setNewVideoFile(null)}
                  title="Quitar video"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="professional-profile__field-grid professional-profile__field-grid--stacked">
                <label className="professional-profile__field">
                  <span>Título del video</span>
                  <input
                    type="text"
                    placeholder="Ej. Recorrido del local"
                    value={newVideoTitle}
                    onChange={(e) => setNewVideoTitle(e.target.value)}
                    required
                  />
                </label>
                <label className="professional-profile__field">
                  <span>Descripción</span>
                  <textarea
                    placeholder="Contá de qué se trata este video de presentación."
                    value={newVideoDescription}
                    onChange={(e) => setNewVideoDescription(e.target.value)}
                    rows={3}
                  />
                </label>
              </div>
            </div>
          )}

          <div className="professional-profile__modal-actions">
            <button
              type="button"
              className="professional-profile__cancel-btn"
              onClick={() => setIsVideoModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="professional-profile__save-btn"
              onClick={handleAddVideo}
              disabled={!newVideoFile || !newVideoTitle.trim() || isPublishingVideo}
            >
              {isPublishingVideo ? (
                <>
                  <Loader2 size={18} className="professional-profile__spin" /> Procesando...
                </>
              ) : (
                "Subir video"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
