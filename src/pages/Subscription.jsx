import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSubscription } from '../contexts/SubscriptionContext.jsx';
import { useApp } from '../contexts/AppContext.jsx';
import { PLANS } from '../core/SubscriptionManager.js';
import {
  Check, Crown, Zap, ArrowLeft, Loader2, AlertCircle,
  Tv, Film, Monitor, MessageCircle, Gift, Shield
} from 'lucide-react';

export default function Subscription() {
  const { isPremium, isTrialing, plan, checkout, loading } = useSubscription();
  const { session } = useApp();
  const navigate = useNavigate();
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState(null);

  const handleSubscribe = async (priceId) => {
    if (!session) {
      navigate('/login?redirect=/subscription');
      return;
    }
    setCheckingOut(true);
    setError(null);
    try {
      await checkout(priceId);
    } catch (e) {
      setError(e.message);
      setCheckingOut(false);
    }
  };

  const premiumPlan = PLANS.premium;
  const isActive = isPremium || isTrialing;

  return (
    <div className="min-h-screen bg-sb-black px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="text-sb-gray hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-white">מנוי StreamBox</h1>
        </div>

        {/* Current Status */}
        <div className="bg-sb-card rounded-2xl p-6 mb-8 border border-sb-border">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-6 h-6 text-sb-purple" />
            <h2 className="text-white font-semibold">המנוי שלך</h2>
          </div>
          <p className="text-sb-gray text-sm">
            {isTrialing ? (
              <span className="text-sb-blue flex items-center gap-2">
                <Gift className="w-4 h-4" />
                בתקופת ניסיון חינם
              </span>
            ) : isPremium ? (
              <span className="text-sb-green flex items-center gap-2">
                <Check className="w-4 h-4" />
                מנוי פרימיום פעיל
              </span>
            ) : (
              <span>אין מנוי פעיל</span>
            )}
          </p>
        </div>

        {/* Trial Banner */}
        {!isActive && (
          <div className="bg-gradient-to-r from-sb-purple/20 to-sb-blue/20 border border-sb-purple/30 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-sb-purple/20 flex items-center justify-center shrink-0">
                <Gift className="w-6 h-6 text-sb-purple" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-1">7 ימי ניסיון בחינם!</h3>
                <p className="text-sb-light text-sm">
                  התחל עכשיו וקבל <strong>7 ימי ניסיון ללא תשלום</strong>.
                  ביטול בכל עת — ללא שאלות. לאחר הניסיון: {premiumPlan.price} ₪ / חודש בלבד.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Premium Plan */}
        <div className="bg-sb-card rounded-2xl p-6 border-2 border-sb-purple relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sb-purple text-white text-xs font-bold px-3 py-1 rounded-full">
            מומלץ
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-sb-purple/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-sb-purple" />
            </div>
            <div>
              <h3 className="text-white font-semibold">{premiumPlan.name}</h3>
              <p className="text-sb-purple text-sm font-bold">{premiumPlan.price} ₪ / חודש</p>
            </div>
          </div>
          <ul className="space-y-3 mb-6">
            {premiumPlan.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sb-light text-sm">
                <Check className="w-4 h-4 text-sb-purple shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleSubscribe(premiumPlan.stripePriceId)}
            disabled={isActive || checkingOut || !premiumPlan.stripePriceId}
            className="w-full py-3 rounded-xl text-sm font-bold bg-sb-purple hover:bg-sb-purple/80 text-white disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {checkingOut ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                מעביר לתשלום...
              </>
            ) : isActive ? (
              'מנוי פעיל'
            ) : !premiumPlan.stripePriceId ? (
              'בקרוב'
            ) : (
              <>
                <Crown className="w-4 h-4" />
                התחל ניסיון חינם
              </>
            )}
          </button>
          {!isActive && premiumPlan.stripePriceId && (
            <p className="text-center text-sb-gray text-xs mt-2">
              7 ימי ניסיון חינם, לאחר מכן {premiumPlan.price} ₪/חודש
            </p>
          )}
        </div>

        {/* Info */}
        <div className="mt-8 bg-sb-surface/50 rounded-xl p-4 text-sb-gray text-sm space-y-2">
          <p className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            התשלום מאובטח דרך Stripe. ניתן לבטל בכל עת.
          </p>
          <p className="flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            צפייה באיכות 4K עם 3 שירותי Debrid במקביל.
          </p>
          <p className="flex items-center gap-2">
            <Film className="w-4 h-4" />
            ה-admin מנהל את כל חשבונות ה-Debrid — לקוח לא צריך לדעת שום דבר.
          </p>
          <p className="flex items-center gap-2">
            <Tv className="w-4 h-4" />
            כתוביות עברית אוטומטיות עם fallback לאנגלית.
          </p>
        </div>
      </div>
    </div>
  );
}
