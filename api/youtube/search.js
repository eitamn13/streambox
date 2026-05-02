// YouTube Search via Invidious (no API key needed)
// =================================================

const INVIDIOUS_INSTANCES = [
  'https://vid.puffyan.us',
  'https://inv.riverside.rocks',
  'https://invidious.snopyta.org',
  'https://y.com.sb',
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing q parameter' });

  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const response = await fetch(
        `${instance}/api/v1/search?q=${encodeURIComponent(q + ' full movie')}&type=video`,
        { headers: { 'User-Agent': 'StreamBox/1.0' }, timeout: 5000 }
      );
      if (!response.ok) continue;

      const data = await response.json();
      const results = (Array.isArray(data) ? data : []).slice(0, 5).map(v => ({
        videoId: v.videoId,
        title: v.title,
        author: v.author,
        url: `https://www.youtube.com/watch?v=${v.videoId}`,
        embedUrl: `https://www.youtube.com/embed/${v.videoId}`,
        thumbnail: v.videoThumbnails?.find(t => t.quality === 'medium')?.url || v.videoThumbnails?.[0]?.url,
        duration: v.lengthSeconds,
        provider: 'YouTube',
        sourceType: 'legal_free',
      }));

      return res.status(200).json({ results });
    } catch (e) {
      console.warn(`Invidious instance ${instance} failed:`, e.message);
    }
  }

  res.status(500).json({ error: 'All Invidious instances failed' });
}
