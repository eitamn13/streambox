import { useState } from 'react';
import { Film, Tv } from 'lucide-react';

function ImageWithFallback({ src, alt, className = '', type = 'poster' }) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (error || !src) {
    const initials = alt
      ?.split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('') || '?';

    return (
      <div className={`${className} bg-[#1a1a2e] flex items-center justify-center`}>
        <div className="text-center">
          {type === 'logo' ? (
            <Tv className="w-8 h-8 text-[#33334a] mx-auto mb-1" />
          ) : (
            <Film className="w-8 h-8 text-[#33334a] mx-auto mb-1" />
          )}
          <span className="text-xs font-bold text-[#44445c]">{initials}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div className={`${className} absolute inset-0 bg-[#1a1a2e] animate-shimmer z-10`} />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </>
  );
}

export default ImageWithFallback;
