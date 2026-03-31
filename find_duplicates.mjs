import mongoose from 'mongoose';
const MONGODB_URI = "mongodb+srv://admin:Gharpayy2025@dev-projects.gyl1l.mongodb.net/gharpayy?retryWrites=true&w=majority";

async function findDuplicateMexa() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
    // Get all collections to see if we have iqproperties and iq-properties
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));

    // Check in 'iqproperties' (standard Mongoose name)
    const props = await mongoose.connection.db.collection('iqproperties').find({ name: /MEXA COED/i }).toArray();
    console.log(`Found ${props.length} matches in 'iqproperties'`);
    props.forEach(p => {
      console.log(`ID: ${p._id}, hasPdf: ${!!p.brochurePdf}, Name: ${p.name}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

findDuplicateMexa();
