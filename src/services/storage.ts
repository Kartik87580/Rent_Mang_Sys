import { Property } from '../types/property';
import { Payment } from '../types/payment';

const AUTH_KEY = 'rms_auth';
const API_BASE = '/api';

// Helper to generate UUID if needed client-side
export const generateId = (): string => {
  return 'id_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

// Check Neon Database health and latency
export interface NeonHealthStatus {
  status: 'connected' | 'error' | 'connecting';
  provider?: string;
  database?: string;
  latencyMs?: number;
  message?: string;
}

export const checkNeonHealth = async (): Promise<NeonHealthStatus> => {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { status: 'error', message: err.message || `HTTP ${res.status}` };
    }
    const data = await res.json();
    return {
      status: 'connected',
      provider: data.provider,
      database: data.database,
      latencyMs: data.latencyMs
    };
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Cannot reach API backend'
    };
  }
};

// ================= PROPERTIES =================

export const getProperties = async (): Promise<Property[]> => {
  const response = await fetch(`${API_BASE}/properties`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch properties (${response.status})`);
  }
  return response.json();
};

export const getPropertyById = async (id: string): Promise<Property | undefined> => {
  const response = await fetch(`${API_BASE}/properties/${id}`);
  if (response.status === 404) return undefined;
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch property ${id}`);
  }
  return response.json();
};

export const addProperty = async (
  propertyData: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Property> => {
  const response = await fetch(`${API_BASE}/properties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(propertyData)
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to add property to Neon PostgreSQL');
  }
  return response.json();
};

export const updateProperty = async (
  id: string,
  propertyData: Partial<Property>
): Promise<Property | null> => {
  const response = await fetch(`${API_BASE}/properties/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(propertyData)
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update property');
  }
  return response.json();
};

export const deleteProperty = async (id: string): Promise<boolean> => {
  const response = await fetch(`${API_BASE}/properties/${id}`, {
    method: 'DELETE'
  });
  if (response.status === 404) return false;
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete property');
  }
  return true;
};

// ================= PAYMENTS =================

export const getPayments = async (): Promise<Payment[]> => {
  const response = await fetch(`${API_BASE}/payments`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch payments (${response.status})`);
  }
  return response.json();
};

export const getPaymentById = async (id: string): Promise<Payment | undefined> => {
  const response = await fetch(`${API_BASE}/payments/${id}`);
  if (response.status === 404) return undefined;
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch payment ${id}`);
  }
  return response.json();
};

export const addPayment = async (
  paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Payment> => {
  const response = await fetch(`${API_BASE}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData)
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to add payment record');
  }
  return response.json();
};

export const updatePayment = async (
  id: string,
  paymentData: Partial<Payment>
): Promise<Payment | null> => {
  const response = await fetch(`${API_BASE}/payments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData)
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update payment');
  }
  return response.json();
};

export const deletePayment = async (id: string): Promise<boolean> => {
  const response = await fetch(`${API_BASE}/payments/${id}`, {
    method: 'DELETE'
  });
  if (response.status === 404) return false;
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete payment');
  }
  return true;
};

// ================= AUTH =================

export const getAuthState = (): boolean => {
  return localStorage.getItem(AUTH_KEY) === 'true';
};

export const setAuthState = (isAuthenticated: boolean): void => {
  if (isAuthenticated) {
    localStorage.setItem(AUTH_KEY, 'true');
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
};

export const login = async (
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Invalid username or password.'
      };
    }

    setAuthState(true);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Cannot reach authentication server.'
    };
  }
};

export const logout = (): void => {
  localStorage.removeItem(AUTH_KEY);
};

// ================= BACKUP & RESTORE =================

export interface BackupData {
  version: string;
  exportDate: string;
  properties: Property[];
  payments: Payment[];
}

export const exportDataAsJSON = async (): Promise<string> => {
  const [properties, payments] = await Promise.all([getProperties(), getPayments()]);
  const backup: BackupData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    properties,
    payments
  };
  return JSON.stringify(backup, null, 2);
};

export const importDataFromJSON = async (
  jsonString: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') {
      return { success: false, message: 'Invalid JSON format.' };
    }

    if (!Array.isArray(data.properties) || !Array.isArray(data.payments)) {
      return { success: false, message: 'Invalid backup schema: missing properties or payments array.' };
    }

    const response = await fetch(`${API_BASE}/backup/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ properties: data.properties, payments: data.payments })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { success: false, message: err.error || 'Failed to import backup into Neon PostgreSQL.' };
    }

    const resData = await response.json();
    return { success: true, message: resData.message || 'Backup successfully restored to Neon PostgreSQL.' };
  } catch (error: any) {
    return { success: false, message: `Failed to import JSON: ${error.message || 'Unknown error'}` };
  }
};

export const clearAllData = async (): Promise<void> => {
  const response = await fetch(`${API_BASE}/backup/clear`, {
    method: 'POST'
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to reset database');
  }
};
