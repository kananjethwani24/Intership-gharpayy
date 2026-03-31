import mongoose from 'mongoose';
const MONGODB_URI = "mongodb+srv://admin:Gharpayy2025@dev-projects.gyl1l.mongodb.net/gharpayy?retryWrites=true&w=majority";

async function checkPdf() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
    // Search by name MEXA COED
    const property = await mongoose.connection.db.collection('iqproperties').findOne({ name: /MEXA COED/i });
    if (property) {
       console.log("--- FOUND PROPERTY ---");
       console.log(`Name: ${property.name}`);
       console.log(`ID: ${property._id}`);
       console.log(`Has brochurePdf field: ${'brochurePdf' in property}`);
       console.log(`Value of brochurePdf: ${property.brochurePdf ? (property.brochurePdf.substring(0, 50) + "...") : 'EMPTY'}`);
       if (property.brochurePdf) {
         console.log(`Length: ${property.brochurePdf.length} characters`);
       }
    } else {
       console.log("Property 'MEXA COED' not found in database.");
    }
  } catch (err) {
    console.error("Database connection or query failed:", err);
  } finally {
    await mongoose.disconnect();
  }
}

checkPdf();
