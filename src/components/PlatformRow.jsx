const PLATFORMS = [
  { id: 'netflix', name: 'Netflix', color: '#e50914', logo: 'N' },
  { id: 'hbo', name: 'HBO', color: '#9b59b6', logo: 'HBO' },
  { id: 'disney', name: 'Disney+', color: '#113ccf', logo: 'D+' },
  { id: 'appletv', name: 'Apple TV', color: '#1d1d1f', logo: 'tv' },
  { id: 'prime', name: 'Prime Video', color: '#00a8e1', logo: 'P' },
  { id: 'yes', name: 'yes', color: '#0066cc', logo: 'yes' },
  { id: 'hot', name: 'HOT', color: '#ff6b00', logo: 'HOT' },
];

function PlatformRow({ selected, onSelect }) {
  return (
    <section className="py-4 animate-fade-up">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="platform-row hide-scrollbar">
          {PLATFORMS.map((platform) => {
            const isActive = selected === platform.id;
            return (
              <button
                key={platform.id}
                onClick={() => onSelect(isActive ? null : platform.id)}
                className={`relative flex-shrink-0 flex items-center gap-2.5 px-5 py-2.5 rounded-full border transition-all duration-300 ${
                  isActive
                    ? 'bg-white text-black border-white font-bold shadow-lg'
                    : 'bg-[#1f1f1f]/80 text-white border-white/10 hover:border-white/30 hover:bg-[#2a2a2a]'
                }`}
              >
                <span
                  className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black"
                  style={{
                    background: isActive ? '#000' : platform.color,
                    color: '#fff',
                  }}
                >
                  {platform.logo}
                </span>
                <span className="text-sm font-medium whitespace-nowrap">{platform.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default PlatformRow;
