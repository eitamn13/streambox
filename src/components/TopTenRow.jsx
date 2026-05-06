import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

function TopTenRow({ items }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  const topTen = items.slice(0, 10);

  return (
    <section className="py-6 animate-fade-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-5 px-1">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">טופ 10</h2>
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
            {topTen.map((item, idx) => (
              <Link
                key={`top-${item.type}-${item.id}`}
                to={`/detail/${item.type}/${item.id}`}
                className="group relative block w-[160px] sm:w-[200px] flex-shrink-0"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#1a1a2e]">
                  {item.poster ? (
                    <img
                      src={item.poster}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#232330]">
                      <span className="text-4xl font-black text-white/10">{idx + 1}</span>
                    </div>
                  )}

                  {/* Big number behind poster */}
                  <div className="absolute -left-3 bottom-0 z-0 pointer-events-none select-none">
                    <span
                      className="text-[100px] sm:text-[130px] font-black leading-none"
                      style={{
                        color: 'transparent',
                        WebkitTextStroke: '2px rgba(255,255,255,0.2)',
                        fontFamily: "'Inter', system-ui, sans-serif",
                      }}
                    >
                      {idx + 1}
                    </span>
                  </div>

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />

                  {/* Rating badge */}
                  {item.rating > 0 && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5 z-10">
                      <Star className="w-3 h-3 text-[#f5c518]" fill="currentColor" />
                      <span className="text-[10px] font-bold text-white">{item.rating.toFixed(1)}</span>
                    </div>
                  )}

                  {/* Hover info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-10">
                    <h4 className="text-sm font-bold text-white line-clamp-1">{item.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#a0a0a0]">
                      <span>{item.type === 'tv' ? 'סדרה' : 'סרט'}</span>
                      {item.year && <span>{item.year}</span>}
                    </div>
                  </div>
                </div>

                {/* Hebrew title below */}
                <h3 className="mt-2 text-sm font-medium text-white group-hover:text-[#e50914] transition-colors line-clamp-2">
                  {item.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TopTenRow;
