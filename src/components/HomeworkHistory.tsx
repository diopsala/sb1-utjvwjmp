import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, generateCorrection } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Download, Share2, Sparkles, Trash2, ZoomIn, Mail, FileDown, AlertTriangle, ChevronDown, ChevronUp, Facebook, Twitter, Linkedin, Link2, Pin, Star, Filter, Search as SearchIcon } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { deleteFromCloudinary } from '../lib/cloudinary';

interface Homework {
  id: string;
  analysis: string;
  title: string;
  subject: string;
  tags: string[];
  image_url: string;
  created_at: string;
  user_id: string;
  correction?: string;
  is_pinned?: boolean;
  is_favorite?: boolean;
}

interface FilterState {
  subject: string;
  timeframe: 'all' | 'today' | 'week' | 'month';
  search: string;
  tags: string[];
}

const SUBJECTS = [
  { id: 'math', name: 'Mathématiques', color: 'bg-blue-500' },
  { id: 'physics', name: 'Physique-Chimie', color: 'bg-purple-500' },
  { id: 'biology', name: 'SVT', color: 'bg-green-500' },
  { id: 'french', name: 'Français', color: 'bg-red-500' },
  { id: 'history', name: 'Histoire-Géo', color: 'bg-yellow-500' },
  { id: 'english', name: 'Anglais', color: 'bg-pink-500' },
];

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  homework: Homework;
  onShare: (platform: string) => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, homework, onShare }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Partager le devoir
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onShare('whatsapp')}
            className="flex items-center justify-center gap-2 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </button>
          <button
            onClick={() => onShare('facebook')}
            className="flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Facebook className="w-5 h-5" />
            Facebook
          </button>
          <button
            onClick={() => onShare('twitter')}
            className="flex items-center justify-center gap-2 p-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
          >
            <Twitter className="w-5 h-5" />
            Twitter
          </button>
          <button
            onClick={() => onShare('linkedin')}
            className="flex items-center justify-center gap-2 p-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
          >
            <Linkedin className="w-5 h-5" />
            LinkedIn
          </button>
          <button
            onClick={() => onShare('copy')}
            className="flex items-center justify-center gap-2 p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors col-span-2"
          >
            <Link2 className="w-5 h-5" />
            Copier le lien
          </button>
        </div>
      </div>
    </div>
  );
};

const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
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
          Êtes-vous sûr de vouloir supprimer ce devoir ? Cette action supprimera définitivement le devoir et son image associée.
        </p>
        
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

const CorrectionAccordion: React.FC<{
  homework: Homework;
  onShare: () => void;
  onGeneratePDF: () => void;
}> = ({ homework, onShare, onGeneratePDF }) => {
  const [isOpen, setIsOpen] = useState(false);

  const sections = homework.correction?.split(/(?=👋|📝|✨|🔍|💡|🎯)/).filter(Boolean) || [];

  return (
    <div className="mt-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left transition-colors hover:bg-purple-100/50 dark:hover:bg-purple-800/30"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
            Correction détaillée
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare();
              }}
              className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-800/50 rounded-lg transition-colors"
              title="Partager par email"
            >
              <Mail className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onGeneratePDF();
              }}
              className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-800/50 rounded-lg transition-colors"
              title="Télécharger en PDF"
            >
              <FileDown className="w-5 h-5" />
            </button>
          </div>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          )}
        </div>
      </button>
      
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pb-6">
          <div className="prose prose-purple dark:prose-invert max-w-none">
            {sections.map((section, index) => {
              const [emoji] = section.match(/^[^\s]+/) || [];
              const content = section.replace(/^[^\s]+\s*/, '');
              
              return (
                <div
                  key={index}
                  className="mb-6 last:mb-0 p-4 rounded-lg bg-white/50 dark:bg-gray-800/30"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{emoji}</span>
                    <div className="flex-1">
                      <div className="whitespace-pre-wrap text-purple-900 dark:text-purple-100">
                        {content}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function HomeworkHistory() {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    subject: '',
    timeframe: 'all',
    search: '',
    tags: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<{ message: string; type: 'success' | 'error' | '' }>({ message: '', type: '' });
  const [processingCorrection, setProcessingCorrection] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [homeworkToDelete, setHomeworkToDelete] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const { currentUser } = useAuth();

  // Move fetchHomeworks outside useEffect so it's accessible throughout the component
  const fetchHomeworks = async () => {
    if (!currentUser) return;
    
    let baseQuery = query(
      collection(db, 'homework'),
      where('user_id', '==', currentUser.uid)
    );

    // Apply subject filter
    if (filters.subject) {
      baseQuery = query(baseQuery, where('subject', '==', filters.subject));
    }

    // Apply timeframe filter
    if (filters.timeframe !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (filters.timeframe) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      baseQuery = query(baseQuery, where('created_at', '>=', startDate.toISOString()));
    }

    // Always sort by created_at desc
    baseQuery = query(baseQuery, orderBy('created_at', 'desc'));

    try {
      const querySnapshot = await getDocs(baseQuery);
      console.log('Snapshot size:', querySnapshot.size); // Debug log
      const homeworkData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Homework[];
      console.log('Fetched homework:', homeworkData); // Debug log

      // Apply search filter client-side
      let filteredData = homeworkData;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = homeworkData.filter(hw =>
          hw.title?.toLowerCase().includes(searchLower) ||
          hw.subject?.toLowerCase().includes(searchLower) ||
          hw.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      setHomeworks(filteredData);
    } catch (error) {
      console.error('Error fetching homeworks:', error);
      setShareStatus({ 
        message: 'Erreur lors de la récupération des devoirs', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeworks();
  }, [currentUser, filters]);

  const togglePin = async (homework: Homework) => {
    try {
      const newPinnedState = !homework.is_pinned;
      const homeworkRef = doc(db, 'homework', homework.id);
      
      await updateDoc(homeworkRef, {
        is_pinned: newPinnedState
      });
      
      setHomeworks(prev => prev.map(hw =>
        hw.id === homework.id ? { ...hw, is_pinned: newPinnedState } : hw
      ));
      
      setShareStatus({ 
        message: newPinnedState ? 'Devoir épinglé' : 'Devoir désépinglé', 
        type: 'success' 
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
      setShareStatus({ message: 'Erreur lors de l\'épinglage', type: 'error' });
    }
  };

  const toggleFavorite = async (homework: Homework) => {
    try {
      const newFavoriteState = !homework.is_favorite;
      const homeworkRef = doc(db, 'homework', homework.id);
      
      await updateDoc(homeworkRef, {
        is_favorite: newFavoriteState
      });
      
      setHomeworks(prev => prev.map(hw =>
        hw.id === homework.id ? { ...hw, is_favorite: newFavoriteState } : hw
      ));
      
      setShareStatus({ 
        message: newFavoriteState ? 'Ajouté aux favoris' : 'Retiré des favoris', 
        type: 'success' 
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setShareStatus({ message: 'Erreur lors de la mise à jour des favoris', type: 'error' });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  const optimizeCloudinaryUrl = (url: string, width: number = 800) => {
    if (!url.includes('res.cloudinary.com')) return url;

    const parts = url.split('upload/');
    if (parts.length !== 2) return url;

    return `${parts[0]}upload/w_${width},q_auto,f_auto/${parts[1]}`;
  };

  const downloadImage = async (imageUrl: string, created_at: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `devoir_${new Date(created_at).toISOString().split('T')[0]}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      setShareStatus({ message: 'Erreur lors du téléchargement', type: 'error' });
      setTimeout(() => setShareStatus({ message: '', type: '' }), 3000);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShareStatus({ message: 'Copié dans le presse-papiers !', type: 'success' });
      setTimeout(() => setShareStatus({ message: '', type: '' }), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setShareStatus({ message: 'Erreur lors de la copie', type: 'error' });
      setTimeout(() => setShareStatus({ message: '', type: '' }), 3000);
    }
  };

  const deleteHomework = async (homeworkId: string) => {
    if (!currentUser) return;

    setHomeworkToDelete(homeworkId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!homeworkToDelete || !currentUser) return;

    try {
      // Get the homework data before deleting
      const homework = homeworks.find(hw => hw.id === homeworkToDelete);
      if (!homework) {
        throw new Error('Devoir non trouvé');
      }

      // Delete from Cloudinary first
      await deleteFromCloudinary(homework.image_url);

      // Then delete from Firestore
      await deleteDoc(doc(db, 'homework', homeworkToDelete));
      
      // Update local state
      setHomeworks(prevHomeworks => prevHomeworks.filter(hw => hw.id !== homeworkToDelete));
      setShareStatus({ message: 'Devoir supprimé avec succès', type: 'success' });
    } catch (error) {
      console.error('Error deleting homework:', error);
      setShareStatus({ 
        message: error instanceof Error ? error.message : 'Erreur lors de la suppression', 
        type: 'error' 
      });
    } finally {
      setDeleteModalOpen(false);
      setHomeworkToDelete(null);
      setTimeout(() => setShareStatus({ message: '', type: '' }), 3000);
    }
  };

  const handleShare = (platform: string) => {
    if (!selectedHomework) return;

    const shareUrl = window.location.href;
    const shareText = `Devoir du ${formatDate(selectedHomework.created_at)}\n\n${selectedHomework.analysis}`;
    
    let url = '';
    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'copy':
        copyToClipboard(`${shareText}\n\n${shareUrl}`);
        setShareModalOpen(false);
        return;
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
      setShareModalOpen(false);
    }
  };

  const shareHomework = async (homework: Homework) => {
    setSelectedHomework(homework);
    setShareModalOpen(true);
  };

  const generateCorrection = async (homework: Homework) => {
    if (processingCorrection) return;
    
    setProcessingCorrection(homework.id);
    try {
      // Utiliser la fonction Cloud pour générer la correction
      const result = await generateCorrection(homework.id);
      
      if (!result.success) {
        throw new Error(result.error || "Erreur lors de la génération de la correction");
      }
      
      const correction = result.correction;

      setHomeworks(prevHomeworks =>
        prevHomeworks.map(hw =>
          hw.id === homework.id ? { ...hw, correction } : hw
        )
      );

      setShareStatus({ message: 'Correction générée avec succès !', type: 'success' });
    } catch (error) {
      console.error('Error generating correction:', error);
      setShareStatus({ 
        message: error instanceof Error ? error.message : 'Erreur lors de la génération de la correction', 
        type: 'error' 
      });
    } finally {
      setProcessingCorrection(null);
      setTimeout(() => setShareStatus({ message: '', type: '' }), 3000);
    }
  };

  const generatePDF = async (homework: Homework) => {
    try {
      const element = document.getElementById(`correction-${homework.id}`);
      if (!element) return;

      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      pdf.setFontSize(16);
      pdf.text(`Correction du devoir du ${formatDate(homework.created_at)}`, pdfWidth / 2, 20, { align: 'center' });
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      pdf.save(`correction_${new Date(homework.created_at).toISOString().split('T')[0]}.pdf`);
      
      setShareStatus({ message: 'PDF généré avec succès !', type: 'success' });
      setTimeout(() => setShareStatus({ message: '', type: '' }), 3000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setShareStatus({ message: 'Erreur lors de la génération du PDF', type: 'error' });
      setTimeout(() => setShareStatus({ message: '', type: '' }), 3000);
    }
  };

  const shareByEmail = (homework: Homework) => {
    const subject = encodeURIComponent(`Correction du devoir du ${formatDate(homework.created_at)}`);
    const body = encodeURIComponent(homework.correction || '');
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const ImageViewer = ({ url, onClose }: { url: string; onClose: () => void }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <img
          src={optimizeCloudinaryUrl(url, 1200)}
          alt="Devoir en plein écran"
          className="max-w-[90vw] max-h-[90vh] object-contain"
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Mes devoirs</h1>
          <p className="text-gray-600 dark:text-gray-400">Retrouvez tous vos devoirs scannés et leurs explications</p>
        </div>

        <div className="mb-8">
          <button
            onClick={() =>setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <Filter className="w-5 h-5" />
            <span className="font-medium">Filtrer</span>
          </button>
          
          {showFilters && (
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Matière
                  </label>
                  <select
                    value={filters.subject}
                    onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  >
                    <option value="">Toutes les matières</option>
                    {SUBJECTS.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Période
                  </label>
                  <select
                    value={filters.timeframe}
                    onChange={(e) => setFilters(prev => ({ ...prev, timeframe: e.target.value as 'all' | 'today' | 'week' | 'month' }))}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  >
                    <option value="all">Tout</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="week">Cette semaine</option>
                    <option value="month">Ce mois</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rechercher
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      placeholder="Rechercher par titre, matière ou tag..."
                      className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div className="md:col-span-2 flex justify-end mt-4">
                  <button
                    onClick={() => {
                      fetchHomeworks();
                      setShowFilters(false);
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2"
                  >
                    Appliquer les filtres
                  </button>
                </div>
                
              </div>
            </div>
          )}
        </div>

        {/* Status message */}
        {shareStatus.message && (
          <div
            className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg text-white ${
              shareStatus.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {shareStatus.message}
          </div>
        )}

        {/* Homework list */}
        <div className="space-y-8">
          {homeworks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                Aucun devoir trouvé
              </p>
            </div>
          ) : (
            homeworks.map((homework) => (
              <div
                key={homework.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {homework.title || formatDate(homework.created_at)}
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{formatDate(homework.created_at)}</span>
                        {homework.subject && (
                          <>
                            <span>•</span>
                            <span className={`px-2 py-1 rounded-full text-white ${
                              SUBJECTS.find(s => s.id === homework.subject)?.color || 'bg-gray-500'
                            }`}>
                              {SUBJECTS.find(s => s.id === homework.subject)?.name || homework.subject}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => togglePin(homework)}
                        className={`p-2 rounded-lg transition-colors ${
                          homework.is_pinned === true
                            ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                            : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        title={homework.is_pinned ? 'Désépingler' : 'Épingler'}
                      >
                        <Pin className={`w-5 h-5 ${homework.is_pinned === true ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => toggleFavorite(homework)}
                        className={`p-2 rounded-lg transition-colors ${
                          homework.is_favorite === true
                            ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                            : 'text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        title={homework.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      >
                        <Star className={`w-5 h-5 ${homework.is_favorite === true ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Image */}
                  <div className="relative mb-6">
                    <img
                      src={optimizeCloudinaryUrl(homework.image_url)}
                      alt="Devoir"
                      className="w-full h-auto rounded-lg shadow-md cursor-pointer"
                      onClick={() => setSelectedImage(homework.image_url)}
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-2">
                      <button
                        onClick={() => downloadImage(homework.image_url, homework.created_at)}
                        className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                        title="Télécharger l'image"
                      >
                        <Download className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      </button>
                      <button
                        onClick={() => setSelectedImage(homework.image_url)}
                        className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                        title="Voir en plein écran"
                      >
                        <ZoomIn className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      </button>
                    </div>
                  </div>

                  {/* Tags */}
                  {homework.tags && homework.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {homework.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Analysis */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Analyse
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                      {homework.analysis}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => shareHomework(homework)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        <Share2 className="w-5 h-5" />
                        Partager
                      </button>
                      <button
                        onClick={() => deleteHomework(homework.id)}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                        Supprimer
                      </button>
                    </div>
                    {!homework.correction && (
                      <button
                        onClick={() => generateCorrection(homework)}
                        disabled={processingCorrection === homework.id}
                        className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg transition-all ${
                          processingCorrection === homework.id
                            ? 'opacity-75 cursor-not-allowed'
                            : 'hover:from-purple-600 hover:to-pink-600'
                        }`}
                      >
                        <Sparkles className="w-5 h-5" />
                        {processingCorrection === homework.id ? 'Génération...' : 'Générer une correction'}
                      </button>
                    )}
                  </div>

                  {/* Correction */}
                  {homework.correction && (
                    <div id={`correction-${homework.id}`}>
                      <CorrectionAccordion
                        homework={homework}
                        onShare={() => shareByEmail(homework)}
                        onGeneratePDF={() => generatePDF(homework)}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Image viewer modal */}
        {selectedImage && (
          <ImageViewer
            url={selectedImage}
            onClose={() => setSelectedImage(null)}
          />
        )}

        {/* Delete confirmation modal */}
        <DeleteModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
        />

        {/* Share modal */}
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          homework={selectedHomework!}
          onShare={handleShare}
        />
      </div>
    </div>
  );
}