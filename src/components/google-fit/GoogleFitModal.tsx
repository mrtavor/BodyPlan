import React, { useState, useEffect } from 'react';
import { Activity, Check, Key, ExternalLink, HelpCircle, Shield, RefreshCw } from 'lucide-react';
import { Modal } from '../ui/Modal';
import {
  getSavedGoogleFitToken,
  parseTokenFromUrl,
  requestGoogleFitAuth,
  saveGoogleFitToken,
} from '../../lib/googleFit';

interface GoogleFitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY_GFIT_CLIENT_ID = 'bodyplan_gfit_client_id';

export const GoogleFitModal: React.FC<GoogleFitModalProps> = ({ isOpen, onClose }) => {
  const [clientId, setClientId] = useState<string>(() => localStorage.getItem(STORAGE_KEY_GFIT_CLIENT_ID) || '');
  const [token, setToken] = useState<string | null>(getSavedGoogleFitToken());
  const [manualToken, setManualToken] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Check URL hash for OAuth return on mount / open
  useEffect(() => {
    const urlToken = parseTokenFromUrl();
    if (urlToken) {
      setToken(urlToken);
      setStatusMsg('Google Fit успішно підключено через OAuth!');
    }
  }, []);

  const handleSaveClientId = () => {
    localStorage.setItem(STORAGE_KEY_GFIT_CLIENT_ID, clientId.trim());
    setStatusMsg('Client ID збережено.');
  };

  const handleStartOAuth = () => {
    if (!clientId.trim()) {
      setStatusMsg('Будь ласка, введіть ваш Google OAuth Client ID.');
      return;
    }
    handleSaveClientId();
    requestGoogleFitAuth(clientId.trim());
  };

  const handleSaveManualToken = () => {
    if (!manualToken.trim()) return;
    saveGoogleFitToken(manualToken.trim());
    setToken(manualToken.trim());
    setStatusMsg('Токен доступу збережено!');
    setManualToken('');
  };

  const handleDisconnect = () => {
    saveGoogleFitToken(null);
    setToken(null);
    setStatusMsg('Google Fit відключено.');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Інтеграція з Google Fit"
      subtitle="Автоматичне зчитування щоденних кроків та спалених калорій"
    >
      <div className="space-y-5 text-xs text-slate-300">
        {/* Connection Status Card */}
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            token
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                token ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-100">
                {token ? 'Google Fit підключено ✅' : 'Google Fit не підключено'}
              </p>
              <p className="text-[11px] text-slate-400">
                {token
                  ? 'Дані про активність оновлюватимуться у щоденнику'
                  : 'Підключіть акаунт Google для синхронізації'}
              </p>
            </div>
          </div>

          {token && (
            <button
              onClick={handleDisconnect}
              className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 rounded-lg text-xs font-semibold"
            >
              Відключити
            </button>
          )}
        </div>

        {/* OAuth Configuration */}
        <div className="space-y-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
          <label className="block text-xs font-bold text-slate-200">
            1. Введіть Google OAuth 2.0 Client ID
          </label>
          <input
            type="text"
            placeholder="xxxxxx-xxxxxxxxxxxx.apps.googleusercontent.com"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
          />

          <button
            type="button"
            onClick={handleStartOAuth}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all"
          >
            <Activity className="w-4 h-4" />
            <span>Підключити Google Fit через Google OAuth</span>
          </button>
        </div>

        {/* Manual Access Token Option */}
        <div className="space-y-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
          <label className="block text-xs font-bold text-slate-200">
            2. Або вставте готовий Bearer Token (OAuth Playground / розробник)
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="ya29.a0AfH6SM..."
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={handleSaveManualToken}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs"
            >
              Зберегти
            </button>
          </div>
        </div>

        {statusMsg && (
          <p className="text-center text-xs font-semibold text-emerald-400">{statusMsg}</p>
        )}

        {/* Info Guide on Google Console */}
        <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>Як отримати Google Client ID:</span>
          </div>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Перейдіть у <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-blue-400 underline">Google Cloud Console</a>.</li>
            <li>Увімкніть <strong>Fitness API</strong> у бібліотеці API.</li>
            <li>Створіть OAuth 2.0 Client ID (Web Application) та додайте поточний URL у дозволені Javascript Origins та Redirect URIs.</li>
          </ol>
        </div>
      </div>
    </Modal>
  );
};
