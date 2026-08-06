import { Suspense } from "react";
import ReelsPage from "@/views/Reels/ReelsPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ReelsPage />
    </Suspense>
  );
}