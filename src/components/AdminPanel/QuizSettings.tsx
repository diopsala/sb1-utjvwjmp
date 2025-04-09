import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';

interface QuizSettings {
  questionsPerQuiz: number;
  validationThreshold: number;
  timeLimit: number;
  showExplanations: boolean;
  enableGamification: boolean;
  enabledSubjects: {
    math: boolean;
    physics: boolean;
    biology: boolean;
    french: boolean;
    history: boolean;
    english: boolean;
  };
}

export default function QuizSettings() {
  const [settings, setSettings] = useState<QuizSettings>({
    questionsPerQuiz: 10,
    validationThreshold: 70,
    timeLimit: 30,
    showExplanations: true,
    enableGamification: true,
    enabledSubjects: {
      math: true,
      physics: true,
      biology: true,
      french: true,
      history: true,
      english: true
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
      // TODO: Implement settings update logic with Firebase
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
          Paramètres des quiz
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Questions et validation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Configuration générale
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre de questions par quiz
              </label>
              <input
                type="number"
                value={settings.questionsPerQuiz}
                onChange={(e) => setSettings(prev => ({ ...prev, questionsPerQuiz: parseInt(e.target.value) }))}
                min="1"
                max="50"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seuil de validation (%)
              </label>
              <input
                type="number"
                value={settings.validationThreshold}
                onChange={(e) => setSettings(prev => ({ ...prev, validationThreshold: parseInt(e.target.value) }))}
                min="0"
                max="100"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Temps limite (minutes)
              </label>
              <input
                type="number"
                value={settings.timeLimit}
                onChange={(e) => setSettings(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                min="1"
                max="120"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Options
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Explications à la correction
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Afficher les explications détaillées après chaque question
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showExplanations}
                  onChange={(e) => setSettings(prev => ({ ...prev, showExplanations: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Gamification
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Activer les points, badges et classements
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableGamification}
                  onChange={(e) => setSettings(prev => ({ ...prev, enableGamification: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Matières */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Matières actives
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(settings.enabledSubjects).map(([subject, enabled]) => (
              <div key={subject} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {subject}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      enabledSubjects: {
                        ...prev.enabledSubjects,
                        [subject]: e.target.checked
                      }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
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