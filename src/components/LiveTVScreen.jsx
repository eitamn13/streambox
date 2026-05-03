import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Tv,
  Link as LinkIcon,
  X,
  Loader2,
  Play,
  CalendarDays,
  Clock,
  ChevronRight,
  ExternalLink,
  Star,
  Filter,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import AnimatedPage from './ui/AnimatedPage';
import VideoPlayer from './VideoPlayer';
import { fetchM3U, getCategories, generateMockEPG } from '../utils/m3uParser';

const CATEGORY_LABELS = {
  all: 'All Channels',
  sport: 'Sports',
  news: 'News',
  movies: 'Movies',
  kids: 'Kids',
  music: 'Music',
  general: 'General',
};

const CATEGORY_ICONS = {
  sport: '⚽',
  news: '📰',
  movies: '🎬',
  kids: '🧸',
  music: '🎵',
  general: '📺',
};

export default function LiveTVScreen() {
  const { state, dispatch } = useApp();
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [m3uUrl, setM3uUrl] = useState(state.tvSettings?.m3uUrl || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEpg, setShowEpg] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tv_favorites') || '[]');
    } catch {
      return [];
    }
  });

  const channels = state.tvSettings?.channels || [];

  const categories = useMemo(() => getCategories(channels), [channels]);

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
          c.group.toLowerCase().includes(q)
      );
    }
    return result;
  }, [channels, activeCategory, searchQuery]);

  const handleSaveUrl = useCallback(async () => {
    if (!m3uUrl.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const parsed = await fetchM3U(m3uUrl.trim());
      dispatch({
        type: 'SET_TV_SETTINGS',
        payload: { m3uUrl: m3uUrl.trim(), channels: parsed },
      });
      setShowUrlInput(false);
    } catch (err) {
      setError(err.message || 'Failed to load playlist');
    } finally {
      setIsLoading(false);
    }
  }, [m3uUrl, dispatch]);

  const toggleFavorite = useCallback((channelId) => {
    setFavorites((prev) => {
      const next = prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId];
      localStorage.setItem('tv_favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  const formatTime = (date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <AnimatedPage className="min-h-screen bg-nexora-950">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'home' })}
            className="flex items-center gap-2 text-nexora-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div className="flex items-center gap-2 flex-1">
            <Tv className="w-5 h-5 text-accent-400" />
            <h1 className="text-xl font-bold text-white">Live TV</h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowUrlInput(true)}
            className="p-2 rounded-xl bg-nexora-800 text-nexora-300 hover:text-white transition-colors"
            title="Set M3U URL"
          >
            <LinkIcon className="w-4 h-4" />
          </motion.button>
        </div>

        {/* URL Input Modal */}
        <AnimatePresence>
          {showUrlInput && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-nexora-900 rounded-2xl p-5 border border-nexora-800 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-nexora-400 uppercase tracking-wider">
                  M3U Playlist URL
                </h2>
                <button
                  onClick={() => setShowUrlInput(false)}
                  className="text-nexora-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-nexora-400 mb-3">
                Paste your M3U playlist URL from{' '}
                <a
                  href="https://tv.team/packages"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-400 hover:underline inline-flex items-center gap-1"
                >
                  tv.team <ExternalLink className="w-3 h-3" />
                </a>
              </p>

              <input
                type="url"
                value={m3uUrl}
                onChange={(e) => setM3uUrl(e.target.value)}
                placeholder="https://tv.team/playlist.m3u?token=..."
                className="w-full bg-nexora-950 border border-nexora-700 rounded-xl px-4 py-3 text-sm text-white placeholder-nexora-500 focus:outline-none focus:border-accent-500 mb-3"
              />

              {error && (
                <p className="text-xs text-red-400 mb-3">{error}</p>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveUrl}
                  disabled={isLoading || !m3uUrl.trim()}
                  className="flex-1 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-medium text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load Channels'
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
              <VideoPlayer
                src={selectedChannel.url}
                channelName={selectedChannel.name}
                channelLogo={selectedChannel.logo}
              />

              {/* Channel info below player */}
              <div className="flex items-center justify-between mt-3 px-1">
                <div className="flex items-center gap-3">
                  {selectedChannel.logo && (
                    <img
                      src={selectedChannel.logo}
                      alt=""
                      className="w-8 h-8 object-contain rounded bg-nexora-800"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <div>
                    <p className="text-white font-medium text-sm">
                      {selectedChannel.name}
                    </p>
                    <p className="text-xs text-nexora-400 capitalize">
                      {CATEGORY_LABELS[selectedChannel.category] || selectedChannel.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFavorite(selectedChannel.id)}
                    className={`p-2 rounded-xl transition-colors ${
                      favorites.includes(selectedChannel.id)
                        ? 'bg-accent-500/20 text-accent-400'
                        : 'bg-nexora-800 text-nexora-400 hover:text-white'
                    }`}
                  >
                    <Star
                      className="w-4 h-4"
                      fill={
                        favorites.includes(selectedChannel.id)
                          ? 'currentColor'
                          : 'none'
                      }
                    />
                  </button>
                  <button
                    onClick={() => setShowEpg(!showEpg)}
                    className={`p-2 rounded-xl transition-colors ${
                      showEpg
                        ? 'bg-accent-500/20 text-accent-400'
                        : 'bg-nexora-800 text-nexora-400 hover:text-white'
                    }`}
                  >
                    <CalendarDays className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedChannel(null)}
                    className="p-2 rounded-xl bg-nexora-800 text-nexora-400 hover:text-white transition-colors"
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
                    <div className="mt-3 bg-nexora-900 rounded-2xl border border-nexora-800 p-4">
                      <h3 className="text-sm font-semibold text-nexora-300 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        TV Guide
                      </h3>
                      <div className="space-y-2">
                        {generateMockEPG(selectedChannel).map((program, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center gap-3 p-2 rounded-xl text-sm ${
                              program.isCurrent
                                ? 'bg-accent-500/10 border border-accent-500/30'
                                : 'border border-transparent'
                            }`}
                          >
                            <div className="text-xs text-nexora-400 whitespace-nowrap">
                              {formatTime(program.start)}
                            </div>
                            <div className="flex-1">
                              <p
                                className={`font-medium ${
                                  program.isCurrent
                                    ? 'text-accent-400'
                                    : 'text-nexora-200'
                                }`}
                              >
                                {program.title}
                              </p>
                            </div>
                            {program.isCurrent && (
                              <span className="text-[10px] bg-accent-500 text-white px-2 py-0.5 rounded-full">
                                LIVE
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nexora-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search channels..."
                className="w-full bg-nexora-900 border border-nexora-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-nexora-500 focus:outline-none focus:border-accent-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-nexora-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    activeCategory === cat
                      ? 'bg-accent-500 text-white'
                      : 'bg-nexora-800 text-nexora-300 hover:bg-nexora-700'
                  }`}
                >
                  {cat !== 'all' && (
                    <span>{CATEGORY_ICONS[cat] || '📺'}</span>
                  )}
                  {cat === 'all' && <Filter className="w-3 h-3" />}
                  {CATEGORY_LABELS[cat] || cat}
                </button>
              ))}
            </div>

            {/* Channel count */}
            <p className="text-xs text-nexora-500 mb-3">
              {filteredChannels.length}{' '}
              {filteredChannels.length === 1 ? 'channel' : 'channels'}
            </p>

            {/* Channel List */}
            <div className="space-y-2">
              {filteredChannels.map((channel) => (
                <motion.button
                  key={channel.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedChannel(channel);
                    setShowEpg(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                    selectedChannel?.id === channel.id
                      ? 'bg-accent-500/10 border-accent-500/30'
                      : 'bg-nexora-900 border-nexora-800 hover:border-nexora-700'
                  }`}
                >
                  <div className="relative">
                    {channel.logo ? (
                      <img
                        src={channel.logo}
                        alt={channel.name}
                        className="w-12 h-12 object-contain rounded-lg bg-nexora-950"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-12 h-12 rounded-lg bg-nexora-800 flex items-center justify-center text-lg ${
                        channel.logo ? 'hidden' : 'flex'
                      }`}
                    >
                      {CATEGORY_ICONS[channel.category] || '📺'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {channel.name}
                    </p>
                    <p className="text-xs text-nexora-400">
                      {channel.group}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {favorites.includes(channel.id) && (
                      <Star className="w-3.5 h-3.5 text-accent-400 fill-accent-400" />
                    )}
                    <Play className="w-4 h-4 text-nexora-500" />
                  </div>
                </motion.button>
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
            <div className="w-16 h-16 rounded-2xl bg-nexora-900 flex items-center justify-center mb-4">
              <Tv className="w-8 h-8 text-nexora-500" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">
              No Channels Loaded
            </h2>
            <p className="text-sm text-nexora-400 max-w-xs mb-6">
              Add your M3U playlist URL from tv.team to start watching live TV.
            </p>
            <button
              onClick={() => setShowUrlInput(true)}
              className="flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-medium text-sm py-3 px-6 rounded-xl transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
              Add Playlist URL
            </button>
            <a
              href="https://tv.team/packages"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 text-xs text-accent-400 hover:underline flex items-center gap-1"
            >
              Get playlist from tv.team
              <ExternalLink className="w-3 h-3" />
            </a>
          </motion.div>
        )}
      </div>
    </AnimatedPage>
  );
}
