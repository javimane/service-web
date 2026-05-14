import { Globe } from "lucide-react";

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
            <Globe size={16} /> Web
          </span>
          <input type="url" placeholder="https://tuweb.com" />
        </label>
      </div>
    </article>
  );
}
