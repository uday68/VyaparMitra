export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface LocationAddress {
  formatted: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  district?: string;
}

export interface LocationResult {
  coordinates: LocationCoordinates;
  address: LocationAddress;
}

export class LocationService {
  private static readonly TIMEOUT = 10000; // 10 seconds
  private static readonly MAX_AGE = 300000; // 5 minutes

  /**
   * Get current location using GPS
   */
  static async getCurrentLocation(): Promise<LocationCoordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: this.TIMEOUT,
        maximumAge: this.MAX_AGE,
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          
          reject(new Error(errorMessage));
        },
        options
      );
    });
  }

  /**
   * Convert coordinates to human-readable address using reverse geocoding
   */
  static async reverseGeocode(coordinates: LocationCoordinates): Promise<LocationAddress> {
    try {
      // Using OpenStreetMap Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.latitude}&lon=${coordinates.longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'VyaparMitra/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }

      const data = await response.json();
      
      if (!data || !data.display_name) {
        throw new Error('No address found for these coordinates');
      }

      const address = data.address || {};
      
      return {
        formatted: data.display_name,
        city: address.city || address.town || address.village || address.hamlet,
        state: address.state,
        country: address.country,
        postalCode: address.postcode,
        district: address.state_district || address.county,
      };
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      
      // Fallback: return coordinates as formatted string
      return {
        formatted: `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`,
        city: 'Unknown',
        state: 'Unknown',
        country: 'Unknown',
      };
    }
  }

  /**
   * Get current location with address
   */
  static async getCurrentLocationWithAddress(): Promise<LocationResult> {
    try {
      const coordinates = await this.getCurrentLocation();
      const address = await this.reverseGeocode(coordinates);
      
      return {
        coordinates,
        address,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if geolocation is supported
   */
  static isGeolocationSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Request location permission
   */
  static async requestLocationPermission(): Promise<PermissionState> {
    if (!navigator.permissions) {
      throw new Error('Permissions API not supported');
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state;
    } catch (error) {
      throw new Error('Failed to check location permission');
    }
  }

  /**
   * Format address for display
   */
  static formatAddress(address: LocationAddress, format: 'short' | 'full' = 'short'): string {
    if (format === 'short') {
      const parts = [address.city, address.state].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : address.formatted;
    }
    
    return address.formatted;
  }

  /**
   * Calculate distance between two coordinates (in kilometers)
   */
  static calculateDistance(
    coord1: LocationCoordinates,
    coord2: LocationCoordinates
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) *
        Math.cos(this.toRadians(coord2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Hook for using location service in React components
export function useLocation() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [location, setLocation] = React.useState<LocationResult | null>(null);

  const getCurrentLocation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await LocationService.getCurrentLocationWithAddress();
      setLocation(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get location';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLocation = () => {
    setLocation(null);
    setError(null);
  };

  return {
    location,
    isLoading,
    error,
    getCurrentLocation,
    clearLocation,
    isSupported: LocationService.isGeolocationSupported(),
  };
}

// Add React import for the hook
import React from 'react';