async function check() {
  const res = await fetch('http://localhost:3000/api/debug/trace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location: 'Koramangala', budget: 0, gender: '', occupation: '' })
  });
  const data = await res.json();
  console.log(`Total: ${data.total}`);
  const leadPrf = { location: 'Koramangala', gender: 'Male', budget: 0 };
  let matchCount = 0;
  let skipReasons = {};

  data.trace.forEach(t => {
     if (t.isDirectMatch) {
        if (t.status === 'OK') {
           matchCount++;
           console.log(`MATCH: ${t.name} (${t.area})`);
        } else {
           skipReasons[t.reason] = (skipReasons[t.reason] || 0) + 1;
           console.log(`SKIP: ${t.name} (${t.area}) BECAUSE: ${t.reason}`);
        }
     }
  });
  console.log(`--- SUMMARY FOR MITUN (Male) ---`);
  console.log(`Matches: ${matchCount}`);
  console.log(`Skips:`, JSON.stringify(skipReasons));
}
check();
