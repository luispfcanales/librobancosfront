import React, { useState, useMemo, useEffect } from 'react';

const formatMoney = (num) => {
  if (num === undefined || num === null) return '0.00';
  return num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function DataTable({
  records,
  rawCsv,
  period,
  ticket,
  bookType,
  onUploadSystem,
  uploading,
}) {
  const isRCE = bookType === 'RCE';
  const [searchTerm, setSearchTerm] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('ALL');
  const [showRawCsv, setShowRawCsv] = useState(false);
  const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'full_rce'
  const [selectedRecord, setSelectedRecord] = useState(null); // Record for detail modal

  // Pagination state
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, docTypeFilter, pageSize, viewMode]);

  const filteredRecords = useMemo(() => {
    if (!records) return [];
    return records.filter((rec) => {
      const searchLower = searchTerm.toLowerCase().trim();
      const numDoc = (rec.numDocAdquiriente || rec.ruc || rec.rucComprador || '').toLowerCase();
      const razon = (rec.razonSocialAdquiriente || rec.razonSocialEmisor || rec.razonSocialComprador || '').toLowerCase();
      const car = (rec.carSunat || '').toLowerCase();
      const compNum = `${rec.serie || ''}-${rec.numero || ''}`.toLowerCase();

      const matchesSearch =
        !searchLower ||
        numDoc.includes(searchLower) ||
        razon.includes(searchLower) ||
        car.includes(searchLower) ||
        compNum.includes(searchLower);

      const matchesType =
        docTypeFilter === 'ALL' || rec.codTipoComprobante === docTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [records, searchTerm, docTypeFilter]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredRecords.length / pageSize) || 1;
  }, [filteredRecords.length, pageSize]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, filteredRecords.length);

  const handleExportCSV = () => {
    if (!rawCsv) {
      alert('No hay datos CSV para exportar');
      return;
    }
    const blob = new Blob([rawCsv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Propuesta_${isRCE ? 'RCE' : 'RVIE'}_${period || 'export'}_${ticket || 'file'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyRawCsv = () => {
    if (!rawCsv) return;
    navigator.clipboard.writeText(rawCsv);
    alert('Código CSV copiado al portapapeles');
  };

  return (
    <div className="card table-wrapper-card">
      <div className="table-toolbar">
        <div className="table-title">
          <h3>
            <i className="fa-solid fa-magnifying-glass-chart text-blue"></i> Previsualización Registros {isRCE ? 'RCE (Compras)' : 'RVIE (Ventas)'}
          </h3>
          <span className="badge badge-success">
            {records ? records.length.toLocaleString() : 0} registros cargados
          </span>
        </div>

        <div className="toolbar-actions" style={{ flexWrap: 'wrap', gap: '8px' }}>
          {isRCE && (
            <div className="btn-group" style={{ display: 'inline-flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <button
                className={`btn btn-sm ${viewMode === 'summary' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 0, padding: '5px 12px', fontSize: '12px' }}
                onClick={() => setViewMode('summary')}
              >
                <i className="fa-solid fa-table-cells"></i> Resumen
              </button>
              <button
                className={`btn btn-sm ${viewMode === 'full_rce' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 0, padding: '5px 12px', fontSize: '12px' }}
                onClick={() => setViewMode('full_rce')}
              >
                <i className="fa-solid fa-table-columns"></i> SUNAT RCE (41 Campos)
              </button>
            </div>
          )}

          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar RUC, Razón Social, CAR..."
            />
          </div>

          <select
            className="select-sm"
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
          >
            <option value="ALL">Todos los Comprobantes</option>
            <option value="01">Facturas (01)</option>
            <option value="03">Boletas (03)</option>
            <option value="07">Notas de Crédito (07)</option>
            <option value="14">Recibos Servicios (14)</option>
          </select>

          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <i className="fa-solid fa-file-csv"></i> Guardar CSV
          </button>

          <button
            className="btn btn-success"
            disabled={uploading || !records || records.length === 0}
            onClick={() => onUploadSystem(false)}
          >
            {uploading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> Subiendo al Sistema...
              </>
            ) : (
              <>
                <i className="fa-solid fa-cloud-arrow-up"></i> Subir a Mi Sistema
              </>
            )}
          </button>
        </div>
      </div>

      <div className="table-responsive">
        {viewMode === 'full_rce' && isRCE ? (
          /* Full SUNAT 41 Column Table View */
          <table className="data-table font-mono-table" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>
                <th>#</th>
                <th>CAR SUNAT</th>
                <th>RUC Comprador</th>
                <th>F. Emisión</th>
                <th>F. Vcto</th>
                <th>Tipo Doc</th>
                <th>Serie - Número</th>
                <th>Doc Proveedor</th>
                <th>Razón Social Proveedor</th>
                <th className="text-right">BI Gravado DG</th>
                <th className="text-right">IGV DG</th>
                <th className="text-right">BI Grav. DGNG</th>
                <th className="text-right">IGV DGNG</th>
                <th className="text-right">BI Grav. DNG</th>
                <th className="text-right">IGV DNG</th>
                <th className="text-right">Valor Adq. NG</th>
                <th className="text-right">ISC</th>
                <th className="text-right">ICBPER</th>
                <th className="text-right">Otros Trib.</th>
                <th className="text-right">Total CP</th>
                <th>Moneda</th>
                <th>T. Cambio</th>
                <th>Doc. Modificado</th>
                <th>Detracción</th>
                <th>Est. Comp.</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="26" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No se encontraron registros para los filtros seleccionados
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((rec, idx) => {
                  const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                  const docIdent = (rec.tipoDocAdquiriente || 'RUC') + ': ' + (rec.ruc || rec.numDocAdquiriente);
                  const razonSocial = rec.razonSocialEmisor || rec.razonSocialAdquiriente || '-';
                  const docMod = rec.serieCPMod || rec.nroCPMod ? `${rec.tipoCPMod || 'Doc'}: ${rec.serieCPMod || ''}-${rec.nroCPMod || ''}` : '-';

                  return (
                    <tr key={idx}>
                      <td className="font-mono">{globalIndex}</td>
                      <td className="font-mono text-blue" style={{ fontSize: '11px' }}>{rec.carSunat || '-'}</td>
                      <td className="font-mono">{rec.rucComprador || '-'}</td>
                      <td>{rec.fechaEmision}</td>
                      <td>{rec.fechaVencimiento || '-'}</td>
                      <td>
                        <span className={`badge ${rec.codTipoComprobante === '07' ? 'badge-danger' : 'badge-info'}`}>
                          {rec.descTipoComprobante} ({rec.codTipoComprobante})
                        </span>
                      </td>
                      <td className="font-mono">{rec.serie}-{rec.numero}</td>
                      <td className="font-mono">{docIdent}</td>
                      <td><strong>{razonSocial}</strong></td>
                      <td className="text-right font-mono">{formatMoney(rec.biGravadoDG)}</td>
                      <td className="text-right font-mono">{formatMoney(rec.igvDG)}</td>
                      <td className="text-right font-mono">{formatMoney(rec.biGravadoDGNG)}</td>
                      <td className="text-right font-mono">{formatMoney(rec.igvDGNG)}</td>
                      <td className="text-right font-mono">{formatMoney(rec.biGravadoDNG)}</td>
                      <td className="text-right font-mono">{formatMoney(rec.igvDNG)}</td>
                      <td className="text-right font-mono" style={{ color: rec.valorAdqNG > 0 ? '#38bdf8' : 'inherit' }}>
                        {formatMoney(rec.valorAdqNG)}
                      </td>
                      <td className="text-right font-mono">{formatMoney(rec.isc)}</td>
                      <td className="text-right font-mono">{formatMoney(rec.icbper)}</td>
                      <td className="text-right font-mono">{formatMoney(rec.otrosTributos)}</td>
                      <td className="text-right font-mono" style={{ fontWeight: 700 }}>{formatMoney(rec.montoTotal)}</td>
                      <td className="font-mono">{rec.moneda || 'PEN'}</td>
                      <td className="font-mono">{rec.tipoCambio || '1.000'}</td>
                      <td className="font-mono" style={{ fontSize: '11px' }}>{docMod}</td>
                      <td>{rec.detraccion || '-'}</td>
                      <td><span className="badge badge-success">{rec.estado || '1'}</span></td>
                      <td>
                        <button
                          className="btn-text"
                          style={{ fontSize: '12px', padding: '2px 6px', color: '#38bdf8' }}
                          onClick={() => setSelectedRecord(rec)}
                          title="Ver Ficha SUNAT Completa"
                        >
                          <i className="fa-solid fa-eye"></i> Ficha
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : isRCE ? (
          /* Custom RCE Table View as specifically requested by user */
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Fecha de emisión</th>
                <th>Tipo de documento</th>
                <th>Serie - Número</th>
                <th>RUC Proveedor</th>
                <th>Razón Social Proveedor</th>
                <th className="text-right">Monto Total</th>
                <th>Moneda</th>
                <th style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>F. Emisión Modificado</th>
                <th style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>Tipo CP Modificado</th>
                <style>{`.nc-col { background: rgba(239, 68, 68, 0.05); }`}</style>
                <th style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>Serie CP Modificado</th>
                <th style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>Nro CP Modificado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="13" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No se encontraron registros para los filtros seleccionados
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((rec, idx) => {
                  const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                  const isNC = rec.codTipoComprobante === '07';
                  const docBadgeClass = isNC ? 'badge-danger' : 'badge-info';

                  const rucProv = rec.numDocAdquiriente || rec.ruc || '-';
                  const razonProv = rec.razonSocialEmisor || rec.razonSocialAdquiriente || 'PROVEEDOR VARIOS';

                  return (
                    <tr key={idx}>
                      <td className="font-mono">{globalIndex}</td>
                      <td>{rec.fechaEmision}</td>
                      <td>
                        <span className={`badge ${docBadgeClass}`}>
                          {rec.descTipoComprobante} ({rec.codTipoComprobante})
                        </span>
                      </td>
                      <td className="font-mono">{rec.serie}-{rec.numero}</td>
                      <td className="font-mono">{rucProv}</td>
                      <td><strong>{razonProv}</strong></td>
                      <td className="text-right font-mono" style={{ fontWeight: 700 }}>
                        {formatMoney(rec.montoTotal)}
                      </td>
                      <td className="font-mono">{rec.moneda || 'PEN'}</td>
                      
                      {/* Documento Modificado cuando es Nota de Crédito */}
                      <td className="font-mono nc-col" style={{ fontSize: '11px' }}>
                        {isNC || rec.fechaEmisionDocMod ? (rec.fechaEmisionDocMod || '-') : '-'}
                      </td>
                      <td className="nc-col">
                        {isNC || rec.tipoCPMod ? (rec.tipoCPMod || '-') : '-'}
                      </td>
                      <td className="font-mono nc-col">
                        {isNC || rec.serieCPMod ? (rec.serieCPMod || '-') : '-'}
                      </td>
                      <td className="font-mono nc-col">
                        {isNC || rec.nroCPMod ? (rec.nroCPMod || '-') : '-'}
                      </td>

                      <td>
                        <button
                          className="btn-text"
                          style={{ fontSize: '12px', color: '#38bdf8' }}
                          onClick={() => setSelectedRecord(rec)}
                          title="Ver Ficha Completa SUNAT RCE"
                        >
                          <i className="fa-solid fa-eye"></i> Detalle
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          /* Standard RVIE Ventas Table View */
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>CAR SUNAT</th>
                <th>F. Emisión</th>
                <th>Tipo Doc</th>
                <th>Serie - Número</th>
                <th>Adquiriente (RUC/DNI)</th>
                <th>Razón Social Adquiriente</th>
                <th className="text-right">B. Imponible (S/)</th>
                <th className="text-right">IGV (S/)</th>
                <th className="text-right">Total (S/)</th>
                <th>Moneda</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No se encontraron registros para los filtros seleccionados
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((rec, idx) => {
                  const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                  let docBadgeClass = 'badge-info';
                  if (rec.codTipoComprobante === '03') docBadgeClass = 'badge-warning';
                  if (rec.codTipoComprobante === '07') docBadgeClass = 'badge-danger';

                  const docIdent = rec.tipoDocAdquiriente + ': ' + rec.numDocAdquiriente;
                  const razonSocial = rec.razonSocialAdquiriente || 'CLIENTE VARIOS';

                  return (
                    <tr key={idx}>
                      <td className="font-mono">{globalIndex}</td>
                      <td className="font-mono text-blue" style={{ fontSize: '11px' }}>
                        {rec.carSunat || '-'}
                      </td>
                      <td>{rec.fechaEmision}</td>
                      <td>
                        <span className={`badge ${docBadgeClass}`}>
                          {rec.descTipoComprobante} ({rec.codTipoComprobante})
                        </span>
                      </td>
                      <td className="font-mono">
                        {rec.serie}-{rec.numero}
                      </td>
                      <td className="font-mono">{docIdent}</td>
                      <td>
                        <strong>{razonSocial}</strong>
                      </td>
                      <td className="text-right font-mono">{formatMoney(rec.biGravada)}</td>
                      <td className="text-right font-mono">{formatMoney(rec.igv)}</td>
                      <td className="text-right font-mono" style={{ fontWeight: 700 }}>
                        {formatMoney(rec.montoTotal)}
                      </td>
                      <td className="font-mono">{rec.moneda || 'PEN'}</td>
                      <td>
                        <button
                          className="btn-text"
                          style={{ fontSize: '12px', color: '#38bdf8' }}
                          onClick={() => setSelectedRecord(rec)}
                          title="Ver Ficha SUNAT Completa"
                        >
                          <i className="fa-solid fa-eye"></i> Detalle
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination & Footer Controls */}
      <div className="table-footer" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div className="footer-info" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>
            Mostrando <strong>{filteredRecords.length > 0 ? startRecord : 0}</strong> a{' '}
            <strong>{endRecord}</strong> de <strong>{filteredRecords.length.toLocaleString()}</strong> registros
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mostrar:</span>
            <select
              className="select-sm"
              style={{ padding: '4px 8px', fontSize: '12px' }}
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value={25}>25 por pág.</option>
              <option value={50}>50 por pág.</option>
              <option value={100}>100 por pág.</option>
              <option value={250}>250 por pág.</option>
              <option value={500}>500 por pág.</option>
            </select>
          </div>
        </div>

        {/* Page Nav Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '6px 10px', fontSize: '12px' }}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
            title="Primera Página"
          >
            <i className="fa-solid fa-angles-left"></i>
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '6px 10px', fontSize: '12px' }}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            title="Página Anterior"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>

          <span style={{ fontSize: '12px', fontWeight: '600', padding: '0 8px', color: 'var(--text-primary)' }}>
            Página {currentPage} de {totalPages}
          </span>

          <button
            className="btn btn-secondary"
            style={{ padding: '6px 10px', fontSize: '12px' }}
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            title="Página Siguiente"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '6px 10px', fontSize: '12px' }}
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(totalPages)}
            title="Última Página"
          >
            <i className="fa-solid fa-angles-right"></i>
          </button>

          <button
            className="btn-text"
            style={{ marginLeft: '12px' }}
            onClick={() => setShowRawCsv(!showRawCsv)}
          >
            <i className="fa-solid fa-code"></i> {showRawCsv ? 'Ocultar CSV' : 'Ver CSV'}
          </button>
        </div>
      </div>

      {showRawCsv && (
        <div className="raw-csv-container">
          <div className="raw-csv-header">
            <span>CSV Original Extraído del ZIP de SUNAT:</span>
            <button className="btn-text" style={{ color: '#38bdf8' }} onClick={handleCopyRawCsv}>
              <i className="fa-solid fa-copy"></i> Copiar
            </button>
          </div>
          <textarea value={rawCsv || ''} readOnly></textarea>
        </div>
      )}

      {/* Record Inspector Modal showing all 41 SUNAT RCE fields */}
      {selectedRecord && (
        <div className="modal-backdrop" onClick={() => setSelectedRecord(null)}>
          <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3>
                <i className="fa-solid fa-file-invoice text-blue"></i> Ficha SUNAT {isRCE ? 'RCE Compras' : 'RVIE Ventas'} #{selectedRecord.id}
              </h3>
              <button className="btn-close" onClick={() => setSelectedRecord(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Box 1: Datos Comprador / Empresa */}
              <div style={{ background: 'var(--bg-card-hover)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#38bdf8' }}>
                  <i className="fa-solid fa-building"></i> Empresa / Comprador
                </h4>
                <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
                  <div><strong>RUC Comprador:</strong> <span className="font-mono">{selectedRecord.rucComprador || '-'}</span></div>
                  <div><strong>Razón Social Comprador:</strong> {selectedRecord.razonSocialComprador || '-'}</div>
                  <div><strong>Período:</strong> <span className="font-mono">{selectedRecord.periodo || '-'}</span></div>
                  <div><strong>CAR SUNAT:</strong> <span className="font-mono text-blue" style={{ fontSize: '11px' }}>{selectedRecord.carSunat || '-'}</span></div>
                </div>
              </div>

              {/* Box 2: Proveedor / Emisor */}
              <div style={{ background: 'var(--bg-card-hover)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#38bdf8' }}>
                  <i className="fa-solid fa-truck-field"></i> {isRCE ? 'Proveedor / Emisor' : 'Adquiriente / Cliente'}
                </h4>
                <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
                  <div><strong>Tipo Doc Identidad:</strong> {selectedRecord.tipoDocAdquiriente || 'RUC'}</div>
                  <div><strong>Nro Doc Identidad:</strong> <span className="font-mono">{selectedRecord.numDocAdquiriente || selectedRecord.ruc || '-'}</span></div>
                  <div><strong>Razón Social:</strong> {selectedRecord.razonSocialEmisor || selectedRecord.razonSocialAdquiriente || '-'}</div>
                </div>
              </div>

              {/* Box 3: Comprobante */}
              <div style={{ background: 'var(--bg-card-hover)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#38bdf8' }}>
                  <i className="fa-solid fa-file-lines"></i> Comprobante de Pago
                </h4>
                <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
                  <div><strong>Tipo CP:</strong> {selectedRecord.descTipoComprobante} ({selectedRecord.codTipoComprobante})</div>
                  <div><strong>Serie - Número:</strong> <span className="font-mono">{selectedRecord.serie}-{selectedRecord.numero}</span></div>
                  <div><strong>Nro Inicial / Final:</strong> {selectedRecord.numInicial || '-'} {selectedRecord.numFinal ? `- ${selectedRecord.numFinal}` : ''}</div>
                  <div><strong>Fecha Emisión:</strong> {selectedRecord.fechaEmision}</div>
                  <div><strong>Fecha Vencimiento:</strong> {selectedRecord.fechaVencimiento || '-'}</div>
                  <div><strong>Moneda / T. Cambio:</strong> {selectedRecord.moneda || 'PEN'} (TC: {selectedRecord.tipoCambio || '1.000'})</div>
                </div>
              </div>

              {/* Box 4: Desglose Bases e Impuestos (RCE) */}
              <div style={{ background: 'var(--bg-card-hover)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#38bdf8' }}>
                  <i className="fa-solid fa-calculator"></i> Desglose Tributario RCE
                </h4>
                <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
                  <div><strong>BI Gravado (DG):</strong> S/ {formatMoney(selectedRecord.biGravadoDG || selectedRecord.biGravada)}</div>
                  <div><strong>IGV / IPM (DG):</strong> S/ {formatMoney(selectedRecord.igvDG || selectedRecord.igv)}</div>
                  <div><strong>BI Gravado (DGNG):</strong> S/ {formatMoney(selectedRecord.biGravadoDGNG)}</div>
                  <div><strong>IGV / IPM (DGNG):</strong> S/ {formatMoney(selectedRecord.igvDGNG)}</div>
                  <div><strong>BI Gravado (DNG):</strong> S/ {formatMoney(selectedRecord.biGravadoDNG)}</div>
                  <div><strong>IGV / IPM (DNG):</strong> S/ {formatMoney(selectedRecord.igvDNG)}</div>
                  <div><strong>Valor Adq. No Gravadas:</strong> S/ {formatMoney(selectedRecord.valorAdqNG)}</div>
                  <div><strong>ISC / ICBPER / Otros:</strong> S/ {formatMoney(selectedRecord.isc + selectedRecord.icbper + selectedRecord.otrosTributos)}</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '4px' }}>
                    <strong>Monto Total CP:</strong> S/ {formatMoney(selectedRecord.montoTotal)}
                  </div>
                </div>
              </div>

              {/* Box 5: Documento Modificado (Si Aplica) */}
              <div style={{ background: 'var(--bg-card-hover)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', gridColumn: 'span 2' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#38bdf8' }}>
                  <i className="fa-solid fa-arrow-right-arrow-left"></i> Documento Modificado / Clasificación SUNAT
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '12px' }}>
                  <div><strong>Fecha Emisión Mod.:</strong> {selectedRecord.fechaEmisionDocMod || '-'}</div>
                  <div><strong>Tipo CP Modificado:</strong> {selectedRecord.tipoCPMod || '-'}</div>
                  <div><strong>Serie CP Modificado:</strong> {selectedRecord.serieCPMod || '-'}</div>
                  <div><strong>Nro CP Modificado:</strong> {selectedRecord.nroCPMod || '-'}</div>
                  <div><strong>COD DAM / DSI:</strong> {selectedRecord.codDAM || '-'}</div>
                  <div><strong>Detracción:</strong> {selectedRecord.detraccion || '-'}</div>
                  <div><strong>Estado Comprobante:</strong> {selectedRecord.estado || '1'}</div>
                  <div><strong>Clasificación Bienes/Serv.:</strong> {selectedRecord.clasifBssSss || '-'}</div>
                  <div><strong>CAR Orig / Ind:</strong> {selectedRecord.carOrig || '-'}</div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedRecord(null)}>
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
