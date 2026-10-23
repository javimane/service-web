import { AlertTriangle } from "lucide-react";
import "./WithdrawalReviewNotice.css";

export default function WithdrawalReviewNotice() {
  return (
    <p className="withdrawal-review-notice" role="note">
      <AlertTriangle size={18} aria-hidden="true" />
      <span>Podés solicitar hasta 3 cancelaciones o devoluciones por arrepentimiento por mes. Después, iniciá un reclamo por la compra.</span>
    </p>
  );
}
