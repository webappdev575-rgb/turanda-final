/*
# Dynamic Commodity Market System

## Overview
This migration transforms the commodity market from a static demo with hardcoded data
into a fully dynamic, admin-managed system. It adds:
- Dynamic data source management (RSS/XML/JSON API sources stored in the database)
- Fetch logging for monitoring data ingestion
- Commodity icon overrides (admin-configurable, falling back to code defaults)
- Commodity registry (admin-configurable translations and metadata for new commodities)
- Admin CRUD policies on commodity_exchanges (add/edit/delete exchanges from the panel)
- Performance indexes and a unique constraint for deduplication
- A latest_price_date column on commodity_exchanges for freshness tracking

## 1. New Tables

### commodity_sources
- Stores data source configurations that the fetch-commodities edge function reads
- Each source has a type (rss_xml, json_api, manual_json), URL, optional API key,
  target exchange, fetch interval, active toggle, and field mapping JSON

### commodity_source_logs
- Records every fetch attempt (success or failure) for monitoring
- Linked to commodity_sources via foreign key with CASCADE delete

### commodity_icon_overrides
- Stores admin-configured icon names per commodity (overrides hardcoded defaults)
- Primary key is the commodity name (text)

### commodity_registry
- Stores admin-registered commodity definitions with translations
- Allows adding new commodities through the admin panel without code changes
- Includes category, unit, translations for tr/en/ar, and icon name

## 2. Modified Tables

### commodity_exchanges
- Added `latest_price_date` (date, nullable) — updated when prices are ingested
- Added INSERT/UPDATE/DELETE RLS policies for admin users (using profiles.is_admin check)
- Existing SELECT policy for anon/authenticated is preserved

### commodity_prices
- Added unique composite index on (exchange_id, commodity_name, recorded_date) for deduplication
- Added composite index on (commodity_name, recorded_date DESC) for chart query performance

## 3. Security (RLS)
- commodity_sources: anon read, admin-only insert/update/delete (profiles.is_admin check)
- commodity_source_logs: anon read, admin-only insert/update/delete
- commodity_icon_overrides: anon read, admin-only insert/update/delete
- commodity_registry: anon read, admin-only insert/update/delete
- commodity_exchanges: existing anon SELECT preserved, added admin-only INSERT/UPDATE/DELETE

## 4. Important Notes
1. All admin policies use the same pattern: EXISTS (SELECT 1 FROM profiles WHERE
   profiles.id = auth.uid() AND profiles.is_admin = true)
2. The unique index on commodity_prices enables ON CONFLICT DO NOTHING for deduplication
3. latest_price_date is nullable so existing exchanges won't break
4. The field_mapping column in commodity_sources is a JSONB object that maps API
   response field names to database columns (commodity_name, price, unit, recorded_date, change_pct)
*/