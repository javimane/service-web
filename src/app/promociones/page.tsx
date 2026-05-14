import { Suspense } from "react";
import PromotionsPage from "@/views/Promotions/PromotionsPage";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PromotionsPage />
    </Suspense>
  );
}
