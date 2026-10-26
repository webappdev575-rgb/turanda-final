# Turanda Tarım — Agricultural Job Marketplace

A full-featured agricultural job marketplace for Turkey with multi-language support (Turkish, English, Arabic), dark/light mode, commodity market data, weather, personalized dashboards, and an integrated ad management system.

## Features

- **Job Board** — Browse, filter, and apply to agricultural jobs across Turkey with list and map views
- **Employer Portal** — Post jobs, manage listings, review applications
- **Commodity Markets** — Live agricultural commodity prices from 20 Turkish commodity exchanges with interactive charts
- **Personalized Dashboard** — Weather (Open-Meteo API), local commodity prices, and regional news based on user location
- **Multi-language** — Turkish, English, Arabic (with RTL support)
- **Dark/Light Mode** — Theme toggle with system preference detection
- **Authentication** — Email/password sign-up and login via Supabase Auth
- **Hero Slider** — Dynamic agriculture news, commodity prices, and opportunity slides
- **Ad Management** — Full admin dashboard for managing ad spaces, scheduling placements, category targeting, AdSense override, and performance analytics
- **AI Thumbnails** — Automated AI-generated thumbnails for news articles (optional, requires API key)

## Tech Stack

- **Frontend**: Next.js 13, React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Charts**: Recharts
- **Backend**: Supabase (PostgreSQL, Auth, RLS, Edge Functions)
- **Weather API**: Open-Meteo (free, no API key required)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase project 

### 1. Clone the repository

```bash
git clone https://github.com/your-username/turanda-tarim.git
cd turanda-tarim
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The Supabase URL and anon key are found in your Supabase dashboard under Settings > API. The service role key is also there (keep it secret — never expose it in client-side code).

### 4. Run the development server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 5. Build for production

```bash
npm run build
npm start
```

## Running with Docker

```bash
# Make sure .env is configured
docker-compose up --build
```

The app runs at http://localhost:3000.

## Deployment

### Netlify

The project includes `netlify.toml` with the Next.js plugin pre-configured:

1. Push to a Git repository
2. Connect the repo to Netlify
3. Add environment variables in the Netlify dashboard
4. Deploy

### Vercel

1. Push to a Git repository
2. Import the project in Vercel
3. Add environment variables
4. Deploy

### Any server (Docker)

1. Clone the repo to your server
2. Ensure `.env` is configured
3. Run `docker-compose up -d --build`
4. Set up a reverse proxy (nginx/caddy) to forward port 3000

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `AI_IMAGE_API_KEY` | No | OpenAI API key for AI thumbnail generation |
| `AI_IMAGE_PROVIDER` | No | `openai` or `custom` (default: openai) |
| `AI_IMAGE_ENDPOINT` | No | Custom image generation endpoint (if provider is custom) |

Weather data uses the free Open-Meteo API — no API key required.

## Database Schema

The app uses Supabase with the following tables:

- `jobs` — Job listings
- `applications` — Worker applications
- `commodity_exchanges` — Turkish commodity exchange hubs
- `commodity_prices` — Monthly commodity price data
- `profiles` — User profiles with location
- `news_articles` — Agricultural news articles with AI thumbnails
- `ad_spaces` — Configurable ad placement slots (sidebar, inline, header, footer)
- `ad_placements` — Individual ad bookings with scheduling and targeting

All tables have Row Level Security (RLS) enabled. Migrations are in `supabase/migrations/`.

### Ad System

The ad system supports:

- **Category-targeted slots** — Show different ads per job category (Hasat, Suruş, etc.)
- **Page-targeted slots** — Different ads for home, jobs, news, and dashboard pages
- **Scheduling** — Day-of-week and hourly scheduling per placement
- **Priority rotation** — Higher-priority placements show first; equal priorities rotate randomly
- **AdSense override** — Toggle Google AdSense per slot instead of direct placements
- **Performance tracking** — Impression and click counts with CTR calculation
- **Admin dashboard** — Full CRUD for ad spaces and placements at `/admin/ads`

### Edge Functions

- `fetch-commodities` — Fetches commodity prices from Turkish exchange websites
- `fetch-news` — Fetches agricultural news articles
- `generate-thumbnail` — Generates AI thumbnails for news articles (supports batch mode)

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Home page
│   ├── jobs/               # Job listings
│   ├── haberler/            # News page
│   ├── commodities/        # Commodity markets
│   ├── dashboard/          # User dashboard
│   ├── employer/           # Employer portal
│   ├── admin/ads/          # Ad management dashboard
│   └── ...
├── components/             # React components
│   ├── ads/                # Ad space components
│   ├── jobs/               # Job-related components
│   ├── home/               # Home page sections
│   ├── layout/             # Navbar, footer
│   └── ui/                 # shadcn/ui primitives
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities, config, types
├── supabase/
│   ├── config.toml         # Supabase project config
│   ├── functions/          # Edge functions
│   └── migrations/         # SQL migrations
├── Dockerfile
├── docker-compose.yml
├── netlify.toml
└── tailwind.config.ts
```

## License

© 2026 Turanda Tarım. All rights reserved.
