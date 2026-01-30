import React, { useState } from 'react';
import { useLocation, LocationService } from '../services/locationService';
import { useTranslation } from '../hooks/useTranslation';

interface LocationPickerProps {
  value: string;
  onChange: (location: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function LocationPicker({
  value,
  onChange,
  placeholder,
  disabled = false,
  className = '',
}: LocationPickerProps) {
  const { t } = useTranslation();
  const { location, isLoading, error, getCurrentLocation, isSupported } = useLocation();
  const [showMap, setShowMap] = useState(false);

  const handleGetCurrentLocation = async () => {
    try {
      const result = await getCurrentLocation();
      const formattedAddress = LocationService.formatAddress(result.address, 'short');
      onChange(formattedAddress);
    } catch (err) {
      console.error('Failed to get location:', err);
    }
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleManualInput}
          placeholder={placeholder || t('auth.register.locationPlaceholder', { defaultValue: 'Enter your location' })}
          disabled={disabled || isLoading}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            disabled || isLoading ? 'bg-gray-50 cursor-not-allowed' : ''
          } ${className}`}
        />
        
        {isSupported && (
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={disabled || isLoading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
            title={t('location.useCurrentLocation', { defaultValue: 'Use current location' })}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            ) : (
              <span className="material-symbols-outlined text-xl">my_location</span>
            )}
          </button>
        )}
      </div>

      {/* GPS Button */}
      {isSupported && (
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={disabled || isLoading}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined text-lg">
            {isLoading ? 'hourglass_empty' : 'gps_fixed'}
          </span>
          {isLoading 
            ? t('location.gettingLocation', { defaultValue: 'Getting location...' })
            : t('location.useGPS', { defaultValue: 'Use GPS Location' })
          }
        </button>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
          <span className="material-symbols-outlined text-red-600 text-sm">error</span>
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {location && !error && (
        <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
          <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
          <div className="text-sm text-green-700">
            <div className="font-medium">
              {t('location.locationDetected', { defaultValue: 'Location detected' })}
            </div>
            <div className="text-xs text-green-600">
              {LocationService.formatAddress(location.address, 'full')}
            </div>
          </div>
        </div>
      )}

      {/* Location not supported message */}
      {!isSupported && (
        <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <span className="material-symbols-outlined text-yellow-600 text-sm">info</span>
          <span className="text-sm text-yellow-700">
            {t('location.notSupported', { defaultValue: 'GPS location is not supported in this browser' })}
          </span>
        </div>
      )}

      {/* Map Toggle Button (for future enhancement) */}
      {false && ( // Disabled for now, can be enabled when map integration is added
        <button
          type="button"
          onClick={() => setShowMap(!showMap)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">map</span>
          {showMap 
            ? t('location.hideMap', { defaultValue: 'Hide Map' })
            : t('location.showMap', { defaultValue: 'Show Map' })
          }
        </button>
      )}

      {/* Map Container (for future enhancement) */}
      {showMap && (
        <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center border border-gray-300">
          <div className="text-center text-gray-500">
            <span className="material-symbols-outlined text-4xl mb-2 block">map</span>
            <p className="text-sm">
              {t('location.mapComingSoon', { defaultValue: 'Interactive map coming soon' })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Simplified location button component
export function LocationButton({
  onLocationSelect,
  disabled = false,
  variant = 'default',
}: {
  onLocationSelect: (location: string) => void;
  disabled?: boolean;
  variant?: 'default' | 'compact';
}) {
  const { t } = useTranslation();
  const { isLoading, getCurrentLocation, isSupported } = useLocation();

  const handleClick = async () => {
    if (!isSupported) {
      alert(t('location.notSupported', { defaultValue: 'GPS location is not supported in this browser' }));
      return;
    }

    try {
      const result = await getCurrentLocation();
      const formattedAddress = LocationService.formatAddress(result.address, 'short');
      onLocationSelect(formattedAddress);
    } catch (err: any) {
      alert(err.message || t('location.error', { defaultValue: 'Failed to get location' }));
    }
  };

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isLoading || !isSupported}
        className="p-2 text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
        title={t('location.useCurrentLocation', { defaultValue: 'Use current location' })}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        ) : (
          <span className="material-symbols-outlined">my_location</span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading || !isSupported}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
    >
      <span className="material-symbols-outlined">
        {isLoading ? 'hourglass_empty' : 'gps_fixed'}
      </span>
      {isLoading 
        ? t('location.gettingLocation', { defaultValue: 'Getting location...' })
        : t('location.useGPS', { defaultValue: 'Use GPS Location' })
      }
    </button>
  );
}