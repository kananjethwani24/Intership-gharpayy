import mongoose from 'mongoose';

async function fix() {
  await mongoose.connect('mongodb://127.0.0.1:27017/gharpayy');
  const db = mongoose.connection.db;
  
  const res = await db.collection('rooms').updateMany(
    { status: 'available' },
    { $set: { status: 'vacant' } }
  );
  console.log('Migrated old available to vacant:', res.modifiedCount);
  process.exit();
}
fix();
