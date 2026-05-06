import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, ChevronLeft, ChevronRight, Plus, Volume2, VolumeX, Info } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback.jsx';

const PLATFORM_STYLES = {
  netflix: { bg: '#e50914', label: 'N' },
  hbo: { bg: '#9b59b6', label: 'HBO' },
  disney: { bg: '#113ccf', label: 'D+' },
  appletv: { bg: '#1d1d1f', label: 'tv' },
  prime: { bg: '#00a8e1', label: 'P' },
};

function getPlatformStyle(item) {
  const platforms = Object.keys(PLATFORM_STYLES);
  const index = (item.id || 0) % platforms.length;
  return PLATFORM_STYLES[platforms[index]];
}

function getAgeRating(item) {
  const ratings = ['13+', '16+', '18+', '7+'];
  return ratings[(item.id || 0) % ratings.length];
}

function ContentRow({ title, items, loading = false, showProgress = false }) {
  const scrollRef = useRef(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [previewMuted, setPreviewMuted] = useState(true);
  const [hoverTimer, setHoverTimer] = useState(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const scrollAmount = direction === 'left' ? -container.clientWidth * 0.8 : container.clientWidth * 0.8;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <section className="py-2 mb-2">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="h-5 w-32 bg-[#1a1a2e] rounded animate-shimmer mb-3" />
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-[200px] sm:w-[240px] md:w-[280px] aspect-video bg-[#1a1a2e] rounded-lg animate-shimmer flex-shrink-0" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <section className="py-2 mb-2 animate-fade-up">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-1 px-1">
          <h2 className="row-title">{title}</h2>
          <button onClick={() => scroll('right')} className="text-[#54b9c5] text-xs font-bold opacity-0 hover:opacity-100 transition-opacity hidden sm:block">
            צפה הכל ←
          </button>
        </div>

        <div className="relative row-container group">
          <button onClick={() => scroll('right')} className="row-nav-btn right hidden md:flex">
            <ChevronRight className="w-10 h-10" />
          </button>
          <button onClick={() => scroll('left')} className="row-nav-btn left hidden md:flex">
            <ChevronLeft className="w-10 h-10" />
          </button>

          <div ref={scrollRef} className="scroll-row hide-scrollbar -mx-4 px-4">
            {items.map((item) => {
              const platform = getPlatformStyle(item);
              const ageRating = getAgeRating(item);
              const isHovered = hoveredId === `${item.type}-${item.id}`;
              const matchScore = Math.min(98, 85 + (item.id % 15));

              return (
                <Link
                  key={`${item.type}-${item.id}`}
                  to={`/detail/${item.type}/${item.id}`}
                  className="group relative block w-[180px] sm:w-[220px] md:w-[280px] lg:w-[320px] flex-shrink-0"
                  onMouseEnter={() => {
                    const timer = setTimeout(() => setHoveredId(`${item.type}-${item.id}`), 700);
                    setHoverTimer(timer);
                  }}
                  onMouseLeave={() => {
                    if (hoverTimer) clearTimeout(hoverTimer);
                    setHoveredId(null);
                    setPreviewMuted(true);
                  }}
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-[#1a1a2e] transition-all duration-300 group-hover:scale-105 group-hover:z-20 group-hover:shadow-2xl">
                    {/* Main image - poster or backdrop */}
                    {item.backdrop || item.poster ? (
                      <ImageWithFallback
                        src={item.backdrop || item.poster}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#1a1a2e]">
                        <Star className="w-8 h-8 text-[#33334a]" />
                      </div>
                    )}

                    {/* Simulated preview on hover */}
                    {isHovered && item.backdrop && (
                      <div className="absolute inset-0 bg-black/40 animate-fade-in z-10">
                        <img
                          src={item.backdrop}
                          alt=""
                          className="w-full h-full object-cover animate-fade-in"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewMuted(!previewMuted); }}
                          className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white z-20 hover:bg-black/70"
                        >
                          {previewMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />

                    {/* Hover controls */}
                    <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <Link
                          to={`/player/${item.type}/${item.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:scale-110 transition-transform"
                        >
                          <Play className="w-4 h-4 text-black ml-0.5" fill="black" />
                        </Link>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          className="w-8 h-8 rounded-full border border-white/50 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/detail/${item.type}/${item.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="w-8 h-8 rounded-full border border-white/50 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                        >
                          <Info className="w-4 h-4" />
                        </Link>
                      </div>
                      <h4 className="text-sm font-bold text-white line-clamp-1 mb-1">{item.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-[#b3b3c0]">
                        <span className="text-[#46d369] font-bold">{matchScore}% התאמה</span>
                        <span className="age-badge">{ageRating}</span>
                        <span>{item.type === 'tv' ? 'סדרה' : 'סרט'}</span>
                        {item.year && <span>{item.year}</span>}
                      </div>
                    </div>

                    {/* IMDb Rating */}
                    {item.rating > 0 && (
                      <div className="absolute top-2 left-2 imdb-badge z-10">
                        <Star className="w-2.5 h-2.5" fill="black" />
                        <span>{item.rating.toFixed(1)}</span>
                      </div>
                    )}

                    {/* Platform badge */}
                    <div className="absolute top-2 right-2 w-6 h-6 rounded flex items-center justify-center text-[8px] font-black z-10" style={{ background: platform.bg, color: '#fff' }}>
                      {platform.label}
                    </div>

                    {/* Progress bar */}
                    {showProgress && item.progress > 0 && item.duration > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 z-10">
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${(item.progress / item.duration) * 100}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Quality badge */}
                    <div className="absolute bottom-2 left-2 quality-badge z-10">HD</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContentRow;
