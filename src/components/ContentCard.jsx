import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Play, Plus, Check, Volume2, VolumeX } from 'lucide-react';

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

function ContentCard({ item, showSourceIndicator = false, variant = 'default', inWatchlist = false, onToggleWatchlist }) {
  const hasSources = item.hasSources !== false;
  const platform = getPlatformStyle(item);
  const quality = getQuality(item);
  const ageRating = getAgeRating(item);
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const handleWatchlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleWatchlist) onToggleWatchlist(item);
  };

  if (variant === 'compact') {
    return (
      <Link
        to={`/detail/${item.type}/${item.id}`}
        className="group relative block animate-fade-in"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-[#1a1a2e] transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl">
          {item.poster ? (
            <img src={item.poster} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#2a2a3e]">
              <span className="text-2xl font-black text-white/10">{item.title?.charAt(0)}</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <Play className="w-5 h-5 text-white mr-0.5" fill="white" />
            </div>
          </div>

          {item.rating > 0 && (
            <div className="absolute top-2 left-2 imdb-badge z-10">
              <Star className="w-2.5 h-2.5" fill="black" />
              <span>{item.rating.toFixed(1)}</span>
            </div>
          )}

          <div className="absolute top-2 right-2 w-5 h-5 rounded flex items-center justify-center text-[7px] font-black z-10" style={{ background: platform.bg, color: platform.text }}>
            {platform.label}
          </div>

          <div className="absolute bottom-2 left-2 quality-badge z-10">{quality}</div>
        </div>

        <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#46d369] text-xs font-bold">{Math.min(98, 85 + (item.id % 15))}% התאמה</span>
            <span className="age-badge text-[9px]">{ageRating}</span>
            <span className="text-[#b3b3c0] text-[10px]">{item.year}</span>
          </div>
          <h3 className="text-xs font-medium text-white line-clamp-1">{item.title}</h3>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/detail/${item.type}/${item.id}`}
      className="group relative block animate-fade-in"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-[#1a1a2e] transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:z-20">
        {item.poster ? (
          <img src={item.poster} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#2a2a3e]">
            <span className="text-4xl font-black text-white/10">{item.title?.charAt(0)}</span>
          </div>
        )}

        {/* Simulated hover trailer overlay */}
        {isHovered && item.backdrop && (
          <div className="hover-trailer">
            <img src={item.backdrop} alt="" className="w-full h-full object-cover animate-fade-in" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMuted(!isMuted); }}
              className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white z-20"
            >
              {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            </button>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />

        {/* Hover controls */}
        <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <Play className="w-4 h-4 text-black mr-0.5" fill="black" />
            </div>
            <button
              onClick={handleWatchlistClick}
              className="w-8 h-8 rounded-full border border-white/50 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            >
              {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
          <h4 className="text-sm font-bold text-white line-clamp-1 mb-1">{item.title}</h4>
          <div className="flex items-center gap-2 text-[10px] text-[#b3b3c0]">
            <span className="text-[#46d369] font-bold">{Math.min(98, 85 + (item.id % 15))}%</span>
            <span className="age-badge">{ageRating}</span>
            <span>{item.type === 'tv' ? 'סדרה' : 'סרט'}</span>
            {item.runtime && <span>{item.runtime} דק'</span>}
          </div>
        </div>

        {item.rating > 0 && (
          <div className="absolute top-2 left-2 imdb-badge z-10">
            <Star className="w-3 h-3" fill="black" />
            <span>{item.rating.toFixed(1)}</span>
          </div>
        )}

        <div className="absolute top-2 right-2 w-7 h-7 rounded-md flex items-center justify-center text-[9px] font-black z-10" style={{ background: platform.bg, color: platform.text }}>
          {platform.label}
        </div>

        {showSourceIndicator && hasSources && (
          <div className="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full bg-[#46d369] shadow-[0_0_8px_rgba(70,211,105,0.6)] z-10" />
        )}
        {showSourceIndicator && !hasSources && (
          <div className="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full bg-[#e50914] shadow-[0_0_8px_rgba(229,9,20,0.6)] z-10" />
        )}

        <div className="absolute bottom-2 left-2 quality-badge z-10">{quality}</div>
      </div>
    </Link>
  );
}

export default ContentCard;
