'use client';

import { useEffect, useState } from 'react';
import { icons as LucideIcons, Wheat } from 'lucide-react';
import { sanitizeSvg } from '@/lib/svg-sanitizer';
import { supabase } from '@/lib/supabase';

export interface IconInfo {
  icon_type: 'lucide' | 'custom';
  icon_name: string;
  icon_svg_path: string | null;
}

interface IconRendererProps {
  icon: IconInfo | null | undefined;
  className?: string;
  fallback?: string;
}

export function IconRenderer({ icon, className = 'h-5 w-5', fallback = 'Wheat' }: IconRendererProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);

  const isCustom = icon?.icon_type === 'custom' && !!icon?.icon_svg_path;
  const path = icon?.icon_svg_path ?? null;

  useEffect(() => {
    if (!isCustom || !path) {
      setSvgContent(null);
      return;
    }
    setSvgContent(null);
    let cancelled = false;
    (async () => {
      const { data } = await supabase.storage.from('icons').download(path);
      if (data && !cancelled) {
        const text = await data.text();
        if (!cancelled) setSvgContent(sanitizeSvg(text));
      }
    })();
    return () => { cancelled = true; };
  }, [isCustom, path]);

  if (isCustom) {
    if (svgContent) {
      return (
        <span
          className={className}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      );
    }
    return <Wheat className={className} />;
  }

  const lucideName = icon?.icon_name || fallback;
  const Icon = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[lucideName] || Wheat;
  return <Icon className={className} />;
}

export function getLucideIcon(name: string): React.ComponentType<{ className?: string }> {
  return (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[name] || Wheat;
}
