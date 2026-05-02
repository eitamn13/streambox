import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info, ChevronRight, ChevronLeft, Star, Clock } from 'lucide-react';

function HeroBanner({ items }) {
  const [index, setIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const goTo = useCallback((i) => {
    if (transitioning) return;
    setTransitioning(true);
    setIndex(i);
    setTimeout(() => setTransitioning(false), 500);
  }, [transitioning]);

  useEffect(() => {
    if (!items || items.length <= 1) return;
    const interval = setInterval(() => {
      goTo((index + 1) % items.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [items, index, goTo]);

  if (!items || items.length === 0) return null;

  const item = items[index];

  return (
    <div className="relative w-full h-[65vh] sm:h-[75vh] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        {items.map((it, i) => (
          <div
            key={it.id}
            className={`absolute inset-0 transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0'}`}
          >
            {it.backdrop ? (
              <img src={it.backdrop} alt={it.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-sb-dark" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-sb-black via-sb-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-l from-sb-black/60 via-transparent to-transparent" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex items-end">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full pb-16 sm:pb-24">
          <div className="max-w-xl animate-fade-up">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sb-red text-xs sm:text-sm font-bold uppercase tracking-wider">טרנדינג</span>
              {item.rating > 0 && (
                <span className="flex items-center gap-1 text-sb-gold text-xs">
                  <Star className="w-3 h-3" fill="currentColor" />
                  {item.rating.toFixed(1)}
                </span>
              )}
              {item.year && <span className="text-sb-gray text-xs">{item.year}</span>}
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-3 leading-tight">
              {item.title}
            </h1>

            <p className="text-sb-light/80 text-sm sm:text-base leading-relaxed mb-6 line-clamp-3">
              {item.overview}
            </p>

            <div className="flex items-center gap-3">
              <Link
                to={`/player/${item.type}/${item.id}`}
                className="flex items-center gap-2 bg-sb-red hover:bg-sb-red-hover text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-sb-red-glow hover:shadow-xl hover:shadow-sb-red-glow hover:-translate-y-0.5"
              >
                <Play className="w-5 h-5" fill="white" />
                צפה עכשיו
              </Link>
              <Link
                to={`/detail/${item.type}/${item.id}`}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold backdrop-blur-sm transition-all"
              >
                <Info className="w-5 h-5" />
                פרטים
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dots */}
      {items.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? 'w-6 bg-sb-red' : 'w-1.5 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* Arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={() => goTo((index - 1 + items.length) % items.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => goTo((index + 1) % items.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}

export default HeroBanner;
