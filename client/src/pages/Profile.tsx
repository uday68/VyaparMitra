import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { LocationPicker } from '../components/LocationPicker';

export function Profile() {
  const { user, logout, updateProfile, isLoading } = useAuth();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    location: user?.location || '',
    language: user?.language || 'hi',
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(formData);
      setSuccess(t('success.updated'));
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Update failed');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const languages = [
    { code: 'hi', name: 'हिंदी (Hindi)' },
    { code: 'en', name: 'English' },
    { code: 'bn', name: 'বাংলা (Bengali)' },
    { code: 'te', name: 'తెలుగు (Telugu)' },
    { code: 'mr', name: 'मराठी (Marathi)' },
    { code: 'ta', name: 'தமிழ் (Tamil)' },
    { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
    { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
    { code: 'ml', name: 'മലയാളം (Malayalam)' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
    { code: 'or', name: 'ଓଡ଼ିଆ (Odia)' },
    { code: 'as', name: 'অসমীয়া (Assamese)' },
  ];

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={t('profile.title')} showBack />
      
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <div className="p-6">
          {/* Profile Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-white text-3xl">
                {user.type === 'vendor' ? 'storefront' : 'person'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-600 capitalize">{user.type}</p>
            {user.type === 'vendor' && user.qrCode && (
              <p className="text-sm text-gray-500 mt-1">QR: {user.qrCode}</p>
            )}
          </div>

          {/* Success/Error Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          {/* Profile Information */}
          <div className="space-y-6">
            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.name')}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.location')}
                  </label>
                  <LocationPicker
                    value={formData.location}
                    onChange={(location) => setFormData(prev => ({ ...prev, location }))}
                    disabled={updateLoading}
                  />
                </div>

                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.language')}
                  </label>
                  <select
                    id="language"
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={updateLoading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {updateLoading ? t('common.loading') : t('common.save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user.name,
                        location: user.location,
                        language: user.language,
                      });
                      setError('');
                      setSuccess('');
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">{t('profile.personalInfo')}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('profile.name')}:</span>
                      <span className="font-medium">{user.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('profile.location')}:</span>
                      <span className="font-medium">{user.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('profile.language')}:</span>
                      <span className="font-medium">
                        {languages.find(lang => lang.code === user.language)?.name || user.language}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('profile.accountType')}:</span>
                      <span className="font-medium capitalize">{user.type}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {t('profile.editProfile')}
                </button>
              </div>
            )}

            {/* Action Buttons */}
            {!isEditing && (
              <div className="space-y-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setLocation('/voice-settings')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <span className="material-symbols-outlined text-gray-600 mr-3">mic</span>
                    <span className="text-gray-900">{t('voice.settings.title')}</span>
                  </div>
                  <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                </button>

                <button
                  onClick={() => setLocation('/order-history')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <span className="material-symbols-outlined text-gray-600 mr-3">history</span>
                    <span className="text-gray-900">{t('orders.title')}</span>
                  </div>
                  <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center p-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <span className="material-symbols-outlined mr-2">logout</span>
                  <span>{t('common.logout')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav currentPage="account" />
    </div>
  );
}