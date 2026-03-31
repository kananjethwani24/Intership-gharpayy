const mongoose = require('mongoose');
const MONGODB_URI = "mongodb+srv://admin:Gharpayy2025@dev-projects.gyl1l.mongodb.net/gharpayy?retryWrites=true&w=majority";

async function checkPdf() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
    const property = await mongoose.connection.db.collection('iqproperties').findOne({ name: /MEXA COED/i });
    if (property) {
      console.log(`Found Property: ${property.name}`);
      console.log(`Has Brochure PDF: ${!!property.brochurePdf}`);
      if (property.brochurePdf) {
        console.log(`PDF Length: ${property.brochurePdf.length} chars`);
        console.log(`PDF Start: ${property.brochurePdf.substring(0, 50)}...`);
      }
    } else {
      console.log("Property MEXA COED not found");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

checkPdf();
