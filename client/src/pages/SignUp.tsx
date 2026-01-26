import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { LanguageSelector } from '../components/LanguageSelector';
import { LocationPicker } from '../components/LocationPicker';

export function SignUp() {
  const [, setLocation] = useLocation();
  const { t, language } = useTranslation();
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    language: language || 'hi', // Initialize with current language
    location: '',
    userType: 'customer' as 'customer' | 'vendor'
  });
  const [error, setError] = useState('');

  // Sync form language with selected language
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      language: language || 'hi'
    }));
  }, [language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.errors.passwordMismatch'));
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        language: formData.language,
        location: formData.location,
        userType: formData.userType,
      });

      // Redirect based on user type
      if (formData.userType === 'vendor') {
        setLocation('/vendor');
      } else {
        setLocation('/customer/shop');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Language Selector - Top Right */}
      <div className="absolute top-4 right-4">
        <LanguageSelector variant="compact" />
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-2xl">storefront</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          {t('auth.register.title')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('auth.register.subtitle')}
        </p>
        <p className="mt-1 text-center text-xs text-blue-600">
          {t('auth.languageNote', { defaultValue: 'Change language using the selector above' })}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* User Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.register.userType')}
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="userType"
                    value="customer"
                    checked={formData.userType === 'customer'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm">{t('auth.login.customer')}</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="userType"
                    value="vendor"
                    checked={formData.userType === 'vendor'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm">{t('auth.login.vendor')}</span>
                </label>
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {t('auth.register.name')}
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Location with GPS */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                {t('auth.register.location')}
              </label>
              <div className="mt-1">
                <LocationPicker
                  value={formData.location}
                  onChange={(location) => setFormData(prev => ({ ...prev, location }))}
                  placeholder="Enter your location"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Language - Auto-synced with selector */}
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                {t('auth.register.language')}
                <span className="text-xs text-blue-600 ml-2">({t('common.canBeChanged')})</span>
              </label>
              <div className="mt-1">
                <select
                  id="language"
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  disabled
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {t('auth.register.languageNote', { defaultValue: 'Language is automatically set from the selector above' })}
                </p>
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('auth.register.password')}
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {t('auth.register.confirmPassword')}
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('common.loading')}
                  </span>
                ) : (
                  t('auth.register.registerButton')
                )}
              </button>
            </div>

            {/* Sign In Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setLocation('/login')}
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                {t('auth.register.hasAccount')} {t('auth.register.signIn')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}