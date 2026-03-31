fetch('http://localhost:3000/api/iq-properties')
  .then(res => res.json())
  .then(data => {
    const zillion = data.find(p => p.name && p.name.toLowerCase().includes('zillion'));
    if(zillion) {
       console.log("Price text HEX prefix (first 500 chars):");
       const buf = Buffer.from(zillion.price);
       console.log(buf.slice(0, 500).toString('hex'));
       console.log("\nPrice text (first 500 chars):");
       console.log(zillion.price.substring(0, 500));
    }
  });
