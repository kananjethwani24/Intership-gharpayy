fetch('http://localhost:3000/api/iq-properties')
  .then(res => res.json())
  .then(data => {
    const zillion = data.find(p => p.name && p.name.toLowerCase().includes('zillion'));
    console.log("Zillion Property:", JSON.stringify(zillion.price));
  })
  .catch(console.error);
