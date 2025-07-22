"use client";

import { useState, useEffect, FormEvent } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Simple inline Alert component to avoid import issues
const Alert = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("relative w-full rounded-lg border border-destructive/50 px-4 py-3 text-sm text-destructive", className)}>
    {children}
  </div>
);

const AlertDescription = ({ children }: { children: React.ReactNode }) => (
  <div className="text-sm">{children}</div>
);
import { useAuth } from '@/contexts/auth-context';
import { LoginRequest } from '@/types/auth';

// Form validation
interface FormErrors {
  email?: string;
  password?: string;
}

interface LoginContainerProps {
  className?: string;
}

export function LoginContainer({ className }: LoginContainerProps) {
  const { login, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      clearError();

      const credentials: LoginRequest = {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      };

      await login(credentials);
      
      // Login successful - user will be redirected by the auth context
    } catch (error) {
      // Clear password field on error for security
      setFormData(prev => ({ ...prev, password: '' }));
      
      // Error is already handled by auth context
      console.error('Login failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Determine if form should be disabled
  const isFormDisabled = isLoading || isSubmitting;

  // Get the error message to display
  const displayError = error;

  return (
    <form 
      className={cn("flex flex-col gap-6", className)} 
      onSubmit={onSubmit}
      noValidate
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your email and password to access your dashboard
        </p>
      </div>

      {/* Error Alert */}
      {displayError && (
        <Alert>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{displayError}</AlertDescription>
          </div>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Email Field */}
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            autoComplete="email"
            disabled={isFormDisabled}
            value={formData.email}
            onChange={handleInputChange('email')}
            className={cn(
              formErrors.email && "border-destructive focus-visible:ring-destructive"
            )}
          />
          {formErrors.email && (
            <p className="text-sm text-destructive">{formErrors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <a
              href="/forgot-password"
              className="ml-auto text-sm underline-offset-4 hover:underline text-muted-foreground"
              tabIndex={isFormDisabled ? -1 : 0}
            >
              Forgot your password?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            disabled={isFormDisabled}
            value={formData.password}
            onChange={handleInputChange('password')}
            className={cn(
              formErrors.password && "border-destructive focus-visible:ring-destructive"
            )}
          />
          {formErrors.password && (
            <p className="text-sm text-destructive">{formErrors.password}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isFormDisabled}
        >
          {isFormDisabled ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>

        {/* Divider */}
        <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-background text-muted-foreground relative z-10 px-2">
            Or continue with
          </span>
        </div>

        {/* Social Login Button (Optional) */}
        <Button 
          variant="outline" 
          className="w-full" 
          type="button"
          disabled={isFormDisabled}
          onClick={() => {
            // Implement social login if needed
            console.log('Social login not implemented');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
            <path
              d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
              fill="currentColor"
            />
          </svg>
          Login with GitHub
        </Button>
      </div>

      {/* Additional Security Info */}
      <div className="text-center text-xs text-muted-foreground">
        <p>
          By signing in, you agree to our{' '}
          <a href="/terms" className="underline underline-offset-4 hover:text-primary">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </a>
        </p>
      </div>
    </form>
  );
}
