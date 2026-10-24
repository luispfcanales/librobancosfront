import React, { useEffect, useRef } from 'react';

export default function TicketStepper({
  ticketNumber,
  steps,
  logs,
}) {
  const consoleRef = useRef(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="card ticket-card">
      <div className="ticket-header">
        <div className="ticket-title">
          <h4>
            Ticket SUNAT Generado:{' '}
            <span style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
              {ticketNumber || '----------------'}
            </span>
          </h4>
          <p>Consultando estado en SUNAT y preparando extracción de propuesta...</p>
        </div>
        <div className="ticket-status-pill">
          <i className="fa-solid fa-spinner fa-spin"></i> En proceso...
        </div>
      </div>

      <div className="stepper">
        <div className={`step ${steps[1] || ''}`}>
          <div className="step-icon">
            <i className="fa-solid fa-key"></i>
          </div>
          <div className="step-label">OAuth Token</div>
        </div>

        <div className="step-line"></div>

        <div className={`step ${steps[2] || ''}`}>
          <div className="step-icon">
            <i className="fa-solid fa-paper-plane"></i>
          </div>
          <div className="step-label">Solicitud Ticket</div>
        </div>

        <div className="step-line"></div>

        <div className={`step ${steps[3] || ''}`}>
          <div className="step-icon">
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>
          <div className="step-label">Consulta (06)</div>
        </div>

        <div className="step-line"></div>

        <div className={`step ${steps[4] || ''}`}>
          <div className="step-icon">
            <i className="fa-solid fa-file-zipper"></i>
          </div>
          <div className="step-label">Descarga ZIP</div>
        </div>

        <div className="step-line"></div>

        <div className={`step ${steps[5] || ''}`}>
          <div className="step-icon">
            <i className="fa-solid fa-table-cells"></i>
          </div>
          <div className="step-label">Previs. CSV</div>
        </div>
      </div>

      <div className="log-console" ref={consoleRef}>
        {logs.map((log, index) => (
          <div key={index} className={`log-entry ${log.type}`}>
            <span className="time">[{log.time}]</span> {log.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
