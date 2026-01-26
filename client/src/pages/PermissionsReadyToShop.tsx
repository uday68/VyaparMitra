import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { 
  Mic, 
  Camera, 
  MapPin, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Settings,
  ArrowRight,
  Volume2
} from 'lucide-react';

interface Permission {
  name: string;
  icon: React.ReactNode;
  description: string;
  required: boolean;
  granted: boolean;
  error?: string;
}

export function PermissionsReadyToShop() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      name: 'microphone',
      icon: <Mic className="h-6 w-6" />,
      description: t('permissions.microphone.description'),
      required: true,
      granted: false
    },
    {
      name: 'camera',
      icon: <Camera className="h-6 w-6" />,
      description: t('permissions.camera.description'),
      required: false,
      granted: false
    },
    {
      name: 'location',
      icon: <MapPin className="h-6 w-6" />,
      description: t('permissions.location.description'),
      required: false,
      granted: false
    }
  ]);

  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
  const [allRequiredGranted, setAllRequiredGranted] = useState(false);

  // Check existing permissions on mount
  useEffect(() => {
    checkExistingPermissions();
  }, []);

  // Update allRequiredGranted when permissions change
  useEffect(() => {
    const requiredPermissions = permissions.filter(p => p.required);
    const grantedRequired = requiredPermissions.filter(p => p.granted);
    setAllRequiredGranted(grantedRequired.length === requiredPermissions.length);
  }, [permissions]);

  const checkExistingPermissions = async () => {
    const updatedPermissions = [...permissions];

    // Check microphone permission
    try {
      const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      updatedPermissions[0].granted = micPermission.state === 'granted';
    } catch (error) {
      console.log('Microphone permission check failed:', error);
    }

    // Check camera permission
    try {
      const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      updatedPermissions[1].granted = cameraPermission.state === 'granted';
    } catch (error) {
      console.log('Camera permission check failed:', error);
    }

    // Check location permission
    try {
      const locationPermission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      updatedPermissions[2].granted = locationPermission.state === 'granted';
    } catch (error) {
      console.log('Location permission check failed:', error);
    }

    setPermissions(updatedPermissions);
  };

  const requestPermission = async (permissionName: string) => {
    setIsRequestingPermissions(true);
    const updatedPermissions = [...permissions];
    const permissionIndex = updatedPermissions.findIndex(p => p.name === permissionName);

    try {
      switch (permissionName) {
        case 'microphone':
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStream.getTracks().forEach(track => track.stop());
          updatedPermissions[permissionIndex].granted = true;
          updatedPermissions[permissionIndex].error = undefined;
          break;

        case 'camera':
          const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
          cameraStream.getTracks().forEach(track => track.stop());
          updatedPermissions[permissionIndex].granted = true;
          updatedPermissions[permissionIndex].error = undefined;
          break;

        case 'location':
          await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          updatedPermissions[permissionIndex].granted = true;
          updatedPermissions[permissionIndex].error = undefined;
          break;
      }
    } catch (error) {
      updatedPermissions[permissionIndex].error = error instanceof Error ? error.message : 'Permission denied';
    }

    setPermissions(updatedPermissions);
    setIsRequestingPermissions(false);
  };

  const requestAllPermissions = async () => {
    setIsRequestingPermissions(true);
    
    for (const permission of permissions) {
      if (!permission.granted) {
        await requestPermission(permission.name);
      }
    }
    
    setIsRequestingPermissions(false);
  };

  const handleContinue = () => {
    // Store permission preferences
    localStorage.setItem('vyapar-mitra-permissions', JSON.stringify(permissions));
    
    // Navigate to customer dashboard
    setLocation('/customer/dashboard');
  };

  const handleSkip = () => {
    // Navigate without full permissions (limited functionality)
    setLocation('/customer/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4 p-4 bg-blue-100 dark:bg-blue-900 rounded-full"
            >
              <Shield className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('permissions.title')}
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t('permissions.subtitle')}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Permissions List */}
            <div className="space-y-4">
              {permissions.map((permission, index) => (
                <motion.div
                  key={permission.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Card className={`border-2 transition-colors ${
                    permission.granted 
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                      : permission.error
                      ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${
                            permission.granted 
                              ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {permission.icon}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium text-gray-900 dark:text-white capitalize">
                                {t(`permissions.${permission.name}.title`)}
                              </h3>
                              {permission.required && (
                                <Badge variant="destructive" className="text-xs">
                                  {t('permissions.required')}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {permission.description}
                            </p>
                            {permission.error && (
                              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                {permission.error}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {permission.granted ? (
                            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => requestPermission(permission.name)}
                              disabled={isRequestingPermissions}
                            >
                              {t('permissions.allow')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Voice Test Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Volume2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h3 className="font-medium text-blue-900 dark:text-blue-100">
                        {t('permissions.voiceTest.title')}
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {t('permissions.voiceTest.description')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Status Alert */}
            {allRequiredGranted ? (
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  {t('permissions.allGranted')}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
                <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  {t('permissions.someRequired')}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={requestAllPermissions}
                disabled={isRequestingPermissions}
                className="flex-1"
                size="lg"
              >
                <Shield className="h-4 w-4 mr-2" />
                {isRequestingPermissions ? t('permissions.requesting') : t('permissions.allowAll')}
              </Button>
              
              {allRequiredGranted ? (
                <Button
                  onClick={handleContinue}
                  className="flex-1"
                  size="lg"
                >
                  {t('permissions.continue')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="flex-1"
                  size="lg"
                >
                  {t('permissions.skipForNow')}
                </Button>
              )}
            </div>

            {/* Settings Link */}
            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/voice-settings')}
                className="text-gray-600 dark:text-gray-400"
              >
                <Settings className="h-4 w-4 mr-2" />
                {t('permissions.advancedSettings')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}