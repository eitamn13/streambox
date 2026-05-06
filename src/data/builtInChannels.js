// Built-in Israeli IPTV channels — only channels with working public URLs
export const BUILT_IN_CHANNELS = [
  {
    id: 'builtin-kan11',
    name: 'כאן 11',
    url: 'https://kan11.media.kan.org.il/hls/live/2024514/2024514/playlist.m3u8',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Kan11Logo.svg/120px-Kan11Logo.svg.png',
    group: 'חדשות וכללי',
    category: 'news',
    tvgId: 'Kan11',
    isPublic: true,
  },
  {
    id: 'builtin-keshet12',
    name: 'קשת 12',
    url: 'https://keshethlslive-lh.akamaihd.net/i/c2l_1@192271/master.m3u8',
    logo: 'https://upload.wikimedia.org/wikipedia/he/thumb/7/7a/Keshet12Logo.svg/120px-Keshet12Logo.svg.png',
    group: 'חדשות וכללי',
    category: 'news',
    tvgId: 'Keshet12',
    isPublic: true,
  },
  {
    id: 'builtin-reshet13',
    name: 'רשת 13',
    url: 'https://d18b0e6mopany4.cloudfront.net/out/v1/08bc71cf0a0f4712b6b03c732b0e6d25/index.m3u8',
    logo: 'https://upload.wikimedia.org/wikipedia/he/thumb/f/f4/Reshet13Logo.svg/120px-Reshet13Logo.svg.png',
    group: 'חדשות וכללי',
    category: 'news',
    tvgId: 'Reshet13',
    isPublic: true,
  },
  {
    id: 'builtin-now14',
    name: 'עכשיו 14',
    url: 'https://now14.g-mana.live/media/91517161-44ab-4e46-af70-e9fe26117d1e/mainManifest.m3u8',
    logo: 'https://upload.wikimedia.org/wikipedia/he/thumb/5/56/Now_14_logo.svg/120px-Now_14_logo.svg.png',
    group: 'חדשות וכללי',
    category: 'news',
    tvgId: 'Now14',
    isPublic: true,
  },
  {
    id: 'builtin-makan',
    name: 'מכאן 33',
    url: 'https://makan.media.kan.org.il/hls/live/2024680/2024680/playlist.m3u8',
    logo: 'https://upload.wikimedia.org/wikipedia/he/thumb/0/00/Makan33Logo.svg/120px-Makan33Logo.svg.png',
    group: 'חדשות וכללי',
    category: 'news',
    tvgId: 'Makan33',
    isPublic: true,
  },
  {
    id: 'builtin-i24',
    name: 'i24NEWS',
    url: 'https://bcovlive-a.akamaihd.net/6e3dd61ac4c34d3f8fbaf8e6391d4ca8/eu-central-1/5377161796001/playlist.m3u8',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/LOGO_i24NEWS.png/120px-LOGO_i24NEWS.png',
    group: 'חדשות וכללי',
    category: 'news',
    tvgId: 'i24news',
    isPublic: true,
  },
  {
    id: 'builtin-hop',
    name: 'הופ!',
    url: 'https://hopchanneltv.g-mana.live/media/0f9b77fd-095e-4b84-9f74-7fc4d1f4505d/mainManifest.m3u8',
    logo: 'https://upload.wikimedia.org/wikipedia/he/thumb/1/14/HopLogo.svg/120px-HopLogo.svg.png',
    group: 'ילדים',
    category: 'kids',
    tvgId: 'HopChannel',
    isPublic: true,
  },
];

export function getBuiltInChannels() {
  return BUILT_IN_CHANNELS.map((ch, idx) => ({
    ...ch,
    id: ch.id || `builtin-${idx}`,
  }));
}

export function getPublicChannels() {
  return getBuiltInChannels().filter((ch) => ch.isPublic && ch.url);
}

export function getAllBuiltInChannels() {
  return getBuiltInChannels();
}
