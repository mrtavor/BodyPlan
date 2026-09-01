import React, { useState } from 'react';
import {
  Settings,
  Database,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Check,
  Shield,
  Key,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { usePlan } from '../../context/PlanContext';
import { FirebaseCustomConfig } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { firebaseConfig, updateFirebaseConfig } = useAuth();
  const { state, loadSampleDemoData, resetAllData } = usePlan();

  const [apiKey, setApiKey] = useState<string>(firebaseConfig?.apiKey || '');
  const [projectId, setProjectId] = useState<string>(firebaseConfig?.projectId || '');
  const [authDomain, setAuthDomain] = useState<string>(firebaseConfig?.authDomain || '');
  const [appId, setAppId] = useState<string>(firebaseConfig?.appId || '');

  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [rawJson, setRawJson] = useState<string>('');

  const handleSaveConfig = () => {
    if (!apiKey.trim() || !projectId.trim()) {
      updateFirebaseConfig(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      return;
    }

    const newConfig: FirebaseCustomConfig = {
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      storageBucket: `${projectId.trim()}.appspot.com`,
      messagingSenderId: '',
      appId: appId.trim(),
    };

    updateFirebaseConfig(newConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handlePasteFirebaseJson = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawJson(val);
    try {
      // Parse if user pasted const firebaseConfig = { ... }
      const cleaned = val.replace(/const\s+firebaseConfig\s*=\s*/, '').replace(/;\s*$/, '');
      const parsed = JSON.parse(cleaned);
      if (parsed.apiKey) setApiKey(parsed.apiKey);
      if (parsed.projectId) setProjectId(parsed.projectId);
      if (parsed.authDomain) setAuthDomain(parsed.authDomain);
      if (parsed.appId) setAppId(parsed.appId);
    } catch (err) {
      // ignore
    }
  };

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `bodyplan_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(evt.target?.result as string);
        if (imported.metrics || imported.logs) {
          localStorage.setItem('bodyplan_app_state_v1', JSON.stringify(imported));
          window.location.reload();
        }
      } catch (err) {
        alert('Помилка при зчитуванні JSON файлу');
      }
    };
    reader.readAsText(file);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Налаштування та Хмарне Сховище"
      subtitle="Firebase Google Auth конфігурація та резервні копії"
    >
      <div className="space-y-6 text-xs text-slate-300">
        {/* Firebase Config Section */}
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 font-bold text-slate-100">
              <Key className="w-4 h-4 text-emerald-400" />
              <span>Firebase / Google Cloud Ключі</span>
            </div>
            <span className="text-[10px] text-slate-500">Для мультипристроїв</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Вставити Firebase Config JSON (швидке автозаповнення)
              </label>
              <textarea
                rows={2}
                placeholder='{"apiKey": "AIzaSy...", "projectId": "my-app"}'
                value={rawJson}
                onChange={handlePasteFirebaseJson}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-mono text-[11px] text-slate-200 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Firebase API Key</label>
                <input
                  type="text"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Firebase Project ID</label>
                <input
                  type="text"
                  placeholder="my-diet-app"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveConfig}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>Збережено!</span>
                </>
              ) : (
                <span>Зберегти налаштування Firebase</span>
              )}
            </button>
          </div>
        </div>

        {/* Backup and Restore */}
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-100 pb-2 border-b border-slate-800">
            <Database className="w-4 h-4 text-indigo-400" />
            <span>Резервне копіювання даних</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleExportBackup}
              className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl font-semibold flex items-center justify-center gap-2 text-slate-200 transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Експорт у JSON</span>
            </button>

            <label className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl font-semibold flex items-center justify-center gap-2 text-slate-200 cursor-pointer transition-colors">
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>Імпорт з JSON</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>
        </div>

        {/* Demo data & Reset */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-2">
          <button
            type="button"
            onClick={() => {
              loadSampleDemoData();
              onClose();
            }}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline"
          >
            Завантажити демо-приклад
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('Ви впевнені, що бажаєте очистити всі дані?')) {
                resetAllData();
                onClose();
              }
            }}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Скинути все</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
