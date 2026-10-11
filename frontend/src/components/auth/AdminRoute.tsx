import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AdminRoute: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base text-text-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
          <span className="text-xs font-mono text-text-muted">Checking administrator privileges...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base text-text-primary p-4">
        <div className="max-w-md w-full bg-bg-surface border border-accent-negative/30 rounded-xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-accent-negative-subtle flex items-center justify-center mx-auto text-accent-negative">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-text-primary">Access Restricted</h2>
          <p className="text-xs text-text-secondary">
            This module requires administrator authorization. Your account currently holds the{' '}
            <span className="font-semibold text-accent-primary uppercase font-mono">{user?.role}</span> role.
          </p>
          <Button variant="secondary" className="w-full" onClick={() => window.history.back()}>
            Return to Previous Screen
          </Button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
