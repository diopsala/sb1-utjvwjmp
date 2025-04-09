import React, { useState } from 'react';
import { Upload, Search, Filter, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface Resource {
  id: string;
  title: string;
  subject: string;
  level: string;
  type: string;
  difficulty: number;
  tags: string[];
  language: string;
  year: string;
  url: string;
  createdAt: string;
}

const RESOURCE_TYPES = [
  { id: 'course', label: 'Cours' },
  { id: 'homework', label: 'Devoir' },
  { id: 'exam', label: 'Examen' },
  { id: 'exercise', label: 'Exercice' },
  { id: 'sheet', label: 'Fiche' }
];

const DIFFICULTY_LEVELS = [
  { value: 1, label: 'Très facile' },
  { value: 2, label: 'Facile' },
  { value: 3, label: 'Moyen' },
  { value: 4, label: 'Difficile' },
  { value: 5, label: 'Très difficile' }
];

const EDUCATION_LEVELS = [
  { id: 'college', label: 'Collège' },
  { id: 'seconde', label: 'Seconde' },
  { id: 'premiere', label: 'Première' },
  { id: 'terminale', label: 'Terminale' }
];

const SUBJECTS = [
  { id: 'math', label: 'Mathématiques' },
  { id: 'physics', label: 'Physique-Chimie' },
  { id: 'biology', label: 'SVT' },
  { id: 'french', label: 'Français' },
  { id: 'history', label: 'Histoire-Géo' },
  { id: 'english', label: 'Anglais' }
];

export default function ResourceManager() {
  const { currentUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    subject: '',
    level: '',
    type: ''
  });
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    level: '',
    type: 'resources',
    difficulty: 3,
    tags: '',
    language: 'fr',
    year: new Date().getFullYear().toString(),
    file: null as File | null
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      // Convert file to data URL
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(dataUrl);
      
      setFormData(prev => ({ ...prev, file: file }));
      setSuccess('Fichier uploadé avec succès !');
    } catch (error) {
      setError('Erreur lors de l\'upload du fichier');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Vous devez être connecté pour créer une ressource');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Upload file to Cloudinary if present
      let fileUrl = '';
      if (formData.file) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(formData.file);
        });

        fileUrl = await uploadToCloudinary(dataUrl);
      }

      // Create timestamps for Firestore
      const now = Timestamp.now();

      // Prepare resource data matching the rules requirements
      const resourceData = {
        title: formData.title,
        subject: formData.subject,
        level: formData.level,
        type: formData.type,
        difficulty: formData.difficulty,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        language: formData.language,
        year: formData.year,
        file_url: fileUrl || '', // Ensure empty string if no file
        created_at: now,
        created_by: currentUser.uid,
        updated_at: now
      };

      // Log data for debugging
      console.log('Saving resource data:', resourceData);

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'resources'), resourceData);
      console.log('Resource created with ID:', docRef.id);

      setSuccess('Ressource créée avec succès !');
      setShowForm(false);
      
      // Reset form
      setFormData({
        title: '',
        subject: '',
        level: '',
        type: '',
        difficulty: 3,
        tags: '',
        language: 'fr',
        year: new Date().getFullYear().toString(),
        file: null
      });

    } catch (error) {
      console.error('Error creating resource:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la création de la ressource. Vérifiez que vous avez les droits administrateur.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Ressources pédagogiques
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouvelle ressource
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
        <select
          value={filters.subject}
          onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Toutes les matières</option>
          {SUBJECTS.map(subject => (
            <option key={subject.id} value={subject.id}>{subject.label}</option>
          ))}
        </select>
        <select
          value={filters.level}
          onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Tous les niveaux</option>
          {EDUCATION_LEVELS.map(level => (
            <option key={level.id} value={level.id}>{level.label}</option>
          ))}
        </select>
        <select
          value={filters.type}
          onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Tous les types</option>
          {RESOURCE_TYPES.map(type => (
            <option key={type.id} value={type.id}>{type.label}</option>
          ))}
        </select>
      </div>

      {/* Resource Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Nouvelle ressource pédagogique
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Titre
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Matière
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Sélectionner une matière</option>
                    {SUBJECTS.map(subject => (
                      <option key={subject.id} value={subject.id}>{subject.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Niveau
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Sélectionner un niveau</option>
                    {EDUCATION_LEVELS.map(level => (
                      <option key={level.id} value={level.id}>{level.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type de ressource
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Sélectionner un type</option>
                    {RESOURCE_TYPES.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Difficulté
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    {DIFFICULTY_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags (séparés par des virgules)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="ex: trigonométrie, pythagore"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Langue
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="fr">Français</option>
                    <option value="en">Anglais</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Année
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="2000"
                    max="2100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fichier
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg border-gray-300 dark:border-gray-600">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload un fichier</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                      </label>
                      <p className="pl-1">ou glisser-déposer</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PDF, Word ou image jusqu'à 10MB
                    </p>
                  </div>
                </div>
              </div>

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

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploading || saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Upload en cours...' : saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resources List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400">
            Aucune ressource disponible pour le moment
          </p>
        </div>
      </div>
    </div>
  );
}