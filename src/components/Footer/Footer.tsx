import BrandLogo from "../BrandLogo/BrandLogo";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <div className="footer__brand-logo">
            <BrandLogo className="footer__brand-mark" />
          </div>
          <p className="footer__copy">
            © 2026 Sercio. Servicios, promociones y comercios en un solo lugar.
          </p>
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
