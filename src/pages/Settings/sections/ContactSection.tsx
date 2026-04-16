import { Globe, Link, MessageCircle } from "lucide-react";

export default function ContactSection() {
  return (
    <article className="settings-card">
      <div className="section-header settings-header-compact">
        <div className="section-title">
          <span className="section-emoji">📲</span>
          <h2>Contact</h2>
        </div>
      </div>

      <div className="settings-fields social-links-list">
        <label className="settings-field social-field">
          <span>
            <Link size={16} /> Facebook
          </span>
          <input type="url" placeholder="https://facebook.com/tu-pagina" />
        </label>
        <label className="settings-field social-field">
          <span>
            <MessageCircle size={16} /> Instagram
          </span>
          <input type="url" placeholder="https://instagram.com/tu-perfil" />
        </label>
        <label className="settings-field social-field">
          <span>
            <Globe size={16} /> Web
          </span>
          <input type="url" placeholder="https://tuweb.com" />
        </label>
      </div>
    </article>
  );
}
