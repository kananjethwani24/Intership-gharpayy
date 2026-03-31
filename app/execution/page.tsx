'use client';

import { useState, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { useLeads, useVisits, useAgents } from '@/hooks/useCrmData';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Users, Building2, Bed, Calendar, 
  CheckCircle2, Clock, MapPin, Search, 
  ChevronRight, ArrowRight, UserPlus, 
  Zap, AlertCircle, Info, Layers, Handshake
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

// ─── Data Hooks ──────────────────────────────────────────────────────────────
function useInventory() {
  return useQuery({
    queryKey: ['team-inventory'],
    queryFn: async () => {
      const res = await fetch('/api/properties');
      if (!res.ok) throw new Error('Failed to fetch inventory');
      return res.json();
    },
  });
}

function useScheduleTour() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to schedule tour');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visits'] });
      toast.success('Tour scheduled successfully');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create booking');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking confirmed! 🎉');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ─── Component: Inventory Ledger ─────────────────────────────────────────────
function InventoryLedger({ properties }: { properties: any[] }) {
  const [search, setSearch] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  const filtered = properties?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.area.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input 
            placeholder="Search verified inventory..." 
            className="pl-9 h-11 bg-card border-border rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered?.map(p => (
           <Card key={p.id || p._id} className="kpi-card hover:border-accent/30 transition-all cursor-pointer" onClick={() => setSelectedProperty(p)}>
              <div className="flex justify-between items-start">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-accent"><Building2 size={20}/></div>
                    <div>
                       <h4 className="text-sm font-bold text-foreground">{p.name}</h4>
                       <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none">{p.area}</p>
                    </div>
                 </div>
                 <Badge variant="outline" className="text-[9px] font-bold">
                    {(p.rooms?.filter((r: any) => r.status === 'vacant' || r.status === 'vacating_soon').length || 0)} Available Units
                 </Badge>
              </div>
           </Card>
        ))}
      </div>

      {/* Property Room Detail View */}
      {selectedProperty && (
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
               <h3 className="text-sm font-bold flex items-center gap-2">
                  <Layers size={14} className="text-accent" /> Rooms in {selectedProperty.name}
               </h3>
               <Button variant="ghost" size="sm" onClick={() => setSelectedProperty(null)} className="text-[10px] font-bold">Clear Selection</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
               {selectedProperty.rooms?.map((r: any) => (
                  <Card key={r._id || r.id} className={`p-4 border shadow-sm ${r.isLocked ? 'opacity-50 grayscale' : ''}`}>
                     <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-black">Room {r.roomNumber}</span>
                        {r.isLocked ? <Badge variant="destructive" className="text-[8px] font-black uppercase tracking-tighter">Locked by Owner</Badge> : (
                           <Badge className={`text-[8px] font-black uppercase tracking-tighter ${r.status === 'vacant' ? 'bg-success/10 text-success border-success/20' : (r.status === 'vacating_soon' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : (r.status === 'visit_scheduled' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-slate-500/10 text-slate-500'))}`}>
                              {r.status === 'visit_scheduled' ? 'Room Locked (Tour in progress)' : (r.status === 'vacating_soon' ? `Prebook [${r.vacatingDate ? format(new Date(r.vacatingDate), 'MMM d') : 'Soon'}]` : r.status.replace('_', ' '))}
                           </Badge>
                        )}
                     </div>
                     <div className="space-y-1 mb-4">
                        <div className="flex justify-between text-[10px] font-bold"><span className="text-muted-foreground">Type</span><span className="text-foreground">{r.roomType}</span></div>
                        <div className="flex justify-between text-[10px] font-bold"><span className="text-muted-foreground">Rent</span><span className="text-emerald-500">₹{r.expectedRent?.toLocaleString()}</span></div>
                     </div>
                     <Button 
                        disabled={(r.status !== 'vacant' && r.status !== 'vacating_soon') || r.isLocked} 
                        size="sm" 
                        className="w-full h-8 text-[10px] font-black uppercase tracking-widest hovr:bg-accent"
                        variant={r.status === 'vacating_soon' ? 'outline' : (r.status === 'vacant' ? 'default' : 'secondary')}
                     >
                        {r.status === 'vacating_soon' ? 'Assign Lead (Prebook)' : 'Assign Lead'}
                     </Button>
                  </Card>
               ))}
               {(!selectedProperty.rooms || selectedProperty.rooms.length === 0) && (
                  <p className="col-span-full text-center py-10 text-xs text-muted-foreground">No room IDs defined for this property by the owner.</p>
               )}
            </div>
         </motion.div>
      )}
    </div>
  );
}

// ─── Component: Lead Pipeline ───────────────────────────────────────────────
function LeadExecution({ leads, agents, properties, onSchedule }: { leads: any[], agents: any[], properties: any[], onSchedule: (lead: any) => void }) {
  const activeLeads = leads?.filter(l => l.status !== 'dropped' && l.status !== 'booked');

  return (
    <div className="kpi-card p-0 overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-secondary/30 border-b border-border">
          <tr>
            <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lead</th>
            <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Preference</th>
            <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Agent</th>
            <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Timeline</th>
            <th className="text-right px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Action</th>
          </tr>
        </thead>
        <tbody>
          {activeLeads?.map(l => (
            <tr key={l.id} className="border-b border-border hover:bg-accent/5 transition-colors group">
              <td className="px-5 py-4">
                 <p className="font-bold text-foreground text-sm">{l.name}</p>
                 <p className="text-[10px] text-muted-foreground font-medium">{l.phone}</p>
              </td>
              <td className="px-5 py-4">
                 <p className="text-[10px] font-bold text-foreground">{l.preferredLocation || 'Anywhere'}</p>
                 <p className="text-[10px] text-emerald-500 font-bold">Budget: ₹{l.budget || '—'}</p>
              </td>
              <td className="px-5 py-4 text-[10px] text-muted-foreground font-bold">
                 {l.agents?.name || 'Unassigned'}
              </td>
              <td className="px-5 py-4 opacity-70">
                 <p className="text-[10px] font-bold flex items-center gap-1"><Clock size={10} /> {format(new Date(l.createdAt), 'MMM d')}</p>
              </td>
              <td className="px-5 py-4 text-right">
                 <Button 
                   size="sm" 
                   onClick={() => onSchedule(l)}
                   className="h-8 px-4 text-[10px] font-black uppercase tracking-wider rounded-lg bg-accent/10 border border-accent/20 text-accent hover:bg-accent hover:text-white transition-all"
                 >
                    Schedule Tour
                 </Button>
              </td>
            </tr>
          ))}
          {activeLeads?.length === 0 && (
             <tr><td colSpan={5} className="py-20 text-center text-xs text-muted-foreground">No active leads in pipeline.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Component: Scheduler Dialog ──────────────────────────────────────────────
function ScheduleTourDialog({ lead, properties, agents, isOpen, onClose }: { lead: any, properties: any[], agents: any[], isOpen: boolean, onClose: () => void }) {
  const tourMutation = useScheduleTour();
  const [formData, setFormData] = useState({
     propertyId: '',
     roomId: '',
     assignedStaffId: '',
     scheduledAt: '',
     tourType: 'Physical',
     applySoftLock: true
  });

  const selectedProp = useMemo(() => properties?.find(p => p.id === formData.propertyId), [formData.propertyId, properties]);

  const handleSubmit = async () => {
     if (!formData.propertyId || !formData.scheduledAt || !formData.assignedStaffId || !formData.tourType) return toast.error('Fill required fields');
     
     const tourData = { ...formData };
     const applyLock = formData.applySoftLock;
     delete (tourData as any).applySoftLock;

     const tour = await tourMutation.mutateAsync(tourData);
     
     if (applyLock && formData.roomId) {
        try {
           await fetch('/api/soft-locks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                 roomId: formData.roomId,
                 leadId: lead.id,
                 expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
              })
           });
           toast.success('Room soft-locked for 2 hours');
        } catch (e) { console.error('Soft lock failed', e); }
     }
     
     onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
       <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
             <DialogTitle>Schedule Execution Tour</DialogTitle>
             <DialogDescription className="text-xs">Schedule a {formData.tourType.toLowerCase()} tour for {lead?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Property</Label>
                <Select value={formData.propertyId} onValueChange={v => setFormData({ ...formData, propertyId: v, roomId: '' })}>
                   <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Select Property" /></SelectTrigger>
                   <SelectContent>
                      {properties?.map(p => <SelectItem key={p.id || p._id} value={p.id || p._id}>{p.name} ({p.area})</SelectItem>)}
                   </SelectContent>
                </Select>
             </div>
             
             {formData.propertyId && (
                <div className="space-y-1.5 animate-in slide-in-from-top-1">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Approved Room (Owner Ledger)</Label>
                   <Select value={formData.roomId} onValueChange={v => setFormData({ ...formData, roomId: v })}>
                      <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Select Room ID" /></SelectTrigger>
                      <SelectContent>
                         {selectedProp?.rooms?.filter((r: any) => (r.status === 'vacant' || r.status === 'vacating_soon') && !r.isLocked).map((r: any) => (
                            <SelectItem key={r.id || r._id} value={r.id || r._id}>Room {r.roomNumber} - {r.status === 'vacating_soon' ? '[PREBOOK] ' : ''}₹{r.expectedRent}</SelectItem>
                         ))}
                         {(!selectedProp?.rooms || selectedProp.rooms.length === 0) && <SelectItem value="none" disabled>No rooms available</SelectItem>}
                      </SelectContent>
                   </Select>
                </div>
             )}

             <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Assigned Field Agent</Label>
                <Select value={formData.assignedStaffId} onValueChange={v => setFormData({ ...formData, assignedStaffId: v })}>
                   <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Select Agent" /></SelectTrigger>
                   <SelectContent>
                      {agents?.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                   </SelectContent>
                </Select>
             </div>

             <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tour Slot (Date & Time)</Label>
                <Input type="datetime-local" value={formData.scheduledAt} onChange={e => setFormData({...formData, scheduledAt: e.target.value})} className="h-10 rounded-xl" />
             </div>

             {formData.roomId && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 mt-4">
                   <div className="space-y-0.5">
                      <Label className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Apply 2-Hour Soft Lock</Label>
                      <p className="text-[9px] font-bold text-orange-500/70">Temporarily prevent other bookings during the tour window</p>
                   </div>
                   <Switch checked={formData.applySoftLock} onCheckedChange={v => setFormData({...formData, applySoftLock: v})} className="data-[state=checked]:bg-orange-500" />
                </div>
             )}
          </div>
          <DialogFooter>
             <Button onClick={handleSubmit} disabled={tourMutation.isPending} className="w-full rounded-xl bg-accent text-white font-black uppercase tracking-widest h-12 shadow-lg shadow-accent/20">
                Confirm Schedule
             </Button>
          </DialogFooter>
       </DialogContent>
    </Dialog>
  );
}

// ─── Component: Active Tours ────────────────────────────────────────────────
function ActiveTours({ visits, onCreateBooking }: { visits: any[], onCreateBooking: (tour: any) => void }) {
  const upcoming = visits?.filter(v => v.outcome === undefined);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       {upcoming?.map(v => (
          <Card key={v.id} className="kpi-card relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-3">
                <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-tighter bg-accent/5">{v.tourType || 'Physical'} Tour</Badge>
             </div>
             <div className="space-y-4 pt-2">
                <div>
                   <h4 className="text-sm font-black text-foreground">{v.leads?.name}</h4>
                   <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1"><MapPin size={10} className="text-accent" /> {v.properties?.name}</p>
                </div>
                
                <div className="flex items-center justify-between text-[10px] font-bold py-2 border-y border-border">
                   <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground uppercase text-[8px] tracking-widest">Time</span>
                      <span>{format(new Date(v.scheduledAt), 'h:mm a, MMM d')}</span>
                   </div>
                   <div className="flex flex-col gap-1 text-right">
                      <span className="text-muted-foreground uppercase text-[8px] tracking-widest">Room ID</span>
                      <span className="text-accent">Room {v.rooms?.roomNumber || 'TBD'}</span>
                   </div>
                </div>

                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">{v.agents?.name?.[0]}</div>
                   <div>
                      <p className="text-[10px] font-bold">{v.agents?.name}</p>
                      <p className="text-[8px] text-muted-foreground font-medium uppercase">Field Agent</p>
                   </div>
                </div>

                <Button 
                   onClick={() => onCreateBooking(v)}
                   className="w-full h-10 rounded-xl bg-orange-600/10 border border-orange-600/20 text-orange-600 hover:bg-orange-600 hover:text-white font-black uppercase text-[10px] tracking-widest transition-all"
                >
                   <Handshake size={14} className="mr-2" /> Convert to Booking
                </Button>
             </div>
          </Card>
       ))}
       {upcoming?.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-[2rem]">
             <Zap size={24} className="mx-auto mb-3 text-slate-300" />
             <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No pending tours in execution queue</p>
          </div>
       )}
    </div>
  );
}

// ─── Main Portal ─────────────────────────────────────────────────────────────

export default function TeamPortal() {
  const { data: leads, isLoading: leadsLoading } = useLeads();
  const { data: visits, isLoading: visitsLoading } = useVisits();
  const { data: agents } = useAgents();
  const { data: properties, isLoading: propsLoading } = useInventory();
  
  const [activeLead, setActiveLead] = useState<any>(null);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);

  const bookingMutation = useCreateBooking();

  const handleCreateBooking = async (formData: any) => {
     await bookingMutation.mutateAsync({
        ...formData,
        leadId: selectedVisit.leads?.id,
        propertyId: selectedVisit.properties?.id,
        visitId: selectedVisit.id,
        roomId: selectedVisit.rooms?.id
     });
     setIsBookingOpen(false);
  };

  if (leadsLoading || visitsLoading || propsLoading) {
    return (
      <AppLayout title="Demand & Execution" subtitle="Gharpayy Team Command Center">
        <Skeleton className="h-[600px] rounded-[2rem]" />
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Demand & Execution" 
      subtitle="Team Portal: Leads, Tours, and Closures"
      actions={<Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 uppercase text-[9px] font-black tracking-widest">Internal Command Center</Badge>}
    >
      <Tabs defaultValue="leads" className="space-y-6">
        <TabsList className="bg-secondary/50 p-1.5 rounded-2xl border border-border h-auto">
          <TabsTrigger value="leads" className="rounded-xl px-6 py-2.5 text-xs font-bold data-[state=active]:bg-accent data-[state=active]:text-white transition-all">
             <Users size={14} className="mr-2" /> Live Leads
          </TabsTrigger>
          <TabsTrigger value="inventory" className="rounded-xl px-6 py-2.5 text-xs font-bold data-[state=active]:bg-accent data-[state=active]:text-white transition-all">
             <Building2 size={14} className="mr-2" /> Inventory Ledger
          </TabsTrigger>
          <TabsTrigger value="visits" className="rounded-xl px-6 py-2.5 text-xs font-bold data-[state=active]:bg-accent data-[state=active]:text-white transition-all">
             <Calendar size={14} className="mr-2" /> Active Tours
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leads">
           <LeadExecution 
             leads={leads || []} 
             agents={agents || []} 
             properties={properties || []}
             onSchedule={(lead) => { setActiveLead(lead); setIsSchedulerOpen(true); }}
           />
        </TabsContent>

        <TabsContent value="inventory">
           <InventoryLedger properties={properties || []} />
        </TabsContent>

        <TabsContent value="visits">
           <ActiveTours 
             visits={visits || []} 
             onCreateBooking={(visit) => { setSelectedVisit(visit); setIsBookingOpen(true); }}
           />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ScheduleTourDialog 
        lead={activeLead}
        properties={properties || []}
        agents={agents || []}
        isOpen={isSchedulerOpen}
        onClose={() => setIsSchedulerOpen(false)}
      />

      {selectedVisit && (
         <BookingConfirmationDialog 
           visit={selectedVisit}
           isOpen={isBookingOpen}
           onClose={() => setIsBookingOpen(false)}
           onConfirm={handleCreateBooking}
         />
      )}
    </AppLayout>
  );
}

function BookingConfirmationDialog({ visit, isOpen, onClose, onConfirm }: { visit: any, isOpen: boolean, onClose: () => void, onConfirm: (data: any) => void }) {
   const [formData, setFormData] = useState({
      monthlyRent: visit.rooms?.expectedRent || 0,
      securityDeposit: (visit.rooms?.expectedRent || 0) * 1,
      moveInDate: ''
   });

   return (
      <Dialog open={isOpen} onOpenChange={onClose}>
         <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
               <DialogTitle>Convert to Booking</DialogTitle>
               <DialogDescription className="text-xs">Finalize the closure for {visit.leads?.name} at Room {visit.rooms?.roomNumber}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
               <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Monthly Rent</Label>
                  <Input type="number" value={formData.monthlyRent} onChange={e => setFormData({...formData, monthlyRent: parseInt(e.target.value)})} className="h-10 rounded-xl" />
               </div>
               <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Security Deposit</Label>
                  <Input type="number" value={formData.securityDeposit} onChange={e => setFormData({...formData, securityDeposit: parseInt(e.target.value)})} className="h-10 rounded-xl" />
               </div>
               <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Move-in Date</Label>
                  <Input type="date" value={formData.moveInDate} onChange={e => setFormData({...formData, moveInDate: e.target.value})} className="h-10 rounded-xl" />
               </div>
            </div>
            <DialogFooter>
               <Button onClick={() => onConfirm(formData)} className="w-full h-12 rounded-xl bg-orange-600 text-white font-black uppercase tracking-widest">Confirm Closure</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}
