const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://owner:Kanan%402403@ac-dbqk62f-shard-00-00.4ncwyob.mongodb.net:27017,ac-dbqk62f-shard-00-01.4ncwyob.mongodb.net:27017,ac-dbqk62f-shard-00-02.4ncwyob.mongodb.net:27017/?ssl=true&replicaSet=atlas-sjb8tc-shard-0&authSource=admin&appName=kanan';

async function check() {
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db('test');
  
  // Find FORUM PRO BOYS rooms with their lock status
  const props = await db.collection('properties').find({ name: /FORUM PRO BOYS/i }).toArray();
  console.log('Properties found:', props.length);
  
  for (const prop of props) {
    const rooms = await db.collection('rooms').find({ propertyId: prop._id }).toArray();
    console.log(`\nProperty: ${prop.name} (${prop._id})`);
    rooms.forEach(r => console.log(`  Room ${r.roomNumber}: status=${r.status}, isLocked=${r.isLocked}`));
  }
  
  await client.close();
}
check().catch(console.error);
