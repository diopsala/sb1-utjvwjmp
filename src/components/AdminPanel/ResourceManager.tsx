import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ArrowUp,
  Upload,
  Tag,
  XCircle,
  FileText
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
  addDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { uploadToCloudinary, getFileExtension, normalizeFilename } from '../../lib/cloudinary';
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

interface NewResource {
  title: string;
  subject: string;
  level: string;
  type: string;
  difficulty: number;
  tags: string[];
  language: string;
  year: string;
  file: File | null;
}

interface Subject {
  id: string;
  label: string;
}

interface EducationLevel {
  id: string;
  label: string;
}

const RESOURCE_TYPES = [
  { id: 'course', label: 'Cours' },
  { id: 'homework', label: 'Devoir' },
  { id: 'exam', label: 'Examen' },
  { id: 'exercise', label: 'Exercice' },
  { id: 'sheet', label: 'Fiche' }
];

const DIFFICULTY_LEVELS = [
  { value: 1, label: 'Très facile', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { value: 2, label: 'Facile', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 3, label: 'Moyen', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 4, label: 'Difficile', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  { value: 5, label: 'Très difficile', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [editForm, setEditForm] = useState<Partial<Resource>>({});
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // Create form state
  const [newResource, setNewResource] = useState<NewResource>({
    title: '',
    subject: 'math',
    level: 'college',
    type: 'course',
    difficulty: 3,
    tags: [],
    language: 'fr',
    year: new Date().getFullYear().toString(),
    file: null
  });
  
  // Tag input state
  const [tagInput, setTagInput] = useState<string>('');
  const [editTagInput, setEditTagInput] = useState<string>('');
  
  // Dynamic data from Firestore
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingLevels, setLoadingLevels] = useState(true);
  
  // Form validation state
  const [validationErrors, setValidationErrors] = useState<{
    title?: string;
    file?: string;
  }>({});
  
  // File input ref for programmatic clicks
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { currentUser } = useAuth();

  // Fetch subjects and education levels
  useEffect(() => {
    const subjectsUnsubscribe = onSnapshot(
      query(collection(db, 'subjects'), orderBy('label')),
      (snapshot) => {
        const subjectsData = snapshot.docs.map(doc => ({
          id: doc.data().id,
          label: doc.data().label
        }));
        setSubjects(subjectsData);
        setLoadingSubjects(false);
      },
      (error) => {
        console.error('Error fetching subjects:', error);
        setLoadingSubjects(false);
      }
    );
    
    const levelsUnsubscribe = onSnapshot(
      query(collection(db, 'education_levels'), orderBy('label')),
      (snapshot) => {
        const levelsData = snapshot.docs.map(doc => ({
          id: doc.data().id,
          label: doc.data().label
        }));
        setEducationLevels(levelsData);
        setLoadingLevels(false);
      },
      (error) => {
        console.error('Error fetching education levels:', error);
        setLoadingLevels(false);
      }
    );
    
    // Set default values for new resource once data is loaded
    if (subjects.length > 0 && newResource.subject === 'math') {
      setNewResource(prev => ({ ...prev, subject: subjects[0].id }));
    }
    
    if (educationLevels.length > 0 && newResource.level === 'college') {
      setNewResource(prev => ({ ...prev, level: educationLevels[0].id }));
    }
    
    return () => {
      subjectsUnsubscribe();
      levelsUnsubscribe();
    };
  }, []);

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
      
      // Start with a base collection reference
      const resourcesRef = collection(db, 'resources');
      
      // Build an array of query constraints
      const constraints = [];
      
      // Only add filter constraints if they have values
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
      
      // Build the query with all applicable constraints
      let q = query(resourcesRef, ...constraints);
      
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

  // Handle tag input
  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    if (isEdit) {
      setEditTagInput(e.target.value);
    } else {
      setTagInput(e.target.value);
    }
  };

  // Add a tag
  const addTag = (isEdit: boolean = false) => {
    const input = isEdit ? editTagInput : tagInput;
    if (!input.trim()) return;

    const newTags = input.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    if (isEdit) {
      // Add tags to edit form
      const currentTags = editForm.tags || [];
      const updatedTags = [...currentTags];
      
      newTags.forEach(tag => {
        if (!currentTags.includes(tag)) {
          updatedTags.push(tag);
        }
      });
      
      setEditForm(prev => ({
        ...prev,
        tags: updatedTags
      }));
      setEditTagInput('');
    } else {
      // Add tags to new resource
      const currentTags = newResource.tags;
      const updatedTags = [...currentTags];
      
      newTags.forEach(tag => {
        if (!currentTags.includes(tag)) {
          updatedTags.push(tag);
        }
      });
      
      setNewResource(prev => ({
        ...prev,
        tags: updatedTags
      }));
      setTagInput('');
    }
  };

  // Handle key down for tag input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, isEdit: boolean = false) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(isEdit);
    }
  };

  // Remove a tag
  const removeTag = (tagToRemove: string, isEdit: boolean = false) => {
    if (isEdit) {
      setEditForm(prev => ({
        ...prev,
        tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
      }));
    } else {
      setNewResource(prev => ({
        ...prev,
        tags: prev.tags.filter(tag => tag !== tagToRemove)
      }));
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors: {title?: string; file?: string} = {};
    
    if (!newResource.title.trim()) {
      errors.title = 'Le titre est obligatoire';
    }
    
    if (!newResource.file) {
      errors.file = 'Veuillez sélectionner un fichier';
    } else {
      // Validate file type
      const allowedTypes = ['.pdf', '.doc', '.docx'];
      const fileExt = `.${getFileExtension(newResource.file.name)}`;
      if (!allowedTypes.includes(fileExt)) {
        errors.file = 'Format de fichier non supporté. Formats acceptés: PDF, DOC, DOCX';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create a new resource
  const createResource = async () => {
    if (!currentUser) {
      setNotification({
        message: 'Vous devez être connecté pour créer une ressource',
        type: 'error'
      });
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setProcessing(true);
    
    try {
      // Generate clean filename based on title
      const cleanTitle = normalizeFilename(newResource.title);
      
      // Upload file to Cloudinary - first convert to data URL
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(newResource.file!);
      });
      
      // Upload the file with the clean title as filename
      const fileUrl = await uploadToCloudinary(dataUrl, cleanTitle);
      
      // Prepare data for Firestore
      const now = new Date().toISOString();
      const resourceData = {
        title: newResource.title,
        subject: newResource.subject,
        level: newResource.level,
        type: newResource.type,
        difficulty: newResource.difficulty,
        tags: newResource.tags,
        language: newResource.language,
        year: newResource.year,
        file_url: fileUrl,
        created_at: now,
        updated_at: now,
        created_by: currentUser.uid
      };
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'resources'), resourceData);
      
      // Add to local state
      setResources(prev => [{
        id: docRef.id,
        ...resourceData
      } as Resource, ...prev]);
      
      // Reset form and close modal
      setNewResource({
        title: '',
        subject: subjects.length > 0 ? subjects[0].id : 'math',
        level: educationLevels.length > 0 ? educationLevels[0].id : 'college',
        type: 'course',
        difficulty: 3,
        tags: [],
        language: 'fr',
        year: new Date().getFullYear().toString(),
        file: null
      });
      setTagInput('');
      setShowCreateModal(false);
      setValidationErrors({});
      
      // Show success notification
      setNotification({
        message: 'Ressource créée avec succès',
        type: 'success'
      });
      
      // Refresh resource list
      fetchResources();
      
    } catch (error) {
      console.error('Error creating resource:', error);
      setNotification({
        message: error instanceof Error ? `Erreur: ${error.message}` : 'Erreur lors de la création de la ressource',
        type: 'error'
      });
    } finally {
      setProcessing(false);
      setTimeout(() => setNotification(null), 3000);
    }
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
      tags: resource.tags || [],
      language: resource.language,
      year: resource.year
    });
    setEditTagInput('');
    setShowEditModal(true);
  };

  // Handle delete
  const handleDelete = (resource: Resource) => {
    setSelectedResource(resource);
    setShowDeleteModal(true);
  };

  // Handle file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewResource(prev => ({ ...prev, file: e.target.files![0] }));
      setValidationErrors(prev => ({...prev, file: undefined}));
    }
  };

  // Handle download
  const handleDownload = async (resource: Resource) => {
    try {
      // Get the file extension from the URL
      const fileUrl = resource.file_url;
      const urlParts = fileUrl.split('.');
      const fileExtension = urlParts.length > 1 ? `.${urlParts.pop()}` : '';
      
      // Clean the title for the download filename
      const cleanTitle = resource.title.replace(/[^a-zA-Z0-9]/g, '-');
      const downloadFilename = `${cleanTitle}${fileExtension}`;
      
      // Fetch the file
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      
      // Create a download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      
      setNotification({
        message: 'Téléchargement démarré',
        type: 'success'
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error downloading file:', error);
      setNotification({
        message: 'Erreur lors du téléchargement du fichier',
        type: 'error'
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Get difficulty label and color
  const getDifficultyInfo = (difficultyValue: number) => {
    return DIFFICULTY_LEVELS.find(level => level.value === difficultyValue) || 
      { value: difficultyValue, label: `Niveau ${difficultyValue}`, color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
  };

  // Render tags with tooltip
  const renderTags = (tags: string[]) => {
    if (!tags || tags.length === 0) return <span className="text-gray-400 dark:text-gray-500">-</span>;

    const visibleTags = tags.slice(0, 3);
    const hasMore = tags.length > 3;

    return (
      <div className="group relative">
        <div className="flex flex-wrap gap-1 max-w-[200px] overflow-hidden">
          {visibleTags.map((tag, idx) => (
            <span 
              key={idx} 
              className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              {tag}
            </span>
          ))}
          {hasMore && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              +{tags.length - 3}
            </span>
          )}
        </div>
        
        {/* Tooltip */}
        <div className="absolute left-0 mt-2 w-48 p-2 bg-black/80 text-white text-xs rounded shadow-lg z-10 invisible group-hover:visible">
          {tags.join(', ')}
        </div>
      </div>
    );
  };

  // Filter resources based on search term
  const filteredResources = resources.filter(resource => {
    if (!filters.search) return true;
    
    const searchLower = filters.search.toLowerCase();
    return (
      resource.title.toLowerCase().includes(searchLower) ||
      subjects.find(s => s.id === resource.subject)?.label.toLowerCase().includes(searchLower) ||
      RESOURCE_TYPES.find(t => t.id === resource.type)?.label.toLowerCase().includes(searchLower) ||
      (resource.tags && resource.tags.some(tag => tag.toLowerCase().includes(searchLower))) ||
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
          onClick={() => setShowCreateModal(true)}
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
          {subjects.map(subject => (
            <option key={subject.id} value={subject.id}>{subject.label}</option>
          ))}
        </select>
        <select
          value={filters.level}
          onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Tous les niveaux</option>
          {educationLevels.map(level => (
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
                    Difficulté
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Tags
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
                      {subjects.find(s => s.id === resource.subject)?.label || resource.subject}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {educationLevels.find(l => l.id === resource.level)?.label || resource.level}
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyInfo(resource.difficulty).color}`}>
                        {getDifficultyInfo(resource.difficulty).label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {renderTags(resource.tags || [])}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleDownload(resource)}
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

      {/* Create Resource Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full p-6 shadow-xl overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Nouvelle ressource pédagogique
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Titre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newResource.title}
                  onChange={(e) => {
                    setNewResource(prev => ({ ...prev, title: e.target.value }));
                    setValidationErrors(prev => ({...prev, title: undefined}));
                  }}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    validationErrors.title 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  required
                />
                {validationErrors.title && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.title}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Matière <span className="text-red-500">*</span>
                </label>
                <select
                  value={newResource.subject}
                  onChange={(e) => setNewResource(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  {loadingSubjects ? (
                    <option value="">Chargement...</option>
                  ) : (
                    subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>{subject.label}</option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Niveau <span className="text-red-500">*</span>
                </label>
                <select
                  value={newResource.level}
                  onChange={(e) => setNewResource(prev => ({ ...prev, level: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  {loadingLevels ? (
                    <option value="">Chargement...</option>
                  ) : (
                    educationLevels.map(level => (
                      <option key={level.id} value={level.id}>{level.label}</option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={newResource.type}
                  onChange={(e) => setNewResource(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
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
                  value={newResource.year}
                  onChange={(e) => setNewResource(prev => ({ ...prev, year: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulté
                </label>
                <select
                  value={newResource.difficulty}
                  onChange={(e) => setNewResource(prev => ({ ...prev, difficulty: Number(e.target.value) }))}
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
                  value={newResource.language}
                  onChange={(e) => setNewResource(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="fr">Français</option>
                  <option value="en">Anglais</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {newResource.tags.map((tag, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                    >
                      <Tag className="w-3 h-3" />
                      <span className="text-sm">{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-200 ml-1"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => handleTagInput(e)}
                    onKeyDown={(e) => handleKeyDown(e)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ajouter des tags (séparés par des virgules)..."
                  />
                  <button
                    type="button"
                    onClick={() => addTag()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Saisissez un ou plusieurs tags séparés par des virgules ou appuyez sur Entrée après chaque tag.
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fichier <span className="text-red-500">*</span>
                </label>
                <div 
                  className={`p-4 border-2 border-dashed rounded-lg ${
                    validationErrors.file 
                      ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                      : 'border-gray-300 dark:border-gray-600'
                  } mb-2`}
                >
                  <div className="text-center">
                    {newResource.file ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="w-8 h-8 text-blue-500" />
                        <span className="text-gray-700 dark:text-gray-300">{newResource.file.name}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          Cliquez pour sélectionner un fichier ou glissez-déposez
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Formats acceptés: PDF, DOC, DOCX. Taille max: 10MB.
                        </p>
                      </>
                    )}
                    <input
                      type="file"
                      id="file-input"
                      ref={fileInputRef}
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-3 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Upload className="-ml-1 mr-2 h-5 w-5" />
                      {newResource.file ? 'Changer de fichier' : 'Sélectionner un fichier'}
                    </button>
                  </div>
                </div>
                {validationErrors.file && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.file}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={processing}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={createResource}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {processing ? 'Création en cours...' : 'Créer la ressource'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  {subjects.map(subject => (
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
                  {educationLevels.map(level => (
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
                  Tags
                </label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {editForm.tags?.map((tag, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                    >
                      <Tag className="w-3 h-3" />
                      <span className="text-sm">{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag, true)}
                        className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-200 ml-1"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editTagInput}
                    onChange={(e) => handleTagInput(e, true)}
                    onKeyDown={(e) => handleKeyDown(e, true)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ajouter des tags (séparés par des virgules)..."
                  />
                  <button
                    type="button"
                    onClick={() => addTag(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Saisissez un ou plusieurs tags séparés par des virgules ou appuyez sur Entrée après chaque tag.
                </p>
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