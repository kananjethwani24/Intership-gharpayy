const fs = require('fs');

fetch('http://localhost:3000/api/iq-properties')
  .then(res => res.json())
  .then(data => {
    const zillion = data.find(p => p.name && p.name.toLowerCase().includes('zillion'));
    if(zillion) {
       fs.writeFileSync('zillion_price.txt', zillion.price);
       console.log("Saved to zillion_price.txt");
    }
  })
  .catch(console.error);
