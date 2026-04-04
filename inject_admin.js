require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 1. Point to your correct model file location if using inside the project, 
// but for a one-off script we can just define the schema here to avoid path issues.
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'admin' },
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createEmergencyAdmin() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI is not set in your .env file!');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    
    const email = 'admin@gharpayy.com';
    const password = 'GharpayyPassword123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Delete existing if exists to reset
    await User.deleteOne({ email });

    await User.create({
      email,
      password: hashedPassword,
      fullName: 'Gharpayy Admin',
      role: 'admin'
    });

    console.log('\n✅ SUCCESS: Emergency Admin Created!');
    console.log('-----------------------------------');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log('-----------------------------------');
    console.log('Try signing in with these credentials now.\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

createEmergencyAdmin();
