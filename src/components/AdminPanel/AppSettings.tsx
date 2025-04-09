import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';

interface AppSettings {
  appName: string;
  maxUploadSize: number;
  allowedFileTypes: string[];
  maintenanceMode: boolean;
  apiKeys: {
    openai: string;
    cloudinary: string;
  };
  emailSettings: {
    enableNotifications: boolean;
    fromEmail: string;
    replyTo: string;
  };
}

export default function AppSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    appName: 'KAIROS AI',
    maxUploadSize: 10,
    allowedFileTypes: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
    maintenanceMode: false,
    apiKeys: {
      openai: import.meta.env.VITE_OPENAI_API_KEY || '',
      cloudinary: import.meta.env.VITE_CLOUDINARY_API_KEY || ''
    },
    emailSettings: {
      enableNotifications: true,
      fromEmail: 'noreply@kairosai.com',
      replyTo: 'support@kairosai.com'
    }
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      // TODO: Implement settings update logic
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setSuccess('Paramètres mis à jour avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Erreur lors de la mise à jour des paramètres');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Paramètres de l'application
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* General Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Paramètres généraux
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom de l'application
              </label>
              <input
                type="text"
                value={settings.appName}
                onChange={(e) => setSettings(prev => ({ ...prev, appName: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Taille max. upload (MB)
              </label>
              <input
                type="number"
                value={settings.maxUploadSize}
                onChange={(e) => setSettings(prev => ({ ...prev, maxUploadSize: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Types de fichiers autorisés
              </label>
              <input
                type="text"
                value={settings.allowedFileTypes.join(', ')}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  allowedFileTypes: e.target.value.split(',').map(type => type.trim()) 
                }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Clés API
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={settings.apiKeys.openai}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  apiKeys: { ...prev.apiKeys, openai: e.target.value }
                }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cloudinary API Key
              </label>
              <input
                type="password"
                value={settings.apiKeys.cloudinary}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  apiKeys: { ...prev.apiKeys, cloudinary: e.target.value }
                }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Paramètres email
          </h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Notifications email
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Activer l'envoi des notifications par email
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailSettings.enableNotifications}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    emailSettings: {
                      ...prev.emailSettings,
                      enableNotifications: e.target.checked
                    }
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email expéditeur
              </label>
              <input
                type="email"
                value={settings.emailSettings.fromEmail}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  emailSettings: {
                    ...prev.emailSettings,
                    fromEmail: e.target.value
                  }
                }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email de réponse
              </label>
              <input
                type="email"
                value={settings.emailSettings.replyTo}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  emailSettings: {
                    ...prev.emailSettings,
                    replyTo: e.target.value
                  }
                }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Maintenance Mode */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Mode maintenance
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Activer le mode maintenance pour bloquer l'accès à l'application
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
            {success}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  );
}