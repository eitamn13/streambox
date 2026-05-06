// EPG Parser — Disabled due to CORS issues
// Will be re-enabled with a backend proxy in the future

export async function fetchEPG() {
  // EPG disabled — CORS issues with external proxy
  // Return cached data if available
  try {
    const cached = JSON.parse(localStorage.getItem('sb-epg-cache') || 'null');
    if (cached && Date.now() - cached.timestamp < 6 * 60 * 60 * 1000) {
      return cached.data;
    }
  } catch { /* ignore */ }
  return [];
}

export function getChannelEPG(_programs, _channelId, _channelName) {
  return [];
}

export function getCurrentProgram(_programs, _channelId, _channelName) {
  return null;
}

export function formatEPGTime(date) {
  if (!date) return '';
  return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}
