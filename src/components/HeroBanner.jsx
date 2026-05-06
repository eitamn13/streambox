import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info, ChevronRight, ChevronLeft, Star, Clock, Volume2, VolumeX } from 'lucide-react';

function HeroBanner({ items }) {
  const [index, setIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);

  const goTo = useCallback((i) => {
    if (transitioning) return;
    setTransitioning(true);
    setShowTrailer(false);
    setIndex(i);
    setTimeout(() => setTransitioning(false), 700);
  }, [transitioning]);

  useEffect(() => {
    if (!items || items.length <= 1) return;
    const interval = setInterval(() => {
      goTo((index + 1) % items.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [items, index, goTo]);

  if (!items || items.length === 0) return null;

  const item = items[index];
  const ageRating = item.id % 3 === 0 ? '16+' : item.id % 3 === 1 ? '13+' : '18+';
  const quality = item.rating > 7.5 ? '4K HDR' : 'HD';
  const matchScore = Math.min(98, 85 + (item.id % 15));

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: 'clamp(400px, 65vh, 750px)' }}
      onMouseEnter={() => setShowTrailer(true)}
      onMouseLeave={() => { setShowTrailer(false); setIsMuted(true); }}
    >
      {/* Background */}
      <div className="absolute inset-0">
        {items.map((it, i) => (
          <div
            key={it.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${i === index ? 'opacity-100' : 'opacity-0'}`}
          >
            {it.backdrop ? (
              <>
                <img
                  src={it.backdrop}
                  alt={it.title}
                  className={`w-full h-full object-cover transition-transform duration-[10000ms] ease-out ${i === index ? 'scale-105' : 'scale-100'}`}
                />
                {showTrailer && i === index && (
                  <div className="absolute inset-0 bg-black/20 animate-fade-in" />
                )}
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a]" />
            )}
            <div className="absolute inset-0 hero-vignette" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] via-[#0f0f1a]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#0f0f1a]/30 to-[#0f0f1a]/70" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f0f1a]/70 via-transparent to-transparent" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex items-end">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 w-full pb-20 sm:pb-28">
          <div className="max-w-2xl animate-fade-up">
            {/* Match + meta */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="match-badge">{matchScore}% התאמה</span>
              <span className="text-[#b3b3c0] text-sm">{item.year}</span>
              <span className="age-badge">{ageRating}</span>
              <span className="quality-badge">{quality}</span>
              {item.runtime && (
                <span className="text-[#b3b3c0] text-sm flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {item.runtime} דק'
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight drop-shadow-2xl">
              {item.title}
            </h1>

            <p className="text-[#b3b3c0] text-sm mb-3">
              כוכבים: ליאור אשכנזי, שלמה בראבא, רונית אלקבץ
            </p>

            <p className="text-white/90 text-sm sm:text-base lg:text-lg leading-relaxed mb-8 line-clamp-3 drop-shadow-lg max-w-xl">
              {item.overview}
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <Link
                to={`/player/${item.type}/${item.id}`}
                className="flex items-center gap-2.5 bg-white hover:bg-white/90 text-black px-8 py-3 rounded-md font-bold text-base transition-all hover:scale-105"
              >
                <Play className="w-5 h-5" fill="black" />
                צפה עכשיו
              </Link>
              <Link
                to={`/detail/${item.type}/${item.id}`}
                className="flex items-center gap-2.5 bg-[#6d6d6d]/70 hover:bg-[#6d6d6d]/90 text-white px-8 py-3 rounded-md font-bold text-base backdrop-blur-sm transition-all hover:scale-105"
              >
                <Info className="w-5 h-5" />
                מידע נוסף
              </Link>
              {showTrailer && (
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center text-white hover:bg-white/10 transition-all"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress dots */}
      {items.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
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
