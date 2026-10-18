import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  Upload, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Database,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { 
  exportDataAsJSON, 
  importDataFromJSON, 
  clearAllData, 
  getProperties, 
  getPayments,
  checkNeonHealth,
  NeonHealthStatus
} from '../services/storage';
import { exportPropertiesToCSV, exportPaymentsToCSV } from '../utils/csv';
import { downloadFile } from '../utils/validation';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';

export const Settings: React.FC = () => {
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [dbHealth, setDbHealth] = useState<NeonHealthStatus | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const status = await checkNeonHealth();
      setDbHealth(status);
    } catch {
      setDbHealth({ status: 'error', message: 'Failed to contact database API' });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const jsonStr = await exportDataAsJSON();
      const dateStr = new Date().toISOString().split('T')[0];
      downloadFile(jsonStr, `rent-management-backup-${dateStr}.json`, 'application/json');
      showToast('success', 'JSON backup downloaded from Neon PostgreSQL successfully.');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to export JSON backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        setIsImporting(true);
        try {
          const result = await importDataFromJSON(content);
          if (result.success) {
            showToast('success', result.message);
          } else {
            showToast('error', result.message);
          }
        } catch (err: any) {
          showToast('error', err.message || 'Import failed');
        } finally {
          setIsImporting(false);
        }
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleExportPropertiesCSV = async () => {
    try {
      const props = await getProperties();
      const csv = exportPropertiesToCSV(props);
      const dateStr = new Date().toISOString().split('T')[0];
      downloadFile(csv, `properties-export-${dateStr}.csv`, 'text/csv');
      showToast('success', 'Properties CSV exported successfully.');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to export Properties CSV.');
    }
  };

  const handleExportPaymentsCSV = async () => {
    try {
      const [payments, properties] = await Promise.all([getPayments(), getProperties()]);
      const csv = exportPaymentsToCSV(payments, properties);
      const dateStr = new Date().toISOString().split('T')[0];
      downloadFile(csv, `payments-export-${dateStr}.csv`, 'text/csv');
      showToast('success', 'Payments CSV exported successfully.');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to export Payments CSV.');
    }
  };

  const handleClearDataConfirm = async () => {
    setIsClearing(true);
    try {
      await clearAllData();
      setClearModalOpen(false);
      showToast('success', 'Neon PostgreSQL data cleared and reset to initial state.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to clear data.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings & Database Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage database connections, backup snapshots, and system data.</p>
        </div>
        <button
          onClick={checkHealth}
          className="inline-flex items-center space-x-2 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCheckingHealth ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Refresh DB Status</span>
        </button>
      </div>

      {toastMessage && (
        <div className={`p-4 rounded-xl flex items-center space-x-3 text-sm ${
          toastMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Database Connection Status Card */}
      <div className={`p-6 rounded-2xl border flex items-start space-x-4 ${
        dbHealth?.status === 'connected' 
          ? 'bg-emerald-50/50 border-emerald-200' 
          : 'bg-amber-50/50 border-amber-200'
      }`}>
        <div className={`p-3 rounded-xl ${
          dbHealth?.status === 'connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        }`}>
          <Database className="w-6 h-6" />
        </div>
        <div className="flex-1 space-y-1 text-sm">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-slate-900">Neon PostgreSQL Serverless Connection</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              dbHealth?.status === 'connected' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {dbHealth?.status === 'connected' ? 'Connected' : 'Connecting / Offline'}
            </span>
          </div>
          <p className="text-slate-600 text-xs">
            Backend is connected to serverless PostgreSQL on Neon. Cloud latency: <strong>{dbHealth?.latencyMs ?? '--'} ms</strong>.
          </p>
          <p className="text-slate-500 text-xs font-mono">
            Provider: {dbHealth?.provider || 'Neon Serverless'} | Target Database: {dbHealth?.database || 'neondb'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* JSON Backup & Restore */}
        <Card title="JSON Backup & Restore" subtitle="Full database snapshot">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-3">Download a complete JSON backup containing all properties, tenants, and payment records from Neon PostgreSQL.</p>
              <Button onClick={handleExportJSON} isLoading={isExporting} className="w-full flex items-center justify-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export JSON Backup</span>
              </Button>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-600 mb-3">Restore your database from a previously exported JSON backup file directly into Neon.</p>
              <input 
                type="file" 
                accept=".json" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
              />
              <Button 
                variant="outline" 
                isLoading={isImporting}
                onClick={() => fileInputRef.current?.click()} 
                className="w-full flex items-center justify-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Import JSON Backup</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* CSV Export & Danger Zone */}
        <div className="space-y-6">
          <Card title="CSV Exports" subtitle="Spreadsheet compatible backups">
            <div className="space-y-3">
              <Button 
                variant="outline" 
                onClick={handleExportPropertiesCSV} 
                className="w-full flex items-center justify-center space-x-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export Properties CSV</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={handleExportPaymentsCSV} 
                className="w-full flex items-center justify-center space-x-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export Payments CSV</span>
              </Button>
            </div>
          </Card>

          <Card title="Danger Zone" subtitle="Irreversible data actions">
            <div className="space-y-3">
              <p className="text-xs text-slate-500">Clearing all data will purge all records in Neon PostgreSQL, resetting to default demo data.</p>
              <Button 
                variant="danger" 
                onClick={() => setClearModalOpen(true)} 
                className="w-full flex items-center justify-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All Data</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Clear Data Confirmation Modal */}
      <Modal isOpen={clearModalOpen} onClose={() => setClearModalOpen(false)} title="Confirm Clear All Data">
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-red-600 bg-red-50 p-4 rounded-xl">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <p className="text-sm">
              Are you extremely sure? This action will erase all current records in your Neon PostgreSQL database. Make sure you have exported a JSON backup first!
            </p>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" onClick={() => setClearModalOpen(false)} disabled={isClearing}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleClearDataConfirm} isLoading={isClearing}>
              Yes, Clear All Data
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
