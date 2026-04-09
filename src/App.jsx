import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/Login/LoginPage'
import ThemeToggle from './components/ThemeToggle/ThemeToggle'
import RegisterPage from './pages/Register/RegisterPage'

function App() {
  return (
    <>
      <ThemeToggle />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}

export default App
