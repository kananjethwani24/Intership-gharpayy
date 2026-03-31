import connectToDatabase from './src/lib/mongodb';
import User from './src/models/User';

async function promote() {
  await connectToDatabase();
  const u = await User.findOne({ email: 'admin@gharpayy.com' });
  if (!u) {
    console.log('User not found!');
  } else {
    console.log(`Current role: ${u.role}`);
    if (u.role !== 'admin') {
      u.role = 'admin';
      await u.save();
      console.log('User promoted to ADMIN!');
    } else {
      console.log('User is already ADMIN.');
    }
  }
  process.exit(0);
}
promote();
