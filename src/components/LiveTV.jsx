import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Link as LinkIcon,
  X,
  Loader2,
  Play,
  CalendarDays,
  Clock,
  Star,
  Filter,
  Tv,
  Radio,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext.jsx';
import LiveTVPlayer from './LiveTVPlayer.jsx';
import ImageWithFallback from './ImageWithFallback.jsx';
import { fetchM3U, getCategories, detectCategory } from '../utils/m3uParser.js';
import { fetchEPG, getChannelEPG, formatEPGTime, getCurrentProgram } from '../utils/epgParser.js';
import { getBuiltInChannels } from '../data/builtInChannels.js';

const CATEGORY_LABELS = {
  all: 'הכל',
  sport: 'ספורט',
  news: 'חדשות',
  movies: 'סרטים',
  kids: 'ילדים',
  music: 'מוזיקה',
  entertainment: 'בידור',
  documentary: 'דוקומנטרי',
};

const CATEGORY_ICONS = {
  sport: '⚽',
  news: '📰',
  movies: '🎬',
  kids: '🧸',
  music: '🎵',
  entertainment: '🎭',
  documentary: '🌍',
};

const IPTV_SOURCES = [
  { id: 'builtin', name: 'ערוצים מובנים', placeholder: '' },
  { id: 'custom', name: 'כתובת מותאמת אישית', placeholder: 'https://example.com/playlist.m3u8' },
];

function LiveTV() {
  const { tvSettings, setTvSettings } = useApp();
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [selectedSource, setSelectedSource] = useState(tvSettings?.source || 'builtin');
  const [m3uUrl, setM3uUrl] = useState(tvSettings?.m3uUrl || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEpg, setShowEpg] = useState(false);
  const [epgData, setEpgData] = useState([]);
  const [epgLoading, setEpgLoading] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sb-tv-favorites') || '[]');
    } catch {
      return [];
    }
  });

  const channels = tvSettings?.channels || [];
  const categories = useMemo(() => getCategories(channels), [channels]);

  // Load built-in channels on first mount if no channels loaded
  useEffect(() => {
    if (!tvSettings?.channels || tvSettings.channels.length === 0) {
      const builtIn = getBuiltInChannels();
      setTvSettings({ source: 'builtin', m3uUrl: '', channels: builtIn });
    }
  }, []);

  // Load EPG on mount
  useEffect(() => {
    let cancelled = false;
    async function loadEPG() {
      setEpgLoading(true);
      try {
        const data = await fetchEPG();
        if (!cancelled) setEpgData(data);
      } catch (e) {
        console.warn('EPG load failed:', e);
      } finally {
        if (!cancelled) setEpgLoading(false);
      }
    }
    loadEPG();
    return () => { cancelled = true; };
  }, []);

  const filteredChannels = useMemo(() => {
    let result = channels;
    if (activeCategory !== 'all') {
      result = result.filter((c) => c.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.group || '').toLowerCase().includes(q)
      );
    }
    // Sort favorites first
    result = result.sort((a, b) => {
      const aFav = favorites.includes(a.id) ? 1 : 0;
      const bFav = favorites.includes(b.id) ? 1 : 0;
      return bFav - aFav;
    });
    return result;
  }, [channels, activeCategory, searchQuery, favorites]);

  const handleSaveUrl = useCallback(async () => {
    if (selectedSource === 'builtin') {
      const builtIn = getBuiltInChannels();
      setTvSettings({ source: 'builtin', m3uUrl: '', channels: builtIn });
      setShowUrlInput(false);
      return;
    }
    if (!m3uUrl.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const parsed = await fetchM3U(m3uUrl.trim());
      setTvSettings({ source: selectedSource, m3uUrl: m3uUrl.trim(), channels: parsed });
      setShowUrlInput(false);
    } catch (err) {
      setError(err.message || 'טעינת הרשימה נכשלה');
    } finally {
      setIsLoading(false);
    }
  }, [m3uUrl, selectedSource, setTvSettings]);

  const toggleFavorite = useCallback((channelId) => {
    setFavorites((prev) => {
      const next = prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId];
      localStorage.setItem('sb-tv-favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  const currentSource = IPTV_SOURCES.find((s) => s.id === selectedSource) || IPTV_SOURCES[0];

  return (
    <div className="page-transition px-4 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-sb-red/20 flex items-center justify-center">
            <Tv className="w-5 h-5 text-sb-red" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">טלוויזיה חיה</h1>
            <p className="text-xs text-sb-gray">{channels.length} ערוצים זמינים • ערוצים ישראליים</p>
          </div>
        </div>
        <button
          onClick={() => setShowUrlInput(!showUrlInput)}
          className={`p-2.5 rounded-xl border transition-colors ${
            showUrlInput
              ? 'bg-sb-red text-white border-sb-red'
              : 'bg-sb-card border-sb-border text-sb-gray hover:text-white hover:border-sb-gray'
          }`}
          title="הגדר מקור ערוצים"
        >
          {showUrlInput ? <X className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
        </button>
      </div>

      {/* Source Config Panel */}
      <AnimatePresence>
        {showUrlInput && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-sb-card rounded-2xl p-5 border border-sb-border mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-sb-light">
                  הגדרות מקור
                </h2>
                <button
                  onClick={() => setShowUrlInput(false)}
                  className="text-sb-gray hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Source selector */}
              <div className="mb-4">
                <label className="text-xs text-sb-gray mb-2 block">בחר ספק</label>
                <div className="grid grid-cols-3 gap-2">
                  {IPTV_SOURCES.map((source) => (
                    <button
                      key={source.id}
                      onClick={() => {
                        setSelectedSource(source.id);
                        if (source.id === 'builtin') setM3uUrl('');
                      }}
                      className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                        selectedSource === source.id
                          ? 'bg-sb-red text-white'
                          : 'bg-sb-surface text-sb-gray hover:text-white'
                      }`}
                    >
                      {source.name}
                    </button>
                  ))}
                </div>
              </div>

              {selectedSource !== 'builtin' && (
                <>
                  <p className="text-xs text-sb-gray mb-3">
  {'הדבק כתובת M3U מותאמת אישית'}
                  </p>

                  <input
                    type="url"
                    value={m3uUrl}
                    onChange={(e) => setM3uUrl(e.target.value)}
                    placeholder={currentSource.placeholder}
                    className="w-full bg-sb-black border border-sb-border rounded-xl px-4 py-3 text-sm text-white placeholder-sb-gray focus:outline-none focus:border-sb-red/60 mb-3"
                  />
                </>
              )}

              {selectedSource === 'builtin' && (
                <p className="text-xs text-sb-gray mb-3">
                  ערוצים ישראליים מובנים — כולל כאן 11, קשת 12, רשת 13, עכשיו 14, ועוד.
                  הערוצים הספורטים והפרימיום דורשים מקור IPTV משלך.
                </p>
              )}

              {error && (
                <p className="text-xs text-red-400 mb-3">{error}</p>
              )}

              <button
                onClick={handleSaveUrl}
                disabled={isLoading || (selectedSource !== 'builtin' && !m3uUrl.trim())}
                className="w-full bg-sb-red hover:bg-sb-red-hover disabled:opacity-50 text-white font-medium text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    טוען ערוצים...
                  </>
                ) : (
                  <>
                    <Radio className="w-4 h-4" />
                    {selectedSource === 'builtin' ? 'טען ערוצים מובנים' : 'טען ערוצים'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player */}
      <AnimatePresence>
        {selectedChannel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="mb-6"
          >
            <LiveTVPlayer
              key={selectedChannel.id}
              src={selectedChannel.url}
              channelName={selectedChannel.name}
              channelLogo={selectedChannel.logo}
            />

            <div className="flex items-center justify-between mt-3 px-1">
              <div className="flex items-center gap-3">
                <ImageWithFallback
                  src={selectedChannel.logo}
                  alt={selectedChannel.name}
                  type="logo"
                  className="w-10 h-10 object-contain rounded-lg bg-[#0f0f1a]"
                />
                <div>
                  <p className="text-white font-medium text-sm">{selectedChannel.name}</p>
                  <ChannelNowPlaying epgData={epgData} channel={selectedChannel} compact />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleFavorite(selectedChannel.id)}
                  className={`p-2 rounded-xl transition-colors ${
                    favorites.includes(selectedChannel.id)
                      ? 'bg-sb-red/20 text-sb-red'
                      : 'bg-sb-surface text-sb-gray hover:text-white'
                  }`}
                >
                  <Star
                    className="w-4 h-4"
                    fill={favorites.includes(selectedChannel.id) ? 'currentColor' : 'none'}
                  />
                </button>
                <button
                  onClick={() => setShowEpg(!showEpg)}
                  className={`p-2 rounded-xl transition-colors ${
                    showEpg
                      ? 'bg-sb-red/20 text-sb-red'
                      : 'bg-sb-surface text-sb-gray hover:text-white'
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedChannel(null)}
                  className="p-2 rounded-xl bg-sb-surface text-sb-gray hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* EPG */}
            <AnimatePresence>
              {showEpg && selectedChannel && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 bg-sb-card rounded-2xl border border-sb-border p-4">
                    <h3 className="text-sm font-semibold text-sb-light mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      לוח שידורים
                    </h3>
                    <EPGDisplay channel={selectedChannel} epgData={epgData} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filters */}
      {channels.length > 0 && (
        <>
          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sb-gray" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חפש ערוץ..."
              className="w-full bg-sb-card border border-sb-border rounded-xl pr-10 pl-4 py-3 text-sm text-white placeholder-sb-gray focus:outline-none focus:border-sb-red/60"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sb-gray hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 hide-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-sb-red text-white'
                    : 'bg-sb-card text-sb-gray hover:bg-sb-surface'
                }`}
              >
                {cat !== 'all' && <span>{CATEGORY_ICONS[cat] || '📺'}</span>}
                {cat === 'all' && <Filter className="w-3 h-3" />}
                {CATEGORY_LABELS[cat] || cat}
              </button>
            ))}
          </div>

          <p className="text-xs text-sb-gray mb-3">
            {filteredChannels.length} מתוך {channels.length} ערוצים
            {epgLoading && (
              <span className="mr-2 inline-flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                טוען לוח שידורים...
              </span>
            )}
          </p>

          {/* Channel Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredChannels.map((channel) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                isSelected={selectedChannel?.id === channel.id}
                isFavorite={favorites.includes(channel.id)}
                epgData={epgData}
                onClick={() => {
                  setSelectedChannel(channel);
                  setShowEpg(false);
                }}
                onToggleFavorite={() => toggleFavorite(channel.id)}
              />
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {channels.length === 0 && !showUrlInput && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-sb-card flex items-center justify-center mb-4">
            <Tv className="w-8 h-8 text-sb-gray" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">אין ערוצים טעונים</h2>
          <p className="text-sm text-sb-gray max-w-xs mb-6">
            בחר מקור ערוצים — ערוצים מובנים או הוסף כתובת M3U משלך.
          </p>
          <button
            onClick={() => setShowUrlInput(true)}
            className="flex items-center gap-2 bg-sb-red hover:bg-sb-red-hover text-white font-medium text-sm py-3 px-6 rounded-xl transition-colors"
          >
            <Radio className="w-4 h-4" />
            בחר מקור
          </button>
        </motion.div>
      )}
    </div>
  );
}

/* ============================================
   Channel Card Component
   ============================================ */
function ChannelCard({ channel, isSelected, isFavorite, epgData, onClick, onToggleFavorite }) {
  const currentProgram = useMemo(() => {
    return getCurrentProgram(epgData, channel.tvgId, channel.name);
  }, [epgData, channel]);

  const hasUrl = !!channel.url;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors text-right relative overflow-hidden ${
        isSelected
          ? 'bg-sb-red/10 border-sb-red/40'
          : 'bg-sb-card border-sb-border hover:border-sb-gray/50'
      }`}
    >
      {/* Live indicator */}
      {hasUrl && (
        <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      )}

      <div className="relative shrink-0 w-14 h-14">
        <ImageWithFallback
          src={channel.logo}
          alt={channel.name}
          type="logo"
          className="w-14 h-14 object-contain rounded-lg bg-[#0f0f1a] p-1"
        />
        {!hasUrl && (
          <div className="absolute inset-0 bg-[#0f0f1a]/60 rounded-lg flex items-center justify-center z-10">
            <WifiOff className="w-5 h-5 text-[#808090]" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 text-right">
        <p className="text-white text-sm font-medium truncate">{channel.name}</p>
        <p className="text-[11px] text-sb-gray truncate">
          {currentProgram ? (
            <span className="flex items-center gap-1 justify-end">
              <span className="w-1.5 h-1.5 rounded-full bg-sb-red animate-pulse" />
              {currentProgram.title}
            </span>
          ) : (
            channel.group
          )}
        </p>
        {channel.isPublic && (
          <span className="inline-block mt-1 text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
            חינם
          </span>
        )}
      </div>

      <div className="flex flex-col items-center gap-1 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={`p-1.5 rounded-lg transition-colors ${
            isFavorite
              ? 'text-sb-red'
              : 'text-sb-gray hover:text-white'
          }`}
        >
          <Star className="w-3.5 h-3.5" fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
        {hasUrl ? (
          <Play className="w-4 h-4 text-sb-gray" />
        ) : (
          <span className="text-[9px] text-sb-gray bg-sb-surface px-1.5 py-0.5 rounded">
            מנוי
          </span>
        )}
      </div>
    </motion.button>
  );
}

/* ============================================
   Now Playing (compact) Component
   ============================================ */
function ChannelNowPlaying({ epgData, channel, compact }) {
  const program = useMemo(() => {
    return getCurrentProgram(epgData, channel.tvgId, channel.name);
  }, [epgData, channel]);

  if (!program) return <p className="text-xs text-sb-gray">אין מידע על תוכנית נוכחית</p>;

  if (compact) {
    return (
      <p className="text-xs text-sb-gray flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-sb-red animate-pulse" />
        {program.title}
        <span className="text-sb-gray/60">
          {formatEPGTime(program.start)}–{formatEPGTime(program.stop)}
        </span>
      </p>
    );
  }
}

/* ============================================
   EPG Display Component
   ============================================ */
function EPGDisplay({ channel, epgData }) {
  const programs = useMemo(() => {
    return getChannelEPG(epgData, channel.tvgId, channel.name);
  }, [epgData, channel]);

  if (programs.length === 0) {
    return (
      <div className="text-center text-sb-gray text-sm py-4">
        אין נתוני תוכנית לערוץ זה
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="space-y-2">
      {programs.map((program, idx) => {
        const progress = program.isCurrent && program.stop > program.start
          ? ((now - program.start) / (program.stop - program.start)) * 100
          : 0;

        return (
          <div
            key={idx}
            className={`flex flex-col gap-1 p-2 rounded-xl text-sm ${
              program.isCurrent
                ? 'bg-sb-red/10 border border-sb-red/30'
                : 'border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="text-xs text-sb-gray whitespace-nowrap">
                {formatEPGTime(program.start)}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${program.isCurrent ? 'text-sb-red' : 'text-sb-light'}`}>
                  {program.title}
                </p>
                {program.description && (
                  <p className="text-xs text-sb-gray line-clamp-1">{program.description}</p>
                )}
              </div>
              {program.isCurrent && (
                <span className="text-[10px] bg-sb-red text-white px-2 py-0.5 rounded-full shrink-0">
                  שידור חי
                </span>
              )}
            </div>
            {program.isCurrent && (
              <div className="w-full h-1 bg-sb-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-sb-red rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default LiveTV;
