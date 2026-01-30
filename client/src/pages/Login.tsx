import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { AuthLayout, FormField, Input, RadioGroup } from '../design-system/components';
import { Button } from '../components/ui/button';

export function Login() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'customer' as 'customer' | 'vendor'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      newErrors.email = t('auth.errors.emailRequired', { defaultValue: 'Email is required' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('auth.errors.emailInvalid', { defaultValue: 'Please enter a valid email address' });
    }
    
    if (!formData.password) {
      newErrors.password = t('auth.errors.passwordRequired', { defaultValue: 'Password is required' });
    } else if (formData.password.length < 6) {
      newErrors.password = t('auth.errors.passwordTooShort', { defaultValue: 'Password must be at least 6 characters' });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await login(formData);
      // Redirect based on user type
      if (formData.userType === 'vendor') {
        setLocation('/vendor');
      } else {
        setLocation('/customer/dashboard');
      }
    } catch (err: any) {
      setErrors({ 
        general: err.message || t('auth.errors.loginFailed', { defaultValue: 'Login failed. Please try again.' })
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const userTypeOptions = [
    {
      value: 'customer',
      label: t('auth.login.customer', { defaultValue: 'Customer' }),
      description: t('auth.login.customerDesc', { defaultValue: 'Browse and buy products with voice assistance' }),
      icon: <span className="material-symbols-outlined">shopping_cart</span>
    },
    {
      value: 'vendor',
      label: t('auth.login.vendor', { defaultValue: 'Vendor' }),
      description: t('auth.login.vendorDesc', { defaultValue: 'Sell products and manage your business' }),
      icon: <span className="material-symbols-outlined">store</span>
    }
  ];

  return (
    <AuthLayout
      title={t('auth.login.title', { defaultValue: 'Welcome Back' })}
      subtitle={t('auth.login.subtitle', { defaultValue: 'Sign in to your VyaparMitra account' })}
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
          label={t('auth.login.userType', { defaultValue: 'I am a' })}
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

        {/* Email */}
        <FormField
          label={t('auth.login.email', { defaultValue: 'Email Address' })}
          error={errors.email}
          required
        >
          <Input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder={t('auth.login.emailPlaceholder', { defaultValue: 'Enter your email address' })}
            variant={errors.email ? 'error' : 'default'}
            leftIcon={<span className="material-symbols-outlined">email</span>}
            disabled={isLoading}
            autoComplete="email"
          />
        </FormField>

        {/* Password */}
        <FormField
          label={t('auth.login.password', { defaultValue: 'Password' })}
          error={errors.password}
          required
        >
          <Input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder={t('auth.login.passwordPlaceholder', { defaultValue: 'Enter your password' })}
            variant={errors.password ? 'error' : 'default'}
            leftIcon={<span className="material-symbols-outlined">lock</span>}
            disabled={isLoading}
            autoComplete="current-password"
          />
        </FormField>

        {/* Forgot Password Link */}
        <div className="text-right">
          <button
            type="button"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            onClick={() => {
              // TODO: Implement forgot password
              console.log('Forgot password clicked');
            }}
          >
            {t('auth.login.forgotPassword', { defaultValue: 'Forgot your password?' })}
          </button>
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
            ? t('auth.login.signingIn', { defaultValue: 'Signing In...' })
            : t('auth.login.signIn', { defaultValue: 'Sign In' })
          }
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200 dark:border-neutral-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400">
              {t('auth.login.or', { defaultValue: 'or' })}
            </span>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t('auth.login.noAccount', { defaultValue: "Don't have an account?" })}{' '}
            <button
              type="button"
              onClick={() => setLocation('/signup')}
              className="font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              {t('auth.login.signUp', { defaultValue: 'Sign up for free' })}
            </button>
          </p>
        </div>

        {/* Security Notice */}
        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200/50 dark:border-neutral-700/50">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-xl mt-0.5">
              security
            </span>
            <div>
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                {t('auth.security.title', { defaultValue: 'Your data is secure' })}
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {t('auth.security.description', { 
                  defaultValue: 'We use industry-standard encryption to protect your personal information and ensure secure transactions.' 
                })}
              </p>
            </div>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}