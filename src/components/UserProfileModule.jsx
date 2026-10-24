import React, { useState, useEffect } from 'react';
import { saveCredentialsToFirebase, saveUser } from '../services/api';

export default function UserProfileModule({
  creds,
  setCreds,
  currentUser,
  companiesList = [],
  onSelectCompany,
  onProfileUpdated,
  onNavigateToModule,
}) {
  const [formData, setFormData] = useState({
    empresa: '',
    sunatRuc: '',
    clientId: '',
    clientSecret: '',
    userSol: '',
    claveSol: '',
    newAppPassword: '',
    confirmAppPassword: '',
  });

  const [showClientSecret, setShowClientSecret] = useState(false);
  const [showClaveSol, setShowClaveSol] = useState(false);
  const [showAppPassword, setShowAppPassword] = useState(false);

  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState({ text: '', type: '' });

  useEffect(() => {
    if (creds) {
      setFormData({
        empresa: creds.empresa || currentUser?.razonSocial || '',
        sunatRuc: creds.sunatRuc || currentUser?.ruc || '',
        clientId: creds.clientId || '',
        clientSecret: creds.clientSecret || '',
        userSol: creds.userSol || '',
        claveSol: creds.claveSol || '',
        newAppPassword: '',
        confirmAppPassword: '',
      });
    }
  }, [creds, currentUser]);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newAppPassword && formData.newAppPassword !== formData.confirmAppPassword) {
      setNotice({ text: 'Las nuevas contraseñas de acceso no coinciden.', type: 'error' });
      return;
    }

    setSaving(true);
    setNotice({ text: '', type: '' });

    try {
      // 1. Guardar credenciales de SUNAT en Firebase Firestore
      const credsPayload = {
        empresa: formData.empresa.trim(),
        clientId: formData.clientId.trim(),
        clientSecret: formData.clientSecret.trim(),
        ruc: formData.sunatRuc.trim(),
        username: formData.userSol.trim(),
        password: formData.claveSol.trim(),
      };

      await saveCredentialsToFirebase(credsPayload);

      // 2. Si se ingresó una nueva contraseña o cambió la razón social, actualizar en usuarios
      if (formData.newAppPassword.trim() || formData.empresa.trim()) {
        const userUpdatePayload = {
          ruc: formData.sunatRuc.trim(),
          razonSocial: formData.empresa.trim(),
          role: currentUser?.role || 'empresa',
          allowedModules: currentUser?.allowedModules || ['sire', 'payments', 'profile', 'history'],
          activo: true,
        };
        if (formData.newAppPassword.trim()) {
          userUpdatePayload.password = formData.newAppPassword.trim();
        }
        await saveUser(userUpdatePayload);
      }

      // 3. Actualizar estado global en App.jsx
      setCreds((prev) => ({
        ...prev,
        empresa: formData.empresa.trim(),
        sunatRuc: formData.sunatRuc.trim(),
        clientId: formData.clientId.trim(),
        clientSecret: formData.clientSecret.trim(),
        userSol: formData.userSol.trim(),
        claveSol: formData.claveSol.trim(),
      }));

      setNotice({ text: '✅ Perfil y credenciales actualizados exitosamente en Firebase Firestore.', type: 'success' });
      if (onProfileUpdated) onProfileUpdated();

      // Limpiar campos de contraseña
      setFormData((prev) => ({ ...prev, newAppPassword: '', confirmAppPassword: '' }));
      setTimeout(() => setNotice({ text: '', type: '' }), 5000);
    } catch (err) {
      setNotice({ text: 'Error al guardar cambios de perfil: ' + err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const maskSecret = (str) => {
    if (!str) return '••••••••';
    if (str.length <= 6) return '••••••••';
    return str.substring(0, 4) + '••••' + str.substring(str.length - 2);
  };

  const hasCredentialsConfigured = Boolean(formData.clientId && formData.clientSecret && formData.userSol && formData.claveSol);

  return (
    <div className="user-profile-module" style={{ paddingBottom: '30px' }}>
      {/* Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
          border: '1px solid var(--border-color)',
          marginBottom: '24px',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-id-card-clip text-purple"></i> Mi Perfil & Credenciales SUNAT
            </h2>
            <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
              Administre la información de su empresa, sus credenciales SOL y Client API de SUNAT guardadas en Firebase Firestore.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: '700',
                padding: '6px 14px',
                borderRadius: '20px',
                background: 'rgba(124, 58, 237, 0.1)',
                color: '#7c3aed',
                border: '1px solid rgba(124, 58, 237, 0.25)',
              }}
            >
              <i className="fa-solid fa-database" style={{ marginRight: '6px' }}></i> Firebase Firestore Sync
            </span>

            {onNavigateToModule && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onNavigateToModule('sire')}
                style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fa-solid fa-cloud-arrow-down text-red"></i> Ir a Consulta SIRE
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1fr) 380px', gap: '24px', alignItems: 'start' }}>
        {/* Formulario Principal de Configuración */}
        <div className="card" style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)' }}>
              <i className="fa-solid fa-pen-to-square text-blue" style={{ marginRight: '8px' }}></i>
              Editar Datos de la Empresa y Credenciales
            </h3>
            <span style={{ fontSize: '11px', background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', padding: '3px 10px', borderRadius: '12px', fontWeight: '700' }}>
              RUC: {formData.sunatRuc || 'N/A'}
            </span>
          </div>

          {/* Alertas */}
          {notice.text && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                marginBottom: '20px',
                fontSize: '13px',
                fontWeight: '600',
                background: notice.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: notice.type === 'error' ? '#fca5a5' : '#34d399',
                border: `1px solid ${notice.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              }}
            >
              {notice.text}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Bloque 1: Identificación de la Empresa */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <i className="fa-solid fa-building"></i> 1. Información General de la Empresa
              </span>

              {currentUser?.role === 'admin' && companiesList && companiesList.length > 0 && (
                <div className="input-group" style={{ background: '#f0f9ff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                  <label htmlFor="companySelectorAdmin" style={{ fontSize: '12px', fontWeight: '700', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-building-circle-check"></i> Empresa a Configurar (Modo Administrador):
                  </label>
                  <select
                    id="companySelectorAdmin"
                    value={formData.sunatRuc}
                    onChange={(e) => {
                      const ruc = e.target.value;
                      if (onSelectCompany) {
                        onSelectCompany(ruc);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontWeight: '700',
                      marginTop: '4px',
                    }}
                  >
                    {companiesList.map((c) => (
                      <option key={c.ruc} value={c.ruc}>
                        🏢 {c.empresa || c.ruc} ({c.ruc})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="input-group">
                <label htmlFor="empresa" style={{ fontSize: '12px', fontWeight: '700' }}>
                  Razón Social / Nombre Comercial *
                </label>
                <input
                  type="text"
                  id="empresa"
                  value={formData.empresa}
                  onChange={handleChange}
                  required
                  placeholder="Ej: SUPER AHORRO EIRL"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="input-group">
                <label htmlFor="sunatRuc" style={{ fontSize: '12px', fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
                  <span>RUC Contribuyente (11 dígitos)</span>
                  <span style={{ color: currentUser?.role === 'admin' ? '#0284c7' : 'var(--text-muted)', fontSize: '11px' }}>
                    {currentUser?.role === 'admin' ? '(Editable por Administrador)' : '(Identificador Único Vinculado)'}
                  </span>
                </label>
                <input
                  type="text"
                  id="sunatRuc"
                  value={formData.sunatRuc}
                  onChange={handleChange}
                  disabled={currentUser?.role !== 'admin'}
                  title={currentUser?.role !== 'admin' ? 'El RUC está vinculado a su cuenta y no se puede modificar' : 'RUC de la empresa'}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: currentUser?.role === 'admin' ? 'var(--bg-input)' : '#f1f5f9',
                    border: '1px solid var(--border-color)',
                    color: '#0284c7',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '700',
                    cursor: currentUser?.role === 'admin' ? 'text' : 'not-allowed',
                  }}
                />
              </div>
            </div>

            {/* Bloque 2: Credenciales API SUNAT & SOL */}
            <div style={{ background: '#faf5ff', padding: '16px', borderRadius: '12px', border: '1px solid #e9d5ff', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <i className="fa-solid fa-key"></i> 2. Credenciales API SUNAT & Clave SOL
              </span>

              <div className="input-group">
                <label htmlFor="clientId" style={{ fontSize: '12px', fontWeight: '700' }}>
                  <i className="fa-solid fa-id-card text-yellow"></i> Client ID (API SUNAT)
                </label>
                <input
                  type="text"
                  id="clientId"
                  value={formData.clientId}
                  onChange={handleChange}
                  placeholder="ID de Aplicación SUNAT"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="input-group">
                <label htmlFor="clientSecret" style={{ fontSize: '12px', fontWeight: '700' }}>
                  <i className="fa-solid fa-user-lock text-yellow"></i> Client Secret (API SUNAT)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showClientSecret ? 'text' : 'password'}
                    id="clientSecret"
                    value={formData.clientSecret}
                    onChange={handleChange}
                    placeholder="Clave Secreta SUNAT"
                    style={{ width: '100%', padding: '10px 42px 10px 14px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowClientSecret(!showClientSecret)}
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
                      fontSize: '14px',
                    }}
                  >
                    <i className={`fa-solid ${showClientSecret ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label htmlFor="userSol" style={{ fontSize: '12px', fontWeight: '700' }}>
                    <i className="fa-solid fa-user text-green"></i> Usuario SOL (Secundario)
                  </label>
                  <input
                    type="text"
                    id="userSol"
                    value={formData.userSol}
                    onChange={handleChange}
                    placeholder="Ej: APISUNAT"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="claveSol" style={{ fontSize: '12px', fontWeight: '700' }}>
                    <i className="fa-solid fa-lock text-green"></i> Clave SOL (Secundario)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showClaveSol ? 'text' : 'password'}
                      id="claveSol"
                      value={formData.claveSol}
                      onChange={handleChange}
                      placeholder="••••••••"
                      style={{ width: '100%', padding: '10px 42px 10px 14px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowClaveSol(!showClaveSol)}
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
                        fontSize: '14px',
                      }}
                    >
                      <i className={`fa-solid ${showClaveSol ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloque 3: Cambio de Contraseña de Acceso Web */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <i className="fa-solid fa-shield-halved"></i> 3. Seguridad de Inicio de Sesión (Login)
              </span>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                Si desea actualizar su contraseña para acceder a esta aplicación web, escriba la nueva clave a continuación:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label htmlFor="newAppPassword" style={{ fontSize: '12px', fontWeight: '700' }}>
                    Nueva Contraseña
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showAppPassword ? 'text' : 'password'}
                      id="newAppPassword"
                      value={formData.newAppPassword}
                      onChange={handleChange}
                      placeholder="Nueva contraseña"
                      style={{ width: '100%', padding: '10px 38px 10px 12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '13px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAppPassword(!showAppPassword)}
                      tabIndex="-1"
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      <i className={`fa-solid ${showAppPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="confirmAppPassword" style={{ fontSize: '12px', fontWeight: '700' }}>
                    Confirmar Contraseña
                  </label>
                  <input
                    type={showAppPassword ? 'text' : 'password'}
                    id="confirmAppPassword"
                    value={formData.confirmAppPassword}
                    onChange={handleChange}
                    placeholder="Repita nueva clave"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                </div>
              </div>
            </div>

            {/* Botón Principal Guardar */}
            <div style={{ marginTop: '8px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '14px',
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {saving ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>Guardando cambios en Firebase...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-floppy-disk"></i>
                    <span>Guardar Cambios de Perfil en Firebase</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Columna Derecha: Tarjeta de Ficha y Estado */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card Resumen de la Empresa */}
          <div className="card" style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ textAlign: 'center', paddingBottom: '18px', borderBottom: '1px solid var(--border-color)' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  color: '#ffffff',
                  margin: '0 auto 14px auto',
                  boxShadow: '0 8px 18px rgba(37, 99, 235, 0.3)',
                }}
              >
                <i className="fa-solid fa-building"></i>
              </div>

              <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {formData.empresa || 'Empresa Sin Nombre'}
              </h4>
              <code style={{ fontSize: '13px', color: '#0284c7', fontWeight: '700' }}>
                RUC: {formData.sunatRuc || 'N/A'}
              </code>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Rol de Acceso:</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    background: currentUser?.role === 'admin' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(2, 132, 199, 0.1)',
                    color: currentUser?.role === 'admin' ? '#dc2626' : '#0284c7',
                  }}
                >
                  {currentUser?.role === 'admin' ? '🛡️ Administrador' : '🏢 Empresa'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Credenciales SOL:</span>
                <span style={{ fontWeight: '700', color: hasCredentialsConfigured ? '#16a34a' : '#d97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className={`fa-solid ${hasCredentialsConfigured ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}></i>
                  {hasCredentialsConfigured ? 'Configuradas' : 'Incompletas'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Usuario SOL:</span>
                <code style={{ color: '#16a34a', fontWeight: '700' }}>{formData.userSol || 'No asignado'}</code>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Client ID:</span>
                <code>{maskSecret(formData.clientId)}</code>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Libros SIRE Habilitados:</span>
                <span style={{ fontWeight: '800', color: '#0284c7', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <i className="fa-solid fa-cloud-arrow-down text-blue"></i>
                  {(!currentUser?.sireBooks || currentUser.sireBooks.length === 2) ? 'RVIE + RCE (Ambos)' : currentUser.sireBooks.includes('RVIE') ? 'Solo RVIE (Ventas)' : 'Solo RCE (Compras)'}
                </span>
              </div>
            </div>
          </div>

          {/* Card Atajos Rápidos */}
          <div className="card" style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '20px' }}>
            <h5 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '800', color: 'var(--text-secondary)' }}>
              <i className="fa-solid fa-bolt text-yellow" style={{ marginRight: '6px' }}></i> Atajos del Sistema
            </h5>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {onNavigateToModule && (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => onNavigateToModule('sire')}
                    style={{ justifyContent: 'flex-start', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}
                  >
                    <i className="fa-solid fa-cloud-arrow-down text-red" style={{ marginRight: '8px' }}></i>
                    Consultar Propuestas SIRE (Ventas/Compras)
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => onNavigateToModule('payments')}
                    style={{ justifyContent: 'flex-start', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}
                  >
                    <i className="fa-solid fa-credit-card text-blue" style={{ marginRight: '8px' }}></i>
                    Gestionar Pagos de Facturas
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => onNavigateToModule('launcher')}
                    style={{ justifyContent: 'flex-start', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}
                  >
                    <i className="fa-solid fa-grip text-purple" style={{ marginRight: '8px' }}></i>
                    Volver al Menú de Módulos
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
