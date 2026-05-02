import { Navigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { session, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-sb-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-sb-red animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
