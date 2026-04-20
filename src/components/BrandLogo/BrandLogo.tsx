import logoIcon from "../../images/Logo sin nombre y fondo.png";
import logoWordmark from "../../images/Logo solo nombre sin fondo.png";
import "./BrandLogo.css";

type BrandLogoProps = {
  compact?: boolean;
  className?: string;
};

export default function BrandLogo({
  compact = false,
  className = "",
}: BrandLogoProps) {
  return (
    <span
      className={[
        "brand-lockup",
        compact ? "brand-lockup--compact" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <img src={logoIcon} alt="Sercio" className="brand-lockup__icon" />
      <img src={logoWordmark} alt="Sercio" className="brand-lockup__wordmark" />
    </span>
  );
}
