// History & Continue Watching
// ============================

const HISTORY_KEY = 'sb_history_v1';
const WATCHLIST_KEY = 'sb_watchlist_v1';

function load(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function getHistory() {
  return load(HISTORY_KEY);
}

export function addToHistory(item) {
  const history = getHistory();
  const existing = history.find(h => h.id === item.id && h.type === item.type);
  if (existing) {
    existing.progress = item.progress || 0;
    existing.duration = item.duration || existing.duration;
    existing.updatedAt = Date.now();
    existing.title = item.title || existing.title;
    existing.poster = item.poster || existing.poster;
  } else {
    history.unshift({
      ...item,
      progress: item.progress || 0,
      duration: item.duration || 0,
      updatedAt: Date.now(),
    });
  }
  save(HISTORY_KEY, history.slice(0, 100));
}

export function removeFromHistory(id, type) {
  const history = getHistory().filter(h => !(h.id === id && h.type === type));
  save(HISTORY_KEY, history);
}

export function clearHistory() {
  save(HISTORY_KEY, []);
}

export function getContinueWatching() {
  return getHistory()
    .filter(h => h.duration > 0 && h.progress / h.duration < 0.95 && h.progress > 10)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 20);
}

export function getRecentlyWatched() {
  return getHistory().slice(0, 20);
}

// Watchlist
// ---------
export function getWatchlist() {
  return load(WATCHLIST_KEY);
}

export function addToWatchlist(item) {
  const list = getWatchlist();
  if (!list.find(i => i.id === item.id && i.type === item.type)) {
    list.unshift({ ...item, addedAt: Date.now() });
    save(WATCHLIST_KEY, list);
  }
}

export function removeFromWatchlist(id, type) {
  const list = getWatchlist().filter(i => !(i.id === id && i.type === type));
  save(WATCHLIST_KEY, list);
}

export function isInWatchlist(id, type) {
  return getWatchlist().some(i => i.id === id && i.type === type);
}
