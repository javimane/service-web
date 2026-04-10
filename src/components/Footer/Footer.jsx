import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <span className="footer__logo-letter">U</span>
          <div className="footer__brand-text">
            <span className="footer__brand-name">Obsidian</span>
            <span className="footer__brand-sub">Kinetic</span>
          </div>
        </div>
        <p className="footer__copy">© 2024 Obsidian Kinetic. Architectural precision in every service.</p>
      </div>
    </footer>
  );
}
