import { Link } from 'react-router-dom';
import { Play, Star } from 'lucide-react';

function ContentRow({ title, items, loading = false }) {
  if (loading) {
    return (
      <section className="py-4">
        <div className="h-5 w-36 bg-sb-surface rounded animate-shimmer mb-3" />
        <div className="scroll-row hide-scrollbar">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-[140px] sm:w-[160px] aspect-[2/3] bg-sb-card rounded-xl animate-shimmer" />
          ))}
        </div>
      </section>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <section className="py-4 animate-fade-up">
      <h2 className="text-base sm:text-lg font-bold text-white mb-3 px-1">{title}</h2>
      <div className="scroll-row hide-scrollbar -mx-4 px-4">
        {items.map((item) => (
          <Link
            key={`${item.type}-${item.id}`}
            to={`/detail/${item.type}/${item.id}`}
            className="group relative block w-[140px] sm:w-[160px]"
          >
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-sb-card card-hover">
              {item.poster ? (
                <img
                  src={item.poster}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-sb-surface">
                  <Play className="w-10 h-10 text-sb-gray" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-sb-red/90 flex items-center justify-center shadow-lg">
                  <Play className="w-5 h-5 text-white mr-0.5" fill="white" />
                </div>
              </div>
              {item.rating > 0 && (
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5">
                  <Star className="w-3 h-3 text-sb-gold" fill="currentColor" />
                  <span className="text-[10px] font-bold text-white">{item.rating.toFixed(1)}</span>
                </div>
              )}
              {item.progress > 0 && item.duration > 0 && (
                <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${(item.progress / item.duration) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            <h3 className="mt-2 text-xs sm:text-sm font-medium text-sb-light group-hover:text-white transition-colors line-clamp-2">
              {item.title}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default ContentRow;
