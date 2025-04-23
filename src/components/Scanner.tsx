import React, { useState, useCallback } from 'react';
import { Camera as CameraIcon, Upload, ArrowLeft, HelpCircle, AlertCircle } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { db, auth, analyzeImageWithAI } from '../lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { uploadToCloudinary } from '../lib/cloudinary';

interface ScannerProps {
  onBack: () => void;
}

export default function Scanner({ onBack }: ScannerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const { currentUser } = useAuth();

  const detectSubject = (analysis: string): string => {
    const subjectMapping: { [key: string]: string[] } = {
      'math': ['mathématiques', 'maths', 'algèbre', 'géométrie', 'calcul', 'équation', 'fonction', 'théorème', 'probabilité', 'statistique'],
      'physics': ['physique', 'mécanique', 'électricité', 'optique', 'force', 'énergie', 'chaleur', 'mouvement', 'vitesse', 'accélération'],
      'biology': ['biologie', 'svt', 'sciences de la vie', 'cellule', 'écosystème', 'génétique', 'évolution', 'corps humain'],
      'french': ['français', 'littérature française', 'grammaire française', 'conjugaison française', 'dissertation française', 'texte en français', 'rédaction en français', 'analyse littéraire'],
      'history': ['histoire', 'géographie', 'histoire-géo', 'civilisation', 'période', 'chronologie', 'événement historique'],
      'english': ['anglais', 'english', 'vocabulary', 'grammar', 'reading comprehension', 'essay writing', 'present simple', 'past tense', 'future tense', 'write in english', 'answer in english', 'text in english']
    };

    const analysisLower = analysis.toLowerCase();
    
    // Check for language-specific patterns
    const languagePatterns = {
      english: [
        'in english',
        'write in english',
        'write your answer in english',
        'english essay',
        'english text',
        'english exercise',
        'english grammar',
        'english vocabulary',
        'answer in english',
        'translate to english',
        'present perfect',
        'past simple',
        'future tense',
        'modal verbs',
        'irregular verbs',
        'phrasal verbs',
        'reading comprehension',
        'listening comprehension',
        'fill in the blanks with',
        'choose the correct form',
        'rewrite the sentences'
      ],
      french: [
        'écrivez en français',
        'rédigez en français',
        'texte en français',
        'exercice de français',
        'grammaire française',
        'vocabulaire français',
        'répondez en français',
        'traduisez en français',
        'subjonctif',
        'imparfait',
        'passé composé',
        'futur simple',
        'conditionnel',
        'participe présent',
        'participe passé',
        'complétez les phrases',
        'conjuguez les verbes',
        'rédaction française'
      ]
    }
    
    // First, check for explicit language markers
    if (languagePatterns.english.some(pattern => analysisLower.includes(pattern))) {
      return 'english';
    }
    
    if (languagePatterns.french.some(pattern => analysisLower.includes(pattern))) {
      return 'french';
    }
    
    // Check for explicit subject mention in the first paragraph (where GPT-4 states the subject)
    const firstParagraph = analysisLower.split('\n\n')[0];
    for (const [subject, keywords] of Object.entries(subjectMapping)) {
      if (keywords.some(keyword => firstParagraph.includes(keyword))) {
        return subject;
      }
    }
    
    // Fallback: Check entire text
    for (const [subject, keywords] of Object.entries(subjectMapping)) {
      const keywordCount = keywords.reduce((count, keyword) => 
        count + (analysisLower.split(keyword).length - 1), 0);
      if (keywordCount > 0) {
        return subject;
      }
    }

    return 'other';
  };

  const analyzeWithGPT4Vision = async (imageUrl: string): Promise<string> => {
    try {
      setProgress('Préparation de l\'analyse...');
      
      // Utiliser la fonction Cloud pour l'analyse
      const result = await analyzeImageWithAI(imageUrl);
      
      if (!result.success) {
        throw new Error(result.error || "Erreur lors de l'analyse");
      }
      
      return result.result.analysis;
    } catch (error) {
      console.error('Error in analyzeWithGPT4Vision:', error);
      throw error instanceof Error ? error : new Error('Erreur lors de l\'analyse');
    }
  };

  const processImage = async (imageData: string) => {
    if (!currentUser) {
      setProgress('Erreur: Utilisateur non connecté');
      return;
    }

    setProgress('Upload de l\'image vers Cloudinary...');
    
    try {
      const docRef = doc(collection(db, 'homework'));
      const docId = docRef.id;
      const cloudinaryUrl = await uploadToCloudinary(imageData, docId);
      
      setProgress('Analyse de l\'image avec GPT-4 Vision...');
      const analysis = await analyzeWithGPT4Vision(cloudinaryUrl);

      const detectedSubject = detectSubject(analysis);

      setProgress('Enregistrement dans Firebase...');
      await setDoc(docRef, {
        analysis,
        image_url: cloudinaryUrl,
        subject: detectedSubject,
        created_at: new Date().toISOString(),
        user_id: currentUser.uid
      });

      setProgress('Terminé!');
      setTimeout(() => {
        setProgress('');
        onBack();
      }, 2000);
    } catch (error: any) {
      console.error('Error processing image:', error);
      setProgress(error.message || 'Une erreur est survenue');
      setTimeout(() => setProgress(''), 3000);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    setIsLoading(true);
    try {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = async () => {
          const imageData = reader.result as string;
          setPhoto(imageData);
          await processImage(imageData);
        };
        reader.readAsDataURL(file);
      } else {
        throw new Error('Format de fichier non supporté');
      }
    } catch (error: any) {
      console.error('Error processing file:', error);
      setProgress(error.message || 'Format de fichier non supporté');
      setTimeout(() => setProgress(''), 3000);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = async () => {
          const imageData = reader.result as string;
          setPhoto(imageData);
          await processImage(imageData);
        };
        reader.readAsDataURL(file);
      } else {
        throw new Error('Format de fichier non supporté');
      }
    } catch (error: any) {
      console.error('Error processing file:', error);
      setProgress(error.message || 'Format de fichier non supporté');
      setTimeout(() => setProgress(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const takePicture = async () => {
    try {
      setIsLoading(true);
      const image = await Camera.getPhoto({
        quality: 50,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });
      
      if (image.dataUrl) {
        setPhoto(image.dataUrl);
        await processImage(image.dataUrl);
      }
    } catch (error: any) {
      if (error.message !== 'User cancelled photos app') {
        console.error('Error taking picture:', error);
        setProgress(error.message || 'Une erreur est survenue lors de la prise de photo');
        setTimeout(() => setProgress(''), 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-sm z-50">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Scanner un devoir
            </h1>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 pt-24 pb-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
            Scannez vos exercices pour obtenir des explications détaillées
          </p>

          {progress && (
            <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-center text-blue-600 dark:text-blue-400">
                {progress}
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Import File Option */}
            <div className="relative">
              <div 
                className={`h-full p-8 rounded-2xl border ${
                  isDragging 
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-dashed border-gray-300 dark:border-gray-600'
                } transition-all duration-300 cursor-pointer`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  <div className="mb-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-blue-100/50 dark:bg-blue-900/30 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                    Importer un fichier
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Glissez-déposez votre fichier ou cliquez pour parcourir
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Formats acceptés : PNG, JPG (max 10MB)
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="file-upload"
                    className="absolute inset-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Camera Option */}
            <div className="relative">
              <div 
                onClick={takePicture}
                className={`h-full p-8 rounded-2xl border border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="text-center">
                  <div className="mb-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-purple-100/50 dark:bg-purple-900/30 flex items-center justify-center">
                      <CameraIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                    Utiliser la caméra
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Prenez une photo directement avec votre appareil
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tips Section */}
          <div className="mt-8 p-6 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  Conseils pour un bon scan
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Assurez-vous que le document est bien éclairé
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Évitez les ombres et les reflets
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Placez le document sur une surface plane
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Cadrez bien tous les exercices dans l'image
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}