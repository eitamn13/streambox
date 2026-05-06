import { Link } from 'react-router-dom';
import { Star, Play, Clock, Film } from 'lucide-react';

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
  // Assign a platform based on item id for demo purposes
  // In real app this would come from data
  const platforms = Object.keys(PLATFORM_STYLES);
  const index = (item.id || 0) % platforms.length;
  return PLATFORM_STYLES[platforms[index]];
}

function ContentCard({ item, showSourceIndicator = false, variant = 'default' }) {
  const hasSources = item.hasSources !== false;
  const platform = getPlatformStyle(item);

  if (variant === 'compact') {
    return (
      <Link
        to={`/detail/${item.type}/${item.id}`}
        className="group relative block animate-fade-in"
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

          {/* Year badge */}
          {item.year && (
            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5 z-10">
              <span className="text-[10px] text-white font-medium">{item.year}</span>
            </div>
          )}
        </div>

        {/* Hebrew title below */}
        <h3 className="mt-2 text-xs sm:text-sm font-medium text-white group-hover:text-[#e50914] transition-colors line-clamp-2 leading-snug">
          {item.title}
        </h3>
      </Link>
    );
  }

  return (
    <Link
      to={`/detail/${item.type}/${item.id}`}
      className="group relative block animate-fade-in"
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#1a1a2e] card-hover">
        {item.poster ? (
          <img
            src={item.poster}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#232330]">
            <Film className="w-10 h-10 text-[#8b8b9a]" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />

        {/* Hover play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-14 h-14 rounded-full bg-[#e50914] flex items-center justify-center shadow-2xl animate-glow-pulse">
            <Play className="w-6 h-6 text-white mr-0.5" fill="white" />
          </div>
        </div>

        {/* IMDb Rating badge - yellow */}
        {item.rating > 0 && (
          <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-[#f5c518] rounded px-1.5 py-0.5 z-10">
            <Star className="w-3 h-3 text-black" fill="currentColor" />
            <span className="text-[11px] font-black text-black">{item.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Platform badge */}
        <div
          className="absolute top-2 right-2 w-7 h-7 rounded-md flex items-center justify-center text-[9px] font-black z-10"
          style={{ background: platform.bg, color: platform.text }}
        >
          {platform.label}
        </div>

        {/* Source indicator - green dot for available */}
        {showSourceIndicator && hasSources && (
          <div className="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full bg-[#46d369] shadow-[0_0_8px_rgba(70,211,105,0.6)] z-10" />
        )}

        {/* Source indicator - red dot for unavailable */}
        {showSourceIndicator && !hasSources && (
          <div className="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full bg-[#e50914] shadow-[0_0_8px_rgba(229,9,20,0.6)] z-10" />
        )}

        {/* Year badge */}
        {item.year && (
          <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-0.5 z-10">
            <span className="text-[10px] text-white font-medium">{item.year}</span>
          </div>
        )}

        {/* Expanded info on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 card-info-hover z-10">
          <h4 className="text-sm font-bold text-white line-clamp-1 mb-1">{item.title}</h4>
          <div className="flex items-center gap-2 text-[10px] text-[#a0a0a0]">
            {item.type === 'tv' ? (
              <span>סדרה</span>
            ) : (
              <span>סרט</span>
            )}
            {item.runtime && (
              <span className="flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {item.runtime} דק'
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Title below card */}
      <h3 className="mt-2.5 text-sm font-medium text-white group-hover:text-[#e50914] transition-colors line-clamp-2 leading-snug">
        {item.title}
      </h3>
    </Link>
  );
}

export default ContentCard;
