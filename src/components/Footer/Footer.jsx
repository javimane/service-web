import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <div className="footer__brand-logo">
            <span className="footer__logo-text">OBSIDIAN PRO</span>
          </div>
          <p className="footer__copy">© 2024 Obsidian Pro. Architectural precision in every service.</p>
        </div>
        
        <div className="footer__links">
          <a href="#">Legal</a>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">API</a>
          <a href="#">Support</a>
        </div>
      </div>
    </footer>
  );
}

