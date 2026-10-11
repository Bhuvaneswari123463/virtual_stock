import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Password requirements checklist
  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLen && hasUpper && hasLower && hasNumber;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name || !email || !password) {
      setErrorMessage('Please fill in all registration fields.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage('Password must meet all complexity requirements listed below.');
      return;
    }

    setIsLoading(true);
    const result = await register(name, email, password);
    setIsLoading(false);

    if (result.success) {
      toast.success(
        'Account created! ₹10,00,000 in virtual capital provisioned to your wallet.',
        'Welcome to VirtualTrade'
      );
      navigate('/app', { replace: true });
    } else {
      setErrorMessage(result.error || 'Registration failed. Please check inputs.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-bg-base text-text-primary">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center flex flex-col items-center">
          <Link to="/" className="mb-4 inline-block">
            <Logo size="lg" showTagline={true} />
          </Link>
          <h2 className="text-xl font-bold text-text-primary">Start Paper Trading Today</h2>
          <p className="text-xs text-text-secondary mt-1">
            Receive ₹10,00,000 instant virtual capital. No deposit, KYC, or payment required.
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-accent-negative-subtle border border-accent-negative/30 text-accent-negative text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <Card className="p-6 bg-bg-surface border-border-medium shadow-elevated space-y-4">
          {/* Guaranteed Initial Capital Highlight */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-accent-primary-subtle border border-accent-primary/30 text-xs">
            <Sparkles className="h-4 w-4 text-accent-primary shrink-0" />
            <div>
              <span className="font-bold text-accent-primary">₹10,00,000 Free Virtual Capital</span>
              <p className="text-[11px] text-text-secondary">Provisioned authoritatively upon registration.</p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="Arjun Sharma"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrorMessage(null);
              }}
              leftIcon={<User className="h-4 w-4 text-text-muted" />}
              autoComplete="name"
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="arjun@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMessage(null);
              }}
              leftIcon={<Mail className="h-4 w-4 text-text-muted" />}
              autoComplete="email"
              required
            />

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage(null);
                }}
                leftIcon={<Lock className="h-4 w-4 text-text-muted" />}
                autoComplete="new-password"
                required
              />

              {/* Password complexity requirements */}
              {password.length > 0 && (
                <div className="mt-2.5 p-2.5 rounded bg-bg-elevated border border-border-subtle grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${hasMinLen ? 'text-accent-positive' : 'text-text-muted'}`}>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>8+ characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-accent-positive' : 'text-text-muted'}`}>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Uppercase (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasLower ? 'text-accent-positive' : 'text-text-muted'}`}>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Lowercase (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-accent-positive' : 'text-text-muted'}`}>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Number (0-9)</span>
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Create Account & Claim ₹10,00,000
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-accent-primary hover:underline">
              Sign in to terminal
            </Link>
          </div>
        </Card>

        <div className="flex items-center justify-center gap-1.5 text-center text-[11px] text-text-muted">
          <ShieldCheck className="h-3.5 w-3.5 text-accent-primary" />
          <span>Strictly educational simulation platform for Indian equities.</span>
        </div>
      </div>
    </div>
  );
};
