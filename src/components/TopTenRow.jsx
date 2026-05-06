import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star, Play, Plus } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback.jsx';

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
    <section className="py-4 animate-fade-up">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <h2 className="row-title mb-1 px-1">טופ 10 בישראל</h2>

        <div className="relative row-container group">
          <button onClick={() => scroll('right')} className="row-nav-btn right hidden md:flex">
            <ChevronRight className="w-10 h-10" />
          </button>
          <button onClick={() => scroll('left')} className="row-nav-btn left hidden md:flex">
            <ChevronLeft className="w-10 h-10" />
          </button>

          <div ref={scrollRef} className="scroll-row hide-scrollbar -mx-4 px-4">
            {topTen.map((item, idx) => (
              <Link
                key={`top-${item.type}-${item.id}`}
                to={`/detail/${item.type}/${item.id}`}
                className="group relative block w-[180px] sm:w-[220px] md:w-[260px] flex-shrink-0"
              >
                <div className="relative flex items-end h-[180px] sm:h-[220px] md:h-[260px]">
                  {/* Big number behind poster */}
                  <div className="absolute right-0 bottom-0 z-0 pointer-events-none select-none">
                    <span
                      className="text-[120px] sm:text-[160px] md:text-[200px] font-black leading-[0.8]"
                      style={{
                        color: 'transparent',
                        WebkitTextStroke: '3px rgba(100,150,255,0.2)',
                        fontFamily: "'Inter', system-ui, sans-serif",
                      }}
                    >
                      {idx + 1}
                    </span>
                  </div>

                  {/* Poster */}
                  <div className="relative z-10 w-[100px] sm:w-[130px] md:w-[150px] aspect-[2/3] rounded-md overflow-hidden bg-[#1a1a2e] ml-2 transition-transform duration-300 group-hover:scale-105">
                    {item.poster ? (
                      <ImageWithFallback src={item.poster} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#2a2a3e]">
                        <span className="text-3xl font-black text-white/10">{idx + 1}</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    <div className="absolute inset-0 flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                          <Play className="w-3 h-3 text-black mr-0.5" fill="black" />
                        </div>
                        <div className="w-6 h-6 rounded-full border border-white/50 flex items-center justify-center text-white">
                          <Plus className="w-3 h-3" />
                        </div>
                      </div>
                    </div>

                    {item.rating > 0 && (
                      <div className="absolute top-1.5 left-1.5 imdb-badge z-10">
                        <Star className="w-2 h-2" fill="black" />
                        <span>{item.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="mt-2 text-sm font-medium text-white group-hover:text-[#e5e5e5] transition-colors line-clamp-1 px-1">
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
