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

interface Item {
  id: string;
  docId?: string;
  label: string;
}

export default function SubjectsManager() {
  // State for subjects and education levels
  const [subjects, setSubjects] = useState<Item[]>([]);
  const [educationLevels, setEducationLevels] = useState<Item[]>([]);
  
  // State for forms
  const [newSubject, setNewSubject] = useState<Item>({ id: '', label: '' });
  const [newLevel, setNewLevel] = useState<Item>({ id: '', label: '' });
  
  // State for edit mode
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editingLevel, setEditingLevel] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Item>({ id: '', label: '' });
  
  // State for delete confirmation
  const [deleteConfirmSubject, setDeleteConfirmSubject] = useState<string | null>(null);
  const [deleteConfirmLevel, setDeleteConfirmLevel] = useState<string | null>(null);
  
  // Status messages
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  
  // Loading states
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingLevels, setLoadingLevels] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Fetch subjects and levels on component mount
  useEffect(() => {
    fetchSubjects();
    fetchEducationLevels();
  }, []);

  // Fetch subjects from Firestore
  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const q = query(collection(db, 'subjects'), orderBy('label'));
      const querySnapshot = await getDocs(q);
      
      const items = querySnapshot.docs.map(doc => ({
        docId: doc.id,
        ...doc.data(),
      })) as Item[];
      
      setSubjects(items);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      showNotification('Erreur lors du chargement des matières', 'error');
    } finally {
      setLoadingSubjects(false);
    }
  };

  // Fetch education levels from Firestore
  const fetchEducationLevels = async () => {
    try {
      setLoadingLevels(true);
      const q = query(collection(db, 'education_levels'), orderBy('label'));
      const querySnapshot = await getDocs(q);
      
      const items = querySnapshot.docs.map(doc => ({
        docId: doc.id,
        ...doc.data(),
      })) as Item[];
      
      setEducationLevels(items);
    } catch (error) {
      console.error('Error fetching education levels:', error);
      showNotification('Erreur lors du chargement des niveaux', 'error');
    } finally {
      setLoadingLevels(false);
    }
  };

  // Show notification with auto-dismiss
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Check if ID already exists
  const idExists = (id: string, collection: 'subjects' | 'education_levels') => {
    if (collection === 'subjects') {
      return subjects.some(item => item.id === id);
    } else {
      return educationLevels.some(item => item.id === id);
    }
  };

  // Validate form input
  const validateForm = (item: Item, collection: 'subjects' | 'education_levels', isEdit = false) => {
    if (!item.id.trim()) {
      showNotification('L\'identifiant est obligatoire', 'error');
      return false;
    }
    
    if (!item.label.trim()) {
      showNotification('Le libellé est obligatoire', 'error');
      return false;
    }
    
    // Only check for duplicates when creating a new item or changing the ID
    if (!isEdit || (isEdit && item.id !== editForm.id)) {
      if (idExists(item.id, collection)) {
        showNotification(`Cet identifiant existe déjà dans la collection ${collection}`, 'error');
        return false;
      }
    }
    
    return true;
  };

  // Add a new subject
  const addSubject = async () => {
    if (!validateForm(newSubject, 'subjects')) return;
    
    setProcessing(true);
    try {
      // First check if ID already exists
      const checkQuery = query(collection(db, 'subjects'), where('id', '==', newSubject.id));
      const checkSnapshot = await getDocs(checkQuery);
      
      if (!checkSnapshot.empty) {
        showNotification('Cet identifiant existe déjà', 'error');
        setProcessing(false);
        return;
      }
      
      await addDoc(collection(db, 'subjects'), {
        id: newSubject.id,
        label: newSubject.label
      });
      
      // Refresh the list
      await fetchSubjects();
      
      // Reset the form
      setNewSubject({ id: '', label: '' });
      
      showNotification('Matière ajoutée avec succès', 'success');
    } catch (error) {
      console.error('Error adding subject:', error);
      showNotification('Erreur lors de l\'ajout de la matière', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Add a new education level
  const addEducationLevel = async () => {
    if (!validateForm(newLevel, 'education_levels')) return;
    
    setProcessing(true);
    try {
      // First check if ID already exists
      const checkQuery = query(collection(db, 'education_levels'), where('id', '==', newLevel.id));
      const checkSnapshot = await getDocs(checkQuery);
      
      if (!checkSnapshot.empty) {
        showNotification('Cet identifiant existe déjà', 'error');
        setProcessing(false);
        return;
      }
      
      await addDoc(collection(db, 'education_levels'), {
        id: newLevel.id,
        label: newLevel.label
      });
      
      // Refresh the list
      await fetchEducationLevels();
      
      // Reset the form
      setNewLevel({ id: '', label: '' });
      
      showNotification('Niveau ajouté avec succès', 'success');
    } catch (error) {
      console.error('Error adding education level:', error);
      showNotification('Erreur lors de l\'ajout du niveau', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Start editing an item
  const startEdit = (item: Item, type: 'subject' | 'level') => {
    setEditForm({ ...item });
    if (type === 'subject') {
      setEditingSubject(item.docId || null);
      setEditingLevel(null);
    } else {
      setEditingLevel(item.docId || null);
      setEditingSubject(null);
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingSubject(null);
    setEditingLevel(null);
    setEditForm({ id: '', label: '' });
  };

  // Save edited subject
  const saveEditedSubject = async () => {
    if (!editingSubject) return;
    if (!validateForm(editForm, 'subjects', true)) return;
    
    setProcessing(true);
    try {
      const docRef = doc(db, 'subjects', editingSubject);
      await updateDoc(docRef, {
        id: editForm.id,
        label: editForm.label
      });
      
      // Refresh the list
      await fetchSubjects();
      
      // Reset edit state
      setEditingSubject(null);
      setEditForm({ id: '', label: '' });
      
      showNotification('Matière mise à jour avec succès', 'success');
    } catch (error) {
      console.error('Error updating subject:', error);
      showNotification('Erreur lors de la mise à jour de la matière', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Save edited education level
  const saveEditedLevel = async () => {
    if (!editingLevel) return;
    if (!validateForm(editForm, 'education_levels', true)) return;
    
    setProcessing(true);
    try {
      const docRef = doc(db, 'education_levels', editingLevel);
      await updateDoc(docRef, {
        id: editForm.id,
        label: editForm.label
      });
      
      // Refresh the list
      await fetchEducationLevels();
      
      // Reset edit state
      setEditingLevel(null);
      setEditForm({ id: '', label: '' });
      
      showNotification('Niveau mis à jour avec succès', 'success');
    } catch (error) {
      console.error('Error updating education level:', error);
      showNotification('Erreur lors de la mise à jour du niveau', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Delete a subject
  const deleteSubject = async (docId: string) => {
    setProcessing(true);
    try {
      await deleteDoc(doc(db, 'subjects', docId));
      
      // Refresh the list
      await fetchSubjects();
      
      // Reset state
      setDeleteConfirmSubject(null);
      
      showNotification('Matière supprimée avec succès', 'success');
    } catch (error) {
      console.error('Error deleting subject:', error);
      showNotification('Erreur lors de la suppression de la matière', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Delete an education level
  const deleteLevel = async (docId: string) => {
    setProcessing(true);
    try {
      await deleteDoc(doc(db, 'education_levels', docId));
      
      // Refresh the list
      await fetchEducationLevels();
      
      // Reset state
      setDeleteConfirmLevel(null);
      
      showNotification('Niveau supprimé avec succès', 'success');
    } catch (error) {
      console.error('Error deleting education level:', error);
      showNotification('Erreur lors de la suppression du niveau', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Matières & niveaux
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
        {/* Subjects Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Matières
          </h2>
          
          {/* Add New Subject Form */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-4">
              Ajouter une nouvelle matière
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Identifiant
                </label>
                <input
                  type="text"
                  value={newSubject.id}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, id: e.target.value }))}
                  placeholder="ex: math"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Libellé
                </label>
                <input
                  type="text"
                  value={newSubject.label}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="ex: Mathématiques"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={addSubject}
                disabled={processing || !newSubject.id || !newSubject.label}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>
          </div>
          
          {/* Subjects List */}
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
                {loadingSubjects ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                      Chargement...
                    </td>
                  </tr>
                ) : subjects.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                      Aucune matière disponible
                    </td>
                  </tr>
                ) : (
                  subjects.map((subject) => (
                    <tr key={subject.docId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      {editingSubject === subject.docId ? (
                        <>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={editForm.id}
                              onChange={(e) => setEditForm(prev => ({ ...prev, id: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={editForm.label}
                              onChange={(e) => setEditForm(prev => ({ ...prev, label: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={saveEditedSubject}
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
                            {subject.id}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {subject.label}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {deleteConfirmSubject === subject.docId ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs text-red-600 dark:text-red-400">Confirmer ?</span>
                                <button
                                  onClick={() => deleteSubject(subject.docId!)}
                                  disabled={processing}
                                  className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                  title="Confirmer"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmSubject(null)}
                                  className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                  title="Annuler"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => startEdit(subject, 'subject')}
                                  className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                                  title="Modifier"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmSubject(subject.docId!)}
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

        {/* Education Levels Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Niveaux scolaires
          </h2>
          
          {/* Add New Level Form */}
          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <h3 className="text-sm font-medium text-purple-700 dark:text-purple-400 mb-4">
              Ajouter un nouveau niveau
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Identifiant
                </label>
                <input
                  type="text"
                  value={newLevel.id}
                  onChange={(e) => setNewLevel(prev => ({ ...prev, id: e.target.value }))}
                  placeholder="ex: college"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Libellé
                </label>
                <input
                  type="text"
                  value={newLevel.label}
                  onChange={(e) => setNewLevel(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="ex: Collège"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={addEducationLevel}
                disabled={processing || !newLevel.id || !newLevel.label}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>
          </div>
          
          {/* Education Levels List */}
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
                {loadingLevels ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                      Chargement...
                    </td>
                  </tr>
                ) : educationLevels.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                      Aucun niveau disponible
                    </td>
                  </tr>
                ) : (
                  educationLevels.map((level) => (
                    <tr key={level.docId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      {editingLevel === level.docId ? (
                        <>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={editForm.id}
                              onChange={(e) => setEditForm(prev => ({ ...prev, id: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={editForm.label}
                              onChange={(e) => setEditForm(prev => ({ ...prev, label: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={saveEditedLevel}
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
                            {level.id}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {level.label}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {deleteConfirmLevel === level.docId ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs text-red-600 dark:text-red-400">Confirmer ?</span>
                                <button
                                  onClick={() => deleteLevel(level.docId!)}
                                  disabled={processing}
                                  className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                  title="Confirmer"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmLevel(null)}
                                  className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                  title="Annuler"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => startEdit(level, 'level')}
                                  className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                                  title="Modifier"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmLevel(level.docId!)}
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