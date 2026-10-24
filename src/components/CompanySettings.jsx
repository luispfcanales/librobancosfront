import React, { useState, useEffect } from 'react';
import { getUsers, saveUser } from '../services/api';

export default function CompanySettings({
  creds,
  setCreds,
  companiesList,
  onSelectCompany,
  onSaveToFirebase,
  savingFirebase,
  firebaseNotice,
  currentUser,
}) {
  const [activeTab, setActiveTab] = useState('companies'); // 'companies' or 'users'
  const [editingRuc, setEditingRuc] = useState(null);

  // User Access State
  const [appPassword, setAppPassword] = useState('');
  const [showAppPassword, setShowAppPassword] = useState(false);
  const [userRole, setUserRole] = useState('empresa');
  const [userActivo, setUserActivo] = useState(true);
  const [allowedModules, setAllowedModules] = useState(['sire', 'payments', 'history']);
  const [sireBooks, setSireBooks] = useState(['RVIE', 'RCE']);
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userActionNotice, setUserActionNotice] = useState('');

  const MODULE_OPTIONS = [
    {
      id: 'sire',
      label: 'SIRE SUNAT',
      desc: 'Consulta y propuesta RVIE/RCE',
      icon: 'fa-solid fa-cloud-arrow-down',
      color: '#ef4444',
    },
    {
      id: 'payments',
      label: 'Pago de Facturas',
      desc: 'Control bancario y estados de pago',
      icon: 'fa-solid fa-credit-card',
      color: '#3b82f6',
    },
    {
      id: 'settings',
      label: 'Configuración API',
      desc: 'Administrar credenciales SOL SUNAT',
      icon: 'fa-solid fa-gears',
      color: '#8b5cf6',
    },
    {
      id: 'history',
      label: 'Historial Cargas',
      desc: 'Consulta de períodos ya subidos',
      icon: 'fa-solid fa-database',
      color: '#10b981',
    },
  ];

  useEffect(() => {
    fetchUsersFromBackend();
  }, []);

  const fetchUsersFromBackend = async () => {
    setLoadingUsers(true);
    try {
      const res = await getUsers();
      if (res.success && Array.isArray(res.users)) {
        setUsersList(res.users);
      }
    } catch (_) {
      // Ignorar fallo inicial
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setCreds((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  const toggleModule = (modId) => {
    setAllowedModules((prev) => {
      if (prev.includes(modId)) {
        return prev.filter((id) => id !== modId);
      } else {
        return [...prev, modId];
      }
    });
  };

  const toggleSireBook = (book) => {
    setSireBooks((prev) => {
      if (prev.includes(book)) {
        if (prev.length <= 1) return prev; // Al menos un libro debe permanecer activo
        return prev.filter((b) => b !== book);
      } else {
        return [...prev, book];
      }
    });
  };

  const handleEditClick = (comp) => {
    setEditingRuc(comp.ruc);
    setCreds((prev) => ({
      ...prev,
      empresa: comp.empresa || '',
      sunatRuc: comp.ruc || '',
      clientId: comp.clientId || '',
      clientSecret: comp.clientSecret || '',
      userSol: comp.username || '',
      claveSol: comp.password || '',
    }));

    // Find if user already has an account in usersList
    const existingUser = usersList.find((u) => u.ruc === comp.ruc);
    if (existingUser) {
      setUserRole(existingUser.role || 'empresa');
      setUserActivo(existingUser.activo !== false);
      setAllowedModules(existingUser.allowedModules || ['sire', 'payments', 'history']);
      setSireBooks(existingUser.sireBooks && existingUser.sireBooks.length > 0 ? existingUser.sireBooks : ['RVIE', 'RCE']);
      setAppPassword(''); // Leave blank to retain existing unless changed
    } else {
      setUserRole('empresa');
      setUserActivo(true);
      setAllowedModules(['sire', 'payments', 'history']);
      setSireBooks(['RVIE', 'RCE']);
      setAppPassword('');
    }
  };

  const handleEditUserClick = (u) => {
    setEditingRuc(u.ruc);
    setActiveTab('companies');
    // Fill credentials matching company if exists
    const matchingCompany = (companiesList || []).find((c) => c.ruc === u.ruc);
    if (matchingCompany) {
      setCreds((prev) => ({
        ...prev,
        empresa: matchingCompany.empresa || u.razonSocial || '',
        sunatRuc: u.ruc,
        clientId: matchingCompany.clientId || '',
        clientSecret: matchingCompany.clientSecret || '',
        userSol: matchingCompany.username || '',
        claveSol: matchingCompany.password || '',
      }));
    } else {
      setCreds((prev) => ({
        ...prev,
        empresa: u.razonSocial || '',
        sunatRuc: u.ruc,
      }));
    }
    setUserRole(u.role || 'empresa');
    setUserActivo(u.activo !== false);
    setAllowedModules(u.allowedModules || ['sire', 'payments', 'history']);
    setSireBooks(u.sireBooks && u.sireBooks.length > 0 ? u.sireBooks : ['RVIE', 'RCE']);
    setAppPassword('');
  };

  const handleNewCompanyClick = () => {
    setEditingRuc(null);
    setCreds((prev) => ({
      ...prev,
      empresa: '',
      sunatRuc: '',
      clientId: '',
      clientSecret: '',
      userSol: '',
      claveSol: '',
    }));
    setAppPassword('');
    setUserRole('empresa');
    setUserActivo(true);
    setAllowedModules(['sire', 'payments', 'history']);
    setSireBooks(['RVIE', 'RCE']);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // 1. Guardar credenciales de SUNAT en Firebase
    await onSaveToFirebase();

    // 2. Si se ingresó RUC, guardar o actualizar también el usuario en /api/auth/users
    const targetRuc = creds.sunatRuc?.trim();
    if (targetRuc) {
      try {
        const userPayload = {
          ruc: targetRuc,
          razonSocial: creds.empresa?.trim() || `Empresa ${targetRuc}`,
          role: userRole,
          allowedModules: allowedModules.length > 0 ? allowedModules : ['sire', 'payments'],
          sireBooks: sireBooks.length > 0 ? sireBooks : ['RVIE', 'RCE'],
          activo: userActivo,
        };
        if (appPassword.trim()) {
          userPayload.password = appPassword.trim();
        }

        const userRes = await saveUser(userPayload);
        if (userRes.success) {
          setUserActionNotice(`✅ Usuario y contraseña para ${targetRuc} actualizados exitosamente.`);
          await fetchUsersFromBackend();
          setTimeout(() => setUserActionNotice(''), 4000);
        }
      } catch (err) {
        console.error('Error guardando usuario:', err);
      }
    }
  };

  const maskSecret = (str) => {
    if (!str) return '••••••••';
    if (str.length <= 6) return '••••••••';
    return str.substring(0, 4) + '••••' + str.substring(str.length - 2);
  };

  return (
    <div className="company-settings-module" style={{ paddingBottom: '30px' }}>
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
              <i className="fa-solid fa-gears text-purple"></i> Configuración de Empresas & Control de Usuarios
            </h2>
            <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
              Administre de forma centralizada las credenciales SOL de SUNAT, contraseñas de acceso y permisos de módulos para cada usuario.
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

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleNewCompanyClick}
              style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '13px' }}
            >
              <i className="fa-solid fa-plus text-green" style={{ marginRight: '6px' }}></i> Nueva Empresa
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 460px) 1fr', gap: '24px' }}>
        {/* Form Card (Empresa + Credenciales SOL + Login) */}
        <div className="card" style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '24px', height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
              <i className="fa-solid fa-pen-to-square text-blue" style={{ marginRight: '8px' }}></i>
              {editingRuc ? 'Editar Empresa y Accesos' : 'Registrar Nueva Empresa & Usuario'}
            </h3>
            {editingRuc && (
              <span style={{ fontSize: '11px', background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                RUC: {editingRuc}
              </span>
            )}
          </div>

          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Sección 1: Datos de la Empresa */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <i className="fa-solid fa-building"></i> 1. Información de la Empresa
              </span>

              <div className="input-group">
                <label htmlFor="empresa" style={{ fontSize: '12px', fontWeight: '700' }}>
                  Razón Social / Nombre Empresa *
                </label>
                <input
                  type="text"
                  id="empresa"
                  value={creds.empresa || ''}
                  onChange={handleChange}
                  placeholder="Ej: SUPER AHORRO EIRL"
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="input-group">
                <label htmlFor="sunatRuc" style={{ fontSize: '12px', fontWeight: '700' }}>
                  RUC Contribuyente (11 dígitos) *
                </label>
                <input
                  type="text"
                  id="sunatRuc"
                  value={creds.sunatRuc || ''}
                  onChange={handleChange}
                  placeholder="Ej: 20608032844"
                  maxLength={11}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>

            {/* Sección 2: Acceso Web y Permisos de Módulos (Requerimiento del usuario) */}
            <div style={{ background: '#f0f9ff', padding: '14px', borderRadius: '12px', border: '1px solid #bae6fd', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <i className="fa-solid fa-user-lock"></i> 2. Acceso Web & Contraseña (Login)
                </span>
                <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0284c7', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                  Usuario: {creds.sunatRuc || 'RUC'}
                </span>
              </div>

              <div className="input-group">
                <label htmlFor="appPassword" style={{ fontSize: '12px', fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
                  <span><i className="fa-solid fa-key text-purple"></i> Contraseña de Acceso al Sistema</span>
                  {editingRuc && !appPassword && <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>(Dejar en blanco para mantener actual)</span>}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showAppPassword ? 'text' : 'password'}
                    id="appPassword"
                    value={appPassword}
                    onChange={(e) => setAppPassword(e.target.value)}
                    placeholder={editingRuc ? '•••••••••••• (Establecer nueva contraseña)' : 'Escriba la contraseña para este usuario'}
                    style={{ width: '100%', padding: '10px 40px 10px 12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
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
                      fontSize: '14px',
                    }}
                  >
                    <i className={`fa-solid ${showAppPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              {/* Selector de Rol */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div
                  onClick={() => setUserRole('empresa')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: userRole === 'empresa' ? '#e0f2fe' : 'var(--bg-input)',
                    border: userRole === 'empresa' ? '1px solid #0284c7' : '1px solid var(--border-color)',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: userRole === 'empresa' ? '#0284c7' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <i className="fa-solid fa-building"></i> Rol Empresa
                </div>
                <div
                  onClick={() => setUserRole('admin')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: userRole === 'admin' ? '#fee2e2' : 'var(--bg-input)',
                    border: userRole === 'admin' ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: userRole === 'admin' ? '#dc2626' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <i className="fa-solid fa-shield"></i> Rol Admin
                </div>
              </div>

              {/* Selector de Módulos Permitidos */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block', color: 'var(--text-secondary)' }}>
                  <i className="fa-solid fa-layer-group text-blue"></i> Módulos que puede ver este usuario:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {MODULE_OPTIONS.map((m) => {
                    const isChecked = allowedModules.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleModule(m.id)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          background: isChecked ? '#f0f9ff' : 'var(--bg-input)',
                          border: isChecked ? `1px solid ${m.color}` : '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '11px',
                          fontWeight: '700',
                          color: isChecked ? 'var(--text-primary)' : 'var(--text-muted)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <i className={`fa-solid ${isChecked ? 'fa-square-check' : 'fa-square'}`} style={{ color: isChecked ? m.color : 'var(--text-muted)', fontSize: '14px' }}></i>
                        <div>
                          <div>{m.label}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sub-permisos SIRE: RVIE y/o RCE */}
              {allowedModules.includes('sire') && (
                <div style={{ marginTop: '4px', padding: '12px 14px', background: '#fff1f2', borderRadius: '10px', border: '1px solid #fecdd3' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#be123c', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fa-solid fa-cloud-arrow-down"></i> Permisos de Libros SIRE:
                    </label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setSireBooks(['RVIE'])}
                        style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: sireBooks.length === 1 && sireBooks[0] === 'RVIE' ? '#e11d48' : '#ffffff',
                          color: sireBooks.length === 1 && sireBooks[0] === 'RVIE' ? '#ffffff' : '#475569',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        Solo Ventas (RVIE)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSireBooks(['RCE'])}
                        style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: sireBooks.length === 1 && sireBooks[0] === 'RCE' ? '#d97706' : '#ffffff',
                          color: sireBooks.length === 1 && sireBooks[0] === 'RCE' ? '#ffffff' : '#475569',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        Solo Compras (RCE)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSireBooks(['RVIE', 'RCE'])}
                        style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: sireBooks.length === 2 ? '#0284c7' : '#ffffff',
                          color: sireBooks.length === 2 ? '#ffffff' : '#475569',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        Ambos Libros
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div
                      onClick={() => toggleSireBook('RVIE')}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: sireBooks.includes('RVIE') ? '#ffffff' : 'rgba(255,255,255,0.6)',
                        border: sireBooks.includes('RVIE') ? '1px solid #e11d48' : '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.15s ease',
                        boxShadow: sireBooks.includes('RVIE') ? '0 2px 4px rgba(225, 29, 72, 0.08)' : 'none',
                      }}
                    >
                      <i className={`fa-solid ${sireBooks.includes('RVIE') ? 'fa-square-check' : 'fa-square'}`} style={{ color: sireBooks.includes('RVIE') ? '#e11d48' : '#94a3b8', fontSize: '15px' }}></i>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: sireBooks.includes('RVIE') ? '#9f1239' : '#64748b' }}>RVIE (Ventas)</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Registro de Ventas e Ingresos</div>
                      </div>
                    </div>

                    <div
                      onClick={() => toggleSireBook('RCE')}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: sireBooks.includes('RCE') ? '#ffffff' : 'rgba(255,255,255,0.6)',
                        border: sireBooks.includes('RCE') ? '1px solid #d97706' : '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.15s ease',
                        boxShadow: sireBooks.includes('RCE') ? '0 2px 4px rgba(217, 119, 6, 0.08)' : 'none',
                      }}
                    >
                      <i className={`fa-solid ${sireBooks.includes('RCE') ? 'fa-square-check' : 'fa-square'}`} style={{ color: sireBooks.includes('RCE') ? '#d97706' : '#94a3b8', fontSize: '15px' }}></i>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: sireBooks.includes('RCE') ? '#92400e' : '#64748b' }}>RCE (Compras)</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Registro de Compras Electrónico</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sección 3: Credenciales SOL SUNAT API */}
            <div style={{ background: '#faf5ff', padding: '14px', borderRadius: '12px', border: '1px solid #e9d5ff', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <i className="fa-solid fa-cloud-arrow-down"></i> 3. Credenciales SUNAT API & SOL
              </span>

              <div className="input-group">
                <label htmlFor="clientId" style={{ fontSize: '12px', fontWeight: '700' }}>
                  <i className="fa-solid fa-key text-yellow"></i> Client ID (API SUNAT)
                </label>
                <input
                  type="text"
                  id="clientId"
                  value={creds.clientId || ''}
                  onChange={handleChange}
                  placeholder="ID de Aplicación SUNAT"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="input-group">
                <label htmlFor="clientSecret" style={{ fontSize: '12px', fontWeight: '700' }}>
                  <i className="fa-solid fa-user-lock text-yellow"></i> Client Secret (API SUNAT)
                </label>
                <input
                  type="password"
                  id="clientSecret"
                  value={creds.clientSecret || ''}
                  onChange={handleChange}
                  placeholder="Clave Secreta SUNAT"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="input-group">
                  <label htmlFor="userSol" style={{ fontSize: '12px', fontWeight: '700' }}>
                    <i className="fa-solid fa-user text-green"></i> Usuario SOL
                  </label>
                  <input
                    type="text"
                    id="userSol"
                    value={creds.userSol || ''}
                    onChange={handleChange}
                    placeholder="Ej: MODDATOS"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="claveSol" style={{ fontSize: '12px', fontWeight: '700' }}>
                    <i className="fa-solid fa-lock text-green"></i> Clave SOL
                  </label>
                  <input
                    type="password"
                    id="claveSol"
                    value={creds.claveSol || ''}
                    onChange={handleChange}
                    placeholder="Ej: moddatos"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
            </div>

            {/* Botón Guardar */}
            <div style={{ marginTop: '6px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={savingFirebase}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '14px',
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                }}
              >
                {savingFirebase ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Guardando en Firebase...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-floppy-disk" style={{ marginRight: '8px' }}></i> Guardar Empresa & Usuario en Firebase
                  </>
                )}
              </button>

              {firebaseNotice && (
                <div style={{ marginTop: '10px', padding: '10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '12px', textAlign: 'center', fontWeight: '700' }}>
                  {firebaseNotice}
                </div>
              )}
              {userActionNotice && (
                <div style={{ marginTop: '10px', padding: '10px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontSize: '12px', textAlign: 'center', fontWeight: '700' }}>
                  {userActionNotice}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Directory Card con Pestañas: Empresas vs Usuarios */}
        <div className="card" style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '24px' }}>
          {/* Subtabs Navigation */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('companies')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'companies' ? '#ede9fe' : 'transparent',
                color: activeTab === 'companies' ? '#7c3aed' : 'var(--text-muted)',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <i className="fa-solid fa-building"></i> Empresas Registradas ({companiesList ? companiesList.length : 0})
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('users'); fetchUsersFromBackend(); }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'users' ? '#e0f2fe' : 'transparent',
                color: activeTab === 'users' ? '#0284c7' : 'var(--text-muted)',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <i className="fa-solid fa-users"></i> Usuarios & Permisos ({usersList.length})
            </button>
          </div>

          {/* TAB 1: Empresas Registradas */}
          {activeTab === 'companies' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Seleccione una empresa activa para usar en SIRE y Facturación
                </span>
              </div>

              {!companiesList || companiesList.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <i className="fa-solid fa-building-circle-exclamation" style={{ fontSize: '36px', marginBottom: '12px', display: 'block', opacity: 0.5 }}></i>
                  <p style={{ margin: 0, fontSize: '14px' }}>No hay empresas registradas aún en Firebase.</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Utilice el formulario a la izquierda para agregar la primera empresa.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {companiesList.map((comp) => {
                    const isActive = creds.sunatRuc === comp.ruc;
                    return (
                      <div
                        key={comp.ruc}
                        style={{
                          background: isActive ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.08))' : 'var(--bg-input)',
                          border: isActive ? '2px solid #8b5cf6' : '1px solid var(--border-color)',
                          borderRadius: '12px',
                          padding: '16px 20px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
                                🏢 {comp.empresa || 'Empresa Sin Nombre'}
                              </h4>
                              {isActive && (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: '800',
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    background: '#8b5cf6',
                                    color: '#ffffff',
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  ✓ ACTIVA
                                </span>
                              )}
                            </div>

                            <div style={{ marginTop: '8px', display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)' }}>
                              <span>
                                <strong>RUC:</strong> <code style={{ color: '#38bdf8', fontWeight: '700' }}>{comp.ruc}</code>
                              </span>
                              <span>
                                <strong>Usuario SOL:</strong> <code style={{ color: '#34d399' }}>{comp.username || 'N/A'}</code>
                              </span>
                              <span>
                                <strong>Client ID:</strong> <code>{maskSecret(comp.clientId)}</code>
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => handleEditClick(comp)}
                              style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px' }}
                              title="Editar empresa y configurar su contraseña"
                            >
                              <i className="fa-solid fa-pen-to-square"></i> Editar
                            </button>

                            <button
                              type="button"
                              className={`btn ${isActive ? 'btn-success' : 'btn-primary'}`}
                              onClick={() => onSelectCompany(comp.ruc)}
                              disabled={isActive}
                              style={{
                                padding: '6px 14px',
                                fontSize: '12px',
                                borderRadius: '6px',
                                fontWeight: '700',
                                background: isActive ? '#10b981' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                              }}
                            >
                              {isActive ? (
                                <>
                                  <i className="fa-solid fa-circle-check"></i> Seleccionada
                                </>
                              ) : (
                                <>
                                  <i className="fa-solid fa-hand-pointer"></i> Seleccionar
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Usuarios & Permisos */}
          {activeTab === 'users' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Usuarios con credenciales de acceso al sistema y sus módulos habilitados
                </span>
                <button
                  type="button"
                  onClick={fetchUsersFromBackend}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
                >
                  <i className="fa-solid fa-rotate-right"></i> Refrescar
                </button>
              </div>

              {loadingUsers ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '24px' }}></i>
                  <p style={{ marginTop: '8px', fontSize: '13px' }}>Cargando usuarios desde Firebase...</p>
                </div>
              ) : usersList.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <p>No se encontraron usuarios en la colección `usuarios` de Firebase.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {usersList.map((u) => {
                    return (
                      <div
                        key={u.ruc}
                        style={{
                          background: '#ffffff',
                          border: '1px solid var(--border-color)',
                          borderRadius: '12px',
                          padding: '16px 20px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '12px',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
                              {u.razonSocial || u.ruc}
                            </strong>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: '800',
                                padding: '2px 8px',
                                borderRadius: '8px',
                                background: u.role === 'admin' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(2, 132, 199, 0.1)',
                                color: u.role === 'admin' ? '#dc2626' : '#0284c7',
                                textTransform: 'uppercase',
                              }}
                            >
                              {u.role === 'admin' ? '🛡️ Admin' : '🏢 Empresa'}
                            </span>
                            {u.activo === false && (
                              <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '8px', background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }}>
                                INACTIVO
                              </span>
                            )}
                          </div>

                          <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <span>Usuario Login (RUC): <code style={{ color: '#0284c7', fontWeight: '700' }}>{u.ruc}</code></span>
                          </div>

                          {/* Módulos Habilitados Badges */}
                          <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {MODULE_OPTIONS.map((opt) => {
                              const hasMod = Array.isArray(u.allowedModules) && u.allowedModules.includes(opt.id);
                              return (
                                <span
                                  key={opt.id}
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    background: hasMod ? '#f8fafc' : '#f1f5f9',
                                    color: hasMod ? opt.color : '#94a3b8',
                                    border: hasMod ? `1px solid ${opt.color}40` : '1px solid #e2e8f0',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                  }}
                                >
                                  <i className={opt.icon}></i> {opt.label}
                                  {hasMod && opt.id === 'sire' && (
                                    <span style={{ fontSize: '9px', fontWeight: '800', padding: '1px 5px', borderRadius: '4px', background: '#fee2e2', color: '#b91c1c' }}>
                                      {(!u.sireBooks || u.sireBooks.length === 2) ? 'Ventas + Compras' : u.sireBooks.includes('RVIE') ? 'Solo Ventas' : 'Solo Compras'}
                                    </span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => handleEditUserClick(u)}
                            style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '8px', fontWeight: '700' }}
                          >
                            <i className="fa-solid fa-user-pen"></i> Editar Permisos / Clave
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
