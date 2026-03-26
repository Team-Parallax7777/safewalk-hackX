# SafeWalk 🔦
**"What if your entire neighbourhood walked with you?"**

Community-powered women's safety PWA. Real-time unsafe route reporting + Guardian nudge system.

---

## Quick Start (5 steps)

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/safewalk.git
cd safewalk
npm install
```

### 2. Get Your API Keys

**Supabase** (free):
1. Go to [supabase.com](https://supabase.com) → New Project
2. Settings → API → copy `Project URL` and `anon public` key

**Mapbox** (free tier):
1. Go to [mapbox.com](https://mapbox.com) → Account → Tokens
2. Copy your default public token

### 3. Configure Environment
```bash
cp .env.local.example .env.local
```
Edit `.env.local` with your keys:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...
```

### 4. Set Up Database
1. Supabase Dashboard → SQL Editor
2. Paste the entire contents of `lib/supabase/schema.sql`
3. Click **Run**

### 5. Run Locally
```bash
npm run dev
# Open http://localhost:3000
```

---

## Deploy to Vercel
```bash
npm i -g vercel
vercel
# Add your 3 env vars in the Vercel dashboard
```

---

## Project Structure
```
safewalk/
├── app/
│   ├── layout.js          # Root layout, fonts, PWA meta
│   ├── globals.css        # Design system, Tailwind base
│   ├── page.js            # Redirects → /dashboard
│   └── dashboard/
│       └── page.js        # Main app page
├── components/
│   ├── layout/
│   │   ├── Providers.js   # React Query + Context wrappers
│   │   └── AuraHeader.js  # Sticky header with trust level
│   ├── map/
│   │   └── LiveMap.js     # Mapbox GL + real-time markers
│   └── ui/
│       ├── SafetyBar.js   # Bottom sheet: Walk/Unsafe/SOS
│       └── GuardianPanel.js # Guardian signup + dashboard
├── lib/
│   ├── context/
│   │   ├── AuthContext.js    # Supabase auth (anon + OTP)
│   │   ├── MapContext.js     # Mapbox instance + geolocation
│   │   └── SafetyContext.js  # Reports + real-time sync
│   ├── supabase/
│   │   ├── client.js         # Supabase singleton client
│   │   └── schema.sql        # DB tables, RLS, PostGIS setup
│   └── utils.js              # cn() helper
├── public/
│   ├── manifest.json         # PWA manifest
│   └── sw.js                 # Service worker
├── .env.local.example
├── next.config.js
└── tailwind.config.js
```

---

## Tech Stack
| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 App Router (JS) |
| Styling | Tailwind CSS + Lantern Amber palette |
| Maps | Mapbox GL JS v3 |
| Backend | Supabase (Postgres + Realtime + Auth) |
| Spatial | PostGIS for proximity queries |
| PWA | manifest.json + Service Worker |
| Deploy | Vercel |

---

## Fonts Used
- **Bricolage Grotesque** — headings (handmade, human feel)
- **Outfit** — body text (warm, rounded)
- **IBM Plex Mono** — coordinates and status codes
