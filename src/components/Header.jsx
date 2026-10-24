import React, { useEffect, useState } from 'react';
import { checkBackendHealth } from '../services/api';

export default function Header({ activeModule, setActiveModule, activeCompany, currentUser, onLogout, onOpenProfile }) {
  const [healthStatus, setHealthStatus] = useState({ online: false, checking: true });

  const verifyHealth = async () => {
    const res = await checkBackendHealth();
    setHealthStatus({ online: res.online, checking: false, data: res.data });
  };

  useEffect(() => {
    verifyHealth();
    const interval = setInterval(verifyHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const canAccess = (modId) => {
    if (!currentUser) return true;
    if (currentUser.role === 'admin') return true;
    return Array.isArray(currentUser.allowedModules) && currentUser.allowedModules.includes(modId);
  };

  const entityName = activeCompany?.empresa || currentUser?.razonSocial || 'Empresa';
  const entityRuc = activeCompany?.ruc || currentUser?.ruc;

  return (
    <header className="app-header">
      {/* Brand compacto */}
      <div className="brand" style={{ cursor: 'pointer' }} onClick={() => setActiveModule('launcher')}>
        <div className="brand-logo" style={{ background: 'linear-gradient(135deg, #0284c7, #2563eb)' }}>
          <i className="fa-solid fa-building-columns"></i>
        </div>
        <div className="brand-text">
          <h1>
            SIRE <span>SUNAT</span>
          </h1>
        </div>
      </div>

      {/* Navegación de Módulos (Compacta) */}
      <div className="header-nav-tabs" style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
        <button
          type="button"
          className={`btn ${activeModule === 'launcher' ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: '700',
            borderRadius: '7px',
            background: activeModule === 'launcher' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
            color: activeModule === 'launcher' ? '#ffffff' : 'var(--text-secondary)',
            border: 'none',
          }}
          onClick={() => setActiveModule('launcher')}
        >
          <i className="fa-solid fa-grip"></i> Módulos
        </button>

        {canAccess('sire') && (
          <button
            type="button"
            className={`btn ${activeModule === 'sire' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '700',
              borderRadius: '7px',
              background: activeModule === 'sire' ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : 'transparent',
              color: activeModule === 'sire' ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
            }}
            onClick={() => setActiveModule('sire')}
          >
            <i className="fa-solid fa-cloud-arrow-down"></i> SIRE SUNAT
          </button>
        )}

        {canAccess('payments') && (
          <button
            type="button"
            className={`btn ${activeModule === 'payments' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '700',
              borderRadius: '7px',
              background: activeModule === 'payments' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
              color: activeModule === 'payments' ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
            }}
            onClick={() => setActiveModule('payments')}
          >
            <i className="fa-solid fa-credit-card"></i> Pago Facturas
          </button>
        )}

        <button
          type="button"
          className={`btn ${activeModule === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: '700',
            borderRadius: '7px',
            background: activeModule === 'profile' ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'transparent',
            border: 'none',
            color: activeModule === 'profile' ? '#ffffff' : '#7c3aed',
          }}
          onClick={() => setActiveModule('profile')}
        >
          <i className="fa-solid fa-id-card-clip"></i> Mi Perfil
        </button>

        {currentUser?.role === 'admin' && (
          <button
            type="button"
            className={`btn ${activeModule === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '700',
              borderRadius: '7px',
              background: activeModule === 'settings' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
              color: activeModule === 'settings' ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
            }}
            onClick={() => setActiveModule('settings')}
          >
            <i className="fa-solid fa-gears"></i> Empresas & Usuarios
          </button>
        )}
      </div>

      {/* Lado Derecho: Indicador Conexión + Empresa/RUC Único + Salir */}
      <div className="header-status" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* Indicador Discreto de Conexión (Reemplazo de Go Backend Port 8080) */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '20px',
            background: healthStatus.online ? '#f0fdf4' : '#fef2f2',
            border: healthStatus.online ? '1px solid #bbf7d0' : '1px solid #fecaca',
            fontSize: '11px',
            fontWeight: '700',
            color: healthStatus.online ? '#15803d' : '#dc2626',
            whiteSpace: 'nowrap',
          }}
          title={healthStatus.online ? 'Servidor Backend Conectado (Puerto 8080)' : 'Sin conexión con el servidor backend'}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: healthStatus.online ? '#16a34a' : '#dc2626',
              boxShadow: healthStatus.online ? '0 0 6px rgba(22, 163, 74, 0.4)' : 'none',
              display: 'inline-block',
            }}
          />
          <span>{healthStatus.checking ? 'Conectando...' : healthStatus.online ? 'Conectado' : 'Sin conexión'}</span>
        </div>

        {/* ÚNICO Chip de Empresa & RUC (Mostrado solo una vez para evitar redundancia) */}
        {entityRuc && (
          <div
            onClick={() => setActiveModule('profile')}
            title={`Empresa: ${entityName} | RUC: ${entityRuc} (Haz clic para ver Mi Perfil)`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ffffff',
              padding: '4px 10px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0284c7')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
          >
            <i className="fa-solid fa-building text-blue" style={{ fontSize: '11px' }}></i>
            <span
              style={{
                fontWeight: '700',
                color: '#0f172a',
                maxWidth: '180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '12px',
              }}
            >
              {entityName}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: '700',
                color: '#64748b',
                background: '#f1f5f9',
                padding: '1px 5px',
                borderRadius: '4px',
              }}
            >
              {entityRuc}
            </span>
          </div>
        )}

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title="Cerrar Sesión"
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '5px 10px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#fee2e2')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#fef2f2')}
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>Salir</span>
          </button>
        )}
      </div>
    </header>
  );
}
