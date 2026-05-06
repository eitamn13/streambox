import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getContinueWatching, getRecentlyWatched, getWatchlist, removeFromWatchlist, clearHistory } from '../core/History.js';
import { Play, Trash2, Clock, Bookmark, Film, History } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback.jsx';

function Library() {
  const [activeTab, setActiveTab] = useState('continue');
  const [continueWatching, setContinueWatching] = useState([]);
  const [recentlyWatched, setRecentlyWatched] = useState([]);
  const [watchlist, setWatchlist] = useState([]);

  useEffect(() => {
    setContinueWatching(getContinueWatching());
    setRecentlyWatched(getRecentlyWatched());
    setWatchlist(getWatchlist());
  }, [activeTab]);

  const refresh = () => {
    setContinueWatching(getContinueWatching());
    setRecentlyWatched(getRecentlyWatched());
    setWatchlist(getWatchlist());
  };

  const handleClearHistory = () => {
    if (confirm('לנקות את כל ההיסטוריה?')) {
      clearHistory();
      refresh();
    }
  };

  const tabs = [
    { id: 'continue', label: 'המשך לצפות', icon: Play },
    { id: 'recent', label: 'נצפו לאחרונה', icon: History },
    { id: 'watchlist', label: 'רשימת צפייה', icon: Bookmark },
  ];

  const renderItems = (items, emptyMessage) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-20">
          <Film className="w-16 h-16 text-sb-gray mx-auto mb-4 opacity-50" />
          <p className="text-sb-gray text-lg">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="content-grid">
        {items.map(item => (
          <div key={`${item.type}-${item.id}`} className="group relative animate-fade-in">
            <Link to={`/detail/${item.type}/${item.id}`} className="block">
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-sb-card card-hover">
                {item.poster ? (
                  <ImageWithFallback src={item.poster} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-sb-surface">
                    <Film className="w-10 h-10 text-sb-gray" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  {item.progress > 0 && item.duration > 0 && (
                    <div className="progress-track mb-2">
                      <div
                        className="progress-fill"
                        style={{ width: `${(item.progress / item.duration) * 100}%` }}
                      />
                    </div>
                  )}
                  <p className="text-white text-sm font-medium line-clamp-1">{item.title}</p>
                  {item.updatedAt && (
                    <p className="text-sb-gray text-xs mt-0.5">
                      {new Date(item.updatedAt).toLocaleDateString('he-IL')}
                    </p>
                  )}
                </div>
              </div>
            </Link>
            {activeTab === 'watchlist' && (
              <button
                onClick={() => { removeFromWatchlist(item.id, item.type); refresh(); }}
                className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-sb-red"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  const getItems = () => {
    switch (activeTab) {
      case 'continue': return continueWatching;
      case 'recent': return recentlyWatched;
      case 'watchlist': return watchlist;
      default: return [];
    }
  };

  const emptyMessages = {
    continue: 'אין פריטים להמשך צפייה',
    recent: 'אין היסטוריית צפייה',
    watchlist: 'רשימת הצפייה ריקה',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 page-transition">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">ספרייה</h1>
        {activeTab === 'recent' && recentlyWatched.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-2 text-sb-red hover:text-white text-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            נקה היסטוריה
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto hide-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-sb-red text-white shadow-lg shadow-sb-red-glow'
                : 'bg-sb-card text-sb-gray hover:text-white hover:bg-sb-surface'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {renderItems(getItems(), emptyMessages[activeTab])}
    </div>
  );
}

export default Library;
