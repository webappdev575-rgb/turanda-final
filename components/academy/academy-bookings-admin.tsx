'use client';

import { useState } from 'react';
import { Check, Loader2, Pencil, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAdminAcademyBookings } from '@/hooks/use-academy';
import { useToast } from '@/hooks/use-toast';
import type { AcademyCourseBooking, AcademyCourseSettings } from '@/lib/types';

const COURSE_NAMES: Record<string, string> = {
  'farmer-for-a-day': 'Farmer for a Day',
  'weekend-farming': 'Weekend Farming Programme',
  'professional-farming': 'Six-Month Professional Farming Programme',
};

export function AcademyBookingsAdmin() {
  const { settings, bookings, loading, updateCapacity, updateBooking, setBookingStatus } = useAdminAcademyBookings();
  const { toast } = useToast();
  const [editing, setEditing] = useState<AcademyCourseBooking | null>(null);
  const [editForm, setEditForm] = useState<Partial<AcademyCourseBooking>>({});

  const acceptedCount = (slug: string) => bookings.filter((b) => b.course_slug === slug && b.status === 'accepted').length;

  const saveCapacity = async (setting: AcademyCourseSettings, capacity: number) => {
    try {
      await updateCapacity(setting.course_slug, capacity);
      toast({ title: 'Capacity updated' });
    } catch {
      toast({ title: 'Could not update capacity', variant: 'destructive' });
    }
  };

  const changeStatus = async (booking: AcademyCourseBooking, status: 'accepted' | 'refused') => {
    try {
      await setBookingStatus(booking.id, status);
      toast({ title: status === 'accepted' ? 'Booking accepted' : 'Booking refused' });
    } catch {
      toast({ title: 'Could not update booking', variant: 'destructive' });
    }
  };

  const openEdit = (booking: AcademyCourseBooking) => {
    setEditing(booking);
    setEditForm({
      participant_name: booking.participant_name,
      participant_email: booking.participant_email,
      age: booking.age,
      farming_interest: booking.farming_interest,
      status: booking.status,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await updateBooking(editing.id, editForm);
      setEditing(null);
      toast({ title: 'Participant updated' });
    } catch {
      toast({ title: 'Could not update participant', variant: 'destructive' });
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-foreground">Course capacities</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {settings.map((setting) => {
            const accepted = acceptedCount(setting.course_slug);
            return (
              <div key={setting.course_slug} className="rounded-xl border border-border p-4">
                <p className="font-medium text-foreground">{COURSE_NAMES[setting.course_slug] || setting.course_slug}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-xl font-bold">{setting.capacity}</p><p className="text-xs text-muted-foreground">Capacity</p></div>
                  <div><p className="text-xl font-bold">{accepted}</p><p className="text-xs text-muted-foreground">Booked</p></div>
                  <div><p className="text-xl font-bold">{Math.max(setting.capacity - accepted, 0)}</p><p className="text-xs text-muted-foreground">Remaining</p></div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Input
                    type="number"
                    min={0}
                    defaultValue={setting.capacity}
                    onBlur={(event) => {
                      const next = parseInt(event.target.value, 10);
                      if (!Number.isNaN(next) && next >= 0 && next !== setting.capacity) saveCapacity(setting, next);
                    }}
                    aria-label="Course capacity"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-5">
          <h2 className="text-lg font-semibold text-foreground">Participant bookings</h2>
          <p className="text-sm text-muted-foreground">{bookings.length} total requests</p>
        </div>
        {bookings.length === 0 ? (
          <p className="border-t border-border p-5 text-sm text-muted-foreground">No booking requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3">Participant</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Age</th>
                  <th className="px-4 py-3">Area of interest</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-t border-border align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{booking.participant_name}</p>
                      <p className="text-xs text-muted-foreground">{booking.participant_email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{COURSE_NAMES[booking.course_slug] || booking.course_slug}</td>
                    <td className="px-4 py-3">{booking.age}</td>
                    <td className="max-w-xs px-4 py-3 text-muted-foreground">{booking.farming_interest}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={
                        booking.status === 'accepted' ? 'border-success/40 bg-success/10 text-success'
                          : booking.status === 'refused' ? 'border-destructive/40 bg-destructive/10 text-destructive'
                            : 'border-accent/40 bg-accent/10 text-accent-foreground'
                      }>
                        {booking.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {booking.status !== 'accepted' && (
                          <Button size="sm" variant="outline" onClick={() => changeStatus(booking, 'accepted')} title="Accept">
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {booking.status !== 'refused' && (
                          <Button size="sm" variant="outline" onClick={() => changeStatus(booking, 'refused')} title="Refuse">
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => openEdit(booking)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit participant booking</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1"><Label>Name</Label><Input value={editForm.participant_name || ''} onChange={(e) => setEditForm({ ...editForm, participant_name: e.target.value })} /></div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" value={editForm.participant_email || ''} onChange={(e) => setEditForm({ ...editForm, participant_email: e.target.value })} /></div>
            <div className="space-y-1"><Label>Age</Label><Input type="number" min={1} max={120} value={editForm.age || ''} onChange={(e) => setEditForm({ ...editForm, age: parseInt(e.target.value, 10) || 0 })} /></div>
            <div className="space-y-1"><Label>Area of interest</Label><Textarea value={editForm.farming_interest || ''} onChange={(e) => setEditForm({ ...editForm, farming_interest: e.target.value })} /></div>
            <div className="space-y-1">
              <Label>Status</Label>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as AcademyCourseBooking['status'] })}>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="refused">Refused</option>
              </select>
            </div>
          </div>
          <DialogFooter><Button onClick={saveEdit}>Save changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
