import React, { useState, useEffect } from 'react';
import { fetchPeriods, getUploadedPeriods } from '../services/api';

const DEFAULT_MONTHS = [
  { code: '01', name: 'ENE', fullName: 'Enero', quarter: 'Q1', status: 'Presentado' },
  { code: '02', name: 'FEB', fullName: 'Febrero', quarter: 'Q1', status: 'Presentado' },
  { code: '03', name: 'MAR', fullName: 'Marzo', quarter: 'Q1', status: 'Presentado' },
  { code: '04', name: 'ABR', fullName: 'Abril', quarter: 'Q2', status: 'Presentado' },
  { code: '05', name: 'MAY', fullName: 'Mayo', quarter: 'Q2', status: 'Presentado' },
  { code: '06', name: 'JUN', fullName: 'Junio', quarter: 'Q2', status: 'Presentado' },
  { code: '07', name: 'JUL', fullName: 'Julio', quarter: 'Q3', status: 'Presentado' },
  { code: '08', name: 'AGO', fullName: 'Agosto', quarter: 'Q3', status: 'Presentado' },
  { code: '09', name: 'SEP', fullName: 'Setiembre', quarter: 'Q3', status: 'No Presentado' },
  { code: '10', name: 'OCT', fullName: 'Octubre', quarter: 'Q4', status: 'No Presentado' },
  { code: '11', name: 'NOV', fullName: 'Noviembre', quarter: 'Q4', status: 'No Presentado' },
  { code: '12', name: 'DIC', fullName: 'Diciembre', quarter: 'Q4', status: 'No Presentado' },
];

const QUARTERS = [
  { id: 'Q1', label: '1er Trimestre', months: ['01', '02', '03'] },
  { id: 'Q2', label: '2do Trimestre', months: ['04', '05', '06'] },
  { id: 'Q3', label: '3er Trimestre', months: ['07', '08', '09'] },
  { id: 'Q4', label: '4to Trimestre', months: ['10', '11', '12'] },
];

export default function PeriodSelectorCard({
  creds,
  bookType,
  setBookType,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  onStartProcess,
  loading,
  allowedSireBooks = ['RVIE', 'RCE'],
  onOpenProfile,
  onOpenHistory,
}) {
  const isRCE = bookType === 'RCE';
  const [fetchingPeriods, setFetchingPeriods] = useState(false);
  const [availableYears, setAvailableYears] = useState(['2026', '2025', '2024']);
  const [monthsData, setMonthsData] = useState(DEFAULT_MONTHS);
  const [uploadedPeriods, setUploadedPeriods] = useState([]);
  const [periodsNotice, setPeriodsNotice] = useState('');

  // Validate allowed permissions for RVIE & RCE
  const canViewRVIE = Array.isArray(allowedSireBooks) && allowedSireBooks.includes('RVIE');
  const canViewRCE = Array.isArray(allowedSireBooks) && allowedSireBooks.includes('RCE');
  const hasBothPermissions = canViewRVIE && canViewRCE;

  // Auto-correct active bookType if user lacks permission for currently selected book
  useEffect(() => {
    if (bookType === 'RVIE' && !canViewRVIE && canViewRCE) {
      setBookType('RCE');
    } else if (bookType === 'RCE' && !canViewRCE && canViewRVIE) {
      setBookType('RVIE');
    }
  }, [canViewRVIE, canViewRCE, bookType, setBookType]);

  // Fetch dynamic periods from SUNAT API & system upload history
  useEffect(() => {
    loadDynamicPeriods();
    loadUploadedPeriodsHistory();
  }, [creds?.sunatRuc, creds?.userSol, bookType, selectedYear]);

  const loadUploadedPeriodsHistory = async () => {
    try {
      const res = await getUploadedPeriods(bookType, creds?.sunatRuc);
      if (res.success && Array.isArray(res.periods)) {
        setUploadedPeriods(res.periods);
      }
    } catch (_) {
      // Ignore initial load error
    }
  };

  const loadDynamicPeriods = async () => {
    if (!creds?.sunatRuc) return;

    setFetchingPeriods(true);
    setPeriodsNotice('');
    try {
      const credsPayload = {
        empresa: creds?.empresa || '',
        clientId: creds?.clientId || '',
        clientSecret: creds?.clientSecret || '',
        ruc: creds?.sunatRuc || '',
        username: creds?.userSol || '',
        password: creds?.claveSol || '',
        isProduction: true,
      };

      const res = await fetchPeriods({
        credentials: credsPayload,
        bookType: bookType,
        useMock: false,
      });

      if (Array.isArray(res) && res.length > 0) {
        const years = res.map((item) => String(item.numEjercicio || item.periodo || '2026'));
        setAvailableYears(years);
        if (!years.includes(selectedYear)) {
          setSelectedYear(years[0]);
        }

        // Process months for current selectedYear
        const currentExercise = res.find((item) => String(item.numEjercicio) === selectedYear) || res[0];
        if (currentExercise && Array.isArray(currentExercise.lisPeriodos)) {
          const mappedMonths = DEFAULT_MONTHS.map((m) => {
            const perCode = selectedYear + m.code;
            const foundPeriod = currentExercise.lisPeriodos.find((p) => String(p.perTributario) === perCode);
            return {
              ...m,
              status: foundPeriod ? (foundPeriod.desEstado || (foundPeriod.codEstado === '1' ? 'Presentado' : 'No Presentado')) : 'No Presentado',
            };
          });
          setMonthsData(mappedMonths);
          setPeriodsNotice(`⚡ Sincronizado con SUNAT en vivo (${isRCE ? 'Servicio 5.33 RCE' : 'Servicio 5.2 RVIE'})`);
        }
      }
    } catch (_) {
      // Gracefully retain current months/years on network/auth error
    } finally {
      setFetchingPeriods(false);
      setTimeout(() => setPeriodsNotice(''), 3000);
    }
  };

  const currentMonthObj = monthsData.find((m) => m.code === selectedMonth) || monthsData[0];
  const presentedCount = monthsData.filter((m) => m.status.toLowerCase().includes('presentado') && !m.status.toLowerCase().includes('no')).length;

  return (
    <div
      className="card period-selector-card-enhanced"
      style={{
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
        background: '#ffffff',
        overflow: 'hidden',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
      }}
    >
      {/* 1. Header con Contexto de Libro y Segmented Control (solo si tiene ambos libros) */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f1f5f9',
          background: 'linear-gradient(to right, #ffffff, #fafafa)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: isRCE ? 'linear-gradient(135deg, #fffbeb, #fef3c7)' : 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
              color: isRCE ? '#d97706' : '#0284c7',
              border: isRCE ? '1px solid #fde68a' : '1px solid #bae6fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              boxShadow: isRCE ? '0 4px 12px rgba(217, 119, 6, 0.12)' : '0 4px 12px rgba(2, 132, 199, 0.12)',
            }}
          >
            <i className={`fa-solid ${isRCE ? 'fa-cart-shopping' : 'fa-file-invoice-dollar'}`}></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>
                {isRCE ? 'Registro de Compras Electrónico (RCE)' : 'Registro de Ventas e Ingresos (RVIE)'}
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: isRCE ? '#fffbeb' : '#f0f9ff',
                  color: isRCE ? '#b45309' : '#0369a1',
                  border: isRCE ? '1px solid #fde68a' : '1px solid #bae6fd',
                }}
              >
                {isRCE ? 'Compras' : 'Ventas'}
              </span>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              Seleccione el período fiscal y descargue la propuesta oficial generada por SUNAT
            </p>
          </div>
        </div>

        {/* Lado derecho: API SUNAT + Switcher (solo si ambos libros) + Acciones directas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: '700',
              padding: '4px 9px',
              borderRadius: '6px',
              background: '#f0fdf4',
              color: '#15803d',
              border: '1px solid #bbf7d0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }}></span>
            API SUNAT
          </span>

          {hasBothPermissions && (
            <div
              style={{
                display: 'inline-flex',
                padding: '3px',
                background: '#f1f5f9',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                gap: '3px',
              }}
            >
              <button
                type="button"
                onClick={() => setBookType('RVIE')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  background: !isRCE ? '#ffffff' : 'transparent',
                  color: !isRCE ? '#0284c7' : '#64748b',
                  boxShadow: !isRCE ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease',
                }}
              >
                <i className="fa-solid fa-file-invoice-dollar"></i>
                <span>Ventas</span>
              </button>

              <button
                type="button"
                onClick={() => setBookType('RCE')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  background: isRCE ? '#ffffff' : 'transparent',
                  color: isRCE ? '#d97706' : '#64748b',
                  boxShadow: isRCE ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease',
                }}
              >
                <i className="fa-solid fa-cart-shopping"></i>
                <span>Compras</span>
              </button>
            </div>
          )}

          {onOpenProfile && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onOpenProfile}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                borderRadius: '8px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: '#faf5ff',
                border: '1px solid #e9d5ff',
                color: '#7c3aed',
              }}
              title="Configurar credenciales SOL y API de esta empresa"
            >
              <i className="fa-solid fa-id-card-clip text-purple"></i> Credenciales SOL
            </button>
          )}

          {onOpenHistory && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onOpenHistory}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                borderRadius: '8px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
              title="Ver comprobantes y períodos subidos"
            >
              <i className="fa-solid fa-database text-blue"></i> Historial
            </button>
          )}
        </div>
      </div>

      {/* 2. Barra de Control de Período (Ejercicio Fiscal & Estado de Sincronización) */}
      <div
        style={{
          padding: '16px 24px',
          background: '#ffffff',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Selector de Año como Segmented Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <i className="fa-solid fa-calendar text-blue"></i> Ejercicio:
            </span>
            <div style={{ display: 'inline-flex', padding: '3px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', gap: '3px' }}>
              {availableYears.map((y) => {
                const isYearActive = y === selectedYear;
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setSelectedYear(y)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: isYearActive ? '800' : '600',
                      border: 'none',
                      cursor: 'pointer',
                      background: isYearActive ? (isRCE ? '#d97706' : '#0284c7') : 'transparent',
                      color: isYearActive ? '#ffffff' : '#64748b',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
            {fetchingPeriods && (
              <span style={{ fontSize: '11px', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="fa-solid fa-spinner fa-spin"></i> Actualizando...
              </span>
            )}
          </div>

          {/* Estadísticas de Cumplimiento */}
          <div
            style={{
              padding: '4px 10px',
              borderRadius: '8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '11px',
              fontWeight: '700',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ color: '#16a34a' }}>● {presentedCount} presentados</span>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <span style={{ color: '#64748b' }}>{12 - presentedCount} pendientes</span>
          </div>
        </div>

        {/* Resumen del Período Seleccionado */}
        <div
          style={{
            padding: '6px 14px',
            borderRadius: '10px',
            background: isRCE ? '#fffbeb' : '#f0f9ff',
            border: isRCE ? '1px solid #fde68a' : '1px solid #bae6fd',
            fontSize: '12px',
            fontWeight: '700',
            color: isRCE ? '#92400e' : '#075985',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <i className="fa-solid fa-calendar-check" style={{ color: isRCE ? '#d97706' : '#0284c7' }}></i>
          <span>
            Período Activo: <strong>{currentMonthObj.fullName?.toUpperCase()} {selectedYear}</strong> ({selectedYear}{selectedMonth})
          </span>
        </div>
      </div>

      {periodsNotice && (
        <div
          style={{
            padding: '8px 24px',
            fontSize: '12px',
            fontWeight: '700',
            background: '#ecfdf5',
            color: '#065f46',
            borderBottom: '1px solid #a7f3d0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <i className="fa-solid fa-circle-check text-green"></i>
          {periodsNotice}
        </div>
      )}

      {/* 3. Matriz Trimestral de Declaraciones Mensuales (4 Trimestres) */}
      <div style={{ padding: '22px 24px' }}>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Cronograma Trimestral de Declaración ({selectedYear})
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            Haga clic en cualquier mes para consultarlo
          </span>
        </div>

        {/* Layout en 4 Columnas Trimestrales (Q1, Q2, Q3, Q4) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '14px',
          }}
        >
          {QUARTERS.map((q) => (
            <div
              key={q.id}
              style={{
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {/* Encabezado del Trimestre */}
              <div
                style={{
                  padding: '2px 6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px',
                  fontWeight: '800',
                  color: '#64748b',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '6px',
                }}
              >
                <span>{q.id}</span>
                <span style={{ fontSize: '10px', fontWeight: '600', color: '#94a3b8' }}>{q.label}</span>
              </div>

              {/* Los 3 Meses del Trimestre */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {q.months.map((mCode) => {
                  const m = monthsData.find((item) => item.code === mCode) || { code: mCode, name: mCode, status: 'No Presentado' };
                  const isSelected = m.code === selectedMonth;
                  const isPresentado = m.status.toLowerCase().includes('presentado') && !m.status.toLowerCase().includes('no');
                  const perCode = selectedYear + m.code;
                  const isUploaded = uploadedPeriods.some((p) => p.periodo === perCode && (p.bookType === bookType || !p.bookType));

                  const themeBorder = isRCE ? '#d97706' : '#0284c7';
                  const themeBg = isRCE ? '#fffbeb' : '#f0f9ff';

                  return (
                    <div
                      key={m.code}
                      onClick={() => setSelectedMonth(m.code)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: isSelected ? `2px solid ${themeBorder}` : '1px solid #e2e8f0',
                        background: isSelected ? themeBg : '#ffffff',
                        boxShadow: isSelected ? (isRCE ? '0 4px 12px rgba(217, 119, 6, 0.15)' : '0 4px 12px rgba(2, 132, 199, 0.15)') : '0 1px 2px rgba(0,0,0,0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = isRCE ? '#fde68a' : '#bae6fd';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: isSelected ? (isRCE ? '#d97706' : '#0284c7') : '#94a3b8', width: '16px' }}>
                          {m.code}
                        </span>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: isSelected ? '800' : '700', color: isSelected ? '#0f172a' : '#334155' }}>
                            {m.name}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: '800',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: isPresentado ? '#dcfce7' : '#f1f5f9',
                            color: isPresentado ? '#15803d' : '#64748b',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          {isPresentado ? '✓ Presentado' : 'Pendiente'}
                        </span>

                        {isUploaded && (
                          <span
                            style={{
                              fontSize: '8px',
                              fontWeight: '800',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: '#e0f2fe',
                              color: '#0369a1',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                            title="Comprobantes ya sincronizados en Firebase"
                          >
                            <i className="fa-solid fa-cloud-arrow-down" style={{ fontSize: '8px' }}></i> En BD
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 4. Botón Principal de Descarga (Hero Call-to-Action) */}
        <div style={{ marginTop: '22px' }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={loading}
            onClick={onStartProcess}
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: '12px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: isRCE
                ? 'linear-gradient(135deg, #d97706 0%, #ea580c 100%)'
                : 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              boxShadow: isRCE
                ? '0 6px 20px -2px rgba(217, 119, 6, 0.4), 0 2px 6px -1px rgba(217, 119, 6, 0.2)'
                : '0 6px 20px -2px rgba(2, 132, 199, 0.4), 0 2px 6px -1px rgba(2, 132, 199, 0.2)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                <i className={`fa-solid ${loading ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-down'}`}></i>
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '-0.2px' }}>
                  {loading
                    ? 'Consultando estado y descargando propuesta desde SUNAT...'
                    : `Descargar Propuesta ${isRCE ? 'RCE (Compras)' : 'RVIE (Ventas)'} — Período ${selectedYear}-${selectedMonth}`}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
                  Mes: <strong>{currentMonthObj.fullName}</strong> • Conexión oficial y extracción directa con Clave SOL
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                fontSize: '12px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{loading ? 'Procesando' : 'Consultar'}</span>
              <i className="fa-solid fa-arrow-right"></i>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
