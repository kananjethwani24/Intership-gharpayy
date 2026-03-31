require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function fix() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gharpayy';
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  const res = await db.collection('rooms').updateMany(
    { status: 'available' },
    { $set: { status: 'vacant' } }
  );
  console.log('Migrated old available to vacant:', res.modifiedCount);

  // Also unlock any stuck ones from earlier error testing
  // Wait, if lock was set, the execution portal had "isLocked = true" logically if it was ON.
  // Actually, the user's issue was "still shows available".
  process.exit();
}
fix();
