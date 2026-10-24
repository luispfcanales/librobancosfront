// API Client for Golang Backend

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errData = await response.json();
      if (errData.hasConflicts) {
        return errData;
      }
      if (errData.error) errorMsg = errData.error;
      else if (errData.message) errorMsg = errData.message;
    } catch (_) {
      // Ignore parse error
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const checkBackendHealth = async () => {
  try {
    const data = await request('/api/health');
    return { online: true, data };
  } catch (err) {
    return { online: false, error: err.message };
  }
};

export const getStoredCredentials = async (ruc) => {
  const url = ruc ? `/api/credentials?ruc=${encodeURIComponent(ruc)}` : '/api/credentials';
  return request(url);
};

export const saveCredentialsToFirebase = async (credsPayload) => {
  return request('/api/credentials', {
    method: 'POST',
    body: JSON.stringify(credsPayload),
  });
};

export const exportRVIE = async (exportReq) => {
  return request('/api/sire/rvie/export', {
    method: 'POST',
    body: JSON.stringify(exportReq),
  });
};

export const checkTicketStatus = async (statusPayload) => {
  return request('/api/sire/rvie/status', {
    method: 'POST',
    body: JSON.stringify(statusPayload),
  });
};

export const downloadPreviewRVIE = async (previewPayload) => {
  return request('/api/sire/rvie/download-preview', {
    method: 'POST',
    body: JSON.stringify(previewPayload),
  });
};

export const fetchPeriods = async (periodsPayload) => {
  return request('/api/sire/rvie/periodos', {
    method: 'POST',
    body: JSON.stringify(periodsPayload),
  });
};

export const uploadToSystem = async (uploadPayload) => {
  return request('/api/sire/rvie/upload-system', {
    method: 'POST',
    body: JSON.stringify(uploadPayload),
  });
};

export const getUploadedRecords = async (bookType = 'RCE', period = '', ruc = '') => {
  const queryObj = { bookType };
  if (period) queryObj.period = period;
  if (ruc) queryObj.ruc = ruc;
  const query = new URLSearchParams(queryObj).toString();
  return request(`/api/sire/rvie/uploaded-records?${query}`);
};

export const getUploadedPeriods = async (bookType = '', ruc = '') => {
  const queryObj = {};
  if (bookType) queryObj.bookType = bookType;
  if (ruc) queryObj.ruc = ruc;
  const query = new URLSearchParams(queryObj).toString();
  return request(`/api/sire/rvie/uploaded-periods?${query}`);
};

export const updateInvoicePayment = async (paymentPayload) => {
  return request('/api/invoices/pay', {
    method: 'POST',
    body: JSON.stringify(paymentPayload),
  });
};

// Auth & User Management Services
export const loginUser = async ({ ruc, password }) => {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ ruc, password }),
  });
};

export const getUsers = async () => {
  return request('/api/auth/users');
};

export const saveUser = async (userPayload) => {
  return request('/api/auth/users', {
    method: 'POST',
    body: JSON.stringify(userPayload),
  });
};

