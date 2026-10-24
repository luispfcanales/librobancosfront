import React, { useState, useEffect, useMemo } from 'react';
import { getUploadedRecords, updateInvoicePayment } from '../services/api';

const formatMoney = (num) => {
  if (num === undefined || num === null) return '0.00';
  return num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const BANKS = ['BCP', 'BBVA', 'Interbank', 'Scotiabank', 'Banco de la Nación', 'Yape / Plin', 'Efectivo', 'Otros'];

export default function InvoicePayments({ activeCompany, currentUser }) {
  const [bookType, setBookType] = useState('RCE'); // 'RCE' or 'RVIE'
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'PENDIENTE', 'PAGADO'
  const [dataSource, setDataSource] = useState('');

  const currentRuc = activeCompany?.ruc || currentUser?.ruc || '';

  // Payment Modal State
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    paymentStatus: 'PAGADO',
    fechaPago: new Date().toISOString().split('T')[0],
    banco: 'BCP',
    nroOperacion: '',
    montoPagado: 0,
    notas: '',
  });
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState('');

  // Detail Modal State
  const [selectedFicha, setSelectedFicha] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    fetchInvoicesFromFirebase();
  }, [bookType, currentRuc]);

  useEffect(() => {
    setCurrentPage(1);
  }, [bookType, searchTerm, statusFilter]);

  const fetchInvoicesFromFirebase = async () => {
    setLoading(true);
    setPaymentNotice('');
    try {
      const res = await getUploadedRecords(bookType, '', currentRuc);
      if (res.success && Array.isArray(res.records)) {
        setRecords(res.records);
        setDataSource(res.source || 'Firebase Firestore');
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error('Error cargando facturas de Firebase:', err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const searchLower = searchTerm.toLowerCase().trim();
      const car = (rec.carSunat || '').toLowerCase();
      const ruc = (rec.numDocProveedor || rec.numDocAdquiriente || rec.ruc || '').toLowerCase();
      const razon = (rec.razonSocialProveedor || rec.razonSocialAdquiriente || rec.razonSocialEmisor || '').toLowerCase();
      const compNum = `${rec.serie || ''}-${rec.numero || ''}`.toLowerCase();

      const matchesSearch =
        !searchLower ||
        car.includes(searchLower) ||
        ruc.includes(searchLower) ||
        razon.includes(searchLower) ||
        compNum.includes(searchLower);

      const status = (rec.paymentStatus || 'PENDIENTE').toUpperCase();
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PAGADO' && status === 'PAGADO') ||
        (statusFilter === 'PENDIENTE' && status !== 'PAGADO');

      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Metrics
  const metrics = useMemo(() => {
    let totalMonto = 0;
    let totalPagado = 0;
    let totalPendiente = 0;

    records.forEach((rec) => {
      const monto = Number(rec.montoTotal) || 0;
      totalMonto += monto;
      if (rec.paymentStatus === 'PAGADO') {
        totalPagado += monto;
      } else {
        totalPendiente += monto;
      }
    });

    return { totalMonto, totalPagado, totalPendiente };
  }, [records]);

  const handleOpenPaymentModal = (rec) => {
    setSelectedInvoice(rec);
    setPaymentForm({
      paymentStatus: rec.paymentStatus || 'PAGADO',
      fechaPago: rec.fechaPago || new Date().toISOString().split('T')[0],
      banco: rec.banco || 'BCP',
      nroOperacion: rec.nroOperacion || '',
      montoPagado: rec.montoPagado || rec.montoTotal || 0,
      notas: rec.notasPago || '',
    });
  };

  const handleSavePayment = async () => {
    if (!selectedInvoice) return;

    setSavingPayment(true);
    setPaymentNotice('');
    try {
      const payload = {
        carSunat: selectedInvoice.carSunat,
        bookType: bookType,
        ruc: currentRuc,
        paymentStatus: paymentForm.paymentStatus,
        fechaPago: paymentForm.fechaPago,
        banco: paymentForm.banco,
        nroOperacion: paymentForm.nroOperacion,
        montoPagado: Number(paymentForm.montoPagado),
        notas: paymentForm.notas,
      };

      const res = await updateInvoicePayment(payload);
      if (res.success) {
        setPaymentNotice('✅ Estado de pago actualizado en Firebase Firestore');
        setSelectedInvoice(null);
        await fetchInvoicesFromFirebase();
      } else {
        alert('Error: ' + res.error);
      }
    } catch (err) {
      alert('Error de red al actualizar pago: ' + err.message);
    } finally {
      setSavingPayment(false);
      setTimeout(() => setPaymentNotice(''), 4000);
    }
  };

  return (
    <div className="invoice-payments-container">
      {/* Module Title Banner */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <h3>
            <i className="fa-solid fa-credit-card text-blue"></i> Módulo de Pago de Facturas (Consulta Firebase)
          </h3>
          <span className="badge badge-success">
            <i className="fa-solid fa-fire"></i> {dataSource || 'Firebase Firestore'}
          </span>
        </div>
        <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
          Consulte y gestione el estado de pago de las facturas almacenadas en su base de datos Firebase (Colección <code>rce_records</code> / <code>rvie_records</code>).
        </p>
      </div>

      {paymentNotice && (
        <div className="card" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d', marginBottom: '16px', fontWeight: '700' }}>
          {paymentNotice}
        </div>
      )}

      {/* Metrics Row */}
      <div className="metrics-row" style={{ flexWrap: 'wrap', marginBottom: '20px' }}>
        <div className="metric-card">
          <div className="metric-icon blue">
            <i className="fa-solid fa-file-invoice"></i>
          </div>
          <div className="metric-data">
            <span className="metric-label">Facturas en Firebase</span>
            <h3>{records.length}</h3>
            <span className="metric-sub">Colección {bookType === 'RCE' ? 'rce_records' : 'rvie_records'}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon amber">
            <i className="fa-solid fa-clock"></i>
          </div>
          <div className="metric-data">
            <span className="metric-label">Pendiente de Pago</span>
            <h3 style={{ color: '#fbbf24' }}>S/ {formatMoney(metrics.totalPendiente)}</h3>
            <span className="metric-sub">Facturas por Cancelar</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon green">
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <div className="metric-data">
            <span className="metric-label">Total Pagado</span>
            <h3 style={{ color: '#4ade80' }}>S/ {formatMoney(metrics.totalPagado)}</h3>
            <span className="metric-sub">Pagos Confirmados</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon purple">
            <i className="fa-solid fa-sack-dollar"></i>
          </div>
          <div className="metric-data">
            <span className="metric-label">Monto Total Registrado</span>
            <h3>S/ {formatMoney(metrics.totalMonto)}</h3>
            <span className="metric-sub">Total {bookType === 'RCE' ? 'Compras' : 'Ventas'}</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card table-wrapper-card">
        <div className="table-toolbar">
          {/* Book Switcher Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn btn-sm ${bookType === 'RCE' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ background: bookType === 'RCE' ? 'linear-gradient(135deg, #d97706, #f59e0b)' : '' }}
              onClick={() => setBookType('RCE')}
            >
              <i className="fa-solid fa-cart-shopping"></i> Compras RCE
            </button>
            <button
              className={`btn btn-sm ${bookType === 'RVIE' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setBookType('RVIE')}
            >
              <i className="fa-solid fa-file-invoice-dollar"></i> Ventas RVIE
            </button>
          </div>

          <div className="toolbar-actions" style={{ flexWrap: 'wrap', gap: '8px' }}>
            <div className="search-box">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar CAR, RUC, Proveedor..."
              />
            </div>

            <select
              className="select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Todos los Estados de Pago</option>
              <option value="PENDIENTE">🟠 Pendientes de Pago</option>
              <option value="PAGADO">🟢 Pagados</option>
            </select>

            <button className="btn btn-secondary" onClick={fetchInvoicesFromFirebase} disabled={loading}>
              <i className={`fa-solid fa-rotate ${loading ? 'fa-spin' : ''}`}></i> Consultar Firebase
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>CAR SUNAT (ID Firebase)</th>
                <th>F. Emisión</th>
                <th>Tipo - Serie - Nro</th>
                <th>{bookType === 'RCE' ? 'Proveedor (RUC / Razón Social)' : 'Adquiriente'}</th>
                <th className="text-right">Monto Total</th>
                <th>Moneda</th>
                <th>Estado de Pago</th>
                <th>Datos del Pago</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '30px' }}>
                    <i className="fa-solid fa-spinner fa-spin text-blue" style={{ fontSize: '20px' }}></i>
                    <p style={{ marginTop: '8px', color: 'var(--text-muted)' }}>Consultando facturas en Firebase Firestore...</p>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No se encontraron facturas guardadas en Firebase para los filtros seleccionados
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((rec, idx) => {
                  const isPaid = rec.paymentStatus === 'PAGADO';
                  const ruc = rec.numDocProveedor || rec.numDocAdquiriente || rec.ruc || '-';
                  const razon = rec.razonSocialProveedor || rec.razonSocialEmisor || rec.razonSocialAdquiriente || '-';
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;

                  return (
                    <tr key={idx}>
                      <td className="font-mono">{globalIdx}</td>
                      <td className="font-mono text-blue" style={{ fontSize: '11px', fontWeight: '600' }}>
                        {rec.carSunat || '-'}
                      </td>
                      <td>{rec.fechaEmision || '-'}</td>
                      <td className="font-mono">
                        {rec.descTipoComprobante || 'Factura'} ({rec.serie || 'F001'}-{rec.numero || '1'})
                      </td>
                      <td>
                        <div><strong>{razon}</strong></div>
                        <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RUC: {ruc}</span>
                      </td>
                      <td className="text-right font-mono" style={{ fontWeight: 700 }}>
                        {formatMoney(rec.montoTotal)}
                      </td>
                      <td className="font-mono">{rec.moneda || 'PEN'}</td>
                      <td>
                        <span className={`badge ${isPaid ? 'badge-success' : 'badge-warning'}`}>
                          {isPaid ? '🟢 PAGADO' : '🟠 PENDIENTE'}
                        </span>
                      </td>
                      <td style={{ fontSize: '11px' }}>
                        {isPaid ? (
                          <div>
                            <div><strong>Banco:</strong> {rec.banco || '-'}</div>
                            <div><strong>Op:</strong> <span className="font-mono">{rec.nroOperacion || '-'}</span></div>
                            <div><strong>F. Pago:</strong> {rec.fechaPago || '-'}</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Sin registrar</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-sm btn-success"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            onClick={() => handleOpenPaymentModal(rec)}
                            title="Registrar / Editar Pago"
                          >
                            <i className="fa-solid fa-credit-card"></i> {isPaid ? 'Editar' : 'Pagar'}
                          </button>
                          <button
                            className="btn-text"
                            style={{ fontSize: '12px', color: '#38bdf8' }}
                            onClick={() => setSelectedFicha(rec)}
                            title="Ver Ficha Completa"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredRecords.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '10px 14px', background: 'var(--bg-input)', borderRadius: '8px', fontSize: '12.5px', border: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Mostrando <strong>{(currentPage - 1) * pageSize + 1}</strong> - <strong>{Math.min(currentPage * pageSize, filteredRecords.length)}</strong> de <strong>{filteredRecords.length.toLocaleString()}</strong> facturas
            </span>

            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  title="Primera página"
                >
                  ⏮️
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  ◀️ Anterior
                </button>
                <span style={{ padding: '0 8px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '11px' }}
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
                  title="Última página"
                >
                  ⏭️
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Registration Modal */}
      {selectedInvoice && (
        <div className="modal-backdrop" onClick={() => setSelectedInvoice(null)}>
          <div className="modal-content" style={{ maxWidth: '550px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3>
                <i className="fa-solid fa-credit-card text-blue"></i> Registrar Pago de Factura
              </h3>
              <button className="btn-close" onClick={() => setSelectedInvoice(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="modal-body" style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'var(--bg-card-hover)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', lineHeight: '1.8' }}>
                <div><strong>CAR SUNAT:</strong> <span className="font-mono text-blue">{selectedInvoice.carSunat}</span></div>
                <div><strong>Proveedor:</strong> {selectedInvoice.razonSocialProveedor || selectedInvoice.razonSocialEmisor || '-'}</div>
                <div><strong>Comprobante:</strong> {selectedInvoice.serie}-{selectedInvoice.numero}</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0284c7', marginTop: '4px' }}>
                  <strong>Monto Total Comprobante:</strong> {selectedInvoice.moneda || 'PEN'} {formatMoney(selectedInvoice.montoTotal)}
                </div>
              </div>

              <div className="input-group">
                <label>Estado del Pago</label>
                <select
                  value={paymentForm.paymentStatus}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentStatus: e.target.value })}
                >
                  <option value="PAGADO">🟢 PAGADO (CANCELADO)</option>
                  <option value="PENDIENTE">🟠 PENDIENTE DE PAGO</option>
                  <option value="PARCIAL">🟡 PAGO PARCIAL</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label>Fecha de Pago</label>
                  <input
                    type="date"
                    value={paymentForm.fechaPago}
                    onChange={(e) => setPaymentForm({ ...paymentForm, fechaPago: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label>Banco / Medio de Pago</label>
                  <select
                    value={paymentForm.banco}
                    onChange={(e) => setPaymentForm({ ...paymentForm, banco: e.target.value })}
                  >
                    {BANKS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label>Número de Operación</label>
                  <input
                    type="text"
                    placeholder="Ej. OP-982341"
                    value={paymentForm.nroOperacion}
                    onChange={(e) => setPaymentForm({ ...paymentForm, nroOperacion: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label>Monto Pagado (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentForm.montoPagado}
                    onChange={(e) => setPaymentForm({ ...paymentForm, montoPagado: e.target.value })}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Notas / Observaciones</label>
                <textarea
                  rows="2"
                  placeholder="Ingrese observaciones adicionales del pago..."
                  value={paymentForm.notas}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notas: e.target.value })}
                ></textarea>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedInvoice(null)}>
                Cancelar
              </button>
              <button className="btn btn-success" onClick={handleSavePayment} disabled={savingPayment}>
                {savingPayment ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Guardando en Firebase...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-floppy-disk"></i> Guardar Pago en Firebase
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ficha Inspector Modal */}
      {selectedFicha && (
        <div className="modal-backdrop" onClick={() => setSelectedFicha(null)}>
          <div className="modal-content" style={{ maxWidth: '650px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3>
                <i className="fa-solid fa-file-invoice text-blue"></i> Ficha Comprobante Firebase
              </h3>
              <button className="btn-close" onClick={() => setSelectedFicha(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="modal-body" style={{ fontSize: '12px', lineHeight: '1.8', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><strong>CAR SUNAT:</strong> <span className="font-mono text-blue">{selectedFicha.carSunat}</span></div>
              <div><strong>Fecha de Emisión:</strong> {selectedFicha.fechaEmision}</div>
              <div><strong>Tipo Comprobante:</strong> {selectedFicha.descTipoComprobante} ({selectedFicha.codTipoComprobante})</div>
              <div><strong>Serie - Número:</strong> <span className="font-mono">{selectedFicha.serie}-{selectedFicha.numero}</span></div>
              <div><strong>Proveedor / RUC:</strong> {selectedFicha.razonSocialProveedor || selectedFicha.razonSocialEmisor} ({selectedFicha.numDocProveedor || selectedFicha.ruc})</div>
              <div><strong>Monto Total:</strong> {selectedFicha.moneda || 'PEN'} {formatMoney(selectedFicha.montoTotal)}</div>
              <div><strong>Período:</strong> {selectedFicha.periodo}</div>
              <div><strong>Estado de Pago:</strong> {selectedFicha.paymentStatus || 'PENDIENTE'}</div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedFicha(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
