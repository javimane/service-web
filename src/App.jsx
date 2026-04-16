import ThemeToggle from "./components/ThemeToggle/ThemeToggle";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { AuthModalProvider } from "./context/AuthModalContext";
import AuthModal from "./components/AuthModal/AuthModal";

function App() {
  return (
    <AuthProvider>
      <AuthModalProvider>
        <ThemeToggle />
        <AppRoutes />
        <AuthModal />
      </AuthModalProvider>
    </AuthProvider>
  );
}

export default App;
