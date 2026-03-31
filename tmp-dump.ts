import connectToDatabase from './src/lib/mongodb';
import IQProperty from './src/models/IQProperty';

async function dump() {
  await connectToDatabase();
  const kPgs = await IQProperty.find({ area: /Koramangala/i });
  console.log(`Found ${kPgs.length} PGs in Koramangala`);
  kPgs.forEach(p => {
    console.log(`- ${p.name} (Gender: ${p.gender}, Area: ${p.area}, Target: ${p.targetAudience})`);
  });
  process.exit(0);
}
dump();
