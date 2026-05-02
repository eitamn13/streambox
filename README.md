# StreamBox

Streaming app with real Debrid integration, Stremio addon support, and multi-language UI.

## One-Click Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## Deploy in 3 Steps

### 1. Go to Vercel
Open [vercel.com/new](https://vercel.com/new)

### 2. Import the ZIP
Click **"Upload"** → Select `streambox-deploy.zip`

### 3. Set Environment Variables
In the Vercel dashboard before deploying, add:

| Variable | Value | Required |
|----------|-------|----------|
| `VITE_TMDB_API_KEY` | Your TMDB API key | **Yes** |
| `VITE_SUPABASE_URL` | Your Supabase URL | No |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | No |

Get your **TMDB API key** free at: https://www.themoviedb.org/settings/api

Click **Deploy**. Done.

## What Works Out of the Box

- **Real Debrid** — Add your API key in the Debrid tab, manage torrents, get unrestricted links
- **Premiumize** — Same flow, full torrent management
- **TorBox** — Same flow, full torrent management
- **Stremio Addons** — Install any addon via URL in the Addons tab
- **Player** — HLS adaptive streaming, quality picker, subtitle sync
- **Auth** — Local auth (upgradeable to Supabase cloud)
- **i18n** — Hebrew + English with RTL/LTR
- **Multi-profile** — Create multiple user profiles

## Project Structure

```
api/                  # Vercel serverless functions
src/components/       # React UI components
src/core/            # DebridManager, StreamEngine, etc.
src/pages/           # Login, Signup
src/contexts/        # Auth, watchlist, favorites, profiles
src/i18n/            # Hebrew + English translations
```

## Local Dev

```bash
npm install
npm run dev
```

API routes work automatically in dev mode via Vite middleware.
