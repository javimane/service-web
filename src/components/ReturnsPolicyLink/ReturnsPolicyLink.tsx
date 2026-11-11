import Link from "next/link";
import { ExternalLink } from "lucide-react";
import "./ReturnsPolicyLink.css";

export default function ReturnsPolicyLink() {
  return (
    <Link
      className="returns-policy-link"
      href="/devoluciones"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span>Políticas de devolución,arrepentimiento y cancelación</span>
      <ExternalLink size={14} aria-hidden="true" />
    </Link>
  );
}
