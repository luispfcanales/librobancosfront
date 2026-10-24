import React from 'react';

const formatMoney = (num) => {
  if (num === undefined || num === null) return '0.00';
  return num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function MetricsDashboard({ summary, bookType }) {
  if (!summary) return null;
  const isRCE = bookType === 'RCE' || summary.bookType === 'RCE';

  return (
    <div className="metrics-row" style={{ flexWrap: 'wrap' }}>
      <div className="metric-card">
        <div className="metric-icon blue">
          <i className={isRCE ? 'fa-solid fa-cart-shopping' : 'fa-solid fa-file-invoice'}></i>
        </div>
        <div className="metric-data">
          <span className="metric-label">{isRCE ? 'Total Compras' : 'Total Ventas'}</span>
          <h3>{summary.totalRecords || 0}</h3>
          <span className="metric-sub">Período: {summary.period || '-'}</span>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon green">
          <i className="fa-solid fa-chart-line"></i>
        </div>
        <div className="metric-data">
          <span className="metric-label">{isRCE ? 'BI Gravado (DG)' : 'Base Imponible (Gravado)'}</span>
          <h3>S/ {formatMoney(summary.totalBiGravadoDG || summary.totalBiGravada)}</h3>
          <span className="metric-sub">{isRCE ? 'Op. Gravadas Destino Gravado' : 'Operaciones Gravadas Ventas'}</span>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon purple">
          <i className="fa-solid fa-percent"></i>
        </div>
        <div className="metric-data">
          <span className="metric-label">{isRCE ? 'IGV Crédito Fiscal (DG)' : 'IGV / IPM'}</span>
          <h3>S/ {formatMoney(summary.totalIgvDG || summary.totalIgv)}</h3>
          <span className="metric-sub">{isRCE ? 'IGV Compras Gravadas' : '18% Impuesto Ventas'}</span>
        </div>
      </div>

      {isRCE && (
        <div className="metric-card">
          <div className="metric-icon teal" style={{ background: 'rgba(20, 184, 166, 0.15)', color: '#14b8a6' }}>
            <i className="fa-solid fa-ban"></i>
          </div>
          <div className="metric-data">
            <span className="metric-label">Valor Adq. No Gravadas</span>
            <h3>S/ {formatMoney(summary.totalNoGravado || 0)}</h3>
            <span className="metric-sub">Compras No Gravadas</span>
          </div>
        </div>
      )}

      <div className="metric-card">
        <div className="metric-icon amber">
          <i className="fa-solid fa-sack-dollar"></i>
        </div>
        <div className="metric-data">
          <span className="metric-label">{isRCE ? 'Monto Total Compras' : 'Monto Total Facturado'}</span>
          <h3>S/ {formatMoney(summary.totalMontoTotal)}</h3>
          <span className="metric-sub">{isRCE ? 'Total General RCE' : 'Total General RVIE'}</span>
        </div>
      </div>
    </div>
  );
}
