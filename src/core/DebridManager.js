// Debrid Manager - Real-Debrid, Premiumize, TorBox integration
// =============================================================

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
    return !!this.getApiKey();
  }

  // Generic proxy request
  async request(endpoint, options = {}) {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error('API key not configured');

    const url = `/api/debrid?service=${this.serviceCode}&path=${encodeURIComponent(endpoint)}`;
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json', 'X-Debrid-Key': apiKey },
      body: options.body ? JSON.stringify({ ...options.body, apiKey }) : undefined,
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
    return this.request('/torrents/mylist');
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

// Resolve streams via debrid services
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
                    quality: 'auto',
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
          // Poll for completion (max 20s)
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
              } catch { /* ignore item details errors */ }
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
          // Poll for completion (max 20s)
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
              } catch { /* ignore download errors */ }
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
