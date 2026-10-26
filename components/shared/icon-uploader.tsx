'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Search, Check, Loader2, FileText, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { sanitizeSvg, isValidSvg } from '@/lib/svg-sanitizer';
import { IconRenderer, type IconInfo } from '@/components/shared/icon-renderer';
import { POPULAR_LUCIDE_ICONS } from '@/lib/icon-catalog';

interface IconUploaderProps {
  value: IconInfo;
  onChange: (icon: IconInfo) => void;
  label?: string;
}

export function IconUploader({ value, onChange, label = 'Icon' }: IconUploaderProps) {
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [rawSvg, setRawSvg] = useState('');
  const [svgError, setSvgError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const safeValue: IconInfo = {
    icon_type: value.icon_type,
    icon_name: value.icon_name,
    icon_svg_path: value.icon_svg_path ?? null,
  };

  const filteredIcons = POPULAR_LUCIDE_ICONS.filter((n) =>
    n.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 60);

  const emit = useCallback((icon: IconInfo) => {
    onChange({ icon_type: icon.icon_type, icon_name: icon.icon_name, icon_svg_path: icon.icon_svg_path ?? null });
  }, [onChange]);

  const uploadSvg = useCallback(async (svgText: string, fileName?: string) => {
    setSvgError(null);
    if (!isValidSvg(svgText)) {
      setSvgError('Invalid SVG markup. Please ensure it contains a valid <svg> element.');
      return;
    }
    const sanitized = sanitizeSvg(svgText);
    const fname = fileName || `icon-${Date.now()}.svg`;
    setUploading(true);
    const { data, error } = await supabase.storage
      .from('icons')
      .upload(fname, sanitized, { contentType: 'image/svg+xml', upsert: true });
    setUploading(false);
    if (error) {
      setSvgError(`Upload failed: ${error.message}`);
      return;
    }
    emit({ icon_type: 'custom', icon_name: 'custom', icon_svg_path: data.path });
    setShowPreview(false);
  }, [emit]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    await uploadSvg(text, file.name.replace(/\s+/g, '-'));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePasteSvg = async () => {
    if (!rawSvg.trim()) return;
    await uploadSvg(rawSvg);
    if (!svgError) setRawSvg('');
  };

  const handleReset = () => {
    emit({ icon_type: 'lucide', icon_name: 'Wheat', icon_svg_path: null });
    setRawSvg('');
    setSvgError(null);
    setShowPreview(false);
  };

  return (
    <div className="space-y-2">
      {label && <Label className="text-xs">{label}</Label>}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/30">
          <IconRenderer icon={safeValue} className="h-5 w-5 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          {safeValue.icon_type === 'custom' ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] gap-1">
                <ImageIcon className="h-3 w-3" /> Custom SVG
              </Badge>
              <Button size="sm" variant="ghost" onClick={handleReset} className="h-7 text-xs">
                <X className="h-3 w-3" /> Reset
              </Button>
            </div>
          ) : (
            <Select value={safeValue.icon_name} onValueChange={(v) => emit({ icon_type: 'lucide', icon_name: v, icon_svg_path: null })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {POPULAR_LUCIDE_ICONS.slice(0, 30).map((ic) => (
                  <SelectItem key={ic} value={ic}>{ic}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <Tabs value={showPreview ? 'upload' : 'pick'} onValueChange={(v) => setShowPreview(v === 'upload')}>
        <TabsList className="h-8">
          <TabsTrigger value="pick" className="text-[11px] gap-1" onClick={() => setShowPreview(false)}>
            <Search className="h-3 w-3" /> Pick from library
          </TabsTrigger>
          <TabsTrigger value="upload" className="text-[11px] gap-1" onClick={() => setShowPreview(true)}>
            <Upload className="h-3 w-3" /> Upload / Paste SVG
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pick" className="mt-2">
          <Input
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs mb-2"
          />
          <div className="max-h-32 overflow-y-auto rounded-md border border-border p-2">
            <div className="grid grid-cols-8 gap-1">
              {filteredIcons.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => emit({ icon_type: 'lucide', icon_name: n, icon_svg_path: null })}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border transition-all ${
                    safeValue.icon_type === 'lucide' && safeValue.icon_name === n
                      ? 'border-primary bg-primary/10'
                      : 'border-transparent hover:border-border hover:bg-muted'
                  }`}
                  title={n}
                >
                  <IconRenderer icon={{ icon_type: 'lucide' as const, icon_name: n, icon_svg_path: null }} className="h-4 w-4 text-foreground" />
                </button>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="mt-2 space-y-2">
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="h-8 text-xs"
            >
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
              Upload .svg file
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".svg,image/svg+xml"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] flex items-center gap-1"><FileText className="h-3 w-3" /> Or paste raw SVG markup</Label>
            <Textarea
              value={rawSvg}
              onChange={(e) => setRawSvg(e.target.value)}
              placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">...</svg>'
              className="h-20 text-[11px]"
            />
            <Button type="button" size="sm" onClick={handlePasteSvg} disabled={uploading || !rawSvg.trim()} className="h-7 text-xs">
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Save SVG
            </Button>
            {svgError && <p className="text-[10px] text-destructive">{svgError}</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
