import { Link } from 'react-router-dom';
import { Star, Play } from 'lucide-react';

function ContentCard({ item }) {
  return (
    <Link to={`/detail/${item.type}/${item.id}`} className="group relative block animate-fade-in">
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
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="w-12 h-12 rounded-full bg-sb-red/90 flex items-center justify-center">
            <Play className="w-6 h-6 text-white mr-0.5" fill="white" />
          </div>
        </div>
        {item.rating > 0 && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5">
            <Star className="w-3 h-3 text-sb-gold" fill="currentColor" />
            <span className="text-xs font-semibold text-white">{item.rating.toFixed(1)}</span>
          </div>
        )}
        {item.year && (
          <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5">
            <span className="text-[10px] text-sb-light">{item.year}</span>
          </div>
        )}
      </div>
      <h3 className="mt-2 text-sm font-medium text-sb-light group-hover:text-white transition-colors line-clamp-2">
        {item.title}
      </h3>
    </Link>
  );
}

export default ContentCard;
