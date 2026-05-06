import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Play, Info, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PRESENTER_MESSAGES = [
  { text: 'היי! הנה מה שחם היום 🔥', mood: 'excited' },
  { text: 'מצאתי כמה דברים מעולים בשבילך!', mood: 'friendly' },
  { text: 'בוא נמצא לך משהו מעניין לצפייה', mood: 'curious' },
];

export default function AIPresenter({ trendingItems = [] }) {
  const navigate = useNavigate();
  const [messageIdx, setMessageIdx] = useState(0);
  const [activeRec, setActiveRec] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const items = trendingItems.slice(0, 3);

  // Cycle through welcome messages
  useEffect(() => {
    if (items.length === 0) return;
    const interval = setInterval(() => {
      setMessageIdx((prev) => (prev + 1) % PRESENTER_MESSAGES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [items.length]);

  // Auto-rotate recommendations
  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setActiveRec((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [items.length]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    localStorage.setItem('sb-ai-presenter-dismissed', Date.now().toString());
  }, []);

  // Check if dismissed recently (within 1 hour)
  useEffect(() => {
    const dismissed = localStorage.getItem('sb-ai-presenter-dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 60 * 60 * 1000) {
      setIsVisible(false);
    }
  }, []);

  if (!isVisible || items.length === 0) return null;

  const currentItem = items[activeRec];
  const currentMessage = PRESENTER_MESSAGES[messageIdx];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-sb-border/60"
        style={{
          background: 'linear-gradient(135deg, rgba(229,9,20,0.08) 0%, rgba(15,15,25,0.95) 50%, rgba(15,15,25,0.95) 100%)',
        }}
      >
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-sb-red/40"
              animate={{
                x: [0, 100, -50, 0],
                y: [0, -80, 40, 0],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                delay: i * 0.8,
                ease: 'easeInOut',
              }}
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
            />
          ))}
        </div>

        <div className="relative flex flex-col md:flex-row items-stretch gap-0">
          {/* Left: AI Avatar & Message */}
          <div className="flex-1 p-5 md:p-6 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              {/* AI Avatar */}
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-sb-red flex items-center justify-center relative overflow-hidden">
                  <Sparkles className="w-6 h-6 text-white" />
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-sb-black" />
              </div>

              <div>
                <h3 className="text-white font-semibold text-sm flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sb-red" />
                  מנחה StreamBox AI
                </h3>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={messageIdx}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-xs text-sb-gray"
                  >
                    {currentMessage.text}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            {/* Recommendation details */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeRec}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="mb-4"
              >
                <p className="text-white font-bold text-lg md:text-xl mb-1">
                  {currentItem.title || currentItem.name}
                </p>
                <p className="text-sb-gray text-xs line-clamp-2">
                  {currentItem.overview || 'תוכן מומלץ במיוחד עבורך'}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-sb-gray">
                  {currentItem.vote_average > 0 && (
                    <span className="text-yellow-400">★ {(currentItem.vote_average / 2).toFixed(1)}</span>
                  )}
                  {currentItem.release_date && (
                    <span>{currentItem.release_date.slice(0, 4)}</span>
                  )}
                  {currentItem.media_type && (
                    <span className="capitalize">{currentItem.media_type === 'tv' ? 'סדרה' : 'סרט'}</span>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/detail/${currentItem.media_type || 'movie'}/${currentItem.id}`)}
                className="flex items-center gap-1.5 bg-sb-red hover:bg-sb-red-hover text-white text-xs font-medium px-4 py-2 rounded-xl transition-colors"
              >
                <Play className="w-3.5 h-3.5" fill="white" />
                פרטים
              </button>
              <button
                onClick={() => navigate(`/detail/${currentItem.media_type || 'movie'}/${currentItem.id}`)}
                className="flex items-center gap-1.5 bg-sb-surface hover:bg-sb-border text-white text-xs font-medium px-4 py-2 rounded-xl transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
                מידע
              </button>

              {/* Dots */}
              {items.length > 1 && (
                <div className="flex items-center gap-1 mr-auto">
                  {items.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveRec(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        i === activeRec ? 'bg-sb-red' : 'bg-sb-gray/40'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Poster image */}
          <div className="md:w-48 lg:w-56 shrink-0 relative">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeRec}
                src={currentItem.backdrop_path
                  ? `https://image.tmdb.org/t/p/w500${currentItem.backdrop_path}`
                  : currentItem.poster_path
                    ? `https://image.tmdb.org/t/p/w342${currentItem.poster_path}`
                    : ''
                }
                alt={currentItem.title || currentItem.name}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full h-40 md:h-full object-cover md:rounded-l-2xl"
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-sb-black/30 md:bg-gradient-to-l md:from-transparent md:to-sb-black/80" />
          </div>
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 left-3 p-1.5 rounded-lg bg-sb-black/40 text-sb-gray hover:text-white transition-colors z-10"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </div>
  );
}


