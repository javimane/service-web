import { Suspense } from "react";
import PrivateRoute from "@/routes/PrivateRoute";
import MessagesPage from "@/views/Messages/MessagesPage";

export default function Page() {
  return (
    <PrivateRoute>
      <Suspense fallback={null}>
        <MessagesPage />
      </Suspense>
    </PrivateRoute>
  );
}
