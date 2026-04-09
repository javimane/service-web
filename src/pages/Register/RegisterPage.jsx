import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import './RegisterPage.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const validate = () => {
    const newErrors = {};

    if (!formData.name) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre es muy corto';
    }

    if (!formData.email) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'El formato del correo es inválido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Debe tener al menos 6 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirme su contraseña';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setAuthError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setAuthError('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
          }
        }
      });

      if (error) {
        setAuthError(error.message);
      } else {
        alert('¡Cuenta creada exitosamente! Por favor revise su correo.');
        navigate('/login');
      }
    } catch (err) {
      setAuthError('Error inesperado al intentar crear la cuenta: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="brand-content">
          <h1 className="brand-title">Obsidian Pro</h1>
          <p className="brand-subtitle">
            Únase a la nueva generación de interfaces arquitectónicas y servicios profesionales.
          </p>
          
          <div className="hero-graphic">
            <div className="hero-mesh"></div>
            <div className="status-pill status-pill--blue">
              <span className="status-dot status-dot--blue"></span>
              REGISTRATION: OPEN
            </div>
          </div>
        </div>
      </div>
      
      <div className="login-right">
        <div className="login-card register-card">
          <h2 className="login-title">Crear Cuenta</h2>
          <p className="login-subtitle">Complete los datos para registrarse en el panel.</p>
          
          <form className="login-form register-form" onSubmit={handleSubmit} noValidate>
            <div className="input-group">
              <label htmlFor="name">NOMBRE COMPLETO</label>
              <div className={`input-wrapper ${errors.name ? 'has-error' : ''}`}>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej. Juan Pérez"
                />
                <span className="input-icon">👤</span>
              </div>
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="email">CORREO ELECTRÓNICO</label>
              <div className={`input-wrapper ${errors.email ? 'has-error' : ''}`}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="arquitecto@obsidian.pro"
                />
                <span className="input-icon">@</span>
              </div>
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-row">
              <div className="input-group">
                <label htmlFor="password">CONTRASEÑA</label>
                <div className={`input-wrapper ${errors.password ? 'has-error' : ''}`}>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                  />
                  <span className="input-icon">🔒</span>
                </div>
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="confirmPassword">CONFIRMAR</label>
                <div className={`input-wrapper ${errors.confirmPassword ? 'has-error' : ''}`}>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                  />
                  <span className="input-icon">✔️</span>
                </div>
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>
            </div>

            {authError && <div className="auth-error-alert">{authError}</div>}

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Creando cuenta...' : 'Registrarse'}
            </button>
            
            <p className="register-prompt">
              ¿Ya tienes una cuenta? <Link to="/login">Ingresar</Link>
            </p>
          </form>
        </div>
        
        <div className="footer-links">
          <span>© 2024 OBSIDIAN PRO. ARCHITECTURAL PRECISION IN EVERY SERVICE.</span>
          <div className="footer-right">
            <a href="#">PRIVACY POLICY</a>
            <a href="#">SUPPORT</a>
          </div>
        </div>
      </div>
    </div>
  );
}
