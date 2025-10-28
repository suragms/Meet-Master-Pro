import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const { sessionDB } = await import('@/lib/database');
      const user = sessionDB.get();
      
      if (user) {
        setAuthenticated(true);
        setIsAdmin(user.role === 'admin');
        
        // Redirect staff members away from admin-only pages
        if (requireAdmin && user.role !== 'admin') {
          console.warn('Access denied: Admin only');
        }
      }
      
      setLoading(false);
    };
    checkAuth();
  }, [requireAdmin]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
