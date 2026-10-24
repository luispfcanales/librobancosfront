import React, { useState } from 'react';
import { loginUser } from '../services/api';

export default function Login({ onLoginSuccess }) {
  const [ruc, setRuc] = useState(localStorage.getItem('librobancos_last_ruc') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberRuc, setRememberRuc] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanRuc = ruc.trim();
    const cleanPass = password.trim();

    if (!cleanRuc) {
      setErrorMessage('Por favor ingrese su número de RUC o usuario');
      return;
    }
    if (!cleanPass) {
      setErrorMessage('Por favor ingrese su contraseña');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await loginUser({ ruc: cleanRuc, password: cleanPass });
      if (res.success) {
        if (rememberRuc) {
          localStorage.setItem('librobancos_last_ruc', cleanRuc);
        } else {
          localStorage.removeItem('librobancos_last_ruc');
        }
        onLoginSuccess(res);
      } else {
        setErrorMessage(res.message || 'Error al iniciar sesión');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error de conexión con el servidor backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at top, #f8fafc 0%, #e2e8f0 100%)',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative ambient glowing circles */}
      <div
        style={{
          position: 'absolute',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(2, 132, 199, 0.08) 0%, transparent 70%)',
          top: '-10%',
          left: '15%',
          pointerEvents: 'none',
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.06) 0%, transparent 70%)',
          bottom: '-15%',
          right: '10%',
          pointerEvents: 'none',
          filter: 'blur(50px)',
        }}
      />

      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          padding: '40px 36px',
          boxShadow: '0 20px 45px -15px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '68px',
              height: '68px',
              margin: '0 auto 16px auto',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              color: '#ffffff',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.25)',
            }}
          >
            <i className="fa-solid fa-building-columns"></i>
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: '900',
              margin: '0 0 6px 0',
              letterSpacing: '-0.5px',
              color: '#0f172a',
            }}
          >
            SISTEMA SIRE <span style={{ color: '#0284c7' }}>SUNAT</span>
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
            Gestión Multiempresa SIRE RVIE/RCE & Control de Pagos
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              padding: '12px 16px',
              borderRadius: '12px',
              marginBottom: '22px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '16px', flexShrink: 0 }}></i>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* RUC / User input */}
          <div className="input-group">
            <label
              htmlFor="login-ruc"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--text-secondary)',
                marginBottom: '8px',
              }}
            >
              <i className="fa-solid fa-id-card text-blue"></i>
              Usuario / RUC de la Empresa
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-ruc"
                type="text"
                value={ruc}
                onChange={(e) => setRuc(e.target.value)}
                placeholder="Ej. 20608032844 o admin"
                autoFocus
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.5px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#0284c7')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
              />
            </div>
          </div>

          {/* Password input */}
          <div className="input-group">
            <label
              htmlFor="login-password"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--text-secondary)',
                marginBottom: '8px',
              }}
            >
              <i className="fa-solid fa-lock text-purple"></i>
              Contraseña de Acceso
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '14px 44px 14px 16px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#0284c7')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '4px',
                }}
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          {/* Remember check */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={rememberRuc}
                onChange={(e) => setRememberRuc(e.target.checked)}
                style={{ accentColor: '#0284c7', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              Recordar mi usuario
            </label>
            <span style={{ color: '#0284c7', fontSize: '12px', fontWeight: '600' }}>
              <i className="fa-solid fa-shield-halved"></i> Acceso Seguro
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px 20px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%)',
              color: '#ffffff',
              border: 'none',
              fontSize: '15px',
              fontWeight: '800',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.25)',
              transition: 'all 0.2s ease',
              marginTop: '6px',
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span>Verificando credenciales...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-right-to-bracket"></i>
                <span>Ingresar al Sistema</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Info Box */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-color)',
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--text-muted)',
            lineHeight: '1.6',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '4px 12px', borderRadius: '8px', color: '#0284c7', marginBottom: '8px', fontWeight: '600' }}>
            <i className="fa-solid fa-circle-info"></i> Acceso Multiempresa
          </div>
          <div>Cada empresa accede con su número de RUC y la contraseña asignada por el Administrador.</div>
        </div>
      </div>
    </div>
  );
}
