import { type ChangeEvent, type FormEvent, type RefObject } from "react";
import { UploadCloud } from "lucide-react";
import Modal from "../Modal/Modal";
import "./ReelsModal.css";

export type ReelItem = {
  id: number;
  title: string;
  url: string;
  description: string;
};

type ReelsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  reels: ReelItem[];
  newReelTitle: string;
  newReelDescription: string;
  newReelFile: File | null;
  reelInputRef: RefObject<HTMLInputElement | null>;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function ReelsModal({
  isOpen,
  onClose,
  reels,
  newReelTitle,
  newReelDescription,
  newReelFile,
  reelInputRef,
  onTitleChange,
  onDescriptionChange,
  onFileChange,
  onSubmit,
}: ReelsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tus Reels">
      <div className="reels-modal-content">
        <section className="reels-modal-content__panel">
          <div className="reels-modal-content__header">
            <div>
              <h3>Tus reels publicados</h3>
              <p>
                Un espacio más compacto para revisar y cargar nuevo contenido.
              </p>
            </div>
          </div>

          <div className="reels-modal-content__list">
            {reels.map((reel) => (
              <article key={reel.id} className="reels-modal-content__card">
                <video
                  src={reel.url}
                  className="reels-modal-content__video"
                  controls
                  muted
                  preload="metadata"
                />
                <div className="reels-modal-content__meta">
                  <h4>{reel.title}</h4>
                  <p>{reel.description}</p>
                </div>
              </article>
            ))}
          </div>

          <form className="reels-modal-content__form" onSubmit={onSubmit}>
            <div className="reels-modal-content__form-title">
              Agregar nuevo reel
            </div>
            <label className="reels-modal-content__field">
              <span>Archivo de video</span>
              <input
                type="file"
                accept="video/*"
                ref={reelInputRef}
                onChange={onFileChange}
                required
              />
            </label>
            <label className="reels-modal-content__field">
              <span>Título</span>
              <input
                type="text"
                placeholder="Título del reel"
                value={newReelTitle}
                onChange={(event) => onTitleChange(event.target.value)}
                required
              />
            </label>
            <label className="reels-modal-content__field">
              <span>Descripción</span>
              <textarea
                placeholder="Descripción"
                value={newReelDescription}
                onChange={(event) => onDescriptionChange(event.target.value)}
                rows={3}
              />
            </label>
            <button
              type="submit"
              className="reels-modal-content__submit"
              disabled={!newReelFile || !newReelTitle.trim()}
            >
              <UploadCloud size={16} />
              <span>Subir Reel</span>
            </button>
          </form>
        </section>
      </div>
    </Modal>
  );
}
