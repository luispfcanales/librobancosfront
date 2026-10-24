import React, { useEffect, useState, useMemo } from 'react';
import { getUploadedRecords, getUploadedPeriods } from '../services/api';

const formatMoney = (num) => {
  if (num === undefined || num === null) return '0.00';
  return num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function UploadedHistoryModal({ isOpen, onClose, currentRuc = '' }) {
  const [activeTab, setActiveTab] = useState('periods'); // 'periods' | 'invoices'
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [periodsData, setPeriodsData] = useState([]);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setCurrentPage(1);
    }
  }, [isOpen, activeTab, currentRuc]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'periods') {
        const res = await getUploadedPeriods('', currentRuc);
        setPeriodsData(res.periods || []);
      } else {
        const data = await getUploadedRecords('RCE', '', currentRuc);
        setHistoryData(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const records = historyData ? historyData.records || [] : [];
  const totalPages = Math.ceil(records.length / pageSize) || 1;

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return records.slice(start, start + pageSize);
  }, [records, currentPage, pageSize]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '980px', width: '95%', textAlign: 'left', borderRadius: '16px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header" style={{ marginBottom: '12px', paddingBottom: '8px' }}>
          <h3>
            <i className="fa-solid fa-clock-rotate-left text-blue"></i> Historial de Subidas al Sistema
          </h3>
          <button className="btn-text" onClick={onClose}>
            <i className="fa-solid fa-xmark" style={{ fontSize: '18px' }}></i>
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
          <button
            className={`btn ${activeTab === 'periods' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '12.5px', borderRadius: '8px' }}
            onClick={() => setActiveTab('periods')}
          >
            <i className="fa-solid fa-calendar-check" style={{ marginRight: '6px' }}></i>
            Historial de Períodos y Meses ({periodsData.length})
          </button>
          <button
            className={`btn ${activeTab === 'invoices' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '12.5px', borderRadius: '8px' }}
            onClick={() => setActiveTab('invoices')}
          >
            <i className="fa-solid fa-file-invoice" style={{ marginRight: '6px' }}></i>
            Comprobantes Detallados ({records.length})
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <i className="fa-solid fa-spinner fa-spin text-blue" style={{ fontSize: '24px' }}></i>
            <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
              Cargando historial desde el servidor...
            </p>
          </div>
        ) : error ? (
          <div style={{ padding: '20px', color: 'var(--accent-red)' }}>
            Error al consultar historial: {error}
          </div>
        ) : activeTab === 'periods' ? (
          /* Periods History Tab */
          <div>
            {periodsData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-folder-open" style={{ fontSize: '32px', marginBottom: '10px', display: 'block', opacity: 0.5 }}></i>
                No hay períodos subidos al sistema aún.
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '12px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  Se muestran <strong>{periodsData.length}</strong> períodos registrados en el historial de subidas:
                </div>
                <div className="table-responsive" style={{ maxHeight: '400px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <table className="data-table" style={{ fontSize: '12px' }}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Período</th>
                        <th>Libro SIRE</th>
                        <th>Estado SUNAT</th>
                        <th>Fecha de Subida</th>
                        <th>Reg. Nuevos</th>
                        <th>Reg. Omitidos</th>
                        <th>RUC / Empresa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {periodsData.map((p, idx) => {
                        const isPresentado = p.estadoSunat === 'PRESENTADO';
                        const perFormatted = p.year && p.month ? `${p.year}-${p.month}` : p.periodo;
                        return (
                          <tr key={p.id || idx}>
                            <td className="font-mono">{idx + 1}</td>
                            <td>
                              <strong style={{ color: 'var(--text-primary)' }}>{perFormatted}</strong>
                            </td>
                            <td>
                              <span className={`badge ${p.bookType === 'RCE' ? 'badge-warning' : 'badge-info'}`}>
                                {p.bookType || 'RVIE'}
                              </span>
                            </td>
                            <td>
                              {isPresentado ? (
                                <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', fontWeight: '700' }}>
                                  <i className="fa-solid fa-lock" style={{ marginRight: '4px' }}></i> PRESENTADO (1 subida)
                                </span>
                              ) : (
                                <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: '700' }}>
                                  <i className="fa-solid fa-rotate" style={{ marginRight: '4px' }}></i> NO PRESENTADO (Diferencial)
                                </span>
                              )}
                            </td>
                            <td style={{ color: 'var(--text-muted)' }}>
                              {p.uploadedAt ? new Date(p.uploadedAt).toLocaleString() : '-'}
                            </td>
                            <td style={{ fontWeight: '700', color: '#34d399' }}>+{p.newCount || 0}</td>
                            <td style={{ color: '#fbbf24' }}>{p.skippedCount || 0}</td>
                            <td style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                              {p.ruc ? `${p.ruc} - ${p.empresa || ''}` : p.empresa || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Invoices Detailed History Tab */
          <div>
            {records.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No hay comprobantes guardados en el sistema por el momento.
              </div>
            ) : (
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span>
                    <strong>Total Almacenado:</strong> {records.length.toLocaleString()} comprobantes
                  </span>
                  <span>
                    <strong>Última Subida:</strong>{' '}
                    {historyData?.lastUploaded ? new Date(historyData.lastUploaded).toLocaleString() : '-'}
                  </span>
                </div>

                <div className="table-responsive" style={{ maxHeight: '380px' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>F. Emisión</th>
                        <th>Serie-Número</th>
                        <th>RUC/DNI</th>
                        <th>Razón Social</th>
                        <th className="text-right">B. Imponible</th>
                        <th className="text-right">IGV</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRecords.map((rec, idx) => {
                        const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                        return (
                          <tr key={idx}>
                            <td className="font-mono">{globalIdx}</td>
                            <td>{rec.fechaEmision}</td>
                            <td className="font-mono">
                              {rec.serie}-{rec.numero}
                            </td>
                            <td className="font-mono">{rec.numDocAdquiriente || rec.numDocProveedor}</td>
                            <td>{rec.razonSocialAdquiriente || rec.razonSocialProveedor || 'CLIENTE VARIOS'}</td>
                            <td className="text-right font-mono">{formatMoney(rec.biGravada)}</td>
                            <td className="text-right font-mono">{formatMoney(rec.igv)}</td>
                            <td className="text-right font-mono" style={{ fontWeight: 700 }}>
                              {formatMoney(rec.montoTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '12px' }}>
                    <span>Página {currentPage} de {totalPages}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(1)}
                      >
                        ⏮️
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        ◀️ Anterior
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Siguiente ▶️
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        ⏭️
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: '20px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
