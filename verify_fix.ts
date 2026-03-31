import { parseRoomEntries } from './src/lib/parseRoomEntries';

async function test() {
  const res = await fetch('http://localhost:3000/api/iq-properties');
  const data: any[] = await res.json();
  const zillion = data.find(p => p.name && p.name.toLowerCase().includes('zillion'));
  
  if (zillion) {
    console.log("--- ZILLION COED ---");
    console.log("Price Field Content:\n", JSON.stringify(zillion.price));
    const entries = parseRoomEntries(zillion.price, zillion.lows, zillion.priceMin, zillion.priceMax);
    console.log("\nParsed Entries:");
    console.log(entries);
  } else {
    console.log("Zillion Coed not found");
  }
}

test();
