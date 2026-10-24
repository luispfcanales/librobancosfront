import React, { useState } from 'react';

export default function CredentialsCard({
  creds,
  setCreds,
  companiesList,
  onSelectCompany,
  onSaveToFirebase,
  savingFirebase,
  firebaseNotice,
  onOpenHistory,
}) {
  const [showCreds, setShowCreds] = useState(true);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setCreds((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCompanyDropdownChange = (e) => {
    const selectedRuc = e.target.value;
    if (selectedRuc === 'NEW' || selectedRuc === '') {
      // Clear fields for new company registration
      setCreds((prev) => ({
        ...prev,
        empresa: '',
        sunatRuc: '',
        clientId: '',
        clientSecret: '',
        userSol: '',
        claveSol: '',
      }));
    } else {
      onSelectCompany(selectedRuc);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3>
          <i className="fa-solid fa-building text-blue"></i> Gestión de Credenciales por Empresa
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '11px' }}
            onClick={onOpenHistory}
          >
            <i className="fa-solid fa-database text-blue"></i> Historial
          </button>
          <button
            type="button"
            className="btn-text"
            onClick={() => setShowCreds(!showCreds)}
            title="Mostrar/Ocultar Formulario"
          >
            <i className={`fa-solid ${showCreds ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>
      </div>

      {/* Company Selector Dropdown */}
      <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--bg-card-border)', borderRadius: '8px' }}>
        <label htmlFor="companySelect" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
          <i className="fa-solid fa-list-check text-blue"></i> Seleccionar Empresa para Trabajar:
        </label>
        <select
          id="companySelect"
          value={creds.sunatRuc || ''}
          onChange={handleCompanyDropdownChange}
          style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', borderRadius: '6px', color: 'var(--text-primary)', fontWeight: '600', fontSize: '13px' }}
        >
          <option value="">-- Seleccionar una Empresa Registrada --</option>
          {companiesList && companiesList.map((comp) => (
            <option key={comp.ruc} value={comp.ruc}>
              🏢 {comp.empresa || 'Empresa'} — RUC: {comp.ruc}
            </option>
          ))}
          <option value="NEW">➕ Registrar Nueva Empresa / Credenciales</option>
        </select>
      </div>

      {showCreds && (
        <form className="creds-grid" onSubmit={(e) => e.preventDefault()}>
          <div className="input-group" style={{ gridColumn: 'span 2' }}>
            <label htmlFor="empresa">
              <i className="fa-solid fa-building-user"></i> Empresa / Razón Social
            </label>
            <input
              type="text"
              id="empresa"
              value={creds.empresa || ''}
              onChange={handleChange}
              placeholder="Ej: MI EMPRESA S.A.C."
            />
          </div>

          <div className="input-group">
            <label htmlFor="sunatRuc">
              <i className="fa-solid fa-id-badge"></i> RUC Contribuyente
            </label>
            <input
              type="text"
              id="sunatRuc"
              value={creds.sunatRuc || ''}
              onChange={handleChange}
              placeholder="Ej: 20608032844"
            />
          </div>

          <div className="input-group">
            <label htmlFor="clientId">
              <i className="fa-solid fa-id-card"></i> Client ID (ID Aplicación)
            </label>
            <input
              type="text"
              id="clientId"
              value={creds.clientId || ''}
              onChange={handleChange}
              placeholder="ID de Aplicación SUNAT"
            />
          </div>

          <div className="input-group">
            <label htmlFor="clientSecret">
              <i className="fa-solid fa-lock"></i> Client Secret (Clave Secreta)
            </label>
            <input
              type="text"
              id="clientSecret"
              value={creds.clientSecret || ''}
              onChange={handleChange}
              placeholder="Clave Secreta SUNAT"
            />
          </div>

          <div className="input-group">
            <label htmlFor="userSol">
              <i className="fa-solid fa-user"></i> Usuario SOL
            </label>
            <input
              type="text"
              id="userSol"
              value={creds.userSol || ''}
              onChange={handleChange}
              placeholder="Ej: APISUNAT"
            />
          </div>

          <div className="input-group">
            <label htmlFor="claveSol">
              <i className="fa-solid fa-key"></i> Clave SOL
            </label>
            <input
              type="password"
              id="claveSol"
              value={creds.claveSol || ''}
              onChange={handleChange}
              placeholder="Ej: Api3322"
            />
          </div>

          <div style={{ gridColumn: 'span 2', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={savingFirebase}
              onClick={onSaveToFirebase}
            >
              {savingFirebase ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Guardando Empresa...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-floppy-disk"></i> Guardar Credenciales en Firebase
                </>
              )}
            </button>
            {firebaseNotice && (
              <span style={{ fontSize: '12px', color: 'var(--accent-green)', fontWeight: 600 }}>
                {firebaseNotice}
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
