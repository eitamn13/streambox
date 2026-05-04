import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useSubscription } from '../contexts/SubscriptionContext.jsx';
import { Loader2, Crown } from 'lucide-react';

export default function ProtectedRoute({ children, requirePremium = false }) {
  const { session, loading: authLoading, isAdmin } = useApp();
  const { isPremium, loading: subLoading } = useSubscription();
  const location = useLocation();

  const loading = authLoading || subLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-sb-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-sb-red animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (requirePremium && !isPremium && !isAdmin) {
    return (
      <div className="min-h-screen bg-sb-black flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <Crown className="w-16 h-16 text-sb-purple mx-auto mb-4" />
          <h2 className="text-xl text-white font-bold mb-2">נדרש מנוי פרימיום</h2>
          <p className="text-sb-gray text-sm mb-4">תכונה זו זמינה למנויי פרימיום בלבד.</p>
          <a
            href="/subscription"
            className="inline-flex items-center gap-2 bg-sb-purple hover:bg-sb-purple/80 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors"
          >
            <Crown className="w-4 h-4" />
            שדרג עכשיו
          </a>
        </div>
      </div>
    );
  }

  return children;
}
