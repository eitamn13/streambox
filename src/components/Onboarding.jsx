import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCatalog } from '../core/StreamBoxCore.js';
import { Check, Star, Sparkles, ArrowLeft } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback.jsx';

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [trending, popular, topRated] = await Promise.all([
          getCatalog('trending', 1),
          getCatalog('movies_popular', 1),
          getCatalog('tv_popular', 1),
        ]);
        const all = [...trending, ...popular, ...topRated];
        const seen = new Set();
        const unique = all.filter((item) => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
        setItems(unique.slice(0, 24));
      } catch (e) {
        console.error('Failed to load onboarding content:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const toggleSelection = (item) => {
    setSelected((prev) => {
      const exists = prev.find((p) => p.id === item.id);
      if (exists) return prev.filter((p) => p.id !== item.id);
      if (prev.length >= 3) return prev;
      return [...prev, item];
    });
  };

  const finish = () => {
    localStorage.setItem('sb-onboarding-done', 'true');
    localStorage.setItem('sb-onboarding-favorites', JSON.stringify(selected.map((s) => s.id)));
    if (userName.trim()) {
      localStorage.setItem('sb-user-name', userName.trim());
    }
    navigate('/');
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#e50914] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#b3b3c0] text-sm">טוען תוכן...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] px-4 py-8 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-[#e50914]' : 'bg-[#33334a]'}`} />
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-[#e50914]' : 'bg-[#33334a]'}`} />
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 3 ? 'bg-[#e50914]' : 'bg-[#33334a]'}`} />
        </div>

        {step === 1 && (
          <div className="text-center py-12 animate-fade-up">
            <div className="w-20 h-20 rounded-2xl bg-[#e50914] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#e50914]/20">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-4">
              ברוכים הבאים ל-StreamBox
            </h1>
            <p className="text-[#b3b3c0] text-lg mb-8 max-w-md mx-auto">
              נ personalize את החוויה שלך כדי שנוכל להמליץ לך על התוכן הטוב ביותר
            </p>
            <div className="mb-8">
              <label className="block text-sm text-[#b3b3c0] mb-2">איך קוראים לך?</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="השם שלך"
                className="w-full max-w-xs mx-auto bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-3 text-white text-center placeholder-[#808090] focus:outline-none focus:border-[#e50914]/60 transition-all"
              />
            </div>
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 bg-[#e50914] hover:bg-[#f40612] text-white px-8 py-3 rounded-lg font-bold text-base transition-all hover:scale-105 mx-auto"
            >
              התחל
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-up">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">בחר 3 סרטים או סדרות מועדפים</h2>
              <p className="text-[#b3b3c0] text-sm">
                נבחר עבורך תוכן דומה שתאהב ({selected.length}/3)
              </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {items.map((item) => {
                const isSelected = selected.find((s) => s.id === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleSelection(item)}
                    className={`group relative aspect-[2/3] rounded-lg overflow-hidden transition-all ${
                      isSelected ? 'ring-2 ring-[#e50914] scale-105' : 'hover:scale-105'
                    }`}
                  >
                    {item.poster ? (
                      <ImageWithFallback src={item.poster} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#1a1a2e] flex items-center justify-center">
                        <Star className="w-8 h-8 text-[#808090]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-[#e50914]/30 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-[#e50914] flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}
                    <p className="absolute bottom-2 left-2 right-2 text-xs font-bold text-white line-clamp-2 text-center">
                      {item.title}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-lg font-bold text-sm text-[#b3b3c0] hover:text-white transition-colors"
              >
                חזרה
              </button>
              <button
                onClick={() => selected.length === 3 && setStep(3)}
                disabled={selected.length < 3}
                className="flex items-center gap-2 bg-[#e50914] hover:bg-[#f40612] disabled:opacity-40 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-bold text-base transition-all hover:scale-105"
              >
                המשך
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-12 animate-fade-up">
            <div className="w-20 h-20 rounded-full bg-[#46d369] flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4">
              הכל מוכן, {userName || 'חבר'}!
            </h2>
            <p className="text-[#b3b3c0] text-lg mb-2 max-w-md mx-auto">
              בחרת {selected.length} מועדפים
            </p>
            <p className="text-[#808090] text-sm mb-8 max-w-md mx-auto">
              התחל לצפות ואנחנו נלמד את הטעם שלך כדי להמליץ על תוכן מדויק יותר
            </p>
            <button
              onClick={finish}
              className="flex items-center gap-2 bg-[#e50914] hover:bg-[#f40612] text-white px-10 py-4 rounded-lg font-bold text-lg transition-all hover:scale-105 mx-auto"
            >
              התחל צפייה
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Onboarding;
