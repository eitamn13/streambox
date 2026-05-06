import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, ChevronLeft, ChevronRight, Clock, Film } from 'lucide-react';

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

function ContentRow({ title, items, loading = false }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <section className="py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-6 w-40 bg-[#232330] rounded-lg animate-shimmer mb-4" />
          <div className="scroll-row hide-scrollbar">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-[150px] sm:w-[170px] aspect-[2/3] bg-[#1a1a2e] rounded-xl animate-shimmer" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <section className="py-5 animate-fade-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-4 px-1">
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">{title}</h2>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <button
              onClick={() => scroll('right')}
              className="p-2 text-[#a0a0a0] hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('left')}
              className="p-2 text-[#a0a0a0] hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Row with side arrows */}
        <div className="relative row-container">
          <button
            onClick={() => scroll('right')}
            className="row-nav-btn right hidden md:flex"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
          <button
            onClick={() => scroll('left')}
            className="row-nav-btn left hidden md:flex"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <div ref={scrollRef} className="scroll-row hide-scrollbar -mx-4 px-4">
            {items.map((item) => {
              const platform = getPlatformStyle(item);
              return (
                <Link
                  key={`${item.type}-${item.id}`}
                  to={`/detail/${item.type}/${item.id}`}
                  className="group relative block w-[150px] sm:w-[170px]"
                >
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#1a1a2e] transition-transform duration-300 group-hover:scale-105 group-hover:shadow-2xl">
                    {item.poster ? (
                      <img
                        src={item.poster}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#232330]">
                        <Film className="w-8 h-8 text-[#8b8b9a]" />
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />

                    {/* Hover play button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="w-12 h-12 rounded-full bg-[#e50914] flex items-center justify-center shadow-xl">
                        <Play className="w-5 h-5 text-white mr-0.5" fill="white" />
                      </div>
                    </div>

                    {/* IMDb Rating badge - yellow */}
                    {item.rating > 0 && (
                      <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-[#f5c518] rounded px-1 py-0.5 z-10">
                        <Star className="w-2.5 h-2.5 text-black" fill="currentColor" />
                        <span className="text-[10px] font-black text-black">{item.rating.toFixed(1)}</span>
                      </div>
                    )}

                    {/* Platform badge */}
                    <div
                      className="absolute top-2 right-2 w-6 h-6 rounded flex items-center justify-center text-[8px] font-black z-10"
                      style={{ background: platform.bg, color: platform.text }}
                    >
                      {platform.label}
                    </div>

                    {/* Progress bar for continue watching */}
                    {item.progress > 0 && item.duration > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 z-10">
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{ width: `${(item.progress / item.duration) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Hover info */}
                    <div className="absolute bottom-0 left-0 right-0 p-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-10">
                      <h4 className="text-xs font-bold text-white line-clamp-1">{item.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[9px] text-[#a0a0a0]">
                        <span>{item.type === 'tv' ? 'סדרה' : 'סרט'}</span>
                        {item.year && <span>{item.year}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Hebrew title below */}
                  <h3 className="mt-2 text-xs sm:text-sm font-medium text-white group-hover:text-[#e50914] transition-colors line-clamp-2">
                    {item.title}
                  </h3>
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
