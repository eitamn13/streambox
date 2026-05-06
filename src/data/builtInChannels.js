// Built-in Israeli IPTV channels - curated list
// Includes public/free streams and popular subscription channels (marked)

export const BUILT_IN_CHANNELS = [
  // === NEWS & GENERAL ===
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

  // === SPORT ===
  {
    id: 'builtin-sport1',
    name: 'ספורט 1',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/he/thumb/5/53/Sport1Logo.svg/120px-Sport1Logo.svg.png',
    group: 'ספורט',
    category: 'sport',
    tvgId: 'Sport1',
    isPublic: false,
  },
  {
    id: 'builtin-sport2',
    name: 'ספורט 2',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/he/thumb/e/e4/Sport2Logo.svg/120px-Sport2Logo.svg.png',
    group: 'ספורט',
    category: 'sport',
    tvgId: 'Sport2',
    isPublic: false,
  },
  {
    id: 'builtin-sport5',
    name: 'ספורט 5',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/he/thumb/9/9b/Sport5Logo.svg/120px-Sport5Logo.svg.png',
    group: 'ספורט',
    category: 'sport',
    tvgId: 'Sport5',
    isPublic: false,
  },
  {
    id: 'builtin-sport5plus',
    name: 'ספורט 5 פלוס',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/he/thumb/9/9b/Sport5Logo.svg/120px-Sport5Logo.svg.png',
    group: 'ספורט',
    category: 'sport',
    tvgId: 'Sport5Plus',
    isPublic: false,
  },
  {
    id: 'builtin-oneg',
    name: 'ONE גלילות',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/he/thumb/a/a8/OneLogo.svg/120px-OneLogo.svg.png',
    group: 'ספורט',
    category: 'sport',
    tvgId: 'OneG',
    isPublic: false,
  },

  // === KIDS ===
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
  {
    id: 'builtin-nick',
    name: 'ניקלודיאון',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Nickelodeon_logo_new.svg/120px-Nickelodeon_logo_new.svg.png',
    group: 'ילדים',
    category: 'kids',
    tvgId: 'NickelodeonIL',
    isPublic: false,
  },
  {
    id: 'builtin-disney',
    name: 'דיסני',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Disney%2B_logo.svg/120px-Disney%2B_logo.svg.png',
    group: 'ילדים',
    category: 'kids',
    tvgId: 'DisneyIL',
    isPublic: false,
  },

  // === MOVIES ===
  {
    id: 'builtin-yesaction',
    name: 'Yes Action',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/he/thumb/d/d8/YesLogo.svg/120px-YesLogo.svg.png',
    group: 'סרטים',
    category: 'movies',
    tvgId: 'YesAction',
    isPublic: false,
  },
  {
    id: 'builtin-yescomedy',
    name: 'Yes Comedy',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/he/thumb/d/d8/YesLogo.svg/120px-YesLogo.svg.png',
    group: 'סרטים',
    category: 'movies',
    tvgId: 'YesComedy',
    isPublic: false,
  },
  {
    id: 'builtin-yesdrama',
    name: 'Yes Drama',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/he/thumb/d/d8/YesLogo.svg/120px-YesLogo.svg.png',
    group: 'סרטים',
    category: 'movies',
    tvgId: 'YesDrama',
    isPublic: false,
  },

  // === MUSIC ===
  {
    id: 'builtin-music24',
    name: 'Music 24',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/he/thumb/6/66/Music24Logo.svg/120px-Music24Logo.svg.png',
    group: 'מוזיקה',
    category: 'music',
    tvgId: 'Music24',
    isPublic: false,
  },
  {
    id: 'builtin-mtv',
    name: 'MTV',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/MTV-2021.svg/120px-MTV-2021.svg.png',
    group: 'מוזיקה',
    category: 'music',
    tvgId: 'MTVIL',
    isPublic: false,
  },

  // === DOCUMENTARY ===
  {
    id: 'builtin-natgeo',
    name: 'National Geographic',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/National_Geographic_logo.svg/120px-National_Geographic_logo.svg.png',
    group: 'דוקומנטרי',
    category: 'documentary',
    tvgId: 'NatGeoIL',
    isPublic: false,
  },
  {
    id: 'builtin-discovery',
    name: 'Discovery',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Discovery_Channel_logo.svg/120px-Discovery_Channel_logo.svg.png',
    group: 'דוקומנטרי',
    category: 'documentary',
    tvgId: 'DiscoveryIL',
    isPublic: false,
  },
  {
    id: 'builtin-history',
    name: 'History',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/History_%28TV_channel%29_logo.svg/120px-History_%28TV_channel%29_logo.svg.png',
    group: 'דוקומנטרי',
    category: 'documentary',
    tvgId: 'HistoryIL',
    isPublic: false,
  },
  {
    id: 'builtin-animal',
    name: 'Animal Planet',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Animal_Planet_logo.svg/120px-Animal_Planet_logo.svg.png',
    group: 'דוקומנטרי',
    category: 'documentary',
    tvgId: 'AnimalPlanetIL',
    isPublic: false,
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
