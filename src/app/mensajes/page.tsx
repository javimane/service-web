import PrivateRoute from "@/routes/PrivateRoute";
import MessagesPage from "@/views/Messages/MessagesPage";

export default function Page() {
  return (
    <PrivateRoute>
      <MessagesPage />
    </PrivateRoute>
  );
}
