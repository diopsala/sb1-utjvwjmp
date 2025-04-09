import React from 'react';

export default function SubjectsManager() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Matières & niveaux
        </h1>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <p className="text-gray-600 dark:text-gray-300">
          Gérez ici les matières et niveaux disponibles dans l'application.
        </p>
      </div>
    </div>
  );
}