import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Visit from '@/models/Visit';
import Booking from '@/models/Booking';
import Room from '@/models/Room';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: propertyId } = await params;
    await connectToDatabase();

    // Aggregate statistics for the property
    const totalLeads = await Lead.countDocuments({ propertyId });
    const totalVisits = await Visit.countDocuments({ propertyId });
    const booked = await Booking.countDocuments({ propertyId, bookingStatus: 'confirmed' });
    const notInterested = await Lead.countDocuments({ propertyId, status: 'not_interested' });

    // AI-Powered Supply Intelligence: Room/Bed analysis
    const rooms = await Room.find({ propertyId });
    let totalVacantDays = 0;
    let vacantCount = 0;
    let lostRevenue = 0;
    let totalBeds = 0;
    let occupiedBeds = 0;

    const now = Date.now();
    for (const room of rooms) {
      totalBeds += (room.bedCount || 0);
      if (room.status === 'available' || room.status === 'vacant') {
        const vacantSince = new Date(room.updatedAt).getTime();
        const daysVacant = Math.floor((now - vacantSince) / (1000 * 60 * 60 * 24));
        totalVacantDays += daysVacant;
        vacantCount++;

        // Calculate pro-rated lost revenue (daily rent * days vacant)
        const dailyRent = (room.actualRent || (room.rentPerBed * room.bedCount) || 12000) / 30;
        lostRevenue += dailyRent * Math.max(0, daysVacant);
      } else if (room.status === 'occupied') {
        occupiedBeds += (room.bedCount || 0);
      }
    }

    const meanDaysVacant = vacantCount > 0 ? (totalVacantDays / vacantCount).toFixed(1) : 0;
    const conversionRate = totalLeads > 0 ? ((booked / totalLeads) * 100).toFixed(1) : 0;
    const visitToBookingRate = totalVisits > 0 ? ((booked / totalVisits) * 100).toFixed(1) : 0;

    // Action Alerts Logic
    const alerts = [];
    if (vacantCount > 0 && Number(meanDaysVacant) > 15) {
      alerts.push({
        type: 'critical',
        message: `${vacantCount} rooms vacant for 15+ days - Consider reducing price by 5% or boosting marketing.`,
        icon: 'AlertCircle'
      });
    }
    if (totalLeads > 0 && Number(conversionRate) < 5) {
      alerts.push({
        type: 'warning',
        message: 'High funnel leakage: Lead-to-Booking rate is under 5%. Review property photos or site-visit experience.',
        icon: 'Zap'
      });
    }
    if (totalLeads > 10 && totalVisits < totalLeads * 0.2) {
      alerts.push({
        type: 'info',
        message: 'Site-visit bottleneck: Many leads but few visits. Encourage agents to schedule more walkthroughs.',
        icon: 'TrendingDown'
      });
    }

    // Lost Reasons Aggregation
    const lostLeads = await Lead.find({ propertyId, status: { $in: ['lost', 'not_interested'] } });
    const lostReasons: Record<string, number> = {};
    lostLeads.forEach(l => {
       const reason = l.lostReason || 'not specified';
       lostReasons[reason] = (lostReasons[reason] || 0) + 1;
    });

    return NextResponse.json({
      total_leads: totalLeads,
      total_visits: totalVisits,
      booked: booked,
      not_interested: notInterested,
      mean_days_vacant: meanDaysVacant,
      lost_revenue: Math.round(lostRevenue).toLocaleString(),
      total_beds: totalBeds,
      occupied_beds: occupiedBeds,
      conversion_rate: conversionRate,
      visit_to_booking_rate: visitToBookingRate,
      alerts: alerts,
      lost_reasons: lostReasons
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
