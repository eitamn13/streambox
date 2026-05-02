// Debrid Manager - Real-Debrid, Premiumize, TorBox integration
// + Multi-provider torrent search + SaaS customer key support
// =============================================================

import { getCustomerKey } from './SubscriptionManager.js';
import { searchMagnets as _searchMagnets, searchYtsMagnets as _searchYtsMagnets } from './TorrentSearch.js';

const STORAGE_KEYS = {
  realdebrid: 'sb_debrid_rd',
  premiumize: 'sb_debrid_pm',
  torbox: 'sb_debrid_tb',
};

class DebridService {
  constructor(name, keyStorage, serviceCode) {
    this.name = name;
    this.keyStorage = keyStorage;
    this.serviceCode = serviceCode; // 'rd', 'pm', 'tb'
  }

  getApiKey() {
    try {
      return JSON.parse(localStorage.getItem(this.keyStorage))?.apiKey || '';
    } catch {
      return '';
    }
  }

  setApiKey(apiKey) {
    localStorage.setItem(this.keyStorage, JSON.stringify({ apiKey, addedAt: Date.now() }));
  }

  clearAuth() {
    localStorage.removeItem(this.keyStorage);
  }

  isConfigured() {
    // In SaaS mode, customer key replaces individual debrid keys
    if (getCustomerKey()) return true;
    return !!this.getApiKey();
  }

  // Generic proxy request
  async request(endpoint, options = {}) {
    const customerKey = getCustomerKey();
    const userApiKey = this.getApiKey();
    
    if (!customerKey && !userApiKey) {
      throw new Error('API key not configured');
    }

    const url = `/api/debrid?service=${this.serviceCode}&path=${encodeURIComponent(endpoint)}`;
    const headers = { 'Content-Type': 'application/json' };
    
    if (customerKey) {
      headers['X-Customer-Key'] = customerKey;
    } else {
      headers['X-Debrid-Key'] = userApiKey;
    }

    const body = options.body ? JSON.stringify({ ...options.body, ...(userApiKey ? { apiKey: userApiKey } : {}) }) : undefined;

    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body,
    });

    const result = await res.json();
    if (!result.ok && result.status >= 400) {
      throw new Error(result.data?.error || result.message || `HTTP ${result.status}`);
    }
    return result.data;
  }

  // --- Real Debrid specific ---
  async rdGetUser() {
    return this.request('/user');
  }

  async rdGetTorrents(limit = 100) {
    return this.request(`/torrents?limit=${limit}`);
  }

  async rdGetTorrentInfo(id) {
    return this.request(`/torrents/info/${id}`);
  }

  async rdAddMagnet(magnet) {
    return this.request('/torrents/addMagnet', {
      method: 'POST',
      body: { magnet },
    });
  }

  async rdDeleteTorrent(id) {
    return this.request(`/torrents/delete/${id}`, {
      method: 'DELETE',
    });
  }

  async rdSelectFiles(id, files = 'all') {
    return this.request(`/torrents/selectFiles/${id}`, {
      method: 'POST',
      body: { files },
    });
  }

  async rdUnrestrictLink(link) {
    return this.request('/unrestrict/link', {
      method: 'POST',
      body: { link },
    });
  }

  // --- Premiumize specific ---
  async pmGetUser() {
    return this.request('/account/info');
  }

  async pmGetTransfers() {
    return this.request('/transfer/list');
  }

  async pmAddMagnet(magnet, folderId) {
    const body = { src: magnet };
    if (folderId) body.folder_id = folderId;
    return this.request('/transfer/create', {
      method: 'POST',
      body,
    });
  }

  async pmDeleteTransfer(id) {
    return this.request('/transfer/delete', {
      method: 'POST',
      body: { id },
    });
  }

  async pmItemDetails(itemId) {
    return this.request(`/item/details?id=${itemId}`);
  }

  // --- TorBox specific ---
  async tbGetUser() {
    return this.request('/user/me');
  }

  async tbGetTorrents() {
    const res = await this.request('/torrents/mylist');
    // TorBox returns { success: true, data: [...] } or directly [...]
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  }

  async tbAddMagnet(magnet, seed = 1) {
    return this.request('/torrents/createtorrent', {
      method: 'POST',
      body: { magnet, seed, allow_zip: false },
    });
  }

  async tbRequestDownload(torrentId, fileId = null) {
    let endpoint = `/torrents/requestdl?torrent_id=${torrentId}`;
    if (fileId) endpoint += `&file_id=${fileId}`;
    return this.request(endpoint);
  }

  async tbDeleteTorrent(torrentId) {
    return this.request('/torrents/controltorrent', {
      method: 'POST',
      body: { torrent_id: torrentId, operation: 'delete' },
    });
  }
}

export const realDebrid = new DebridService('Real-Debrid', STORAGE_KEYS.realdebrid, 'rd');
export const premiumize = new DebridService('Premiumize', STORAGE_KEYS.premiumize, 'pm');
export const torBox = new DebridService('TorBox', STORAGE_KEYS.torbox, 'tb');

export const DEBRID_SERVICES = [
  {
    id: 'realdebrid',
    name: 'Real-Debrid',
    instance: realDebrid,
    website: 'https://real-debrid.com/',
    signupUrl: 'https://real-debrid.com/premium',
    description: 'שירות debrid פופולרי עם תמיכה ב-4K',
    color: '#00aeef',
  },
  {
    id: 'premiumize',
    name: 'Premiumize',
    instance: premiumize,
    website: 'https://www.premiumize.me/',
    signupUrl: 'https://www.premiumize.me/premium',
    description: 'שירות debrid עם אחסון ענן',
    color: '#f5c518',
  },
  {
    id: 'torbox',
    name: 'TorBox',
    instance: torBox,
    website: 'https://torbox.app/',
    signupUrl: 'https://torbox.app/pricing',
    description: 'שירות debrid ייעודי ל-Stremio',
    color: '#e50914',
  },
];

export function getConfiguredDebrids() {
  return DEBRID_SERVICES.filter(s => s.instance.isConfigured());
}

export async function testDebridConnection(serviceId) {
  const svc = DEBRID_SERVICES.find(s => s.id === serviceId);
  if (!svc) throw new Error('Unknown service');

  try {
    if (serviceId === 'realdebrid') {
      const user = await svc.instance.rdGetUser();
      return { success: true, user: { username: user.username, premium: user.premium } };
    }
    if (serviceId === 'premiumize') {
      const user = await svc.instance.pmGetUser();
      return { success: true, user: { username: user.customer_id, premium: user.premium_until > 0 } };
    }
    if (serviceId === 'torbox') {
      const user = await svc.instance.tbGetUser();
      return { success: true, user: { username: user.email, premium: user.plan > 0 } };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ============================================================================
// STREAM RESOLUTION
// ============================================================================

function detectQuality(filename = '') {
  const f = filename.toLowerCase();
  if (f.includes('2160') || f.includes('4k') || f.includes('uhd')) return '4K';
  if (f.includes('1080')) return '1080p';
  if (f.includes('720')) return '720p';
  if (f.includes('480')) return '480p';
  return 'auto';
}

export async function resolveDebridStreams(magnetOrHash, filename = '') {
  const configured = getConfiguredDebrids();
  const results = [];

  for (const svc of configured) {
    try {
      if (svc.id === 'realdebrid') {
        // Add magnet
        const addRes = await svc.instance.rdAddMagnet(magnetOrHash);
        if (!addRes?.id) continue;

        // Poll for ready status (max 20s)
        for (let i = 0; i < 20; i++) {
          await new Promise(r => setTimeout(r, 1000));
          const info = await svc.instance.rdGetTorrentInfo(addRes.id);

          if (info?.status === 'waiting_files_selection') {
            await svc.instance.rdSelectFiles(addRes.id, 'all');
          }

          if (info?.links?.length > 0) {
            for (const link of info.links) {
              try {
                const unrestrict = await svc.instance.rdUnrestrictLink(link);
                if (unrestrict?.download) {
                  results.push({
                    url: unrestrict.download,
                    title: unrestrict.filename || filename || 'Real-Debrid',
                    quality: detectQuality(unrestrict.filename),
                    provider: 'Real-Debrid',
                    type: 'direct',
                    sourceType: 'debrid',
                    info: ['Premium', unrestrict.filename],
                  });
                }
              } catch { /* ignore unrestrict errors */ }
            }
            break;
          }

          if (info?.status === 'error') break;
        }
      }

      if (svc.id === 'premiumize') {
        const addRes = await svc.instance.pmAddMagnet(magnetOrHash);
        if (addRes?.status === 'success' && addRes.id) {
          for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 2000));
            const transfers = await svc.instance.pmGetTransfers();
            const transfer = transfers.transfers?.find(t => t.id === addRes.id);
            if (transfer?.status === 'finished') {
              try {
                const details = await svc.instance.pmItemDetails(transfer.folder_id);
                if (details?.content) {
                  for (const item of details.content) {
                    if (item.stream_link) {
                      results.push({
                        url: item.stream_link,
                        title: item.name || filename || 'Premiumize',
                        quality: 'auto',
                        provider: 'Premiumize',
                        type: 'direct',
                        sourceType: 'debrid',
                        info: ['Premium', item.name],
                      });
                    }
                  }
                }
              } catch { /* ignore */ }
              break;
            }
            if (transfer?.status === 'error') break;
          }
        }
      }

      if (svc.id === 'torbox') {
        const addRes = await svc.instance.tbAddMagnet(magnetOrHash);
        if (addRes?.success || addRes?.torrent_id) {
          const torrentId = addRes.torrent_id || addRes.data;
          for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 2000));
            const torrents = await svc.instance.tbGetTorrents();
            const torrent = torrents?.find(t => t.id === torrentId);
            if (torrent?.download_present || torrent?.download_speed > 0) {
              try {
                const dl = await svc.instance.tbRequestDownload(torrentId);
                if (dl?.data) {
                  results.push({
                    url: dl.data,
                    title: torrent.name || filename || 'TorBox',
                    quality: 'auto',
                    provider: 'TorBox',
                    type: 'direct',
                    sourceType: 'debrid',
                    info: ['Premium', torrent.name],
                  });
                }
              } catch { /* ignore */ }
              break;
            }
            if (torrent?.status === 'error') break;
          }
        }
      }
    } catch (e) {
      console.warn(`${svc.name} resolve failed:`, e);
    }
  }

  return results;
}

// ============================================================================
// REAL-DEBRID LIBRARY SEARCH
// ============================================================================

export async function searchRdLibrary(title) {
  if (!realDebrid.isConfigured()) return [];
  if (!title) return [];

  try {
    const torrents = await realDebrid.rdGetTorrents(100);
    const lowerTitle = title.toLowerCase();
    const matches = (torrents || []).filter(t =>
      t.filename?.toLowerCase().includes(lowerTitle)
    );

    const results = [];
    for (const match of matches.slice(0, 5)) {
      try {
        const info = await realDebrid.rdGetTorrentInfo(match.id);
        if (info?.links?.length > 0 && info.status === 'downloaded') {
          for (const link of info.links) {
            try {
              const unrestrict = await realDebrid.rdUnrestrictLink(link);
              if (unrestrict?.download) {
                results.push({
                  url: unrestrict.download,
                  title: unrestrict.filename || match.filename || title,
                  quality: detectQuality(unrestrict.filename || match.filename),
                  provider: 'Real-Debrid',
                  type: 'direct',
                  sourceType: 'debrid',
                  info: ['בספרייה שלך', unrestrict.filename],
                });
              }
            } catch { /* ignore */ }
          }
        }
      } catch { /* ignore */ }
    }
    return results;
  } catch (e) {
    console.warn('RD library search failed:', e);
    return [];
  }
}

// ============================================================================
// MULTI-PROVIDER MAGNET SEARCH (delegated to TorrentSearch.js - client-side)
// ============================================================================

export async function searchMagnets(title, year = '', imdbId = '', type = 'movie') {
  return _searchMagnets(title, year, imdbId, type);
}

export async function searchYtsMagnets(title, year = '') {
  return _searchYtsMagnets(title, year);
}

// ============================================================================
// ADD MAGNET TO REAL-DEBRID WITH EXTENDED POLLING
// ============================================================================

export async function addMagnetToRd(magnet, filename = '') {
  if (!realDebrid.isConfigured()) throw new Error('Real-Debrid לא מחובר');

  const addRes = await realDebrid.rdAddMagnet(magnet);
  if (!addRes?.id) throw new Error('הוספת המגנט נכשלה');

  const torrentId = addRes.id;

  // Poll for up to 90 seconds
  for (let i = 0; i < 90; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const info = await realDebrid.rdGetTorrentInfo(torrentId);

    if (info?.status === 'waiting_files_selection') {
      await realDebrid.rdSelectFiles(torrentId, 'all');
    }

    if (info?.links?.length > 0 && info.status === 'downloaded') {
      const results = [];
      for (const link of info.links) {
        try {
          const unrestrict = await realDebrid.rdUnrestrictLink(link);
          if (unrestrict?.download) {
            results.push({
              url: unrestrict.download,
              title: unrestrict.filename || filename || 'Real-Debrid',
              quality: detectQuality(unrestrict.filename),
              provider: 'Real-Debrid',
              type: 'direct',
              sourceType: 'debrid',
              info: ['Premium', unrestrict.filename],
            });
          }
        } catch { /* ignore */ }
      }
      return results;
    }

    if (info?.status === 'error') throw new Error('שגיאה בהורדת הטורנט');
  }

  throw new Error('הטורנט לקח יותר מדי זמן להתחיל. נסה שוב מאוחר יותר.');
}
