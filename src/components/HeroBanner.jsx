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
    setTimeout(() => setTransitioning(false), 700);
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
    <div className="relative w-full h-[65vh] sm:h-[75vh] lg:h-[85vh] overflow-hidden">
      {/* Background with Ken Burns effect */}
      <div className="absolute inset-0">
        {items.map((it, i) => (
          <div
            key={it.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${i === index ? 'opacity-100' : 'opacity-0'}`}
          >
            {it.backdrop ? (
              <img
                src={it.backdrop}
                alt={it.title}
                className={`w-full h-full object-cover transition-transform duration-[8000ms] ease-out ${i === index ? 'scale-105' : 'scale-100'}`}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#12121a] to-[#1a1a2e]" />
            )}
            {/* Dark cinematic vignette */}
            <div className="absolute inset-0 hero-vignette" />
            {/* Dark bottom gradient - stronger */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/70 to-[#0a0a0f]/30" />
            {/* Dark side gradient for text readability */}
            <div className="absolute inset-0 bg-gradient-to-l from-[#0a0a0f]/70 via-[#0a0a0f]/30 to-[#0a0a0f]/50" />
            {/* Top dark gradient for nav readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/60 via-transparent to-transparent" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex items-end">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full pb-16 sm:pb-24">
          <div className="max-w-2xl animate-fade-up">
            {/* Meta info */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {item.rating > 0 && (
                <span className="flex items-center gap-1 text-[#f5c518] text-sm font-bold">
                  <Star className="w-4 h-4" fill="currentColor" />
                  {item.rating.toFixed(1)}
                </span>
              )}
              {item.year && (
                <span className="text-[#a0a0a0] text-sm">{item.year}</span>
              )}
              {item.runtime && (
                <span className="flex items-center gap-1 text-[#a0a0a0] text-sm">
                  <Clock className="w-3.5 h-3.5" />
                  {item.runtime} דק'
                </span>
              )}
              <span className="text-[#a0a0a0] text-sm">
                {item.type === 'tv' ? 'סדרה' : 'סרט'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight drop-shadow-2xl">
              {item.title}
            </h1>

            <p className="text-white/80 text-sm sm:text-base lg:text-lg leading-relaxed mb-8 line-clamp-3 drop-shadow-lg max-w-xl">
              {item.overview}
            </p>

            <div className="flex items-center gap-4">
              <Link
                to={`/player/${item.type}/${item.id}`}
                className="flex items-center gap-2.5 bg-[#e50914] hover:bg-[#c00710] text-white px-8 py-3 rounded-lg font-bold text-base transition-all shadow-lg shadow-[#e50914]/20 hover:shadow-xl hover:shadow-[#e50914]/30 hover:-translate-y-0.5 active:translate-y-0"
              >
                <Play className="w-5 h-5" fill="white" />
                צפה עכשיו
              </Link>
              <Link
                to={`/detail/${item.type}/${item.id}`}
                className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-lg font-bold text-base backdrop-blur-sm transition-all hover:-translate-y-0.5 active:translate-y-0 border border-white/10"
              >
                <Info className="w-5 h-5" />
                פרטים
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Progress dots */}
      {items.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === index ? 'w-8 bg-[#e50914]' : 'w-1.5 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}

      {/* Navigation arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={() => goTo((index - 1 + items.length) % items.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center text-white transition-all hover:scale-110 border border-white/10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => goTo((index + 1) % items.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center text-white transition-all hover:scale-110 border border-white/10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
    </div>
  );
}

export default HeroBanner;
