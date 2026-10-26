'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type FavoriteKind = 'commodity' | 'exchange';

type FavoriteState = Record<FavoriteKind, string[]>;

const COOKIE_NAME = 'turanda-market-favs';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

const EMPTY: FavoriteState = { commodity: [], exchange: [] };

function readCookie(): FavoriteState {
  if (typeof document === 'undefined') return EMPTY;
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return EMPTY;
  try {
    const parsed = JSON.parse(decodeURIComponent(match.slice(COOKIE_NAME.length + 1)));
    return {
      commodity: Array.isArray(parsed?.commodity) ? parsed.commodity.filter((v: unknown) => typeof v === 'string') : [],
      exchange: Array.isArray(parsed?.exchange) ? parsed.exchange.filter((v: unknown) => typeof v === 'string') : [],
    };
  } catch {
    return EMPTY;
  }
}

function writeCookie(state: FavoriteState) {
  if (typeof document === 'undefined') return;
  const empty = state.commodity.length === 0 && state.exchange.length === 0;
  document.cookie = empty
    ? `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`
    : `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(state))}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

/**
 * Favorites for the market page. Signed-in users get database-backed favorites
 * (they follow the account across devices); guests get cookie-backed favorites.
 * When a guest signs in, cookie favorites are merged into the account once and
 * the cookie is cleared.
 */
export function useMarketFavorites() {
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id;
  const [favorites, setFavorites] = useState<FavoriteState>(EMPTY);
  const [ready, setReady] = useState(false);

  // Load favorites: from database when signed in, otherwise from the cookie.
  useEffect(() => {
    let cancelled = false;

    if (!isSupabaseConfigured || !userId) {
      setFavorites(readCookie());
      setReady(true);
      return;
    }

    setReady(false);
    (async () => {
      const { data, error } = await supabase
        .from('user_market_favorites')
        .select('kind, value')
        .eq('user_id', userId);

      if (cancelled) return;
      const dbState: FavoriteState = { commodity: [], exchange: [] };
      if (!error && data) {
        for (const row of data as { kind: FavoriteKind; value: string }[]) {
          if (row.kind === 'commodity' || row.kind === 'exchange') {
            if (!dbState[row.kind].includes(row.value)) dbState[row.kind].push(row.value);
          }
        }
      }

      if (error) {
        setFavorites(EMPTY);
        setReady(true);
        return;
      }

      // Merge cookie favorites into the account (guest → member), then clear the cookie.
      const cookieState = readCookie();
      const merged: FavoriteState = { ...dbState };
      const toInsert: { kind: FavoriteKind; value: string }[] = [];
      (['commodity', 'exchange'] as FavoriteKind[]).forEach((kind) => {
        cookieState[kind].forEach((value) => {
          if (!merged[kind].includes(value)) {
            merged[kind].push(value);
            toInsert.push({ kind, value });
          }
        });
      });

      if (toInsert.length > 0) {
        const { error: mergeError } = await supabase
          .from('user_market_favorites')
          .upsert(toInsert.map((r) => ({ ...r, user_id: userId })), {
            onConflict: 'user_id,kind,value',
            ignoreDuplicates: true,
          });
        if (cancelled) return;
        if (!mergeError) writeCookie(EMPTY);
      }

      if (!cancelled) {
        setFavorites(merged);
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const toggle = useCallback(
    async (kind: FavoriteKind, value: string) => {
      if (!userId || !isSupabaseConfigured) {
        setFavorites((prev) => {
          const has = prev[kind].includes(value);
          const next: FavoriteState = {
            ...prev,
            [kind]: has ? prev[kind].filter((v) => v !== value) : [...prev[kind], value],
          };
          writeCookie(next);
          return next;
        });
        return;
      }

      const has = favorites[kind].includes(value);
      // Optimistic update, rollback on error.
      setFavorites((prev) => ({
        ...prev,
        [kind]: has ? prev[kind].filter((v) => v !== value) : [...prev[kind], value],
      }));

      if (has) {
        const { error } = await supabase
          .from('user_market_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('kind', kind)
          .eq('value', value);
        if (error) {
          setFavorites((prev) => ({
            ...prev,
            [kind]: prev[kind].includes(value) ? prev[kind] : [...prev[kind], value],
          }));
        }
      } else {
        const { error } = await supabase
          .from('user_market_favorites')
          .insert({ kind, value });
        if (error && error.code !== '23505') {
          setFavorites((prev) => ({
            ...prev,
            [kind]: prev[kind].filter((v) => v !== value),
          }));
        }
      }
    },
    [userId, favorites],
  );

  return { favorites, toggle, ready: ready && !authLoading };
}
