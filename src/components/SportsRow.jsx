import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Trophy, Flame } from 'lucide-react';

const SPORTS_CATEGORIES = [
  { id: 'football', name: 'כדורגל', icon: '⚽', color: '#22c55e' },
  { id: 'basketball', name: 'NBA', icon: '🏀', color: '#f97316' },
  { id: 'ufc', name: 'UFC', icon: '🥊', color: '#dc2626' },
  { id: 'f1', name: 'פורמולה 1', icon: '🏎️', color: '#ef4444' },
  { id: 'tennis', name: 'טניס', icon: '🎾', color: '#eab308' },
  { id: 'champions', name: 'ליגת האלופות', icon: '🏆', color: '#3b82f6' },
];

const LIVE_MATCHES = [
  { id: 1, league: 'ליגת האלופות', home: 'ריאל מדריד', away: 'מנצ׳סטר סיטי', time: 'חי עכשיו', isLive: true, homeScore: 2, awayScore: 1 },
  { id: 2, league: 'פרמייר ליג', home: 'ארסנל', away: 'ליברפול', time: '21:00', isLive: false, homeScore: null, awayScore: null },
  { id: 3, league: 'NBA', home: 'לייקרס', away: 'סלטיקס', time: '03:30', isLive: false, homeScore: null, awayScore: null },
  { id: 4, league: 'UFC', home: 'מקגרגור', away: 'צ׳נדרלר', time: 'שבת', isLive: false, homeScore: null, awayScore: null },
  { id: 5, league: 'ליגת האלופות', home: 'ברצלונה', away: 'ביירן מינכן', time: 'חי עכשיו', isLive: true, homeScore: 1, awayScore: 1 },
];

function SportsRow() {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const amount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-4 mb-4">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* Sports categories */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto hide-scrollbar">
          {SPORTS_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a2e] border border-white/5 hover:border-white/20 hover:bg-[#2a2a3e] transition-all flex-shrink-0"
            >
              <span className="text-lg">{cat.icon}</span>
              <span className="text-sm font-medium text-white">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Live matches row */}
        <div className="flex items-center gap-3 mb-3 px-1">
          <Flame className="w-5 h-5 text-[#e50914]" />
          <h2 className="row-title">ספורט חי</h2>
          <div className="flex-1" />
          <button onClick={() => scroll('right')} className="p-2 text-[#808090] hover:text-white rounded-lg hover:bg-white/5 transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
          <button onClick={() => scroll('left')} className="p-2 text-[#808090] hover:text-white rounded-lg hover:bg-white/5 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <div ref={scrollRef} className="scroll-row hide-scrollbar -mx-4 px-4">
          {LIVE_MATCHES.map((match) => (
            <div
              key={match.id}
              className="group relative flex-shrink-0 w-[280px] sm:w-[320px] bg-[#1a1a2e] rounded-xl overflow-hidden border border-white/5 hover:border-white/15 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-[#808090]">{match.league}</span>
                  {match.isLive && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[#e50914]">
                      <span className="w-2 h-2 rounded-full bg-[#e50914] animate-pulse" />
                      חי
                    </span>
                  )}
                  {!match.isLive && (
                    <span className="text-xs text-[#808090]">{match.time}</span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 text-right">
                    <p className="text-white font-bold text-sm">{match.home}</p>
                    {match.homeScore !== null && (
                      <p className="text-xl font-black text-white mt-1">{match.homeScore}</p>
                    )}
                  </div>

                  <div className="shrink-0 text-[#808090] text-xs font-bold">VS</div>

                  <div className="flex-1 text-left">
                    <p className="text-white font-bold text-sm">{match.away}</p>
                    {match.awayScore !== null && (
                      <p className="text-xl font-black text-white mt-1">{match.awayScore}</p>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                  <Link
                    to="/live-tv"
                    className="flex items-center gap-1.5 text-xs text-[#e50914] hover:text-[#f40612] font-bold transition-colors"
                  >
                    <Play className="w-3 h-3" fill="currentColor" />
                    צפה עכשיו
                  </Link>
                  <Trophy className="w-4 h-4 text-[#f5c518]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SportsRow;
