// Official Streaming Services Hub
// =================================

export const STREAMING_SERVICES = [
  {
    id: 'netflix',
    name: 'Netflix',
    url: 'https://www.netflix.com',
    logoColor: '#e50914',
    description: 'הגדול בעולם. סרטים, סדרות, דוקו, אנימה.',
    pricing: 'החל מ-29.90 ₪',
    categories: ['movies', 'series', 'originals'],
  },
  {
    id: 'disney',
    name: 'Disney+',
    url: 'https://www.disneyplus.com',
    logoColor: '#113ccf',
    description: 'דיסני, פיקסאר, מארוול, מלחמת הכוכבים, נשיונל גיאוגרפיק.',
    pricing: 'החל מ-29.90 ₪',
    categories: ['movies', 'series', 'kids'],
  },
  {
    id: 'hbo',
    name: 'HBO Max',
    url: 'https://www.max.com',
    logoColor: '#002be7',
    description: 'HBO Originals, וורנר, DC, סרטי קולנוע.',
    pricing: 'החל מ-34.90 ₪',
    categories: ['movies', 'series', 'originals'],
  },
  {
    id: 'appletv',
    name: 'Apple TV+',
    url: 'https://tv.apple.com',
    logoColor: '#1d1d1f',
    description: 'Apple Originals עם כוכבים הוליוודיים.',
    pricing: 'החל מ-24.90 ₪',
    categories: ['series', 'movies', 'originals'],
  },
  {
    id: 'amazon',
    name: 'Prime Video',
    url: 'https://www.primevideo.com',
    logoColor: '#00a8e1',
    description: 'סרטים, סדרות, ושירותי Prime משלימים.',
    pricing: 'כלול ב-Prime',
    categories: ['movies', 'series', 'sports'],
  },
  {
    id: 'hulu',
    name: 'Hulu',
    url: 'https://www.hulu.com',
    logoColor: '#1ce783',
    description: 'סדרות אמריקאיות, ריאליטי, חדשות.',
    pricing: 'החל מ-$7.99',
    categories: ['series', 'movies'],
  },
  {
    id: 'paramount',
    name: 'Paramount+',
    url: 'https://www.paramountplus.com',
    logoColor: '#0064ff',
    description: 'פרמאונט, CBS, MTV, Comedy Central.',
    pricing: 'החל מ-$5.99',
    categories: ['movies', 'series', 'sports'],
  },
  {
    id: 'peacock',
    name: 'Peacock',
    url: 'https://www.peacocktv.com',
    logoColor: '#1c1c1c',
    description: 'NBC Universal, אולימפיאדה, WWE, סרטים.',
    pricing: 'חינם עם מודעות / פרימיום',
    categories: ['series', 'movies', 'sports'],
  },
  {
    id: 'crunchyroll',
    name: 'Crunchyroll',
    url: 'https://www.crunchyroll.com',
    logoColor: '#f47521',
    description: 'האנימה הגדול בעולם. סימולקאסט מיפן.',
    pricing: 'החל מ-$7.99',
    categories: ['anime'],
  },
  {
    id: 'youtube',
    name: 'YouTube',
    url: 'https://www.youtube.com',
    logoColor: '#ff0000',
    description: 'סרטונים, מוזיקה, שידורים חיים, סרטים להשכרה.',
    pricing: 'חינם / Premium',
    categories: ['free', 'movies', 'music'],
  },
  {
    id: 'pluto',
    name: 'Pluto TV',
    url: 'https://pluto.tv',
    logoColor: '#ffcc00',
    description: 'טלוויזיה חיה חינם עם מודעות.',
    pricing: 'חינם',
    categories: ['free', 'live'],
  },
  {
    id: 'tubi',
    name: 'Tubi',
    url: 'https://tubitv.com',
    logoColor: '#ff501a',
    description: 'סרטים וסדרות חינם עם מודעות.',
    pricing: 'חינם',
    categories: ['free', 'movies', 'series'],
  },
];

export function getUserSubscriptions() {
  try {
    return JSON.parse(localStorage.getItem('sb_subscriptions') || '[]');
  } catch {
    return [];
  }
}

export function setUserSubscriptions(subs) {
  localStorage.setItem('sb_subscriptions', JSON.stringify(subs));
}

export function toggleSubscription(serviceId) {
  const subs = getUserSubscriptions();
  if (subs.includes(serviceId)) {
    setUserSubscriptions(subs.filter(id => id !== serviceId));
  } else {
    setUserSubscriptions([...subs, serviceId]);
  }
}

export function isSubscribed(serviceId) {
  return getUserSubscriptions().includes(serviceId);
}
