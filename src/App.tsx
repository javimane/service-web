import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { AuthModalProvider } from "./context/AuthModalContext";
import AuthModal from "./components/AuthModal/AuthModal";
import SessionTimeoutOverlay from "./components/SessionTimeoutOverlay/SessionTimeoutOverlay";

function App() {
  return (
    <AuthProvider>
      <AuthModalProvider>
        <AppRoutes />
        <AuthModal />
        <SessionTimeoutOverlay />
      </AuthModalProvider>
    </AuthProvider>
  );
}

export default App;
