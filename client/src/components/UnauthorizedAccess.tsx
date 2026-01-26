import React from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';

export function UnauthorizedAccess() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handleGoToDashboard = () => {
    const defaultRoute = user?.type === 'vendor' ? '/vendor' : '/customer/shop';
    setLocation(defaultRoute);
  };

  const handleLogout = () => {
    setLocation('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-2xl">block</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          {t('errors.unauthorized', { defaultValue: 'Access Denied' })}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('errors.unauthorizedMessage', { 
            defaultValue: 'You do not have permission to access this page' 
          })}
        </p>
        {user && (
          <p className="mt-1 text-center text-xs text-gray-500">
            {t('auth.currentUserType', { defaultValue: 'Current user type' })}: {' '}
            <span className="font-medium capitalize">{user.type}</span>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          <div className="space-y-4">
            <button
              onClick={handleGoToDashboard}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('navigation.goToDashboard', { defaultValue: 'Go to Dashboard' })}
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('auth.switchAccount', { defaultValue: 'Switch Account' })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}