import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const PLATFORM_STYLES = {
  netflix: { bg: '#e50914', text: '#fff', label: 'N' },
  hbo: { bg: '#9b59b6', text: '#fff', label: 'HBO' },
  disney: { bg: '#113ccf', text: '#fff', label: 'D+' },
  appletv: { bg: '#1d1d1f', text: '#fff', label: 'tv' },
  prime: { bg: '#00a8e1', text: '#fff', label: 'P' },
  yes: { bg: '#0066cc', text: '#fff', label: 'yes' },
  hot: { bg: '#ff6b00', text: '#fff', label: 'HOT' },
};

function getPlatformStyle(item) {
  const platforms = Object.keys(PLATFORM_STYLES);
  const index = (item.id || 0) % platforms.length;
  return PLATFORM_STYLES[platforms[index]];
}

function getQuality(item) {
  if (item.rating > 8) return '4K HDR';
  if (item.rating > 7) return 'HD';
  return 'HD';
}

function getAgeRating(item) {
  const ratings = ['13+', '16+', '18+', '7+', 'כללית'];
  return ratings[(item.id || 0) % ratings.length];
}

function ContentRow({ title, items, loading = false, showProgress = false }) {
  const scrollRef = useRef(null);
  const [hoveredId, setHoveredId] = useState(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const scrollAmount = direction === 'left' ? -container.clientWidth * 0.75 : container.clientWidth * 0.75;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <section className="py-2 mb-4">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="h-6 w-40 bg-[#2a2a3e] rounded animate-shimmer mb-4" />
          <div className="scroll-row hide-scrollbar">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-[150px] sm:w-[200px] aspect-[2/3] bg-[#1a1a2e] rounded-md animate-shimmer" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <section className="py-2 mb-4 animate-fade-up">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-1 px-1">
          <h2 className="row-title">{title}</h2>
          <button
            onClick={() => scroll('right')}
            className="text-[#54b9c5] text-xs font-bold opacity-0 hover:opacity-100 transition-opacity hidden sm:block"
          >
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
              const quality = getQuality(item);
              const ageRating = getAgeRating(item);
              const isHovered = hoveredId === `${item.type}-${item.id}`;

              return (
                <Link
                  key={`${item.type}-${item.id}`}
                  to={`/detail/${item.type}/${item.id}`}
                  className="group relative block w-[150px] sm:w-[200px] md:w-[240px]"
                  onMouseEnter={() => setHoveredId(`${item.type}-${item.id}`)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-[#1a1a2e] transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:z-20">
                    {item.poster ? (
                      <img src={item.poster} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#2a2a3e]">
                        <span className="text-3xl font-black text-white/10">{item.title?.charAt(0)}</span>
                      </div>
                    )}

                    {/* Simulated hover trailer */}
                    {isHovered && item.backdrop && (
                      <div className="hover-trailer">
                        <img src={item.backdrop} alt="" className="w-full h-full object-cover animate-fade-in" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />

                    {/* Hover controls */}
                    <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                          <Play className="w-4 h-4 text-black mr-0.5" fill="black" />
                        </div>
                        <div className="w-8 h-8 rounded-full border border-white/50 flex items-center justify-center text-white hover:bg-white/10">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-white line-clamp-1 mb-1">{item.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-[#b3b3c0]">
                        <span className="text-[#46d369] font-bold">{Math.min(98, 85 + (item.id % 15))}%</span>
                        <span className="age-badge">{ageRating}</span>
                        <span>{item.type === 'tv' ? 'סדרה' : 'סרט'}</span>
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
                    <div className="absolute top-2 right-2 w-6 h-6 rounded flex items-center justify-center text-[8px] font-black z-10" style={{ background: platform.bg, color: platform.text }}>
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
                    <div className="absolute bottom-2 left-2 quality-badge z-10">{quality}</div>
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
