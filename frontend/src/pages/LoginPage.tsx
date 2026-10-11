import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  ArrowRight,
  Zap,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  X,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);

  // Reset password inline step
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const { login, register, requestPasswordReset, resetPassword, sessionExpired } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = location.state as { from?: { pathname: string } } | null;
  const from = locationState?.from?.pathname || '/app';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      toast.success('Signed in to trading session.', 'Welcome back');
      navigate(from, { replace: true });
    } else {
      setErrorMessage(result.error || 'Authentication failed. Please check credentials.');
    }
  };

  const handleDemoLogin = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    const demoEmail = 'demo.trader@virtualtrade.in';
    const demoPass = 'DemoPass@123';

    let res = await login(demoEmail, demoPass);
    if (!res.success) {
      // Auto-register demo account if not created yet
      const regRes = await register('Demo Trader', demoEmail, demoPass);
      if (regRes.success) {
        res = await login(demoEmail, demoPass);
      }
    }

    if (res.success) {
      setIsLoading(false);
      toast.success('Logged in with Demo Trader credentials. ₹10,00,000 active.');
      navigate('/app', { replace: true });
    } else {
      setEmail(demoEmail);
      setPassword(demoPass);
      setIsLoading(false);
      toast.info('Demo credentials populated. Click Sign In.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setIsForgotLoading(true);
    const res = await requestPasswordReset(forgotEmail);
    setIsForgotLoading(false);

    setForgotSuccessMessage(res.message);
    if (res.devResetToken) {
      setDevToken(res.devResetToken);
      setResetToken(res.devResetToken);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken || !newPassword) return;

    setIsResetLoading(true);
    const res = await resetPassword(resetToken, newPassword);
    setIsResetLoading(false);

    if (res.success) {
      setResetSuccess(true);
      toast.success('Password updated! You can now log in.');
      setTimeout(() => {
        setShowForgotModal(false);
        setResetSuccess(false);
        setForgotSuccessMessage(null);
        setPassword('');
      }, 2000);
    } else {
      toast.error(res.error || 'Failed to reset password.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-bg-base text-text-primary">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center flex flex-col items-center">
          <Link to="/" className="mb-4 inline-block">
            <Logo size="lg" showTagline={true} />
          </Link>
          <h2 className="text-xl font-bold text-text-primary">Sign in to Trading Terminal</h2>
          <p className="text-xs text-text-secondary mt-1">
            Access your simulated portfolio, watchlist, and paper-trading ledger.
          </p>
        </div>

        {sessionExpired && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Your session has expired or was terminated. Please sign in again.</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-accent-negative-subtle border border-accent-negative/30 text-accent-negative text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <Card className="p-6 bg-bg-surface border-border-medium shadow-elevated space-y-4">
          {/* Quick Demo Access Button */}
          <Button
            variant="secondary"
            className="w-full justify-center text-xs border-accent-primary/40 bg-accent-primary-subtle/30 text-accent-primary hover:bg-accent-primary-subtle"
            onClick={handleDemoLogin}
            disabled={isLoading}
            leftIcon={<Zap className="h-4 w-4" />}
          >
            Instant Demo Sign-in (1-Click)
          </Button>

          <div className="flex items-center my-3">
            <div className="flex-1 border-t border-border-subtle" />
            <span className="px-3 text-[11px] text-text-muted uppercase font-mono">or enter credentials</span>
            <div className="flex-1 border-t border-border-subtle" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="trader@virtualtrade.in"
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
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-text-secondary">Password</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotEmail(email);
                  }}
                  className="text-[11px] text-accent-primary hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage(null);
                }}
                leftIcon={<Lock className="h-4 w-4 text-text-muted" />}
                autoComplete="current-password"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Sign In
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-text-secondary">
            Don&apos;t have an account yet?{' '}
            <Link to="/register" className="font-semibold text-accent-primary hover:underline">
              Create account with ₹10,00,000 capital
            </Link>
          </div>
        </Card>

        <div className="flex items-center justify-center gap-1.5 text-center text-[11px] text-text-muted">
          <ShieldCheck className="h-3.5 w-3.5 text-accent-primary" />
          <span>Paper-trading simulation only. Zero financial liability.</span>
        </div>
      </div>

      {/* Forgot / Reset Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-bg-surface border border-border-medium rounded-xl shadow-2xl p-6 relative space-y-4">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-accent-primary">
              <KeyRound className="w-5 h-5" />
              <h3 className="font-bold text-sm text-text-primary">Reset Your Password</h3>
            </div>

            {!forgotSuccessMessage ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-text-secondary">
                  Enter your registered email address. If an account exists, a secure expiring reset token will be issued.
                </p>

                <Input
                  label="Registered Email Address"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={isForgotLoading}
                >
                  Send Reset Token
                </Button>
              </form>
            ) : resetSuccess ? (
              <div className="text-center py-4 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-accent-positive mx-auto" />
                <h4 className="font-bold text-sm text-text-primary">Password Reset Complete</h4>
                <p className="text-xs text-text-secondary">
                  Your password has been securely updated. You can now log in.
                </p>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div className="p-3 rounded-lg bg-accent-primary-subtle border border-accent-primary/30 text-xs text-text-secondary">
                  {forgotSuccessMessage}
                </div>

                {devToken && (
                  <div className="p-2.5 rounded bg-bg-elevated border border-border-medium text-[11px] font-mono break-all text-accent-primary">
                    <span className="text-text-muted block text-[10px] uppercase font-sans">Token:</span>
                    {devToken}
                  </div>
                )}

                <Input
                  label="Reset Token"
                  type="text"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste token"
                  required
                />

                <Input
                  label="New Password (min. 8 chars, 1 uppercase, 1 lowercase, 1 number)"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="NewSecretPassword@123"
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={isResetLoading}
                >
                  Set New Password
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
