import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Property from '@/models/Property';
import IQProperty from '@/models/IQProperty';
import { getAuthUser } from '@/lib/auth-service';

/**
 * UNIFIED PATCH HANDLER
 * 1. Find the property in the Database.
 * 2. If it ONLY exists in the IQ Sheet (imported), "Promote" it to a full Property doc.
 * 3. Sync changes backwards to IQ Sheet for global visibility (Matching Engine/Inventory).
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    await connectToDatabase();
    
    const updates: any = { ...body };
    if (body.priceRange) updates.priceRange = body.priceRange;

    // Check if it exists in DB Properties first
    let property = await Property.findById(id);

    if (!property) {
      // It might be a Spreadsheet Property only!
      const iqProp = await IQProperty.findById(id);
      if (iqProp) {
        // PROMOTE to a full Property document so it links to the owner properly
        property = await Property.create({
          name: iqProp.name,
          city: iqProp.city || 'Bangalore',
          area: iqProp.area || 'Unknown',
          address: iqProp.location || iqProp.locality || 'Imported Address',
          ownerId: user.id, // Assign to the editing owner
          iqPropertyId: iqProp._id,
          isActive: true,
          ...updates // Apply the new updates immediately
        });
      } else {
        return NextResponse.json({ error: 'Property not found in any source' }, { status: 404 });
      }
    } else {
      // Update existing DB property
      property = await Property.findByIdAndUpdate(id, updates, { new: true });
    }

    // SYNC BACK: Ensure the shared IQ Sheet also reflects the changes
    // This keeps the Matching engine and Global Dashboard in sync with Owner Portal edits.
    const iqId = property?.iqPropertyId;
    if (iqId) {
      const iqUpdates: any = {};
      const syncFields = ['name', 'locality', 'nearbyLandmarks', 'furnishingDetails', 'usp', 'amenities', 'houseRules'];
      syncFields.forEach(f => {
         if (updates[f] !== undefined) iqUpdates[f] = updates[f];
      });
      if (updates.priceRange) iqUpdates.price = updates.priceRange;

      if (Object.keys(iqUpdates).length > 0) {
         await IQProperty.findByIdAndUpdate(iqId, { $set: iqUpdates });
      }
    }
    
    return NextResponse.json(property);
  } catch (error: any) {
    console.error('Property Update Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }
    const { id } = await params;
    await connectToDatabase();
    await Property.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
