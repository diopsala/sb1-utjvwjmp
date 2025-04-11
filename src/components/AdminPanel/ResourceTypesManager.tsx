import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, AlertCircle, Check } from 'lucide-react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface ResourceType {
  id: string;
  docId?: string;
  label: string;
}

interface DifficultyLevel {
  value: number;
  docId?: string;
  label: string;
}

export default function ResourceTypesManager() {
  // State for resource types and difficulty levels
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [difficultyLevels, setDifficultyLevels] = useState<DifficultyLevel[]>([]);
  
  // State for forms
  const [newType, setNewType] = useState<ResourceType>({ id: '', label: '' });
  const [newDifficulty, setNewDifficulty] = useState<DifficultyLevel>({ value: 1, label: '' });
  
  // State for edit mode
  const [editingType, setEditingType] = useState<string | null>(null);
  const [editingDifficulty, setEditingDifficulty] = useState<string | null>(null);
  const [editTypeForm, setEditTypeForm] = useState<ResourceType>({ id: '', label: '' });
  const [editDifficultyForm, setEditDifficultyForm] = useState<DifficultyLevel>({ value: 1, label: '' });
  
  // State for delete confirmation
  const [deleteConfirmType, setDeleteConfirmType] = useState<string | null>(null);
  const [deleteConfirmDifficulty, setDeleteConfirmDifficulty] = useState<string | null>(null);
  
  // Status messages
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  
  // Loading states
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingDifficulties, setLoadingDifficulties] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Fetch resource types and difficulty levels on component mount
  useEffect(() => {
    fetchResourceTypes();
    fetchDifficultyLevels();
  }, []);

  // Fetch resource types from Firestore
  const fetchResourceTypes = async () => {
    try {
      setLoadingTypes(true);
      const q = query(collection(db, 'resource_types'), orderBy('label'));
      const querySnapshot = await getDocs(q);
      
      const items = querySnapshot.docs.map(doc => ({
        docId: doc.id,
        ...doc.data(),
      })) as ResourceType[];
      
      setResourceTypes(items);
    } catch (error) {
      console.error('Error fetching resource types:', error);
      showNotification('Erreur lors du chargement des types de ressources', 'error');
    } finally {
      setLoadingTypes(false);
    }
  };

  // Fetch difficulty levels from Firestore
  const fetchDifficultyLevels = async () => {
    try {
      setLoadingDifficulties(true);
      const q = query(collection(db, 'difficulty_levels'), orderBy('value'));
      const querySnapshot = await getDocs(q);
      
      const items = querySnapshot.docs.map(doc => ({
        docId: doc.id,
        ...doc.data(),
      })) as DifficultyLevel[];
      
      setDifficultyLevels(items);
    } catch (error) {
      console.error('Error fetching difficulty levels:', error);
      showNotification('Erreur lors du chargement des niveaux de difficulté', 'error');
    } finally {
      setLoadingDifficulties(false);
    }
  };

  // Show notification with auto-dismiss
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Check if ID already exists
  const typeIdExists = (id: string) => {
    return resourceTypes.some(item => item.id === id);
  };

  // Check if difficulty value already exists
  const difficultyValueExists = (value: number) => {
    return difficultyLevels.some(item => item.value === value);
  };

  // Validate type form input
  const validateTypeForm = (item: ResourceType, isEdit = false) => {
    if (!item.id.trim()) {
      showNotification('L\'identifiant est obligatoire', 'error');
      return false;
    }
    
    if (!item.label.trim()) {
      showNotification('Le libellé est obligatoire', 'error');
      return false;
    }
    
    // Only check for duplicates when creating a new item or changing the ID
    if (!isEdit || (isEdit && item.id !== editTypeForm.id)) {
      if (typeIdExists(item.id)) {
        showNotification('Cet identifiant existe déjà', 'error');
        return false;
      }
    }
    
    return true;
  };

  // Validate difficulty form input
  const validateDifficultyForm = (item: DifficultyLevel, isEdit = false) => {
    if (item.value < 1 || item.value > 5) {
      showNotification('La valeur doit être entre 1 et 5', 'error');
      return false;
    }
    
    if (!item.label.trim()) {
      showNotification('Le libellé est obligatoire', 'error');
      return false;
    }
    
    // Only check for duplicates when creating a new item or changing the value
    if (!isEdit || (isEdit && item.value !== editDifficultyForm.value)) {
      if (difficultyValueExists(item.value)) {
        showNotification('Cette valeur existe déjà', 'error');
        return false;
      }
    }
    
    return true;
  };

  // Add a new resource type
  const addResourceType = async () => {
    if (!validateTypeForm(newType)) return;
    
    setProcessing(true);
    try {
      // First check if ID already exists
      const checkQuery = query(collection(db, 'resource_types'), where('id', '==', newType.id));
      const checkSnapshot = await getDocs(checkQuery);
      
      if (!checkSnapshot.empty) {
        showNotification('Cet identifiant existe déjà', 'error');
        setProcessing(false);
        return;
      }
      
      await addDoc(collection(db, 'resource_types'), {
        id: newType.id,
        label: newType.label
      });
      
      // Refresh the list
      await fetchResourceTypes();
      
      // Reset the form
      setNewType({ id: '', label: '' });
      
      showNotification('Type de ressource ajouté avec succès', 'success');
    } catch (error) {
      console.error('Error adding resource type:', error);
      showNotification('Erreur lors de l\'ajout du type de ressource', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Add a new difficulty level
  const addDifficultyLevel = async () => {
    if (!validateDifficultyForm(newDifficulty)) return;
    
    setProcessing(true);
    try {
      // First check if value already exists
      const checkQuery = query(collection(db, 'difficulty_levels'), where('value', '==', newDifficulty.value));
      const checkSnapshot = await getDocs(checkQuery);
      
      if (!checkSnapshot.empty) {
        showNotification('Cette valeur existe déjà', 'error');
        setProcessing(false);
        return;
      }
      
      await addDoc(collection(db, 'difficulty_levels'), {
        value: newDifficulty.value,
        label: newDifficulty.label
      });
      
      // Refresh the list
      await fetchDifficultyLevels();
      
      // Reset the form
      setNewDifficulty({ value: 1, label: '' });
      
      showNotification('Niveau de difficulté ajouté avec succès', 'success');
    } catch (error) {
      console.error('Error adding difficulty level:', error);
      showNotification('Erreur lors de l\'ajout du niveau de difficulté', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Start editing a resource type
  const startEditType = (type: ResourceType) => {
    setEditTypeForm({ ...type });
    setEditingType(type.docId || null);
    setEditingDifficulty(null);
  };

  // Start editing a difficulty level
  const startEditDifficulty = (difficulty: DifficultyLevel) => {
    setEditDifficultyForm({ ...difficulty });
    setEditingDifficulty(difficulty.docId || null);
    setEditingType(null);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingType(null);
    setEditingDifficulty(null);
    setEditTypeForm({ id: '', label: '' });
    setEditDifficultyForm({ value: 1, label: '' });
  };

  // Save edited resource type
  const saveEditedType = async () => {
    if (!editingType) return;
    if (!validateTypeForm(editTypeForm, true)) return;
    
    setProcessing(true);
    try {
      const docRef = doc(db, 'resource_types', editingType);
      await updateDoc(docRef, {
        id: editTypeForm.id,
        label: editTypeForm.label
      });
      
      // Refresh the list
      await fetchResourceTypes();
      
      // Reset edit state
      setEditingType(null);
      setEditTypeForm({ id: '', label: '' });
      
      showNotification('Type de ressource mis à jour avec succès', 'success');
    } catch (error) {
      console.error('Error updating resource type:', error);
      showNotification('Erreur lors de la mise à jour du type de ressource', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Save edited difficulty level
  const saveEditedDifficulty = async () => {
    if (!editingDifficulty) return;
    if (!validateDifficultyForm(editDifficultyForm, true)) return;
    
    setProcessing(true);
    try {
      const docRef = doc(db, 'difficulty_levels', editingDifficulty);
      await updateDoc(docRef, {
        value: editDifficultyForm.value,
        label: editDifficultyForm.label
      });
      
      // Refresh the list
      await fetchDifficultyLevels();
      
      // Reset edit state
      setEditingDifficulty(null);
      setEditDifficultyForm({ value: 1, label: '' });
      
      showNotification('Niveau de difficulté mis à jour avec succès', 'success');
    } catch (error) {
      console.error('Error updating difficulty level:', error);
      showNotification('Erreur lors de la mise à jour du niveau de difficulté', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Delete a resource type
  const deleteResourceType = async (docId: string) => {
    setProcessing(true);
    try {
      await deleteDoc(doc(db, 'resource_types', docId));
      
      // Refresh the list
      await fetchResourceTypes();
      
      // Reset state
      setDeleteConfirmType(null);
      
      showNotification('Type de ressource supprimé avec succès', 'success');
    } catch (error) {
      console.error('Error deleting resource type:', error);
      showNotification('Erreur lors de la suppression du type de ressource', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Delete a difficulty level
  const deleteDifficultyLevel = async (docId: string) => {
    setProcessing(true);
    try {
      await deleteDoc(doc(db, 'difficulty_levels', docId));
      
      // Refresh the list
      await fetchDifficultyLevels();
      
      // Reset state
      setDeleteConfirmDifficulty(null);
      
      showNotification('Niveau de difficulté supprimé avec succès', 'success');
    } catch (error) {
      console.error('Error deleting difficulty level:', error);
      showNotification('Erreur lors de la suppression du niveau de difficulté', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Types de ressources & difficultés
        </h1>
      </div>
      
      {notification && (
        <div className={`p-4 rounded-lg ${
          notification.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
        } flex items-center gap-2`}>
          {notification.type === 'success' ? (
            <Check className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p>{notification.message}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Resource Types Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Types de ressources
          </h2>
          
          {/* Add New Type Form */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-4">
              Ajouter un nouveau type
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Identifiant
                </label>
                <input
                  type="text"
                  value={newType.id}
                  onChange={(e) => setNewType(prev => ({ ...prev, id: e.target.value }))}
                  placeholder="ex: exam"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Libellé
                </label>
                <input
                  type="text"
                  value={newType.label}
                  onChange={(e) => setNewType(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="ex: Examen"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={addResourceType}
                disabled={processing || !newType.id || !newType.label}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>
          </div>
          
          {/* Resource Types List */}
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Identifiant
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Libellé
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loadingTypes ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                      Chargement...
                    </td>
                  </tr>
                ) : resourceTypes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                      Aucun type de ressource disponible
                    </td>
                  </tr>
                ) : (
                  resourceTypes.map((type) => (
                    <tr key={type.docId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      {editingType === type.docId ? (
                        <>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={editTypeForm.id}
                              onChange={(e) => setEditTypeForm(prev => ({ ...prev, id: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={editTypeForm.label}
                              onChange={(e) => setEditTypeForm(prev => ({ ...prev, label: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={saveEditedType}
                                disabled={processing}
                                className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors"
                                title="Enregistrer"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                title="Annuler"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {type.id}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {type.label}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {deleteConfirmType === type.docId ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs text-red-600 dark:text-red-400">Confirmer ?</span>
                                <button
                                  onClick={() => deleteResourceType(type.docId!)}
                                  disabled={processing}
                                  className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                  title="Confirmer"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmType(null)}
                                  className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                  title="Annuler"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => startEditType(type)}
                                  className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                                  title="Modifier"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmType(type.docId!)}
                                  className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Difficulty Levels Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Niveaux de difficulté
          </h2>
          
          {/* Add New Difficulty Level Form */}
          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <h3 className="text-sm font-medium text-purple-700 dark:text-purple-400 mb-4">
              Ajouter un nouveau niveau de difficulté
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valeur (1-5)
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={newDifficulty.value}
                  onChange={(e) => setNewDifficulty(prev => ({ ...prev, value: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Libellé
                </label>
                <input
                  type="text"
                  value={newDifficulty.label}
                  onChange={(e) => setNewDifficulty(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="ex: Très facile"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={addDifficultyLevel}
                disabled={processing || !newDifficulty.label || newDifficulty.value < 1 || newDifficulty.value > 5}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>
          </div>
          
          {/* Difficulty Levels List */}
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Valeur
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Libellé
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loadingDifficulties ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                      Chargement...
                    </td>
                  </tr>
                ) : difficultyLevels.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                      Aucun niveau de difficulté disponible
                    </td>
                  </tr>
                ) : (
                  difficultyLevels.map((difficulty) => (
                    <tr key={difficulty.docId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      {editingDifficulty === difficulty.docId ? (
                        <>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min={1}
                              max={5}
                              value={editDifficultyForm.value}
                              onChange={(e) => setEditDifficultyForm(prev => ({ ...prev, value: parseInt(e.target.value) || 1 }))}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={editDifficultyForm.label}
                              onChange={(e) => setEditDifficultyForm(prev => ({ ...prev, label: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={saveEditedDifficulty}
                                disabled={processing}
                                className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors"
                                title="Enregistrer"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                title="Annuler"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {difficulty.value}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {difficulty.label}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {deleteConfirmDifficulty === difficulty.docId ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs text-red-600 dark:text-red-400">Confirmer ?</span>
                                <button
                                  onClick={() => deleteDifficultyLevel(difficulty.docId!)}
                                  disabled={processing}
                                  className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                  title="Confirmer"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmDifficulty(null)}
                                  className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                  title="Annuler"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => startEditDifficulty(difficulty)}
                                  className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                                  title="Modifier"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmDifficulty(difficulty.docId!)}
                                  className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}