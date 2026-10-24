import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ModuleLauncher from './components/ModuleLauncher';
import CompanySettings from './components/CompanySettings';
import PeriodSelectorCard from './components/PeriodSelectorCard';
import TicketStepper from './components/TicketStepper';
import MetricsDashboard from './components/MetricsDashboard';
import DataTable from './components/DataTable';
import UploadModal from './components/UploadModal';
import UploadedHistoryModal from './components/UploadedHistoryModal';
import InvoicePayments from './components/InvoicePayments';
import Login from './components/Login';
import UserProfileModule from './components/UserProfileModule';
import {
  exportRVIE,
  checkTicketStatus,
  downloadPreviewRVIE,
  uploadToSystem,
  getStoredCredentials,
  saveCredentialsToFirebase,
} from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('librobancos_user');
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });

  const [activeModule, setActiveModule] = useState('launcher'); // 'launcher', 'sire', 'payments', 'settings'
  const [creds, setCreds] = useState({
    empresa: '',
    clientId: '',
    clientSecret: '',
    sunatRuc: '',
    userSol: '',
    claveSol: '',
  });

  const [bookType, setBookType] = useState('RVIE'); // 'RVIE' (Ventas) or 'RCE' (Compras)
  const [companiesList, setCompaniesList] = useState([]);
  const [savingFirebase, setSavingFirebase] = useState(false);
  const [firebaseNotice, setFirebaseNotice] = useState('');

  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('08');

  // Stepper & Logs
  const [showStepper, setShowStepper] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [steps, setSteps] = useState({});
  const [logs, setLogs] = useState([]);

  // Data
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Modals
  const [uploadModalData, setUploadModalData] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Fetch saved companies & credentials from Firebase on mount
  useEffect(() => {
    const targetRuc = currentUser?.role === 'empresa' ? currentUser?.ruc : undefined;
    fetchCredentialsFromFirebase(targetRuc);
  }, [currentUser]);

  const fetchCredentialsFromFirebase = async (targetRuc) => {
    try {
      const rucToQuery = targetRuc || (currentUser?.role === 'empresa' ? currentUser?.ruc : creds.sunatRuc);
      const res = await getStoredCredentials(rucToQuery);
      if (res.success) {
        if (res.companies && res.companies.length > 0) {
          setCompaniesList(res.companies);
        }
        let matching = null;
        if (currentUser?.role === 'empresa' && currentUser?.ruc && res.companies) {
          matching = res.companies.find((c) => c.ruc === currentUser.ruc);
        }
        const c = matching || res.credentials;
        if (c && c.ruc) {
          setCreds((prev) => ({
            ...prev,
            empresa: c.empresa || '',
            clientId: c.clientId || '',
            clientSecret: c.clientSecret || '',
            sunatRuc: c.ruc || '',
            userSol: c.username || '',
            claveSol: c.password || '',
          }));
          setFirebaseNotice(`🔥 Empresa activa: ${c.empresa || c.ruc}`);
          setTimeout(() => setFirebaseNotice(''), 4000);
        } else if (res.companies && res.companies.length > 0) {
          const first = res.companies[0];
          setCreds((prev) => ({
            ...prev,
            empresa: first.empresa || '',
            clientId: first.clientId || '',
            clientSecret: first.clientSecret || '',
            sunatRuc: first.ruc || '',
            userSol: first.username || '',
            claveSol: first.password || '',
          }));
        }
      }
    } catch (_) {
      // Ignore initial fetch error if Firebase is clean
    }
  };

  const handleSelectCompany = (ruc) => {
    if (!ruc) {
      setCreds((prev) => ({
        ...prev,
        empresa: '',
        sunatRuc: '',
        clientId: '',
        clientSecret: '',
        userSol: '',
        claveSol: '',
      }));
      return;
    }
    const found = companiesList.find((c) => c.ruc === ruc);
    if (found) {
      setCreds((prev) => ({
        ...prev,
        empresa: found.empresa || '',
        sunatRuc: found.ruc || '',
        clientId: found.clientId || '',
        clientSecret: found.clientSecret || '',
        userSol: found.username || '',
        claveSol: found.password || '',
      }));
      setFirebaseNotice(`🏢 Empresa seleccionada: ${found.empresa || found.ruc}`);
      setTimeout(() => setFirebaseNotice(''), 3000);
    }
  };

  const handleSaveToFirebase = async () => {
    if (!creds.sunatRuc.trim()) {
      alert('Ingrese el RUC de la empresa');
      return;
    }
    if (!creds.empresa.trim()) {
      alert('Ingrese el Nombre / Razón Social de la Empresa');
      return;
    }

    setSavingFirebase(true);
    setFirebaseNotice('');
    try {
      const payload = {
        empresa: creds.empresa.trim(),
        clientId: creds.clientId.trim(),
        clientSecret: creds.clientSecret.trim(),
        ruc: creds.sunatRuc.trim(),
        username: creds.userSol.trim(),
        password: creds.claveSol.trim(),
      };
      const res = await saveCredentialsToFirebase(payload);
      if (res.success) {
        setFirebaseNotice('✅ Empresa y credenciales guardadas en Firebase');
        await fetchCredentialsFromFirebase();
      } else {
        setFirebaseNotice('⚠️ ' + (res.error || res.message));
      }
    } catch (err) {
      setFirebaseNotice('❌ Error: ' + err.message);
    } finally {
      setSavingFirebase(false);
      setTimeout(() => setFirebaseNotice(''), 5000);
    }
  };

  const addLog = (msg, type = 'info') => {
    const time = new Date().toTimeString().split(' ')[0];
    setLogs((prev) => [...prev, { time, msg, type }]);
  };

  const updateStep = (stepNum, status) => {
    setSteps((prev) => ({ ...prev, [stepNum]: status }));
  };

  const resetProcess = () => {
    setShowStepper(true);
    setLogs([]);
    setSteps({ 1: 'active' });
  };

  // Main RVIE / RCE Export Process
  const handleStartProcess = async () => {
    if (!creds.sunatRuc.trim() || !creds.clientId.trim() || !creds.userSol.trim()) {
      alert('Por favor selecciona una empresa registrada o completa sus credenciales antes de continuar.');
      return;
    }

    setLoading(true);
    resetProcess();

    const monthNames = {
      '01': 'ENE', '02': 'FEB', '03': 'MAR', '04': 'ABR',
      '05': 'MAY', '06': 'JUN', '07': 'JUL', '08': 'AGO',
      '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DIC',
    };
    const monthName = monthNames[selectedMonth] || selectedMonth;

    addLog(`Iniciando solicitud ${bookType} Propuesta (${bookType === 'RCE' ? 'Compras' : 'Ventas'}) para ${creds.empresa || creds.sunatRuc} (${selectedYear}-${monthName})...`, 'info');

    try {
      // Step 1: Token
      updateStep(1, 'completed');
      updateStep(2, 'active');
      addLog('Obteniendo Token OAuth2 de SUNAT...', 'info');

      const exportPayload = {
        credentials: {
          empresa: creds.empresa,
          clientId: creds.clientId,
          clientSecret: creds.clientSecret,
          ruc: creds.sunatRuc,
          username: creds.userSol,
          password: creds.claveSol,
          isProduction: true,
        },
        period: selectedYear,
        month: selectedMonth,
        fileType: '0',
        bookType: bookType,
        useMock: false,
      };

      const exportRes = await exportRVIE(exportPayload);
      if (!exportRes.success) {
        addLog(`Error al solicitar ticket: ${exportRes.message}`, 'error');
        updateStep(2, 'error');
        setLoading(false);
        return;
      }

      const ticket = exportRes.numTicket;
      setTicketNumber(ticket);
      addLog(`Ticket ${bookType} generado exitosamente: ${ticket}`, 'success');

      updateStep(2, 'completed');
      updateStep(3, 'active');
      addLog(`Consultando estado de ticket SUNAT (${ticket})...`, 'info');

      // Polling ticket status
      let finished = false;
      let filenameToDownload = '';
      let codTipoArchivo = '00';
      let codProceso = '10';
      let attempts = 0;

      while (!finished && attempts < 10) {
        attempts++;
        addLog(`Verificando estado del ticket (${attempts}/10)...`, 'info');

        const statusRes = await checkTicketStatus({
          credentials: exportPayload.credentials,
          period: selectedYear,
          month: selectedMonth,
          ticket: ticket,
          bookType: bookType,
          useMock: false,
        });

        if (statusRes.codClaseState === '06') {
          finished = true;
          addLog('Estado de ticket SUNAT: Terminado (Código 06)', 'success');
          if (statusRes.fileList && statusRes.fileList.length > 0) {
            filenameToDownload = statusRes.fileList[0].nomArchivoDownload;
            if (statusRes.fileList[0].codTipoArchivo) codTipoArchivo = statusRes.fileList[0].codTipoArchivo;
            if (statusRes.fileList[0].codProceso) codProceso = statusRes.fileList[0].codProceso;
          }
        } else {
          addLog(`Ticket en proceso (Estado ${statusRes.codClaseState}). Esperando 2 segundos...`, 'warn');
          await new Promise((r) => setTimeout(r, 2000));
        }
      }

      updateStep(3, 'completed');
      updateStep(4, 'active');

      if (!filenameToDownload) {
        const zipCode = bookType === 'RCE' ? '00080400001O1' : '00140100001O1';
        filenameToDownload = `LE${creds.sunatRuc}${selectedYear}${selectedMonth}${zipCode}.zip`;
      }

      addLog(`Descargando archivo ZIP desde SUNAT (${filenameToDownload})...`, 'info');

      const downloadRes = await downloadPreviewRVIE({
        credentials: exportPayload.credentials,
        filename: filenameToDownload,
        codTipoArchivo: codTipoArchivo,
        codProceso: codProceso,
        ticket: ticket,
        period: selectedYear,
        month: selectedMonth,
        bookType: bookType,
        useMock: false,
      });

      if (downloadRes.error) {
        addLog(`⚠️ ${downloadRes.error}`, 'error');
        updateStep(4, 'error');
        setLoading(false);
        return;
      }

      updateStep(4, 'completed');
      updateStep(5, 'completed');
      addLog(`¡Descompresión y parseo completado! ${downloadRes.totalRecords} registros de ${bookType} extraídos en JSON.`, 'success');

      setSummaryData(downloadRes);
    } catch (err) {
      addLog(`Error inesperado: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Upload to System with Presented Period Validation & Differential Sync
  const handleUploadSystem = async (force = false) => {
    const isForceBool = force === true;

    if (!summaryData || !summaryData.records || summaryData.records.length === 0) {
      alert('No hay registros previsualizados para subir');
      return;
    }

    setUploading(true);
    try {
      // Clean records array to plain JSON objects
      const cleanRecords = summaryData.records.map((rec) => {
        const copy = { ...rec };
        return copy;
      });

      const targetPeriodStr = summaryData.period || (selectedYear + selectedMonth);
      const isPresentado = parseInt(selectedMonth, 10) <= 8;
      // List of periods marked as PRESENTADO (Closed/Submitted tax months)
      const presentedPeriods = ['202601', '202602', '202603', '202604', '202605', '202606', '202607', '202608'];

      const res = await uploadToSystem({
        period: targetPeriodStr,
        bookType: bookType,
        ticket: ticketNumber,
        ruc: creds.sunatRuc,
        empresa: creds.empresa,
        estadoSunat: isPresentado ? 'PRESENTADO' : 'NO PRESENTADO',
        records: cleanRecords,
        presentedPeriods: presentedPeriods,
        forceUpload: isForceBool,
      });

      if (res.success || res.hasConflicts || res.isAlreadyUploadedPresented) {
        setUploadModalData(res);
        setIsUploadModalOpen(true);
      } else {
        alert('Error al subir a sistema: ' + (res.message || res.error || 'Error desconocido'));
      }
    } catch (err) {
      alert('Error de conexión al subir registros: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('librobancos_user', JSON.stringify(userData));
    if (userData.role === 'empresa' && userData.ruc) {
      handleSelectCompany(userData.ruc);
    }
    const userSireBooks = userData.sireBooks || ['RVIE', 'RCE'];
    if (userSireBooks.length === 1) {
      setBookType(userSireBooks[0]);
    }
    setActiveModule('launcher');
  };

  const handleLogout = () => {
    localStorage.removeItem('librobancos_user');
    setCurrentUser(null);
    setActiveModule('launcher');
  };

  const handleSelectModuleLauncher = (modId) => {
    if (modId === 'history') {
      setIsHistoryModalOpen(true);
      return;
    }
    // El perfil siempre está permitido para todos los usuarios
    if (modId !== 'profile' && currentUser && currentUser.role !== 'admin') {
      if (Array.isArray(currentUser.allowedModules) && !currentUser.allowedModules.includes(modId)) {
        alert('No tiene permisos para acceder a este módulo.');
        return;
      }
    }
    setActiveModule(modId);
  };

  // If no user is logged in, show Login view
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <Header
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        activeCompany={{ ruc: creds.sunatRuc, empresa: creds.empresa }}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {activeModule === 'launcher' && (
          <ModuleLauncher
            onSelectModule={handleSelectModuleLauncher}
            activeCompany={{ ruc: creds.sunatRuc, empresa: creds.empresa }}
            currentUser={currentUser}
            allowedModules={currentUser?.allowedModules}
          />
        )}

        {/* Módulo Mi Perfil & Credenciales - Vista Completa accesible para todo usuario */}
        {activeModule === 'profile' && (
          <UserProfileModule
            creds={creds}
            setCreds={setCreds}
            currentUser={currentUser}
            companiesList={companiesList}
            onSelectCompany={handleSelectCompany}
            onProfileUpdated={() => fetchCredentialsFromFirebase(currentUser?.role === 'empresa' ? currentUser?.ruc : creds.sunatRuc)}
            onNavigateToModule={setActiveModule}
          />
        )}

        {/* Módulo Empresas & Usuarios - Gestión Global Administrador */}
        {activeModule === 'settings' && (
          <CompanySettings
            creds={creds}
            setCreds={setCreds}
            companiesList={companiesList}
            onSelectCompany={handleSelectCompany}
            onSaveToFirebase={handleSaveToFirebase}
            savingFirebase={savingFirebase}
            firebaseNotice={firebaseNotice}
            currentUser={currentUser}
          />
        )}

        {/* Módulo SIRE SUNAT - Solo la Consulta limpia al SIRE */}
        {activeModule === 'sire' && (
          <div className="sire-module-view" style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Main Period and Book Selector (Consulta SIRE) */}
            <PeriodSelectorCard
              creds={creds}
              bookType={bookType}
              setBookType={setBookType}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              onStartProcess={handleStartProcess}
              loading={loading}
              allowedSireBooks={currentUser?.sireBooks || ['RVIE', 'RCE']}
              onOpenProfile={() => setActiveModule('profile')}
              onOpenHistory={() => setIsHistoryModalOpen(true)}
            />

            {showStepper && (
              <TicketStepper
                ticketNumber={ticketNumber}
                steps={steps}
                logs={logs}
              />
            )}

            {summaryData && (
              <div className="preview-section">
                <MetricsDashboard summary={summaryData} bookType={bookType} />

                <DataTable
                  records={summaryData.records}
                  rawCsv={summaryData.rawCsv}
                  period={summaryData.period}
                  ticket={ticketNumber}
                  bookType={bookType}
                  onUploadSystem={handleUploadSystem}
                  uploading={uploading}
                />
              </div>
            )}
          </div>
        )}

        {activeModule === 'payments' && (
          <InvoicePayments
            activeCompany={{ ruc: creds.sunatRuc, empresa: creds.empresa }}
            currentUser={currentUser}
          />
        )}
      </main>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        uploadData={uploadModalData}
        onForceUpload={() => {
          setIsUploadModalOpen(false);
          handleUploadSystem(true);
        }}
      />

      <UploadedHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        currentRuc={creds.sunatRuc || currentUser?.ruc || ''}
      />
    </div>
  );
}
