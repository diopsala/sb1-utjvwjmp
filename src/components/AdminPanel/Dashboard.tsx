import React from 'react';
import { Users, BookOpen, Brain, Activity } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard Admin
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Statistiques utilisateurs */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Utilisateurs</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">2,451</p>
            </div>
          </div>
        </div>

        {/* Statistiques ressources */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ressources</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">847</p>
            </div>
          </div>
        </div>

        {/* Statistiques quiz */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Quiz complétés</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">12,938</p>
            </div>
          </div>
        </div>

        {/* Statistiques OpenAI */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tokens OpenAI</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">89.2k</p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques et statistiques détaillées à venir */}
    </div>
  );
}