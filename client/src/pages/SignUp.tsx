import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { AuthLayout, FormField, Input, RadioGroup } from '../design-system/components';
import { Button } from '../components/ui/button';
import { LocationPicker } from '../components/LocationPicker';
import { cn } from '@/lib/utils';

export function SignUp() {
  const [, setLocation] = useLocation();
  const { t, language } = useTranslation();
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    language: language || 'hi',
    location: '',
    userType: 'customer' as 'customer' | 'vendor'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Sync form language with selected language
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      language: language || 'hi'
    }));
  }, [language]);

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = t('auth.errors.nameRequired', { defaultValue: 'Full name is required' });
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('auth.errors.nameTooShort', { defaultValue: 'Name must be at least 2 characters' });
    }
    
    if (!formData.email.trim()) {
      newErrors.email = t('auth.errors.emailRequired', { defaultValue: 'Email is required' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('auth.errors.emailInvalid', { defaultValue: 'Please enter a valid email address' });
    }
    
    if (!formData.password) {
      newErrors.password = t('auth.errors.passwordRequired', { defaultValue: 'Password is required' });
    } else if (formData.password.length < 8) {
      newErrors.password = t('auth.errors.passwordTooShort', { defaultValue: 'Password must be at least 8 characters' });
    } else if (passwordStrength < 3) {
      newErrors.password = t('auth.errors.passwordWeak', { 
        defaultValue: 'Password should include uppercase, lowercase, numbers, and special characters' 
      });
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.errors.passwordMismatch', { defaultValue: 'Passwords do not match' });
    }
    
    if (!formData.location.trim()) {
      newErrors.location = t('auth.errors.locationRequired', { defaultValue: 'Location is required' });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

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
      setErrors({ 
        general: err.message || t('auth.errors.registrationFailed', { defaultValue: 'Registration failed. Please try again.' })
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Calculate password strength
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const userTypeOptions = [
    {
      value: 'customer',
      label: t('auth.register.customer', { defaultValue: 'Customer' }),
      description: t('auth.register.customerDesc', { defaultValue: 'Browse and buy products with voice assistance' }),
      icon: <span className="material-symbols-outlined">shopping_cart</span>
    },
    {
      value: 'vendor',
      label: t('auth.register.vendor', { defaultValue: 'Vendor' }),
      description: t('auth.register.vendorDesc', { defaultValue: 'Sell products and manage your business' }),
      icon: <span className="material-symbols-outlined">store</span>
    }
  ];

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-error';
    if (passwordStrength <= 3) return 'bg-warning';
    return 'bg-success';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return t('auth.password.weak', { defaultValue: 'Weak' });
    if (passwordStrength <= 3) return t('auth.password.medium', { defaultValue: 'Medium' });
    return t('auth.password.strong', { defaultValue: 'Strong' });
  };

  return (
    <AuthLayout
      title={t('auth.register.title', { defaultValue: 'Create Account' })}
      subtitle={t('auth.register.subtitle', { defaultValue: 'Join VyaparMitra and start trading' })}
      className="sm:max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* General Error */}
        {errors.general && (
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span className="text-sm font-medium">{errors.general}</span>
          </div>
        )}

        {/* User Type Selection */}
        <FormField
          label={t('auth.register.userType', { defaultValue: 'I want to' })}
          required
        >
          <RadioGroup
            name="userType"
            value={formData.userType}
            onChange={(value) => setFormData(prev => ({ ...prev, userType: value as 'customer' | 'vendor' }))}
            options={userTypeOptions}
            disabled={isLoading}
          />
        </FormField>

        {/* Name */}
        <FormField
          label={t('auth.register.name', { defaultValue: 'Full Name' })}
          error={errors.name}
          required
        >
          <Input
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            placeholder={t('auth.register.namePlaceholder', { defaultValue: 'Enter your full name' })}
            variant={errors.name ? 'error' : 'default'}
            leftIcon={<span className="material-symbols-outlined">person</span>}
            disabled={isLoading}
            autoComplete="name"
          />
        </FormField>

        {/* Email */}
        <FormField
          label={t('auth.register.email', { defaultValue: 'Email Address' })}
          error={errors.email}
          required
        >
          <Input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder={t('auth.register.emailPlaceholder', { defaultValue: 'Enter your email address' })}
            variant={errors.email ? 'error' : 'default'}
            leftIcon={<span className="material-symbols-outlined">email</span>}
            disabled={isLoading}
            autoComplete="email"
          />
        </FormField>

        {/* Location */}
        <FormField
          label={t('auth.register.location', { defaultValue: 'Location' })}
          error={errors.location}
          required
          description={t('auth.register.locationDesc', { defaultValue: 'This helps us connect you with nearby vendors' })}
        >
          <LocationPicker
            value={formData.location}
            onChange={(location) => setFormData(prev => ({ ...prev, location }))}
            placeholder={t('auth.register.locationPlaceholder', { defaultValue: 'Enter your city or area' })}
            disabled={isLoading}
          />
        </FormField>

        {/* Password */}
        <FormField
          label={t('auth.register.password', { defaultValue: 'Password' })}
          error={errors.password}
          required
        >
          <Input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder={t('auth.register.passwordPlaceholder', { defaultValue: 'Create a strong password' })}
            variant={errors.password ? 'error' : 'default'}
            leftIcon={<span className="material-symbols-outlined">lock</span>}
            disabled={isLoading}
            autoComplete="new-password"
          />
          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                  <div 
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      getPasswordStrengthColor()
                    )}
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  />
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  passwordStrength <= 2 ? 'text-error' : passwordStrength <= 3 ? 'text-warning' : 'text-success'
                )}>
                  {getPasswordStrengthText()}
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {t('auth.register.passwordHint', { 
                  defaultValue: 'Use 8+ characters with uppercase, lowercase, numbers & symbols' 
                })}
              </p>
            </div>
          )}
        </FormField>

        {/* Confirm Password */}
        <FormField
          label={t('auth.register.confirmPassword', { defaultValue: 'Confirm Password' })}
          error={errors.confirmPassword}
          required
        >
          <Input
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder={t('auth.register.confirmPasswordPlaceholder', { defaultValue: 'Confirm your password' })}
            variant={errors.confirmPassword ? 'error' : formData.confirmPassword && formData.password === formData.confirmPassword ? 'success' : 'default'}
            leftIcon={<span className="material-symbols-outlined">lock_reset</span>}
            disabled={isLoading}
            autoComplete="new-password"
          />
        </FormField>

        {/* Terms and Privacy */}
        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200/50 dark:border-neutral-700/50">
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            {t('auth.register.terms', { 
              defaultValue: 'By creating an account, you agree to our' 
            })}{' '}
            <button type="button" className="text-primary hover:underline font-medium">
              {t('auth.register.termsOfService', { defaultValue: 'Terms of Service' })}
            </button>{' '}
            {t('common.and', { defaultValue: 'and' })}{' '}
            <button type="button" className="text-primary hover:underline font-medium">
              {t('auth.register.privacyPolicy', { defaultValue: 'Privacy Policy' })}
            </button>
          </p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {isLoading 
            ? t('auth.register.creating', { defaultValue: 'Creating Account...' })
            : t('auth.register.createAccount', { defaultValue: 'Create Account' })
          }
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200 dark:border-neutral-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400">
              {t('auth.register.or', { defaultValue: 'or' })}
            </span>
          </div>
        </div>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t('auth.register.hasAccount', { defaultValue: 'Already have an account?' })}{' '}
            <button
              type="button"
              onClick={() => setLocation('/login')}
              className="font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              {t('auth.register.signIn', { defaultValue: 'Sign in here' })}
            </button>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}