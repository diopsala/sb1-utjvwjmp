import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArrowLeft, Camera, Bell, Moon, Sun, Shield, LogOut } from 'lucide-react';
import { uploadToCloudinary } from '../lib/cloudinary';

interface UserProfile {
  fullName: string;
  email: string;
  photoURL: string;
  educationLevel: string;
  school: string;
  biography: string;
  notifications: {
    homework: boolean;
    corrections: boolean;
    reminders: boolean;
    news: boolean;
  };
  darkMode: boolean;
}

interface SettingsProps {
  onBack: () => void;
  isDarkMode: boolean;
  onDarkModeChange: (isDark: boolean) => void;
}

export default function Settings({ onBack, isDarkMode, onDarkModeChange }: SettingsProps) {
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    fullName: '',
    email: currentUser?.email || '',
    photoURL: currentUser?.photoURL || '',
    educationLevel: '',
    school: '',
    biography: '',
    notifications: {
      homework: true,
      corrections: true,
      reminders: true,
      news: false
    },
    darkMode: isDarkMode
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser?.uid) {
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          console.log('Profile data found:', docSnap.data());
          setProfile(prev => ({
            ...prev,
            ...docSnap.data() as Partial<UserProfile>
          }));
        } else {
          // Create default profile if it doesn't exist
          const defaultProfile = {
            fullName: '',
            email: currentUser.email || '',
            photoURL: currentUser.photoURL || '',
            educationLevel: '',
            school: '',
            biography: '',
            notifications: {
              homework: true,
              corrections: true,
              reminders: true,
              news: false
            },
            darkMode: isDarkMode
          };
          
          try {
            await setDoc(docRef, defaultProfile);
            setProfile(defaultProfile);
            console.log('Created default profile');
          } catch (error) {
            console.error('Error creating default profile:', error);
            throw new Error('Failed to create default profile');
          }
        }
      } catch (error) {
        console.error('Error in fetchProfile:', error);
        setMessage({
          text: `Erreur lors du chargement du profil: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) {
      setMessage({ 
        text: 'Aucun fichier sélectionné ou utilisateur non connecté', 
        type: 'error' 
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ 
        text: 'Format de fichier non supporté. Veuillez sélectionner une image.', 
        type: 'error' 
      });
      return;
    }

    try {
      setSaving(true);
      
      // Create a new FileReader
      const reader = new FileReader();
      
      // Create a promise to handle the FileReader
      const readFileAsDataURL = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      
      // Get the data URL from the file
      const dataUrl = await readFileAsDataURL;
      
      // Upload the data URL to Cloudinary
      const imageUrl = await uploadToCloudinary(dataUrl);
      
      await updateDoc(doc(db, 'users', currentUser.uid), {
        photoURL: imageUrl
      });

      setProfile(prev => ({ ...prev, photoURL: imageUrl }));
      setMessage({ text: 'Photo de profil mise à jour', type: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('Error updating photo:', errorMessage);
      setMessage({ 
        text: `Erreur lors de la mise à jour de la photo: ${errorMessage}`, 
        type: 'error' 
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      setSaving(true);
      await updateDoc(doc(db, 'users', currentUser.uid), profile);
      setMessage({ text: 'Profil mis à jour avec succès', type: 'success' });
      // Wait a short moment to show the success message before redirecting
      setTimeout(() => {
        onBack(); // Redirect to home page
      }, 1500);
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ text: 'Erreur lors de la sauvegarde', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onBack();
    } catch (error) {
      console.error('Error logging out:', error);
      setMessage({ text: 'Erreur lors de la déconnexion', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-8">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-sm z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </button>
              <h1 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Paramètres
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 pt-24 pb-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Section */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Profil
            </h2>
            
            {/* Profile Photo */}
            <div className="flex items-center gap-6 mb-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden">
                  {profile.photoURL ? (
                    <img
                      src={profile.photoURL}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-medium text-white">
                      {profile.fullName?.charAt(0) || profile.email?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <label
                  htmlFor="photo-upload"
                  className="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-700 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <Camera className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  <input
                    type="file"
                    id="photo-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                </label>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Photo de profil
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  JPG ou PNG. 1MB max.
                </p>
              </div>
            </div>

            {/* Profile Form */}
            <div className="grid gap-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Niveau d'études
                  </label>
                  <select
                    value={profile.educationLevel}
                    onChange={(e) => setProfile(prev => ({ ...prev, educationLevel: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Sélectionner un niveau</option>
                    <option value="college">Collège</option>
                    <option value="seconde">Seconde</option>
                    <option value="premiere">Première</option>
                    <option value="terminale">Terminale</option>
                    <option value="superieur">Études supérieures</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Établissement (optionnel)
                  </label>
                  <input
                    type="text"
                    value={profile.school}
                    onChange={(e) => setProfile(prev => ({ ...prev, school: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Nom de votre établissement"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Biographie
                </label>
                <textarea
                  value={profile.biography}
                  onChange={(e) => setProfile(prev => ({ ...prev, biography: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white h-32 resize-none"
                  placeholder="Parlez-nous un peu de vous..."
                />
              </div>
            </div>
          </section>

          {/* Notifications Section */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Notifications
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Nouveaux devoirs
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Notifications pour les devoirs scannés
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.notifications.homework}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        homework: e.target.checked
                      }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Corrections
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Notifications pour les corrections générées
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.notifications.corrections}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        corrections: e.target.checked
                      }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Rappels
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Rappels pour les révisions
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.notifications.reminders}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        reminders: e.target.checked
                      }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Actualités
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nouvelles fonctionnalités et mises à jour
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.notifications.news}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        news: e.target.checked
                      }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Appearance Section */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              {isDarkMode ? (
                <Moon className="w-6 h-6 text-blue-500" />
              ) : (
                <Sun className="w-6 h-6 text-blue-500" />
              )}
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Apparence
              </h2>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Mode sombre
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Activer le thème sombre
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDarkMode}
                  onChange={(e) => {
                    setProfile(prev => ({ ...prev, darkMode: e.target.checked }));
                    onDarkModeChange(e.target.checked);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </div>
      </main>

      {/* Status Message */}
      {message && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg text-white ${
            message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}