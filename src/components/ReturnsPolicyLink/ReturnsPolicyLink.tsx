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
      <span>Políticas de devolución y arrepentimiento</span>
      <ExternalLink size={14} aria-hidden="true" />
      <span className="returns-policy-link__new-tab">(abre en otra pestaña)</span>
    </Link>
  );
}
