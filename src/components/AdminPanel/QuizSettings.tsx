0
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Temps limite (minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  max={1200}
                  value={settings.timeLimit}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    timeLimit: parseInt(e.target.value) || 1 
                  }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Durée maximale pour compléter le quiz
                </p>
              </div>
            </div>
          </section>

          {/* Options */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <List className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Options
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                    Explications à la correction
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Afficher les explications détaillées après chaque question
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showCorrectionExplanation}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      showCorrectionExplanation: e.target.checked 
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
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
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      enableGamification: e.target.checked 
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                    Randomiser les questions
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Mélanger l'ordre des questions à chaque quiz
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.randomizeQuestions}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      randomizeQuestions: e.target.checked 
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Format des questions */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <HelpCircle className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Format des questions
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Source du quiz
                </label>
                <select
                  value={settings.quizSourceType}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    quizSourceType: e.target.value 
                  }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Sélectionner une source</option>
                  {resourceTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Type de ressource documentaire utilisé pour générer les quiz
                </p>
              </div>
              
              {settings.quizSourceType && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Langue des questions
                    </label>
                    <select
                      value={settings.questionLanguage}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        questionLanguage: e.target.value 
                      }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {LANGUAGES.map(lang => (
                        <option key={lang.id} value={lang.id}>{lang.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Format des questions
                    </label>
                    <select
                      value={settings.questionFormat}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        questionFormat: e.target.value 
                      }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {QUESTION_FORMATS.map(format => (
                        <option key={format.id} value={format.id}>{format.label}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Niveaux scolaires ciblés
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {educationLevels.map(level => (
                  <div 
                    key={level.id}
                    className={`flex items-center p-3 rounded-lg border ${
                      settings.levels.includes(level.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    } cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}
                    onClick={() => handleLevelToggle(level.id)}
                  >
                    <input
                      type="checkbox"
                      checked={settings.levels.includes(level.id)}
                      onChange={() => {}}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                      {level.label}
                    </label>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Sélectionnez les niveaux pour lesquels ce quiz sera disponible
              </p>
            </div>
          </section>

          {/* Matières actives */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-6 h-6 text-indigo-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Matières actives
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map(subject => (
                <div
                  key={subject.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {subject.label}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.activeSubjects?.[subject.id] ?? false}
                      onChange={(e) => handleSubjectToggle(subject.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* Messages de feedback */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Messages de feedback
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message de réussite
                </label>
                <textarea
                  value={settings.feedback.passedMessage}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    feedback: {
                      ...prev.feedback,
                      passedMessage: e.target.value
                    }
                  }))}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Message affiché en cas de réussite du quiz"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message d'échec
                </label>
                <textarea
                  value={settings.feedback.failedMessage}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    feedback: {
                      ...prev.feedback,
                      failedMessage: e.target.value
                    }
                  }))}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Message affiché en cas d'échec du quiz"
                ></textarea>
              </div>
            </div>
          </section>

          {/* Aperçu des paramètres */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <BarChart2 className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Résumé des paramètres
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                    Configuration de base
                  </h3>
                </div>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>• {settings.totalQuestions} questions par quiz</li>
                  <li>• Seuil de réussite: {settings.passThreshold}%</li>
                  <li>• Temps limite: {settings.timeLimit} minutes</li>
                </ul>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <List className="w-5 h-5 text-purple-500" />
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                    Options actives
                  </h3>
                </div>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>• {settings.showCorrectionExplanation ? 'Avec' : 'Sans'} explications détaillées</li>
                  <li>• Gamification: {settings.enableGamification ? 'Activée' : 'Désactivée'}</li>
                  <li>• Questions: {settings.randomizeQuestions ? 'Aléatoires' : 'Ordonnées'}</li>
                </ul>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <HelpCircle className="w-5 h-5 text-green-500" />
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                    Format des questions
                  </h3>
                </div>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Source: {settings.quizSourceType ? resourceTypes.find(t => t.id === settings.quizSourceType)?.label || settings.quizSourceType : 'Non définie'}</li>
                  <li>• Langue: {LANGUAGES.find(l => l.id === settings.questionLanguage)?.label || settings.questionLanguage}</li>
                  <li>• Format: {QUESTION_FORMATS.find(f => f.id === settings.questionFormat)?.label || settings.questionFormat}</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Submit button */}
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving || !hasChanges}
              className={`flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-colors ${
                hasChanges 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              } disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              <Save className="w-5 h-5" />
              {saving ? 'Enregistrement en cours...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}