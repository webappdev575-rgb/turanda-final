'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Megaphone, Plus, Edit2, Trash2, Power, Calendar, Clock, TrendingUp,
  Eye, MousePointerClick, Loader2, AlertCircle, Save, X, Filter,
  CheckCircle2, Inbox,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/i18n-provider';

interface AdSpaceRow {
  id: string;
  slot: string;
  placement: string;
  label: string;
  description: string | null;
  page: string | null;
  category: string | null;
  width: number;
  height: number;
  available: boolean;
  price_per_month: number;
  adsense_enabled: boolean;
  adsense_slot: string | null;
}

interface AdPlacementRow {
  id: string;
  ad_space_id: string;
  business_name: string;
  image_url: string | null;
  target_url: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  priority: number;
  impressions: number;
  clicks: number;
  days_of_week: number[] | null;
  start_hour: number;
  end_hour: number;
}

interface AdRequestRow {
  id: string;
  company_name: string;
  contact_email: string;
  contact_phone: string;
  target_placement: string;
  target_url: string | null;
  banner_design_option: string;
  banner_file_url: string | null;
  design_notes: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const pageOptions = ['home', 'jobs', 'news', 'dashboard', 'commodities', 'employer'];
const placementOptions = ['sidebar', 'header', 'footer', 'inline', 'between-sections'];

export function AdsAdminTab() {
  const { t } = useI18n();
  const [spaces, setSpaces] = useState<AdSpaceRow[]>([]);
  const [placements, setPlacements] = useState<AdPlacementRow[]>([]);
  const [adRequests, setAdRequests] = useState<AdRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPage, setFilterPage] = useState<string>('all');
  const [editingSpace, setEditingSpace] = useState<AdSpaceRow | null>(null);
  const [editingPlacement, setEditingPlacement] = useState<AdPlacementRow | null>(null);
  const [spaceDialogOpen, setSpaceDialogOpen] = useState(false);
  const [placementDialogOpen, setPlacementDialogOpen] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [{ data: spaceData }, { data: placementData }, { data: requestData }] = await Promise.all([
      supabase.from('ad_spaces').select('*').order('page', { ascending: true }).order('slot', { ascending: true }),
      supabase.from('ad_placements').select('*').order('created_at', { ascending: false }),
      supabase.from('ad_requests').select('*').order('created_at', { ascending: false }),
    ]);
    setSpaces((spaceData || []) as AdSpaceRow[]);
    setPlacements((placementData || []) as AdPlacementRow[]);
    setAdRequests((requestData || []) as AdRequestRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaveSpace = async (space: Partial<AdSpaceRow>) => {
    if (editingSpace?.id) await supabase.from('ad_spaces').update(space).eq('id', editingSpace.id);
    else await supabase.from('ad_spaces').insert(space);
    setSpaceDialogOpen(false); setEditingSpace(null); loadData();
  };

  const handleSavePlacement = async (placement: Partial<AdPlacementRow>) => {
    if (editingPlacement?.id) await supabase.from('ad_placements').update(placement).eq('id', editingPlacement.id);
    else await supabase.from('ad_placements').insert(placement);
    setPlacementDialogOpen(false); setEditingPlacement(null); loadData();
  };

  const handleDeleteSpace = async (id: string) => { await supabase.from('ad_spaces').delete().eq('id', id); loadData(); };
  const handleDeletePlacement = async (id: string) => { await supabase.from('ad_placements').delete().eq('id', id); loadData(); };
  const togglePlacementActive = async (p: AdPlacementRow) => { await supabase.from('ad_placements').update({ is_active: !p.is_active }).eq('id', p.id); loadData(); };
  const toggleAdSense = async (s: AdSpaceRow) => { await supabase.from('ad_spaces').update({ adsense_enabled: !s.adsense_enabled }).eq('id', s.id); loadData(); };

  const handleApproveRequest = async (req: AdRequestRow) => {
    await supabase.from('ad_requests').update({ status: 'approved' }).eq('id', req.id);
    loadData();
  };

  const handleRejectRequest = async (req: AdRequestRow) => {
    await supabase.from('ad_requests').update({ status: 'rejected' }).eq('id', req.id);
    loadData();
  };

  const handleConvertRequest = async (req: AdRequestRow) => {
    const { data: space } = await supabase.from('ad_spaces').select('id').eq('slot', req.target_placement).maybeSingle();
    if (space) {
      await supabase.from('ad_placements').insert([{
        ad_space_id: space.id,
        business_name: req.company_name,
        image_url: req.banner_file_url,
        target_url: req.target_url,
        start_date: new Date().toISOString().slice(0, 10),
        end_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        is_active: true,
        priority: 0,
      }]);
      await supabase.from('ad_requests').update({ status: 'converted' }).eq('id', req.id);
    }
    loadData();
  };

  const filteredSpaces = filterPage === 'all' ? spaces : spaces.filter((s) => s.page === filterPage || s.page === null);
  const getPlacementsForSpace = (spaceId: string) => placements.filter((p) => p.ad_space_id === spaceId);
  const pendingRequests = adRequests.filter((r) => r.status === 'pending');

  return (
    <Tabs defaultValue="spaces">
      <TabsList className="mb-4">
        <TabsTrigger value="spaces" className="gap-1.5"><Megaphone className="h-4 w-4" />Ad Spaces</TabsTrigger>
        <TabsTrigger value="requests" className="gap-1.5"><Inbox className="h-4 w-4" />{t('admin.adRequests')}{pendingRequests.length > 0 && <span className="ml-1 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">{pendingRequests.length}</span>}</TabsTrigger>
      </TabsList>

      <TabsContent value="spaces">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterPage} onValueChange={setFilterPage}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filter by page" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pages</SelectItem>
                {pageOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={() => { setEditingSpace(null); setSpaceDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> New Ad Space
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-4">
            {filteredSpaces.map((space) => {
              const spacePlacements = getPlacementsForSpace(space.id);
              return (
                <Card key={space.id} className="overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground">{space.label}</h3>
                          <Badge variant="outline" className="text-[10px]">{space.placement}</Badge>
                          {space.page && <Badge variant="outline" className="text-[10px]">{space.page}</Badge>}
                          {space.category && <Badge variant="outline" className="text-[10px] text-primary">{space.category}</Badge>}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{space.slot} · {space.width > 0 ? `${space.width}×${space.height}` : 'responsive'} · ₺{space.price_per_month}/mo</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5">
                        <span className="text-xs font-medium text-muted-foreground">AdSense</span>
                        <Switch checked={space.adsense_enabled} onCheckedChange={() => toggleAdSense(space)} />
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => { setEditingSpace(space); setSpaceDialogOpen(true); }}><Edit2 className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteSpace(space.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      <Button size="sm" onClick={() => { setSelectedSpaceId(space.id); setEditingPlacement(null); setPlacementDialogOpen(true); }}><Plus className="mr-1 h-4 w-4" /> Add Placement</Button>
                    </div>
                  </div>
                  <div className="p-4">
                    {spacePlacements.length === 0 ? (
                      <div className="flex items-center justify-center py-6 text-center">
                        <div>
                          <AlertCircle className="mx-auto mb-1 h-6 w-6 text-muted-foreground/40" />
                          <p className="text-xs text-muted-foreground">No placements yet.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {spacePlacements.map((p) => (
                          <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                            <div className="flex items-center gap-3">
                              <div className={cn('flex h-2 w-2 rounded-full', p.is_active ? 'bg-success' : 'bg-muted-foreground/30')} />
                              <div>
                                <p className="text-sm font-medium text-foreground">{p.business_name}</p>
                                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                                  <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" />{p.start_date} → {p.end_date}</span>
                                  {p.priority > 0 && <Badge variant="outline" className="text-[9px]">Priority: {p.priority}</Badge>}
                                  <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" />{p.impressions || 0}</span>
                                  <span className="flex items-center gap-0.5"><MousePointerClick className="h-3 w-3" />{p.clicks || 0}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Switch checked={p.is_active} onCheckedChange={() => togglePlacementActive(p)} />
                              <Button size="sm" variant="ghost" onClick={() => { setEditingPlacement(p); setSelectedSpaceId(space.id); setPlacementDialogOpen(true); }}><Edit2 className="h-4 w-4" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeletePlacement(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {spaceDialogOpen && <SpaceEditDialog space={editingSpace} onClose={() => { setSpaceDialogOpen(false); setEditingSpace(null); }} onSave={handleSaveSpace} />}
        {placementDialogOpen && selectedSpaceId && <PlacementEditDialog placement={editingPlacement} spaceId={selectedSpaceId} spaceLabel={spaces.find((s) => s.id === selectedSpaceId)?.label || ''} onClose={() => { setPlacementDialogOpen(false); setEditingPlacement(null); setSelectedSpaceId(null); }} onSave={handleSavePlacement} />}
      </TabsContent>

      <TabsContent value="requests">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : adRequests.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 py-12 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t('advertise.noRequests')}</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {adRequests.map((req) => (
              <Card key={req.id} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">{req.company_name}</h4>
                      <Badge variant="outline" className={cn('text-xs',
                        req.status === 'pending' && 'bg-warning/10 text-warning border-warning/30',
                        req.status === 'approved' && 'bg-success/10 text-success border-success/30',
                        req.status === 'rejected' && 'bg-destructive/10 text-destructive border-destructive/30',
                        req.status === 'converted' && 'bg-primary/10 text-primary border-primary/30',
                      )}>
                        {t(`advertise.status${req.status.charAt(0).toUpperCase() + req.status.slice(1)}` as 'advertise.statusPending')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{req.contact_email} · {req.contact_phone}</p>
                    <p className="text-xs text-muted-foreground">Placement: {req.target_placement}{req.target_url ? ` · URL: ${req.target_url}` : ''}</p>
                    <p className="text-xs text-muted-foreground">Design: {req.banner_design_option === 'self_provided' ? t('advertise.selfProvided') : t('advertise.customDesign')}</p>
                    {req.banner_file_url && <a href={req.banner_file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View banner</a>}
                    {req.design_notes && <p className="text-xs text-muted-foreground">Notes: {req.design_notes}</p>}
                    {req.message && <p className="text-xs text-muted-foreground">Message: {req.message}</p>}
                  </div>
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleRejectRequest(req)} className="text-destructive hover:text-destructive">{t('admin.reject')}</Button>
                      <Button size="sm" variant="outline" onClick={() => handleApproveRequest(req)} className="border-success/30 text-success hover:bg-success/10">{t('admin.approve')}</Button>
                      <Button size="sm" onClick={() => handleConvertRequest(req)} className="bg-primary hover:bg-primary-light">{t('admin.convert')}</Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function SpaceEditDialog({ space, onClose, onSave }: { space: AdSpaceRow | null; onClose: () => void; onSave: (s: Partial<AdSpaceRow>) => void }) {
  const [slot, setSlot] = useState(space?.slot || '');
  const [label, setLabel] = useState(space?.label || '');
  const [description, setDescription] = useState(space?.description || '');
  const [page, setPage] = useState(space?.page || '');
  const [category, setCategory] = useState(space?.category || '');
  const [placement, setPlacement] = useState(space?.placement || 'sidebar');
  const [width, setWidth] = useState(space?.width?.toString() || '0');
  const [height, setHeight] = useState(space?.height?.toString() || '250');
  const [pricePerMonth, setPricePerMonth] = useState(space?.price_per_month?.toString() || '0');
  const [available, setAvailable] = useState(space?.available ?? true);
  const [adsenseEnabled, setAdsenseEnabled] = useState(space?.adsense_enabled ?? false);
  const [adsenseSlot, setAdsenseSlot] = useState(space?.adsense_slot || '');

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader><DialogTitle>{space ? 'Edit Ad Space' : 'New Ad Space'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Slot ID</Label><Input value={slot} onChange={(e) => setSlot(e.target.value)} placeholder="e.g. jobs-sidebar-hasat" disabled={!!space} /></div>
          <div className="space-y-2"><Label>Label</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Jobs Sidebar (Hasat)" /></div>
          <div className="space-y-2"><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Page</Label><Select value={page} onValueChange={setPage}><SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger><SelectContent><SelectItem value="any">Any</SelectItem>{pageOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Placement Type</Label><Select value={placement} onValueChange={setPlacement}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{placementOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="space-y-2"><Label>Category Target (optional)</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2"><Label>Width (px)</Label><Input type="number" value={width} onChange={(e) => setWidth(e.target.value)} /></div>
            <div className="space-y-2"><Label>Height (px)</Label><Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} /></div>
            <div className="space-y-2"><Label>Price/Month</Label><Input type="number" value={pricePerMonth} onChange={(e) => setPricePerMonth(e.target.value)} /></div>
          </div>
          <div className="flex items-center gap-2"><Switch checked={available} onCheckedChange={setAvailable} /><Label>Available for booking</Label></div>
          <div className="rounded-lg border border-border p-3">
            <div className="mb-2 flex items-center gap-2"><Switch checked={adsenseEnabled} onCheckedChange={setAdsenseEnabled} /><Label>Use Google AdSense</Label></div>
            {adsenseEnabled && <div className="space-y-2"><Label>AdSense Slot ID</Label><Input value={adsenseSlot} onChange={(e) => setAdsenseSlot(e.target.value)} /></div>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}><X className="mr-2 h-4 w-4" />Cancel</Button>
          <Button onClick={() => onSave({ slot, label, description: description || null, page: page === 'any' ? null : page || null, category: category || null, placement, width: parseInt(width) || 0, height: parseInt(height) || 0, price_per_month: parseFloat(pricePerMonth) || 0, available, adsense_enabled: adsenseEnabled, adsense_slot: adsenseSlot || null })}><Save className="mr-2 h-4 w-4" />Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlacementEditDialog({ placement, spaceId, spaceLabel, onClose, onSave }: { placement: AdPlacementRow | null; spaceId: string; spaceLabel: string; onClose: () => void; onSave: (p: Partial<AdPlacementRow>) => void }) {
  const [businessName, setBusinessName] = useState(placement?.business_name || '');
  const [imageUrl, setImageUrl] = useState(placement?.image_url || '');
  const [targetUrl, setTargetUrl] = useState(placement?.target_url || '');
  const [startDate, setStartDate] = useState(placement?.start_date || new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(placement?.end_date || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const [isActive, setIsActive] = useState(placement?.is_active ?? true);
  const [priority, setPriority] = useState(placement?.priority?.toString() || '0');
  const [startHour, setStartHour] = useState(placement?.start_hour?.toString() || '0');
  const [endHour, setEndHour] = useState(placement?.end_hour?.toString() || '23');
  const [selectedDays, setSelectedDays] = useState<number[]>(placement?.days_of_week || []);

  const toggleDay = (day: number) => setSelectedDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader><DialogTitle>{placement ? 'Edit Placement' : 'New Placement'} — {spaceLabel}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Business Name</Label><Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} /></div>
          <div className="space-y-2"><Label>Image URL</Label><Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." /></div>
          <div className="space-y-2"><Label>Target URL</Label><Input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>End Date</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Priority</Label><Input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} /></div>
            <div className="flex items-end gap-2"><div className="space-y-2"><Label>Active</Label><div className="flex h-10 items-center"><Switch checked={isActive} onCheckedChange={setIsActive} /></div></div></div>
          </div>
          <div className="space-y-2"><Label>Days of Week (empty = every day)</Label><div className="flex flex-wrap gap-1.5">{dayNames.map((day, i) => (<button key={i} type="button" onClick={() => toggleDay(i)} className={cn('rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all', selectedDays.includes(i) ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/40')}>{day}</button>))}</div></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Start Hour (0-23)</Label><Input type="number" min={0} max={23} value={startHour} onChange={(e) => setStartHour(e.target.value)} /></div>
            <div className="space-y-2"><Label>End Hour (0-23)</Label><Input type="number" min={0} max={23} value={endHour} onChange={(e) => setEndHour(e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}><X className="mr-2 h-4 w-4" />Cancel</Button>
          <Button onClick={() => onSave({ ad_space_id: spaceId, business_name: businessName, image_url: imageUrl || null, target_url: targetUrl || null, start_date: startDate, end_date: endDate, is_active: isActive, priority: parseInt(priority) || 0, days_of_week: selectedDays.length > 0 ? selectedDays : null, start_hour: parseInt(startHour) || 0, end_hour: parseInt(endHour) || 23 })}><Save className="mr-2 h-4 w-4" />Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
