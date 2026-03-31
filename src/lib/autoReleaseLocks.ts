import connectToDatabase from '@/lib/mongodb';
import Visit from '@/models/Visit';
import Room from '@/models/Room';

export async function executeAntiLeakageEngine() {
  await connectToDatabase();
  const now = new Date();
  
  // SLA Definition: If a visit is scheduled, its outcome MUST be recorded within 2 hours of the scheduled time.
  const slaLimit = new Date(now.getTime() - 2 * 60 * 60 * 1000); 

  const expiredVisits = await Visit.find({
    outcome: { $exists: false },
    scheduledAt: { $lt: slaLimit }
  });

  if (expiredVisits.length === 0) return;

  console.log(`[Anti-Leakage Engine] Found ${expiredVisits.length} expired visits. Executing SLA limits.`);

  for (const visit of expiredVisits) {
    // 1. Flush the physical Room back to Vacant
    if (visit.roomId) {
      const room = await Room.findById(visit.roomId);
      if (room && room.status === 'visit_scheduled') {
        room.status = 'vacant';
        await room.save();
        console.warn(`[Anti-Leakage Engine] Auto-released Room ${room._id} (SLA missed for Visit ${visit._id})`);
      }
    }
    
    // 2. Auto-close the stale visit pipeline
    visit.outcome = 'no_show';
    visit.notes = (visit.notes || '') + '\n[Exception Logged: SLA Missed. System Auto-released inventory.]';
    await visit.save();
  }
}
