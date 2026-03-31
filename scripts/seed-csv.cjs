const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedCSV() {
  console.log('Loading CSV data...');
  const csvData = fs.readFileSync('./find_my_pg/FIND PG DATA GG - MASTER.csv', 'utf8');
  
  const records = parse(csvData, {
    columns: false,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  });

  console.log(`Parsed ${records.length} records. Extracting owners and properties...`);

  const usersMap = {}; // mapping phone to user payload
  const propertiesList = [];

  // Skip headers (row 0 and 1)
  for (let i = 2; i < records.length; i++) {
    const row = records[i];
    if (row.length < 15) continue;
    
    const propertyName = row[1] ? row[1].trim() : '';
    const area = row[2] ? row[2].trim() : '';
    const exactName = row[14] ? row[14].trim() : '';
    
    const managerPhone = row[18] ? row[18].replace(/\D/g, '') : '';
    const managerName = row[19] ? row[19].trim() : '';
    const ownerName = row[20] ? row[20].trim() : '';
    const ownerPhone = row[21] ? row[21].replace(/\D/g, '') : '';
    
    if (!propertyName) continue;

    const phone = ownerPhone || managerPhone || '9999999999';
    const name = ownerName || managerName || exactName || `Owner of ${propertyName}`;
    const email = `owner.clean.${phone}@gharpayy.com`.toLowerCase();

    if (!usersMap[phone]) {
      usersMap[phone] = {
        name: name,
        email: email,
        phone: phone,
        role: 'OWNER'
      };
    }

    propertiesList.push({
      location: `${propertyName} (${area})`.trim(),
      ownerPhone: phone,
      bedsInfo: row[8]
    });
  }

  console.log(`Found ${Object.keys(usersMap).length} unique owners and ${propertiesList.length} properties.`);

  const hashedPassword = await bcrypt.hash('password123', 12);

  let ownerCount = 0;
  let propertyCount = 0;

  for (const phone in usersMap) {
    const u = usersMap[phone];
    // Find or create
    let user = await prisma.user.findUnique({ where: { email: u.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: u.name,
          email: u.email,
          phone: u.phone,
          password: hashedPassword,
          role: u.role
        }
      });
      ownerCount++;
    }

    // Now insert all properties for this owner that don't already exist
    const ownerProps = propertiesList.filter(p => p.ownerPhone === phone);
    for (const p of ownerProps) {
      const existingProp = await prisma.propertyMaster.findFirst({
        where: { name: p.location, ownerId: user.id }
      });

      if (!existingProp) {
        const prop = await prisma.propertyMaster.create({
          data: {
            name: p.location,
            area: p.location.split('(')[1] ? p.location.split('(')[1].replace(')','') : 'Unknown',
            ownerId: user.id
          }
        });
        propertyCount++;

        // Add dummy rooms for the property to showcase functionality
        for(let r=1; r<=3; r++){
            const roomNum = `${r}01`;
            const roomObj = await prisma.roomMaster.create({
                data: {
                    propertyId: prop.id,
                    room_number: roomNum,
                    capacity: 2,
                    base_price: 12000,
                }
            });

            // Owner says it is available
            await prisma.availabilityUpdate.create({
                data: {
                    roomId: roomObj.id,
                    availability_type: 'available_now',
                    expected_price: 12500,
                    remarks: 'Seeded from CSV'
                }
            });

            // Sales team approved it
            await prisma.retailRoom.create({
                data: {
                    roomId: roomObj.id,
                    retail_status: 'approved',
                    retail_price: 14000,
                    pricing_tier: 'mid'
                }
            });
        }
      }
    }
  }

  console.log(`\n🎉 Seed Complete!`);
  console.log(`Added ${ownerCount} new Owners.`);
  console.log(`Added ${propertyCount} new Properties.`);
  console.log(`Added 3 dummy Rooms per Property.`);
  console.log(`\n--- TEST CREDENTIALS ---`);
  console.log(`Every owner's email matches the pattern: owner.clean.<PHONE NUMBER>@gharpayy.com`);
  console.log(`Universal Owner Password: password123`);
  console.log(`\nSample Owner Emails from the CSV:`);
  
  const samplePhones = Object.keys(usersMap).slice(0, 5);
  samplePhones.forEach(ph => console.log(`- ${usersMap[ph].email}`));

  await prisma.$disconnect();
}

seedCSV().catch(console.error);
