import React from 'react';

export default function UploadModal({ isOpen, onClose, uploadData, onForceUpload }) {
  if (!isOpen || !uploadData) return null;

  const isConflict = uploadData.hasConflicts;
  const isAlreadyUploadedPresented = uploadData.isAlreadyUploadedPresented;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{
          maxWidth: (isConflict || isAlreadyUploadedPresented) ? '650px' : '500px',
          width: '90%',
          maxHeight: '85vh',
          overflowY: 'auto',
          borderRadius: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isAlreadyUploadedPresented ? (
          /* Presented Period Already Uploaded View */
          <>
            <div className="modal-icon warning" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '28px' }}>
              <i className="fa-solid fa-lock"></i>
            </div>
            <h2 style={{ color: '#f59e0b', margin: '10px 0 6px 0', fontSize: '20px', fontWeight: '800' }}>
              🚫 Período Presentado Ya Subido
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>
              {uploadData.message || 'Este período figura como PRESENTADO y ya ha sido guardado previamente en el sistema.'}
            </p>

            <div
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                padding: '14px 16px',
                borderRadius: '10px',
                marginBottom: '20px',
                textAlign: 'left',
                fontSize: '13px',
                lineHeight: '1.5',
              }}
            >
              <strong style={{ color: '#f59e0b', display: 'block', marginBottom: '6px' }}>
                <i className="fa-solid fa-shield-halved"></i> Regla de Historial de Períodos:
              </strong>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                <li><strong>Períodos Presentados:</strong> Solo se permite subir 1 sola vez para garantizar la inmutabilidad de la declaración.</li>
                <li><strong>Períodos No Presentados:</strong> Se mantiene la función de verificar cuáles comprobantes faltan y subir únicamente los registros nuevos.</li>
              </ul>
            </div>

            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={onClose} style={{ padding: '9px 22px', borderRadius: '8px', fontWeight: '700' }}>
                Entendido
              </button>
            </div>
          </>
        ) : isConflict ? (
          /* Conflict / Presented Month Warning View */
          <>
            <div className="modal-icon error" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h2 style={{ color: '#ef4444', margin: '10px 0 6px 0', fontSize: '20px', fontWeight: '800' }}>
              ⚠️ Validación de Meses Presentados
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {uploadData.message || 'Se detectaron comprobantes cuya fecha de emisión pertenece a periodos PRESENTADOS.'}
            </p>

            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                padding: '14px',
                borderRadius: '10px',
                marginBottom: '16px',
                textAlign: 'left',
                fontSize: '13px',
              }}
            >
              <strong style={{ color: '#ef4444', display: 'block', marginBottom: '4px' }}>
                <i className="fa-solid fa-shield-halved"></i> Regla de Validación de Emisión:
              </strong>
              No se permite alterar o duplicar comprobantes emitidos en meses que ya han sido <strong>PRESENTADOS</strong> en SUNAT sin confirmación.
            </div>

            {/* Conflicts Table */}
            {uploadData.conflicts && uploadData.conflicts.length > 0 && (
              <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
                  Detalle de Comprobantes en Conflicto ({uploadData.conflicts.length}):
                </h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <table style={{ width: '100%', fontSize: '11.5px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '8px' }}>F. Emisión</th>
                        <th style={{ padding: '8px' }}>Periodo</th>
                        <th style={{ padding: '8px' }}>Serie-Número</th>
                        <th style={{ padding: '8px' }}>Monto</th>
                        <th style={{ padding: '8px' }}>Motivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadData.conflicts.map((c, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px', fontWeight: '700', color: '#ef4444' }}>{c.fechaEmision}</td>
                          <td style={{ padding: '8px' }}>{c.periodo}</td>
                          <td style={{ padding: '8px' }}>{c.serie}-{c.numero}</td>
                          <td style={{ padding: '8px' }}>S/ {c.montoTotal ? c.montoTotal.toFixed(2) : '0.00'}</td>
                          <td style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '11px' }}>{c.motivo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: '700' }}>
                Cancelar Importación
              </button>

              {onForceUpload && (
                <button
                  className="btn btn-primary"
                  onClick={onForceUpload}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    border: 'none',
                  }}
                >
                  <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '6px' }}></i> Forzar Subida De Todos Modos
                </button>
              )}
            </div>
          </>
        ) : (
          /* Normal Sync Success View */
          <>
            <div className="modal-icon success" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <i className="fa-solid fa-arrows-rotate"></i>
            </div>
            <h2>¡Sincronización con Firebase Exitosa!</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {uploadData.message || 'Los registros previsualizados han sido sincronizados correctamente.'}
            </p>

            <div
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '20px',
                textAlign: 'left',
                fontSize: '13px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-color)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>📊 Total Comprobantes Analizados:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{uploadData.totalChecked || uploadData.count || 0}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-color)', paddingBottom: '6px' }}>
                <span style={{ color: '#34d399' }}>✨ Registros Nuevos Subidos a Firebase:</span>
                <strong style={{ color: '#34d399', fontWeight: '800' }}>+{uploadData.count || 0} nuevos</strong>
              </div>

              {uploadData.skippedCount !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-color)', paddingBottom: '6px' }}>
                  <span style={{ color: '#fbbf24' }}>⏭️ Registros Omitidos (Ya Existían):</span>
                  <strong style={{ color: '#fbbf24' }}>{uploadData.skippedCount} omitidos</strong>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '2px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                <span>Fecha de Sincronización:</span>
                <span>{uploadData.uploadedAt ? new Date(uploadData.uploadedAt).toLocaleString() : new Date().toLocaleString()}</span>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={onClose} style={{ padding: '10px 24px', borderRadius: '10px', fontWeight: '700' }}>
                Aceptar y Cerrar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
