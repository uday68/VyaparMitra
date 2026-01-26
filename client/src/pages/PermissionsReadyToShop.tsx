import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function PermissionsReadyToShop() {
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState({
    microphone: true,
    location: false
  });
  const [isVoiceListening, setIsVoiceListening] = useState(false);

  const handlePermissionToggle = (permission: 'microphone' | 'location') => {
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  const handleMicrophonePermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissions(prev => ({ ...prev, microphone: true }));
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setPermissions(prev => ({ ...prev, microphone: false }));
    }
  };

  const handleLocationPermission = async () => {
    try {
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      setPermissions(prev => ({ ...prev, location: true }));
    } catch (error) {
      console.error('Location permission denied:', error);
      setPermissions(prev => ({ ...prev, location: false }));
    }
  };

  const handleReadyToShop = () => {
    // Store permissions in localStorage
    localStorage.setItem('permissions', JSON.stringify(permissions));
    navigate('/customer/shop');
  };

  const handleVoiceCommand = (command: string) => {
    if (command.toLowerCase().includes('start shopping')) {
      handleReadyToShop();
    }
  };

  useEffect(() => {
    // Auto-request microphone permission if not already granted
    if (!permissions.microphone) {
      handleMicrophonePermission();
    }
  }, []);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 font-display text-gray-900 dark:text-white antialiased">
      {/* Main Container (Mobile Form Factor) */}
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden max-w-[430px] mx-auto bg-white dark:bg-gray-900 shadow-2xl">
        {/* Top App Bar */}
        <div className="flex items-center bg-white dark:bg-gray-900 p-4 pb-2 justify-between border-b border-gray-100 dark:border-gray-800">
          <div className="text-gray-900 dark:text-white flex size-12 shrink-0 items-center cursor-pointer" onClick={() => navigate(-1)}>
            <span className="material-symbols-outlined">arrow_back_ios</span>
          </div>
          <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
            Permissions
          </h2>
        </div>

        {/* Page Indicators */}
        <div className="flex w-full flex-row items-center justify-center gap-3 py-6 bg-white dark:bg-gray-900">
          <div className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-700"></div>
          <div className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-700"></div>
          <div className="h-1.5 w-6 rounded-full bg-blue-600"></div>
        </div>

        {/* Headline & Body */}
        <div className="bg-white dark:bg-gray-900 px-6 pb-4">
          <h1 className="text-gray-900 dark:text-white tracking-tight text-[32px] font-bold leading-tight text-center pt-2">
            Let's get you set up
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal pt-4 px-4 text-center">
            To enable voice shopping and find local deals, we need a few permissions.
          </p>
        </div>

        {/* Permissions List */}
        <div className="flex flex-col gap-2 p-4 flex-1">
          {/* Microphone Permission */}
          <div className="flex items-center gap-4 bg-white dark:bg-gray-900 px-4 min-h-[88px] py-4 justify-between rounded-xl border border-gray-50 dark:border-gray-800 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="text-blue-600 flex items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 shrink-0 size-14">
                <span className="material-symbols-outlined" style={{fontSize: '32px'}}>mic</span>
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-gray-900 dark:text-white text-base font-semibold leading-normal">Microphone</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-snug">
                  Used to hear your voice commands for a hands-free experience.
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <button
                onClick={() => permissions.microphone ? handlePermissionToggle('microphone') : handleMicrophonePermission()}
                className={`relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none p-0.5 transition-all ${
                  permissions.microphone 
                    ? 'justify-end bg-blue-600' 
                    : 'justify-start bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <div className="h-full w-[27px] rounded-full bg-white shadow-md"></div>
              </button>
            </div>
          </div>

          {/* Location Permission */}
          <div className="flex items-center gap-4 bg-white dark:bg-gray-900 px-4 min-h-[88px] py-4 justify-between rounded-xl border border-gray-50 dark:border-gray-800 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="text-blue-600 flex items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 shrink-0 size-14">
                <span className="material-symbols-outlined" style={{fontSize: '32px'}}>location_on</span>
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-gray-900 dark:text-white text-base font-semibold leading-normal">Location</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-snug">
                  Used to find the best local shops and deals near you.
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <button
                onClick={() => permissions.location ? handlePermissionToggle('location') : handleLocationPermission()}
                className={`relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none p-0.5 transition-all ${
                  permissions.location 
                    ? 'justify-end bg-blue-600' 
                    : 'justify-start bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <div className="h-full w-[27px] rounded-full bg-white shadow-md"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="bg-white dark:bg-gray-900 p-6 flex flex-col gap-6">
          {/* Ready to Shop Button */}
          <button 
            onClick={handleReadyToShop}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all text-lg flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            Ready to Shop
            <span className="material-symbols-outlined">shopping_bag</span>
          </button>

          {/* Voice Prompt Assistant */}
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-center relative">
                {isVoiceListening && <div className="absolute w-4 h-4 bg-blue-600/40 rounded-full animate-ping"></div>}
                <span className="material-symbols-outlined text-blue-600" style={{fontSize: '20px'}}>
                  graphic_eq
                </span>
              </div>
              <p className="text-gray-900 dark:text-white text-sm font-medium">
                Say <span className="font-bold text-blue-600">"Start Shopping"</span> to begin
              </p>
            </div>
          </div>

          {/* Permission Status */}
          <div className="flex items-center justify-center gap-4 text-xs">
            <div className={`flex items-center gap-1 ${permissions.microphone ? 'text-green-600' : 'text-red-500'}`}>
              <span className="material-symbols-outlined text-sm">
                {permissions.microphone ? 'check_circle' : 'cancel'}
              </span>
              <span>Microphone</span>
            </div>
            <div className={`flex items-center gap-1 ${permissions.location ? 'text-green-600' : 'text-gray-400'}`}>
              <span className="material-symbols-outlined text-sm">
                {permissions.location ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span>Location</span>
            </div>
          </div>

          {/* iOS Home Indicator Spacing */}
          <div className="h-4"></div>
        </div>
      </div>
    </div>
  );
}