// Plugin Registry - Manages installed add-ons
// ============================================

const STORAGE_KEY = 'sb_plugins_v2';

class PluginRegistry {
  constructor() {
    this.plugins = new Map();
    this.listeners = [];
    this._loadFromStorage();
  }

  subscribe(fn) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  _notify() {
    this.listeners.forEach(fn => fn(this.getPlugins()));
  }

  _loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      saved.forEach(entry => {
        if (entry.url && entry.enabled !== false) {
          this._registerRemote(entry.url, entry.id, entry.name, entry.manifest, false);
        }
      });
    } catch (e) {
      console.warn('Failed to load plugins from storage:', e);
    }
  }

  _saveToStorage() {
    const userPlugins = [...this.plugins.values()]
      .filter(p => !p.builtin)
      .map(p => ({ url: p.url, id: p.id, name: p.name, manifest: p.manifest, enabled: p.enabled }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userPlugins));
  }

  register(plugin) {
    this.plugins.set(plugin.id, { ...plugin, builtin: true, enabled: true, url: null });
    this._notify();
  }

  async installFromUrl(url) {
    // Use our backend proxy to avoid CORS
    const proxyUrl = `/api/addon/manifest?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch manifest: ${res.status}`);
    }
    const manifest = await res.json();
    const id = manifest.id || `remote.${Date.now()}`;
    const plugin = {
      id,
      name: manifest.name || 'Unknown Addon',
      version: manifest.version || '1.0.0',
      description: manifest.description || '',
      resources: manifest.resources || [],
      types: manifest.types || ['movie', 'series'],
      url: url.replace(/\/$/, ''),
      manifestUrl: `${url.replace(/\/$/, '')}/manifest.json`,
      manifest,
      enabled: true,
      builtin: false,
    };
    this.plugins.set(id, plugin);
    this._saveToStorage();
    this._notify();
    return plugin;
  }

  _registerRemote(url, id, name, manifest, save = true) {
    this.plugins.set(id, {
      id,
      name: name || id,
      url: (url || '').replace(/\/$/, ''),
      enabled: true,
      builtin: false,
      manifest: manifest || null,
      resources: manifest?.resources || ['catalog', 'meta', 'stream', 'subtitles'],
      types: manifest?.types || ['movie', 'series'],
    });
    if (save) this._saveToStorage();
  }

  unregister(id) {
    const p = this.plugins.get(id);
    if (p && p.builtin) return false;
    this.plugins.delete(id);
    this._saveToStorage();
    this._notify();
    return true;
  }

  setEnabled(id, enabled) {
    const p = this.plugins.get(id);
    if (!p) return;
    p.enabled = enabled;
    this._saveToStorage();
    this._notify();
  }

  getPlugins() {
    return [...this.plugins.values()];
  }

  getEnabledPlugins() {
    return this.getPlugins().filter(p => p.enabled);
  }

  getStreamPlugins() {
    return this.getEnabledPlugins().filter(p => p.resources.includes('stream'));
  }

  getSubtitlePlugins() {
    return this.getEnabledPlugins().filter(p => p.resources.includes('subtitles'));
  }
}

export const pluginRegistry = new PluginRegistry();
export default PluginRegistry;
