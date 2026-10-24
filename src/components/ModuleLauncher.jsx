import React from 'react';

export default function ModuleLauncher({
  onSelectModule,
  activeCompany,
  currentUser,
  allowedModules = ['sire', 'payments', 'settings', 'history'],
}) {
  const isAdmin = currentUser?.role === 'admin';

  const allModules = [
    {
      id: 'sire',
      title: 'SIRE SUNAT',
      subtitle: 'Consulta RVIE & RCE',
      icon: 'fa-solid fa-cloud-arrow-down',
      bgColor: 'linear-gradient(135deg, #ef4444, #dc2626)',
      badge: 'SUNAT API 5.18 / 5.34',
      description: 'Previsualización y descompresión masiva de propuestas RVIE (Ventas) y RCE (Compras).',
    },
    {
      id: 'payments',
      title: 'Pago de Facturas',
      subtitle: 'Gestión en Firebase',
      icon: 'fa-solid fa-credit-card',
      bgColor: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      badge: 'Firebase Firestore',
      description: 'Control de pagos, registro de bancos, números de operación y estados de facturas.',
    },
    {
      id: 'profile',
      title: 'Mi Perfil & Credenciales',
      subtitle: 'Credenciales SOL SUNAT',
      icon: 'fa-solid fa-id-card-clip',
      bgColor: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      badge: 'Mi Cuenta',
      description: 'Configuración de Razón Social, Client ID, Client Secret, RUC, Clave SOL y contraseña de su empresa.',
    },
    ...(isAdmin
      ? [
          {
            id: 'settings',
            title: 'Empresas & Usuarios',
            subtitle: 'Administración Global',
            icon: 'fa-solid fa-gears',
            bgColor: 'linear-gradient(135deg, #0284c7, #0369a1)',
            badge: 'Admin',
            description: 'Gestión centralizada de múltiples empresas, creación de usuarios y asignación de permisos.',
          },
        ]
      : []),
    {
      id: 'history',
      title: 'Historial Cargas',
      subtitle: 'Registros Guardados',
      icon: 'fa-solid fa-database',
      bgColor: 'linear-gradient(135deg, #10b981, #059669)',
      badge: 'Firebase',
      description: 'Consulta de lotes y comprobantes RCE/RVIE guardados previamente en el sistema.',
    },
  ];

  const visibleModules = allModules.filter((mod) => {
    if (mod.id === 'profile') return true; // El perfil siempre está visible para todos los usuarios
    return !allowedModules || allowedModules.length === 0 || allowedModules.includes(mod.id);
  });

  return (
    <div className="module-launcher-container" style={{ padding: '10px 0 30px 0' }}>
      {/* Welcome Hero Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
          border: '1px solid var(--border-color)',
          marginBottom: '28px',
          padding: '28px',
          borderRadius: '20px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '20px',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                }}
              >
                <i className="fa-solid fa-grip"></i>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)' }}>
                  Módulos del Sistema
                </h2>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Plataforma de Gestión SIRE SUNAT & Control Financiero Multiempresa
                </span>
              </div>
            </div>
          </div>

          {activeCompany && (
            <div
              style={{
                background: '#f0f9ff',
                padding: '10px 18px',
                borderRadius: '14px',
                border: '1px solid #bae6fd',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0284c7', boxShadow: '0 0 6px #0284c7' }}></div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', fontWeight: '600' }}>EMPRESA EN USO:</span>
                <strong style={{ color: '#0284c7', fontSize: '14px' }}>🏢 {activeCompany.empresa || activeCompany.ruc}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Module App Launcher Tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '22px',
        }}
      >
        {visibleModules.map((mod) => (
          <div
            key={mod.id}
            className="module-card-item"
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '18px',
              padding: '24px',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}
            onClick={() => onSelectModule(mod.id)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#0284c7';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(2, 132, 199, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <div>
              {/* App Icon Box */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '16px',
                    background: mod.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '26px',
                    color: '#ffffff',
                    boxShadow: '0 6px 14px rgba(0,0,0,0.15)',
                  }}
                >
                  <i className={mod.icon}></i>
                </div>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    background: '#f1f5f9',
                    color: '#0284c7',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {mod.badge}
                </span>
              </div>

              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {mod.title}
              </h3>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '12px' }}>
                {mod.subtitle}
              </span>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {mod.description}
              </p>
            </div>

            <div
              style={{
                marginTop: '22px',
                paddingTop: '14px',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '13px',
                fontWeight: '700',
                color: '#0284c7',
              }}
            >
              <span>Ingresar al Módulo</span>
              <i className="fa-solid fa-arrow-right"></i>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
