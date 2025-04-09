import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Edit2, 
  Trash2, 
  AlertCircle, 
  ExternalLink, 
  Save, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ArrowDown, 
  ArrowUp 
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc, 
  limit, 
  startAfter, 
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

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
  file_url: string;
  created_at: string;
  updated_at: string;
  created_by: string;
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
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    subject: '',
    level: '',
    type: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 50,
    lastVisible: null as any,
    hasMore: false
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'created_at',
    direction: 'desc' as 'asc' | 'desc'
  });
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [editForm, setEditForm] = useState<Partial<Resource>>({});
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const { currentUser } = useAuth();

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fetch resources with filters
  const fetchResources = useCallback(async (resetPagination = true) => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError(null);
      
      let q = collection(db, 'resources');
      let constraints = [];
      
      // Apply filters
      if (filters.subject) {
        constraints.push(where('subject', '==', filters.subject));
      }
      
      if (filters.level) {
        constraints.push(where('level', '==', filters.level));
      }
      
      if (filters.type) {
        constraints.push(where('type', '==', filters.type));
      }
      
      // Apply sort
      constraints.push(orderBy(sortConfig.key, sortConfig.direction));
      
      // Apply pagination
      constraints.push(limit(pagination.itemsPerPage));
      
      // If not resetting pagination and we have a last visible document
      if (!resetPagination && pagination.lastVisible) {
        constraints.push(startAfter(pagination.lastVisible));
      }
      
      // Build the query
      q = query(q, ...constraints);
      
      // Execute the query
      const querySnapshot = await getDocs(q);
      
      // Process results
      const resourcesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Resource[];
      
      // Check if there are more results
      const hasMore = resourcesData.length === pagination.itemsPerPage;
      
      // Update state
      if (resetPagination) {
        setResources(resourcesData);
        setPagination(prev => ({
          ...prev,
          currentPage: 1,
          lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
          hasMore
        }));
      } else {
        setResources(prev => [...prev, ...resourcesData]);
        setPagination(prev => ({
          ...prev,
          currentPage: prev.currentPage + 1,
          lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1] || prev.lastVisible,
          hasMore
        }));
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      setError('Erreur lors de la récupération des ressources');
    } finally {
      setLoading(false);
    }
  }, [currentUser, filters, sortConfig, pagination.itemsPerPage, pagination.lastVisible]);

  // Initial fetch
  useEffect(() => {
    fetchResources();
  }, [fetchResources, filters, sortConfig]);

  // Extract public ID from Cloudinary URL
  const extractPublicId = (url: string) => {
    const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
    return matches ? matches[1] : null;
  };

  // Delete resource from Cloudinary and Firestore
  const deleteResource = async (resourceId: string, fileUrl: string) => {
    setProcessing(true);
    try {
      // Extract public ID from file URL
      const publicId = extractPublicId(fileUrl);
      
      if (!publicId) {
        throw new Error('Invalid file URL');
      }

      // Delete from Cloudinary via proxy (would be implemented separately)
      try {
        // This would be a call to a secure server-side function
        // that handles the actual Cloudinary deletion with API keys
        await axios.post('/api/cloudinary/delete', { 
          public_id: publicId 
        });
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Continue with Firestore deletion even if Cloudinary fails
      }

      // Delete from Firestore
      await deleteDoc(doc(db, 'resources', resourceId));
      
      // Update UI
      setResources(prev => prev.filter(resource => resource.id !== resourceId));
      setShowDeleteModal(false);
      setNotification({
        message: 'Ressource supprimée avec succès',
        type: 'success'
      });

      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error deleting resource:', error);
      setNotification({
        message: 'Erreur lors de la suppression de la ressource',
        type: 'error'
      });
    } finally {
      setProcessing(false);
    }
  };

  // Update resource
  const updateResource = async (resourceId: string, data: Partial<Resource>) => {
    setProcessing(true);
    try {
      await updateDoc(doc(db, 'resources', resourceId), {
        ...data,
        updated_at: new Date().toISOString()
      });
      
      // Update UI
      setResources(prev => 
        prev.map(resource => 
          resource.id === resourceId 
            ? { ...resource, ...data, updated_at: new Date().toISOString() } 
            : resource
        )
      );
      
      setShowEditModal(false);
      setNotification({
        message: 'Ressource mise à jour avec succès',
        type: 'success'
      });

      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error updating resource:', error);
      setNotification({
        message: 'Erreur lors de la mise à jour de la ressource',
        type: 'error'
      });
    } finally {
      setProcessing(false);
    }
  };

  // Handle sort
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Handle pagination
  const loadMore = () => {
    if (pagination.hasMore && !loading) {
      fetchResources(false);
    }
  };

  // Handle edit
  const handleEdit = (resource: Resource) => {
    setSelectedResource(resource);
    setEditForm({
      title: resource.title,
      subject: resource.subject,
      level: resource.level,
      type: resource.type,
      difficulty: resource.difficulty,
      tags: resource.tags,
      language: resource.language,
      year: resource.year
    });
    setShowEditModal(true);
  };

  // Handle delete
  const handleDelete = (resource: Resource) => {
    setSelectedResource(resource);
    setShowDeleteModal(true);
  };

  // Handle download
  const handleDownload = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  // Filter resources based on search term
  const filteredResources = resources.filter(resource => {
    if (!filters.search) return true;
    
    const searchLower = filters.search.toLowerCase();
    return (
      resource.title.toLowerCase().includes(searchLower) ||
      SUBJECTS.find(s => s.id === resource.subject)?.label.toLowerCase().includes(searchLower) ||
      RESOURCE_TYPES.find(t => t.id === resource.type)?.label.toLowerCase().includes(searchLower) ||
      formatDate(resource.created_at).toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Ressources pédagogiques
        </h1>
        <button
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

      {/* Items per page selector */}
      <div className="flex items-center justify-end gap-2">
        <label className="text-sm text-gray-600 dark:text-gray-400">
          Items par page:
        </label>
        <select
          value={pagination.itemsPerPage}
          onChange={(e) => setPagination(prev => ({ ...prev, itemsPerPage: Number(e.target.value) }))}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-1"
        >
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      {/* Resources Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {loading && resources.length === 0 ? (
          <div className="p-6 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500 dark:text-red-400">
            {error}
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Aucune ressource disponible pour le moment
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50">
                  <th 
                    className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/70"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center gap-2">
                      Titre
                      {sortConfig.key === 'title' && (
                        sortConfig.direction === 'asc' ? 
                          <ArrowUp className="w-4 h-4" /> : 
                          <ArrowDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Matière
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Niveau
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Année
                  </th>
                  <th 
                    className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/70"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-2">
                      Date de création
                      {sortConfig.key === 'created_at' && (
                        sortConfig.direction === 'asc' ? 
                          <ArrowUp className="w-4 h-4" /> : 
                          <ArrowDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Fichier
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredResources.map((resource) => (
                  <tr 
                    key={resource.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {resource.title}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {SUBJECTS.find(s => s.id === resource.subject)?.label || resource.subject}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {EDUCATION_LEVELS.find(l => l.id === resource.level)?.label || resource.level}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {RESOURCE_TYPES.find(t => t.id === resource.type)?.label || resource.type}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {resource.year}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDate(resource.created_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <a 
                        href={resource.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Fichier</span>
                      </a>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleDownload(resource.file_url)}
                          className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                          title="Télécharger"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(resource)}
                          className="p-1.5 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-full transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(resource)}
                          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.hasMore && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Chargement...' : 'Charger plus'}
            </button>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && selectedResource && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Confirmer la suppression
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Cette action est irréversible
                </p>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Êtes-vous sûr de vouloir supprimer la ressource <b>{selectedResource.title}</b> ? Cette action supprimera définitivement la ressource et son fichier associé.
            </p>
            
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={processing}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteResource(selectedResource.id, selectedResource.file_url)}
                disabled={processing}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedResource && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Modifier la ressource
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Titre
                </label>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Matière
                </label>
                <select
                  value={editForm.subject || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {SUBJECTS.map(subject => (
                    <option key={subject.id} value={subject.id}>{subject.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Niveau
                </label>
                <select
                  value={editForm.level || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, level: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {EDUCATION_LEVELS.map(level => (
                    <option key={level.id} value={level.id}>{level.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <select
                  value={editForm.type || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {RESOURCE_TYPES.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Année
                </label>
                <input
                  type="text"
                  value={editForm.year || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, year: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulté
                </label>
                <select
                  value={editForm.difficulty || 3}
                  onChange={(e) => setEditForm(prev => ({ ...prev, difficulty: Number(e.target.value) }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {DIFFICULTY_LEVELS.map(difficulty => (
                    <option key={difficulty.value} value={difficulty.value}>{difficulty.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Langue
                </label>
                <select
                  value={editForm.language || 'fr'}
                  onChange={(e) => setEditForm(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="fr">Français</option>
                  <option value="en">Anglais</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={editForm.tags ? editForm.tags.join(', ') : ''}
                  onChange={(e) => setEditForm(prev => ({ 
                    ...prev, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={processing}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => updateResource(selectedResource.id, editForm)}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {processing ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg text-white ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {notification.message}
        </div>
      )}
    </div>
  );
}