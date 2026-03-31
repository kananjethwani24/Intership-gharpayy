fetch('http://localhost:3000/api/iq-properties')
  .then(res => res.json())
  .then(data => {
    const zillion = data.find(p => p.name && p.name.toLowerCase().includes('zillion'));
    console.log("Zillion Property:");
    console.log("price:", zillion.price);
    console.log("lows:", zillion.lows);
    console.log("priceMin:", zillion.priceMin);
    console.log("priceMax:", zillion.priceMax);
  })
  .catch(console.error);
