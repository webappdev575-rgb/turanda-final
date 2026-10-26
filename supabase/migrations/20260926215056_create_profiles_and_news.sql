/*
# Create profiles, user_locations, and news tables

## Overview
This migration creates the schema for user profiles (with location),
saved locations, and agricultural news articles. This enables the
personalized dashboard feature.

## 1. New Tables

### profiles
- `id` (uuid, PK, references auth.users) — one row per user
- `full_name` (text) — display name
- `user_type` (text, default 'worker') — 'worker' | 'farmer' | 'business'
- `city` (text) — user's city
- `region` (text) — geographical region
- `latitude` (double precision)
- `longitude` (double precision)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### news_articles
- `id` (uuid, PK)
- `title` (text, not null)
- `summary` (text)
- `category` (text) — 'market' | 'weather' | 'policy' | 'general'
- `region` (text) — region this news applies to, or 'all'
- `source` (text) — source name
- `url` (text) — link to original article
- `published_at` (timestamptz, not null)
- `created_at` (timestamptz, default now())

## 2. Security (RLS)
- profiles: users can read/update only their own profile
- news_articles: public read (anon + authenticated)

## 3. Seed Data
- Sample news articles covering different regions and categories

## Important Notes
1. profiles.id references auth.users — created on first login
2. user_type defaults to 'worker' but can be changed to 'farmer' or 'business'
3. News articles are public, profiles are private
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  user_type text NOT NULL DEFAULT 'worker',
  city text,
  region text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Create news_articles table
CREATE TABLE IF NOT EXISTS news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text,
  category text NOT NULL DEFAULT 'general',
  region text NOT NULL DEFAULT 'all',
  source text,
  url text,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_category ON news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_region ON news_articles(region);
CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles(published_at DESC);

ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_news" ON news_articles;
CREATE POLICY "anon_select_news" ON news_articles
  FOR SELECT TO anon, authenticated USING (true);

-- Seed sample news articles
INSERT INTO news_articles (title, summary, category, region, source, published_at) VALUES
('Buğday fiyatları bu yıl %15 artış gösterdi', 'TMEX verilerine göre buğday ton başına 8.250₺''ye ulaştı. Üreticiler verimli sezon bekliyor.', 'market', 'İç Anadolu', 'TÜRİB', now() - INTERVAL '2 hours'),
('Fındık hasadı Karadeniz''de başladı', 'Ordu ve Giresun''da fındık hasadı resmi olarak başladı. Verim geçen yıla göre %10 fazla bekleniyor.', 'general', 'Karadeniz', 'Ordu Ticaret Borsası', now() - INTERVAL '5 hours'),
('Antalya''da seracılık yatırımı artıyor', 'Antalya bölgesinde yeni seracılık projeleri binlerce iş imkanı yaratıyor.', 'policy', 'Akdeniz', 'Antalya Ticaret Borsası', now() - INTERVAL '8 hours'),
('Pamuk ihracatında rekor bekleniyor', 'Adana ve Hatay''da pamuk üreticileri bu sezon rekor ihracat bekliyor.', 'market', 'Akdeniz', 'Adana Ticaret Borsası', now() - INTERVAL '1 day'),
('Zeytinyağı üretiminde Türkiye liderliğini koruyor', 'Ege bölgesinde zeytinyağı üretimi bu yıl 295.000₺/ton seviyesine ulaştı.', 'market', 'Ege', 'İzmir Ticaret Borsası', now() - INTERVAL '1 day'),
('Antep fıstığı hasadı için geri sayım', 'Gaziantep''de Antep fıstığı hasadı eylül sonunda başlayacak. Fiyatlar 320₺/kg seviyesinde.', 'general', 'Güneydoğu Anadolu', 'Gaziantep Ticaret Borsası', now() - INTERVAL '2 days'),
('Mercimek üretiminde Konya öne çıkıyor', 'Konya Ovası''nda mercimek verimi bu yıl %20 arttı. Fiyatlar 22.500₺/ton seviyesinde.', 'market', 'İç Anadolu', 'Konya Ticaret Borsası', now() - INTERVAL '2 days'),
('Marmara bölgesinde ayçiçeği ekim alanları genişliyor', 'Tekirdağ ve Balıkesir''de ayçiçeği ekim alanları bu yıl %15 arttı.', 'general', 'Marmara', 'Tekirdağ Ticaret Borsası', now() - INTERVAL '3 days'),
('Çay üretiminde Doğu Karadeniz rekor bekliyor', 'Rize ve Trabzon''da çay üretimi bu sezon rekor seviyede bekleniyor.', 'market', 'Karadeniz', 'Trabzon Ticaret Borsası', now() - INTERVAL '3 days'),
('Tarım Bakanlığı''ndan yeni destek açıklaması', 'Tarım ve Orman Bakanlığı, çiftçilere yönelik yeni destek ödemelerini açıkladı.', 'policy', 'all', 'Resmi Gazete', now() - INTERVAL '4 days')
ON CONFLICT DO NOTHING;
